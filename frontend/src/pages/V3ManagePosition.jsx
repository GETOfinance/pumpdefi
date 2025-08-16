import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { getContract, parseEther, parseUnits } from 'viem'
import { V3_NPM_ABI, ERC20_ABI } from '../config/abis'
import { V3_ADDRESSES } from '../config/chains'
import { valuePositionUSD } from '../utils/v3Math'
import toast from 'react-hot-toast'

export default function V3ManagePosition() {
  const { data: walletClient } = useWalletClient()

  const { tokenId } = useParams()
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState(null)
  const [token0Meta, setToken0Meta] = useState(null)
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [decreasePct, setDecreasePct] = useState('25')

  const [token1Meta, setToken1Meta] = useState(null)
  const [valuation, setValuation] = useState(null)

  const npm = getContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: V3_NPM_ABI, publicClient })

  useEffect(() => {
    if (!isConnected) return
    reload().catch(() => {})
  }, [isConnected, tokenId])

  const MAX_UINT128 = (1n << 128n) - 1n

  const ensureAllowance = async (tokenAddr, decimals, amount) => {
    if (!walletClient) throw new Error('Wallet not connected')
    const erc = getContract({ address: tokenAddr, abi: ERC20_ABI, publicClient, walletClient })
    const current = await erc.read.allowance([address, V3_ADDRESSES.V3_POSITION_MANAGER])
    if (current >= amount) return
    await erc.write.approve([V3_ADDRESSES.V3_POSITION_MANAGER, amount], { account: address })
  }

  const reload = async () => {
    setLoading(true)
    try {
      const pos = await npm.read.positions([BigInt(tokenId)])
      const token0 = pos[2], token1 = pos[3], fee = Number(pos[4])
      const tickLower = Number(pos[5]), tickUpper = Number(pos[6])
      const liquidity = pos[7], tokensOwed0 = pos[10], tokensOwed1 = pos[11]
      const t0 = getContract({ address: token0, abi: ERC20_ABI, publicClient })
      const t1 = getContract({ address: token1, abi: ERC20_ABI, publicClient })
      const [sym0, sym1, dec0, dec1] = await Promise.all([
        t0.read.symbol().catch(() => 'T0'), t1.read.symbol().catch(() => 'T1'),
        t0.read.decimals().catch(() => 18), t1.read.decimals().catch(() => 18),
      ])
      const token0Meta_ = { symbol: sym0, address: token0, decimals: dec0 }
      const token1Meta_ = { symbol: sym1, address: token1, decimals: dec1 }
      setToken0Meta(token0Meta_); setToken1Meta(token1Meta_)
      const valuation_ = await valuePositionUSD(publicClient, import.meta.env.VITE_BACKEND_URL || '', { fee, tickLower, tickUpper, liquidity, tokensOwed0, tokensOwed1 }, token0Meta_, token1Meta_)
      setValuation(valuation_)
      setPosition({ fee, tickLower, tickUpper, liquidity, tokensOwed0, tokensOwed1 })
    } catch (e) {
      // ignore
    } finally { setLoading(false) }
  }

  const handleIncrease = async () => {
    try {
      if (!position || !walletClient) return toast.error('Connect wallet')
      const amt0 = amount0 ? parseUnits(amount0, token0Meta.decimals) : 0n
      const amt1 = amount1 ? parseUnits(amount1, token1Meta.decimals) : 0n
      if (amt0 === 0n && amt1 === 0n) return toast.error('Enter amount')
      await ensureAllowance(token0Meta.address, token0Meta.decimals, amt0)
      await ensureAllowance(token1Meta.address, token1Meta.decimals, amt1)
      const npmW = getContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: V3_NPM_ABI, publicClient, walletClient })
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
      await npmW.write.increaseLiquidity([
        {
          tokenId: BigInt(tokenId),
          amount0Desired: amt0,
          amount1Desired: amt1,
          amount0Min: 0n,
          amount1Min: 0n,
          deadline,
        }
      ], { account: address })
      toast.success('Increase liquidity submitted')
      setAmount0(''); setAmount1('')
      setTimeout(reload, 8000)
    } catch (e) {
      toast.error(e?.shortMessage || 'Increase failed')
    }
  }
  const handleDecrease = async () => {
    try {
      if (!position || !walletClient) return toast.error('Connect wallet')
      const pct = Math.max(0, Math.min(100, parseInt(decreasePct || '0', 10)))
      if (pct <= 0) return toast.error('Enter % to decrease')
      const liq = (position.liquidity * BigInt(pct)) / 100n
      const npmW = getContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: V3_NPM_ABI, publicClient, walletClient })
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
      await npmW.write.decreaseLiquidity([
        { tokenId: BigInt(tokenId), liquidity: liq, amount0Min: 0n, amount1Min: 0n, deadline }
      ], { account: address })
      // auto collect
      await npmW.write.collect([
        { tokenId: BigInt(tokenId), recipient: address, amount0Max: MAX_UINT128, amount1Max: MAX_UINT128 }
      ], { account: address })
      toast.success('Decrease + collect submitted')
      setTimeout(reload, 8000)
    } catch (e) {
      toast.error(e?.shortMessage || 'Decrease failed')
    }
  }
  const handleCollect = async () => {
    try {
      if (!walletClient) return toast.error('Connect wallet')
      const npmW = getContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: V3_NPM_ABI, publicClient, walletClient })
      await npmW.write.collect([
        { tokenId: BigInt(tokenId), recipient: address, amount0Max: MAX_UINT128, amount1Max: MAX_UINT128 }
      ], { account: address })
      toast.success('Collect submitted')
      setTimeout(reload, 6000)
    } catch (e) {
      toast.error(e?.shortMessage || 'Collect failed')
    }
  }

  if (!isConnected) return <div className="p-6">Connect your wallet</div>
  if (loading) return <div className="p-6">Loading...</div>
  if (!position) return <div className="p-6">Position not found</div>

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manage Position #{tokenId}</h1>
          <button onClick={() => navigate('/pools')} className="px-3 py-2 bg-gray-800 rounded-lg">Back</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <div className="text-lg font-semibold mb-1">Overview</div>
            <div className="text-sm text-gray-400">{token0Meta.symbol}/{token1Meta.symbol} • Fee {(position.fee/10000).toFixed(2)}%</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Tick Range</span><span>{position.tickLower} to {position.tickUpper}</span></div>
              <div className="flex justify-between"><span>Liquidity</span><span>{position.liquidity.toString()}</span></div>
              <div className="flex justify-between"><span>Tokens Owed</span><span>{token0Meta.symbol} {position.tokensOwed0.toString()} • {token1Meta.symbol} {position.tokensOwed1.toString()}</span></div>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <div className="text-lg font-semibold mb-1">Valuation</div>
            {valuation ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Amount {token0Meta.symbol}</span><span>{valuation.amount0}</span></div>
                <div className="flex justify-between"><span>Amount {token1Meta.symbol}</span><span>{valuation.amount1}</span></div>
                <div className="flex justify-between font-semibold text-white"><span>Total USD</span><span>${valuation.valueUsd.toFixed(2)}</span></div>
              </div>
            ) : <div className="text-gray-400">No valuation</div>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={handleIncrease} className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl">Increase Liquidity</button>
          <button onClick={handleDecrease} className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl">Decrease Liquidity</button>
          <button onClick={handleCollect} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl">Collect Fees</button>
        </div>
      </div>
    </div>
  )
}

