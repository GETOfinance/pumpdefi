import React, { useState } from 'react'
import { usePublicClient } from 'wagmi'
import { getContract } from 'viem'
import { POOL_ABI } from '../config/abis'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function V2ImportPair() {
  const publicClient = usePublicClient()
  const navigate = useNavigate()
  const [pair, setPair] = useState('')
  const [info, setInfo] = useState(null)

  const handleImport = async () => {
    try {
      const c = getContract({ address: pair, abi: POOL_ABI, publicClient })
      const [token0, token1] = await Promise.all([c.read.token0(), c.read.token1()])
      setInfo({ token0, token1 })
      toast.success('Pair found')
    } catch {
      setInfo(null)
      toast.error('Invalid pair address')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Import V2 Pair</h1>
        <div className="space-y-4 bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <input value={pair} onChange={e=>setPair(e.target.value)} placeholder="Pair (pool) address" className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
          <button onClick={handleImport} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl">Import</button>
          {info && (
            <div className="text-sm text-gray-300">Token0: {info.token0}<br/>Token1: {info.token1}</div>
          )}
        </div>
      </div>
    </div>
  )
}

