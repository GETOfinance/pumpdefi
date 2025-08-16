import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useLendingV2 } from '../hooks/useLendingV2'
import { ERC20_ABI } from '../config/abis'
import { usePublicClient } from 'wagmi'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function LendingManage() {
  const { address } = useAccount()
  const { deposit, withdraw, borrow, repay, setUseAsCollateral, pool } = useLendingV2()
  const publicClient = usePublicClient()

  const [markets, setMarkets] = useState([])
  const [selectedAsset, setSelectedAsset] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/api/lendingv2/markets`)
      const j = await r.json()
      if (j.success) setMarkets(j.markets)
    })()
  }, [])

  const asset = useMemo(() => selectedAsset || markets[0]?.asset || '', [selectedAsset, markets])

  async function onDeposit() {
    try {
      setStatus('Approving & Depositing...')
      const decimals = await publicClient.readContract({ address: asset, abi: ERC20_ABI, functionName: 'decimals' })
      const amt = BigInt(Math.floor(Number(amount) * 10 ** Number(decimals)))
      await deposit(asset, amt)
      setStatus('Deposit submitted')
    } catch (e) { setStatus(e.message) }
  }
  async function onWithdraw() {
    try {
      setStatus('Withdrawing...')
      const decimals = await publicClient.readContract({ address: asset, abi: ERC20_ABI, functionName: 'decimals' })
      const amt = BigInt(Math.floor(Number(amount) * 10 ** Number(decimals)))
      await withdraw(asset, amt)
      setStatus('Withdraw submitted')
    } catch (e) { setStatus(e.message) }
  }
  async function onBorrow() {
    try {
      setStatus('Borrowing...')
      const decimals = await publicClient.readContract({ address: asset, abi: ERC20_ABI, functionName: 'decimals' })
      const amt = BigInt(Math.floor(Number(amount) * 10 ** Number(decimals)))
      await borrow(asset, amt)
      setStatus('Borrow submitted')
    } catch (e) { setStatus(e.message) }
  }
  async function onRepay() {
    try {
      setStatus('Approving & Repaying...')
      const decimals = await publicClient.readContract({ address: asset, abi: ERC20_ABI, functionName: 'decimals' })
      const amt = BigInt(Math.floor(Number(amount) * 10 ** Number(decimals)))
      await repay(asset, amt)
      setStatus('Repay submitted')
    } catch (e) { setStatus(e.message) }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Manage Lending</h1>
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-gray-400 text-sm">Asset</div>
            <select className="input" value={asset} onChange={e => setSelectedAsset(e.target.value)}>
              {markets.map(m => (
                <option key={m.asset} value={m.asset}>{m.asset}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Amount</div>
            <input className="input" placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn btn-primary" onClick={onDeposit}>Deposit</button>
            <button className="btn btn-secondary" onClick={onWithdraw}>Withdraw</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div></div>
          <div></div>
          <div className="flex items-end gap-2">
            <button className="btn btn-primary" onClick={onBorrow}>Borrow</button>
            <button className="btn btn-secondary" onClick={onRepay}>Repay</button>
          </div>
        </div>
        {status && <div className="text-sm text-gray-400">{status}</div>}
      </div>
      <div className="text-sm text-gray-400">Pool: {pool.address}</div>
    </div>
  )
}

