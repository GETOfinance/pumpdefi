import { useState } from 'react'
import { usePublicClient } from 'wagmi'
import { getContract } from 'viem'
import { AFFILIATE_MANAGER_ABI } from '../config/abis'
import { CONTRACT_ADDRESSES } from '../config/chains'
import { toast } from 'react-hot-toast'

const AffiliateStatusCard = () => {
  const publicClient = usePublicClient()
  const [cid, setCid] = useState('')
  const [status, setStatus] = useState(null)

  const load = async () => {
    try {
      const affiliate = getContract({ address: CONTRACT_ADDRESSES.AFFILIATE_MANAGER, abi: AFFILIATE_MANAGER_ABI, publicClient })
      const [creator, token, amountPerAction, balance, active] = await affiliate.read.campaigns([BigInt(cid)])
      setStatus({ creator, token, amountPerAction, balance, active })
    } catch {
      setStatus(null)
      toast.error('Failed to load')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-3">Campaign Status</h2>
      <div className="grid md:grid-cols-3 gap-3 items-center">
        <input className="input" placeholder="Campaign ID" value={cid} onChange={e=>setCid(e.target.value)} />
        <button className="btn btn-outline" onClick={load}>Load</button>
      </div>
      {status && (
        <div className="mt-4 text-sm text-gray-300 space-y-1">
          <div>Creator: {status.creator}</div>
          <div>Token: {status.token}</div>
          <div>Amount per action: {status.amountPerAction?.toString?.()}</div>
          <div>Balance: {status.balance?.toString?.()}</div>
          <div>Active: {String(status.active)}</div>
        </div>
      )}
    </div>
  )
}

export default AffiliateStatusCard

