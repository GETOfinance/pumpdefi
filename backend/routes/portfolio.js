const express = require('express')
const { ethers } = require('ethers')
const router = express.Router()

const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network')

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
]
const TOKEN_FACTORY_ABI = [
  'function getAllTokens() view returns (address[])'
]

async function discoverTokensViaExplorer(address) {
  const base = process.env.CORE_EXPLORER_API_URL || 'https://scan.test2.btcs.network/api'
  const key = process.env.CORE_EXPLORER_API_KEY || ''
  const url = `${base}?module=account&action=tokentx&address=${address}&sort=desc${key ? `&apikey=${key}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Explorer responded ${res.status}`)
  const data = await res.json()
  if (!data || data.status === '0') throw new Error(data?.message || 'Explorer error')
  const set = new Set()
  for (const tx of data.result || []) {
    if (tx.contractAddress) set.add(tx.contractAddress.toLowerCase())
  }
  return Array.from(set)
}

async function discoverTokensViaLogs(address) {
  const topicTransfer = ethers.id('Transfer(address,address,uint256)')
  const latest = await provider.getBlockNumber()
  const depth = BigInt(process.env.PORTFOLIO_LOG_SCAN_BLOCKS || '1000000')
  const fromBlock = latest > depth ? latest - depth : 0n

  const pad = (a) => ethers.zeroPadValue(a, 32)
  // to = address
  const toLogs = await provider.getLogs({ fromBlock, toBlock: latest, topics: [topicTransfer, null, pad(address)] })
  // from = address
  const fromLogs = await provider.getLogs({ fromBlock, toBlock: latest, topics: [topicTransfer, pad(address)] })
  const set = new Set()
  for (const l of [...toLogs, ...fromLogs]) { if (l.address) set.add(l.address.toLowerCase()) }
  return Array.from(set)
}

async function discoverTokensViaFactory() {
  const addr = process.env.TOKEN_FACTORY_ADDRESS
  if (!addr || !ethers.isAddress(addr)) return []
  try {
    const factory = new ethers.Contract(addr, TOKEN_FACTORY_ABI, provider)
    const list = await factory.getAllTokens()
    return (list || []).map(x => x.toLowerCase())
  } catch { return [] }
}

async function fallbackDiscoverTokensViaEnv() {
  return (process.env.PORTFOLIO_TOKEN_LIST || '').split(',').map(s=>s.trim()).filter(Boolean).map(x=>x.toLowerCase())
}

router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params
    if (!ethers.isAddress(address)) return res.status(400).json({ success: false, error: 'Invalid address' })

    const discovered = new Set()
    // Try multiple discovery methods
    try { (await discoverTokensViaExplorer(address)).forEach(a=>discovered.add(a)) } catch {}
    try { (await discoverTokensViaLogs(address)).forEach(a=>discovered.add(a)) } catch {}
    try { (await discoverTokensViaFactory()).forEach(a=>discovered.add(a)) } catch {}
    if (discovered.size === 0) { (await fallbackDiscoverTokensViaEnv()).forEach(a=>discovered.add(a)) }

    const tokenAddresses = Array.from(discovered).slice(0, 300)

    // Native CORE balance
    const nativeBal = await provider.getBalance(address)

    const tokens = []
    for (const tokenAddr of tokenAddresses) {
      try {
        const token = new ethers.Contract(tokenAddr, ERC20_ABI, provider)
        const [symbol, name, decimalsRaw, balStr] = await Promise.all([
          token.symbol().catch(()=>''), token.name().catch(()=>''), token.decimals().catch(()=>18), token.balanceOf(address).then(b=>b.toString())
        ])
        const decimals = Number(decimalsRaw)
        if (balStr !== '0') tokens.push({ address: tokenAddr, symbol, name, decimals, balance: balStr })
      } catch {}
    }

    res.json({ success: true, address, native: { symbol: 'CORE', balanceWei: nativeBal.toString() }, tokens })
  } catch (e) {
    console.error('portfolio error', e)
    res.status(500).json({ success: false, error: 'Failed to load portfolio', message: e.message })
  }
})

module.exports = router
