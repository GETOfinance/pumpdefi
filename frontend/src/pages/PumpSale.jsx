import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { formatEther, parseEther, isAddress } from 'viem'
import { getContract } from 'viem'
import { BONDING_SALE_ABI, AFFILIATE_MANAGER_ABI, ERC20_ABI } from '../config/abis'
import { toast } from 'react-hot-toast'
import { captureConversion } from '../utils/affiliate'
import { CONTRACT_ADDRESSES } from '../config/chains'

const PumpSale = () => {
  const { sale } = useParams()
  const { isConnected, address } = useAccount()
  const [info, setInfo] = useState(null)
  const [value, setValue] = useState('0.1')

  // Read ref and campaign from URL for conversion attribution
  const { ref, campaignId } = useMemo(() => {
    try {
      const url = new URL(window.location.href)
      const ref = url.searchParams.get('ref')
      const campaignId = url.searchParams.get('campaign')
      return { ref, campaignId: campaignId ? BigInt(campaignId) : null }
    } catch { return { ref: null, campaignId: null } }
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const rpc = import.meta.env.VITE_PUBLIC_RPC || 'https://rpc.test2.btcs.network'
        const client = new (await import('viem')).createPublicClient({ transport: (await import('viem')).http(rpc) })
        const c = getContract({ address: sale, abi: BONDING_SALE_ABI, client })
        const [startTime, endTime, basePrice, slope, totalForSale, totalSold, totalRaised, token] = await Promise.all([
          c.read.startTime(), c.read.endTime(), c.read.basePrice(), c.read.slope(), c.read.totalForSale(), c.read.totalSold(), c.read.totalRaised(), c.read.token()
        ])
        if (!mounted) return
        setInfo({ startTime, endTime, basePrice, slope, totalForSale, totalSold, totalRaised, token })
      } catch (e) {
        console.error('Failed to load sale info', e)
        toast.error('Failed to load sale info')
      }
    }
    if (sale) load()
    return () => { mounted = false }
  }, [sale])

  const onBuy = async () => {
    try {
      if (!isConnected) { toast.error('Connect wallet'); return }
      const { createWalletClient, http } = await import('viem')
      const chain = (await import('../config/wagmi')).coreChain
      const walletClient = createWalletClient({ chain, transport: http(import.meta.env.VITE_PUBLIC_RPC || 'https://rpc.test2.btcs.network') })
      const c = getContract({ address: sale, abi: BONDING_SALE_ABI, walletClient })
      const wei = parseEther(value)
      const tx = await c.write.buy([], { value: wei })
      toast.success('Buy submitted: ' + tx)

      // Fire-and-forget off-chain conversion tracking
      if (ref) captureConversion({ ref, amountWei: wei.toString(), sale })

      // On-chain affiliate reward: allow multiple rewards to same wallet
      if (ref && isAddress(ref) && campaignId && CONTRACT_ADDRESSES.AFFILIATE_MANAGER) {
        try {
          const affiliate = getContract({ address: CONTRACT_ADDRESSES.AFFILIATE_MANAGER, abi: AFFILIATE_MANAGER_ABI, walletClient })
          await affiliate.write.reward([campaignId, ref])
          toast.success('Affiliate reward sent')
        } catch (e) {
          console.error('Affiliate reward failed', e)
          toast.error('Affiliate reward failed')
        }
      }
    } catch (e) {
      console.error('Buy failed', e)
      toast.error(e?.shortMessage || e?.message || 'Buy failed')
    }
  }

  if (!info) return <div className="p-8 text-gray-400">Loading sale...</div>

  const now = Math.floor(Date.now() / 1000)
  const status = now < Number(info.startTime) ? 'Upcoming' : now > Number(info.endTime) ? 'Ended' : 'Active'

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Link to="/launchpad" className="text-gray-400 hover:text-white">← Back</Link>
      <h1 className="text-3xl font-bold text-white mt-4 mb-6">Pump Sale</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="token-card">
          <div className="text-gray-400 text-sm">Status</div>
          <div className="text-white text-xl font-semibold">{status}</div>
          <div className="mt-4 text-sm text-gray-400">Token</div>
          <div className="text-white break-all">{info.token}</div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total For Sale</div>
              <div className="text-white">{formatEther(info.totalForSale)} tokens</div>
            </div>
            <div>
              <div className="text-gray-400">Sold</div>
              <div className="text-white">{formatEther(info.totalSold)}</div>
            </div>
            <div>
              <div className="text-gray-400">Raised</div>
              <div className="text-white">{formatEther(info.totalRaised)} CORE</div>
            </div>
            <div>
              <div className="text-gray-400">Base Price</div>
              <div className="text-white">{formatEther(info.basePrice)} CORE/token</div>
            </div>
            <div>
              <div className="text-gray-400">Slope</div>
              <div className="text-white">{formatEther(info.slope)} CORE per token per token</div>
            </div>
          </div>
        </div>
        <div className="token-card">
          <div className="text-gray-400 text-sm mb-2">Buy with CORE</div>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" value={value} onChange={e=>setValue(e.target.value)} />
          <button onClick={onBuy} className="btn btn-primary mt-4">Buy</button>
        </div>
      </div>
    </div>
  )
}

export default PumpSale

