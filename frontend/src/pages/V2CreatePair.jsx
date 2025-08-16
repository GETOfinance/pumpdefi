import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { useDEXOperations } from '../hooks/useContracts'
import { isAddress } from 'viem'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { CONTRACT_ADDRESSES } from '../config/chains'
import { tokenListManager } from '../config/tokens'

export default function V2CreatePair() {
  const { isConnected } = useAccount()
  const dexOps = useDEXOperations() || {}
  const { createPool } = dexOps
  const navigate = useNavigate()
  const [tokenA, setTokenA] = useState('')
  const [tokenB, setTokenB] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!isConnected) return toast.error('Connect wallet')
    // Accept "CORE" symbol as native (will be wrapped to WCORE)
    const a = tokenA.trim()
    const b = tokenB.trim()
    const addrA = a.toUpperCase() === 'CORE' ? CONTRACT_ADDRESSES.WCORE : a
    const addrB = b.toUpperCase() === 'CORE' ? CONTRACT_ADDRESSES.WCORE : b
    const validA = isAddress(addrA)
    const validB = isAddress(addrB)
    if (!validA || !validB || addrA.toLowerCase() === addrB.toLowerCase())
      return toast.error('Enter valid token addresses')
    if (!createPool) return toast.error('Pool factory not configured')
    try {
      setLoading(true)
      await createPool(addrA, addrB)
      toast.success('Create pair submitted')
      setTimeout(() => navigate('/pools/v2/add?tokenA='+addrA+'&tokenB='+addrB), 1500)
    } catch (e) {
      toast.error(e?.shortMessage || e?.message || 'Create failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Create V2 Pair</h1>
        <div className="space-y-4 bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <input value={tokenA} onChange={e=>setTokenA(e.target.value)} placeholder="Token A address (0x... or CORE)" className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
          <input value={tokenB} onChange={e=>setTokenB(e.target.value)} placeholder="Token B address (0x... or CORE)" className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
          <button disabled={loading} onClick={handleCreate} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl">{loading?'Submitting...':'Create Pair'}</button>
        </div>
      </div>
    </div>
  )
}

