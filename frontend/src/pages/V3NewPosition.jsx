import { useEffect, useMemo, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { getContract, parseUnits, formatUnits } from 'viem'
import { V3_ADDRESSES, CONTRACT_ADDRESSES } from '../config/chains'
import { V3_NPM_ABI, ERC20_ABI } from '../config/abis'
import WalletConnectButton from '../components/WalletConnectButton'
import { toast } from 'react-hot-toast'

const FEE = 3000 // 0.3%

export default function V3NewPosition() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  const npm = useMemo(() => {
    if (!publicClient) return null
    return getContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: V3_NPM_ABI, client: { public: publicClient } })
  }, [publicClient])

  const [token0, setToken0] = useState('')
  const [token1, setToken1] = useState('')
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [loading, setLoading] = useState(false)

  const approveIfNeeded = async (token, amount, spender) => {
    const c = getContract({ address: token, abi: ERC20_ABI, client: { public: publicClient } })
    const decimals = await c.read.decimals()
    const amt = parseUnits(amount || '0', decimals)
    const allowance = await c.read.allowance([address, spender])
    if (allowance < amt) {
      await c.write.approve([spender, amt], { account: address })
    }
    return amt
  }

  const onMint = async () => {
    if (!isConnected) { toast.error('Connect your wallet'); return }
    if (!token0 || !token1 || !amount0 || !amount1) { toast.error('Fill all fields'); return }

    try {
      setLoading(true)
      // Approvals
      const amt0 = await approveIfNeeded(token0, amount0, V3_ADDRESSES.V3_POSITION_MANAGER)
      const amt1 = await approveIfNeeded(token1, amount1, V3_ADDRESSES.V3_POSITION_MANAGER)

      // Create/init pool if needed using a mid price of 1:1 for demo
      const q96 = BigInt(2) ** BigInt(96)
      const sqrtPriceX96 = q96 // 1:1
      try {
        await npm.write.createAndInitializePoolIfNecessary([
          token0, token1, FEE, sqrtPriceX96
        ], { account: address })
      } catch {}

      const deadline = BigInt(Math.floor(Date.now()/1000) + 1200)

      // Use wide ticks [-887220, 887220] for full range
      const params = {
        token0,
        token1,
        fee: FEE,
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: amt0,
        amount1Desired: amt1,
        amount0Min: (amt0 * 95n) / 100n,
        amount1Min: (amt1 * 95n) / 100n,
        recipient: address,
        deadline
      }

      const tx = await npm.write.mint([params], { account: address })
      toast.success('Mint submitted!')
      console.log('tx', tx)
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Mint failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">New V3 Position (0.3%)</h1>

        {!isConnected ? (
          <WalletConnectButton className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl" text="Connect a wallet" />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Token0 address</label>
              <input value={token0} onChange={e=>setToken0(e.target.value)} className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl" placeholder="0x..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Token1 address</label>
              <input value={token1} onChange={e=>setToken1(e.target.value)} className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl" placeholder="0x..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount0</label>
                <input value={amount0} onChange={e=>setAmount0(e.target.value)} className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount1</label>
                <input value={amount1} onChange={e=>setAmount1(e.target.value)} className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl" placeholder="0.0" />
              </div>
            </div>

            <button onClick={onMint} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl">
              {loading ? 'Minting...' : 'Mint Position'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

