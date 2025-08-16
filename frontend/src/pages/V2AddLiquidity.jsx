import React, { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useDEXOperations, useContracts } from '../hooks/useContracts'
import { getContract, parseUnits, formatUnits } from 'viem'
import { ERC20_ABI } from '../config/abis'
import { CONTRACT_ADDRESSES } from '../config/chains'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function V2AddLiquidity() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { addLiquidity, addLiquidityCORE } = useDEXOperations()
  const { getERC20Contract } = useContracts()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const [tokenA, setTokenA] = useState(params.get('tokenA') || '')
  const [tokenB, setTokenB] = useState(params.get('tokenB') || '')
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // prefill from query params
  }, [])

  const ensureAllowance = async (token, spender, amount) => {
    const erc = getERC20Contract(token)
    const current = await erc.read.allowance([address, spender])
    if (current >= amount) return
    await erc.write.approve([spender, amount], { account: address })
  }

  const handleSubmit = async () => {
    try {
      if (!isConnected) return toast.error('Connect wallet')
      if (!tokenA || !tokenB) return toast.error('Enter tokens')
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
      const amountADesired = parseUnits(amountA || '0', 18)
      const amountBDesired = parseUnits(amountB || '0', 18)
      const slip = Math.max(0, parseFloat(slippage || '0.5'))
      const amountAMin = amountADesired - (amountADesired * BigInt(Math.floor(slip*100))) / 10000n
      const amountBMin = amountBDesired - (amountBDesired * BigInt(Math.floor(slip*100))) / 10000n

      const isWcorePair = tokenA.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase() || tokenB.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase()
      if (isWcorePair) {
        const token = tokenA.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase() ? tokenB : tokenA
        const tokenAmt = tokenA.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase() ? amountBDesired : amountADesired
        const coreAmt = tokenA.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase() ? amountADesired : amountBDesired
        await ensureAllowance(token, CONTRACT_ADDRESSES.SWAP_ROUTER, tokenAmt)
        await addLiquidityCORE(token, tokenAmt, amountAMin, amountBMin, address, deadline, coreAmt)
      } else {
        await ensureAllowance(tokenA, CONTRACT_ADDRESSES.SWAP_ROUTER, amountADesired)
        await ensureAllowance(tokenB, CONTRACT_ADDRESSES.SWAP_ROUTER, amountBDesired)
        await addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, address, deadline)
      }
      toast.success('Add liquidity submitted')
    } catch (e) {
      toast.error(e?.shortMessage || 'Add failed')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Add V2 Liquidity</h1>
        <div className="space-y-4 bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <input value={tokenA} onChange={e=>setTokenA(e.target.value)} placeholder="Token A" className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
          <input value={tokenB} onChange={e=>setTokenB(e.target.value)} placeholder="Token B" className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <input value={amountA} onChange={e=>setAmountA(e.target.value)} placeholder="Amount A" className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
            <input value={amountB} onChange={e=>setAmountB(e.target.value)} placeholder="Amount B" className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-sm text-gray-400">Slippage %</div>
            <input value={slippage} onChange={e=>setSlippage(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded-lg" />
          </div>
          <button disabled={loading} onClick={handleSubmit} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl">{loading?'Submitting...':'Add Liquidity'}</button>
        </div>
      </div>
    </div>
  )
}

