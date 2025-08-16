import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useNavigate, useLocation } from 'react-router-dom'
import { formatEther, parseEther, getContract, formatUnits, parseAbiItem } from 'viem'
import { POOL_ABI, V3_NPM_ABI, ERC20_ABI } from '../config/abis'
import { valuePositionUSD } from '../utils/v3Math'
import axios from 'axios'
import { API_CONFIG, CONTRACT_ADDRESSES, V3_ADDRESSES } from '../config/chains'
import {
  Plus,
  Search,
  Loader2,
  ChevronDown,
  MoreHorizontal,
  ArrowUpRight,
  BookOpen,
  Repeat,
  Wallet,
  ExternalLink,
  Droplets,
  TrendingUp
} from 'lucide-react'
import { useDEXOperations, useContracts } from '../hooks/useContracts'
import WalletConnectButton from '../components/WalletConnectButton'
import toast from 'react-hot-toast'


// Quick error mapper for clearer DEX messages
const extractErrorMessage = (error) => {
  try {
    return (
      error?.shortMessage ||
      error?.details ||
      error?.message ||
      error?.cause?.shortMessage ||
      error?.cause?.message ||
      ''
    )
  } catch {
    return ''
  }
}

const mapDexError = (error) => {
  const msg = (extractErrorMessage(error) || '').toString()

  // Common Factory errors
  if (msg.includes('IDENTICAL_ADDRESSES')) return 'Tokens must be different addresses'
  if (msg.includes('ZERO_ADDRESS')) return 'One of the token addresses is zero/invalid'
  if (msg.includes('POOL_EXISTS')) return 'Pool already exists for this token pair'

  // Router errors
  if (msg.includes('SwapRouter: EXPIRED')) return 'Transaction deadline expired. Try again.'
  if (msg.includes('INSUFFICIENT_A_AMOUNT')) return 'Amount A too low given slippage. Increase amount or slippage.'
  if (msg.includes('INSUFFICIENT_B_AMOUNT')) return 'Amount B too low given slippage. Increase amount or slippage.'
  if (msg.includes('INVALID_PATH')) return 'Invalid path. For CORE routes, ensure WCORE is included correctly.'
  if (msg.includes('INSUFFICIENT_OUTPUT_AMOUNT')) return 'Insufficient output amount. Increase slippage or input amount.'
  if (msg.includes('EXCESSIVE_INPUT_AMOUNT')) return 'Input exceeds allowed maximum. Check amounts and slippage.'
  if (msg.includes('TRANSFER_FROM_FAILED')) return 'Token approval/allowance missing or token is non-standard.'
  if (msg.includes('TRANSFER_FAILED')) return 'Token transfer failed. Check balances and token rules.'
  if (msg.includes('CORE_TRANSFER_FAILED')) return 'CORE transfer failed.'

  // Wallet-level/user actions
  if (msg.toLowerCase().includes('user rejected')) return 'Transaction rejected in wallet'
  if (msg.toLowerCase().includes('insufficient funds')) return 'Insufficient CORE for gas or token balance'

  // Fallback
  return msg || 'Transaction failed. Please try again.'
}

// Zentra-style Pool Row Component
const PoolRow = ({ pool, onAddLiquidity }) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        {/* Pool Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                {pool.token0.symbol[0]}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                {pool.token1.symbol[0]}
              </div>
            </div>
            <div>
              <div className="text-white font-semibold">{pool.token0.symbol}/{pool.token1.symbol}</div>
              <div className="text-gray-400 text-sm">0.3%</div>
            </div>
          </div>
        </div>

        {/* TVL */}
        <div className="text-right min-w-[100px]">
          <div className="text-white font-medium">${parseFloat(pool.tvl).toLocaleString()}</div>
          <div className="text-gray-400 text-sm">TVL</div>
        </div>

        {/* Volume 24h */}
        <div className="text-right min-w-[100px]">
          <div className="text-white font-medium">${parseFloat(pool.volume24h).toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Volume 24H</div>
        </div>

        {/* Fees 24h */}
        <div className="text-right min-w-[100px]">
          <div className="text-white font-medium">${parseFloat(pool.fees24h).toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Fees 24H</div>
        </div>

        {/* APR */}
        <div className="text-right min-w-[80px]">
          <div className="text-green-400 font-semibold">{pool.apr}%</div>
          <div className="text-gray-400 text-sm">APR</div>
        </div>

        {/* Action Button */}
        <div className="ml-4">
          <button
            onClick={() => onAddLiquidity && onAddLiquidity(pool)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Zentra-style Position Row Component
const PositionRow = ({ position, onManage }) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-200">
      <div className="flex items-center justify-between">
        {/* Position Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                {position.token0.symbol[0]}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                {position.token1.symbol[0]}
              </div>
            </div>
            <div>
              <div className="text-white font-semibold">{position.token0.symbol}/{position.token1.symbol}</div>
              <div className="text-gray-400 text-sm">0.3% • In range</div>
            </div>
          </div>
        </div>

        {/* Position Value */}
        <div className="text-right min-w-[120px]">
          <div className="text-white font-medium">${position.value}</div>
          <div className="text-gray-400 text-sm">Position Value</div>
        </div>

        {/* Fees Earned */}
        <div className="text-right min-w-[100px]">
          <div className="text-green-400 font-medium">${position.feesEarned}</div>
          <div className="text-gray-400 text-sm">Fees Earned</div>
        </div>

        {/* APR */}
        <div className="text-right min-w-[80px]">
          <div className="text-green-400 font-semibold">{position.apr}%</div>
          <div className="text-gray-400 text-sm">APR</div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 ml-4">
          <button onClick={() => onManage?.()} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm">
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}

const Pools = () => {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    addLiquidity,
    addLiquidityCORE,
    getAllPools,
    getPoolInfo,
    createPool
  } = useDEXOperations()
  const contractsCtx = useContracts()

  // State management
  const [activeView, setActiveView] = useState('v3') // 'v3' or 'v2'
  const [pools, setPools] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [showAddLiquidityModal, setShowAddLiquidityModal] = useState(false)
  const [selectedPool, setSelectedPool] = useState(null)
  const [liquidityAmounts, setLiquidityAmounts] = useState({ tokenA: '', tokenB: '' })

  // Check if we're on V2 route
  const isV2Route = location.pathname.includes('/v2')

  useEffect(() => {
    if (isV2Route) {
      setActiveView('v2')
    } else {
      setActiveView('v3')
    }
  }, [isV2Route])

  // Load pools data (V2) and V3 positions
  useEffect(() => {
    if (!isConnected) {
      setPools([])
      setPositions([])
      return
    }
    loadPoolsData()
    loadV3Positions().catch(() => {})
  }, [isConnected])

  // Handle navigation to V2
  const handleV2Navigation = () => {
    navigate('/pools/v2')
  }

  // Handle new position creation
  const handleNewPosition = () => {
    if (activeView === 'v2') {
      // Navigate to V2 add liquidity
      navigate('/pools/v2/add')
    } else {
      // Navigate to V3 add liquidity
      navigate('/pools/add')
    }
  }

  // Handle pool creation
  const handleCreatePool = async (tokenA, tokenB) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      const tx = await createPool(tokenA, tokenB)
      toast.success('Pool creation submitted! Waiting for confirmation...')

      // Reload pools after creation
      setTimeout(() => {
        loadPoolsData()
      }, 5000)
    } catch (error) {
      console.error('Error creating pool:', error)
      toast.error(mapDexError(error))
    } finally {
      setLoading(false)
    }
  }

  // Handle opening add liquidity modal
  const handleOpenAddLiquidity = (pool) => {
    setSelectedPool(pool)
    setLiquidityAmounts({ tokenA: '', tokenB: '' })
    setShowAddLiquidityModal(true)
  }

  // Handle liquidity addition
  const handleAddLiquidityToPool = async () => {
    if (!isConnected || !selectedPool) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!liquidityAmounts.tokenA || !liquidityAmounts.tokenB) {
      toast.error('Please enter amounts for both tokens')
      return
    }

    try {
      setLoading(true)

      const deadline = Math.floor(Date.now() / 1000) + 1200 // 20 minutes
      const amountADesired = parseEther(liquidityAmounts.tokenA.toString())
      const amountBDesired = parseEther(liquidityAmounts.tokenB.toString())
      const amountAMin = parseEther((parseFloat(liquidityAmounts.tokenA) * 0.95).toString()) // 5% slippage
      const amountBMin = parseEther((parseFloat(liquidityAmounts.tokenB) * 0.95).toString()) // 5% slippage

      // Approve router to spend tokens if needed
      const needsApprovalA = selectedPool.token0.address !== CONTRACT_ADDRESSES.WCORE
      const needsApprovalB = selectedPool.token1.address !== CONTRACT_ADDRESSES.WCORE

      if (needsApprovalA) {
        try {
          const erc20A = contractsCtx.getERC20Contract(selectedPool.token0.address)
          const currentAllowance = await erc20A.read.allowance([address, CONTRACT_ADDRESSES.SWAP_ROUTER])
          if (currentAllowance < amountADesired) {
            await erc20A.write.approve([CONTRACT_ADDRESSES.SWAP_ROUTER, amountADesired], { account: address })
          }
        } catch (e) {
          console.warn('Token0 approval skipped/failed:', e?.message)
        }
      }
      if (needsApprovalB) {
        try {
          const erc20B = contractsCtx.getERC20Contract(selectedPool.token1.address)
          const currentAllowance = await erc20B.read.allowance([address, CONTRACT_ADDRESSES.SWAP_ROUTER])
          if (currentAllowance < amountBDesired) {
            await erc20B.write.approve([CONTRACT_ADDRESSES.SWAP_ROUTER, amountBDesired], { account: address })
          }
        } catch (e) {
          console.warn('Token1 approval skipped/failed:', e?.message)
        }
      }

      const isWcorePair = selectedPool.token0.address === CONTRACT_ADDRESSES.WCORE || selectedPool.token1.address === CONTRACT_ADDRESSES.WCORE
      if (isWcorePair) {
        // Handle CORE liquidity when pool includes WCORE
        const tokenAddress = selectedPool.token0.address === CONTRACT_ADDRESSES.WCORE ? selectedPool.token1.address : selectedPool.token0.address
        const tokenAmount = selectedPool.token0.address === CONTRACT_ADDRESSES.WCORE ? amountBDesired : amountADesired
        const coreAmount = selectedPool.token0.address === CONTRACT_ADDRESSES.WCORE ? amountADesired : amountBDesired

        await addLiquidityCORE(
          tokenAddress,
          tokenAmount,
          parseEther((parseFloat(formatEther(tokenAmount)) * 0.95).toString()),
          parseEther((parseFloat(formatEther(coreAmount)) * 0.95).toString()),
          address,
          deadline,
          coreAmount
        )
      } else {
        // Regular token-token liquidity
        await addLiquidity(
          selectedPool.token0.address,
          selectedPool.token1.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          address,
          deadline
        )
      }

      toast.success('Liquidity addition submitted! Waiting for confirmation...')
      setShowAddLiquidityModal(false)

      // Reload pools after addition
      setTimeout(() => {
        loadPoolsData()
      }, 5000)
    } catch (error) {
      console.error('Error adding liquidity:', error)
      toast.error(mapDexError(error))
    } finally {
      setLoading(false)
    }
  }

  const loadPoolsData = async () => {
    setLoading(true)
    try {
      // Get all pools from the blockchain
      const poolAddresses = await getAllPools()

      if (!poolAddresses || poolAddresses.length === 0) {
        setPools([])
        setPositions([])
        return
      }

      const poolsData = []

      for (const addr of poolAddresses) {
        try {
          const poolInfo = await getPoolInfo(addr)
          if (!poolInfo) continue

          // Query token metadata directly for accurate symbols/decimals
          const token0Contract = contractsCtx.getERC20Contract(poolInfo.token0)
          const token1Contract = contractsCtx.getERC20Contract(poolInfo.token1)
          const [token0Symbol, token1Symbol, token0Decimals, token1Decimals] = await Promise.all([
            token0Contract.read.symbol().catch(() => 'TOKEN0'),
            token1Contract.read.symbol().catch(() => 'TOKEN1'),
            token0Contract.read.decimals().catch(() => 18),
            token1Contract.read.decimals().catch(() => 18),
          ])

          // Fetch USD prices (mock backend) for TVL
          let price0 = 1, price1 = 1
          try {
            const [p0, p1] = await Promise.all([
              axios.get(`${API_CONFIG.BACKEND_URL}/api/price/token/${poolInfo.token0}`),
              axios.get(`${API_CONFIG.BACKEND_URL}/api/price/token/${poolInfo.token1}`)
            ])
            price0 = p0.data?.price || 1
            price1 = p1.data?.price || 1
          } catch {}

          // Use correct decimals when formatting reserves
          const reserve0Formatted = Number(formatUnits(poolInfo.reserve0, token0Decimals))
          const reserve1Formatted = Number(formatUnits(poolInfo.reserve1, token1Decimals))
          const tvl = reserve0Formatted * price0 + reserve1Formatted * price1

          // Compute user LP data
          let userLpBalance = 0n
          if (isConnected) {
            try {
              const poolContract = getContract({ address: addr, abi: POOL_ABI, publicClient })
              userLpBalance = await poolContract.read.balanceOf([address])
            } catch {}
          }
          const totalSupply = poolInfo.totalSupply
          const share = totalSupply > 0n ? Number(userLpBalance) / Number(totalSupply) * 100 : 0
          const userToken0Raw = totalSupply > 0n ? (userLpBalance * poolInfo.reserve0) / totalSupply : 0n
          const userToken1Raw = totalSupply > 0n ? (userLpBalance * poolInfo.reserve1) / totalSupply : 0n
          const userLiquidityUsd = Number(formatUnits(userToken0Raw, token0Decimals)) * price0 + Number(formatUnits(userToken1Raw, token1Decimals)) * price1

          poolsData.push({
            id: addr,
            address: addr,
            token0: { symbol: token0Symbol, address: poolInfo.token0, decimals: token0Decimals },
            token1: { symbol: token1Symbol, address: poolInfo.token1, decimals: token1Decimals },
            reserve0: poolInfo.reserve0,
            reserve1: poolInfo.reserve1,
            totalSupply: poolInfo.totalSupply,
            userLpBalance,
            userToken0: userToken0Raw,
            userToken1: userToken1Raw,
            userLiquidityUsd: userLiquidityUsd.toFixed(2),
            poolShare: share,
            apr: '0.0',
            volume24h: '0',
            fees24h: '0',
            tvl: tvl.toFixed(2)
          })
        } catch (e) {
          console.warn('Failed to load pool', addr, e?.message)
        }
      }

      setPools(poolsData)
      setPositions([])
    } catch (error) {
      console.error('Error loading pools:', error)
      setPools([])
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  // Zentra-style V3 interface
  // Load V3 positions by scanning Transfer events from NPM and reading positions(tokenId)
  const loadV3Positions = async () => {
    try {
      setLoading(true)
      const npm = getContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: V3_NPM_ABI, publicClient })
      const transferEvent = {
        type: 'event', name: 'Transfer', inputs: [
          { type: 'address', name: 'from', indexed: true },
          { type: 'address', name: 'to', indexed: true },
          { type: 'uint256', name: 'tokenId', indexed: true },
        ]
      }
      const latest = await publicClient.getBlockNumber()
      const fromBlock = latest - 200000n > 0n ? latest - 200000n : 0n
      const logsIn = await publicClient.getLogs({ address: V3_ADDRESSES.V3_POSITION_MANAGER, fromBlock, toBlock: latest, event: transferEvent, args: { to: address } })
      const tokenIds = new Set(); logsIn.forEach(l => tokenIds.add(l.args.tokenId))
      const positionsData = []
      for (const tokenId of tokenIds) {
        try {
          const owner = await npm.read.ownerOf([tokenId]); if (owner.toLowerCase() !== address.toLowerCase()) continue
          const pos = await npm.read.positions([tokenId])
          const token0 = pos[2], token1 = pos[3], fee = Number(pos[4])
          const tickLower = Number(pos[5]), tickUpper = Number(pos[6])
          const liquidity = pos[7], tokensOwed0 = pos[10], tokensOwed1 = pos[11]
          const t0 = getContract({ address: token0, abi: ERC20_ABI, publicClient })
          const t1 = getContract({ address: token1, abi: ERC20_ABI, publicClient })
          const [sym0, sym1, dec0, dec1] = await Promise.all([
            t0.read.symbol().catch(() => 'T0'), t1.read.symbol().catch(() => 'T1'),
            t0.read.decimals().catch(() => 18), t1.read.decimals().catch(() => 18),
          ])

          const token0Meta = { symbol: sym0, address: token0, decimals: dec0 }
          const token1Meta = { symbol: sym1, address: token1, decimals: dec1 }
          const valuation = await valuePositionUSD(publicClient, API_CONFIG.BACKEND_URL, { fee, tickLower, tickUpper, liquidity, tokensOwed0, tokensOwed1 }, token0Meta, token1Meta)

          positionsData.push({ id: tokenId.toString(), tokenId, token0: token0Meta, token1: token1Meta, fee: (fee/10000).toFixed(2) + '%', liquidity, feesEarned: (valuation.valueUsd - (parseFloat(valuation.amount0)*0 + parseFloat(valuation.amount1)*0)).toFixed(2), value: valuation.valueUsd.toFixed(2), apr: '0.0' })
        } catch {}
      }
      setPositions(positionsData)
    } catch { setPositions([]) } finally { setLoading(false) }
  }

  if (activeView === 'v3') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header - Exact Zentra Style */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Pools</h1>
            <div className="flex items-center space-x-4">
              {/* More Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200"
                >
                  <span className="text-white">More</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showMoreDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-50">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowMoreDropdown(false)
                          if (selectedPool?.token0?.address && selectedPool?.token1?.address) {
                            navigate(`/v2/add-liquidity?tokenA=${selectedPool.token0.address}&tokenB=${selectedPool.token1.address}`)
                          } else {
                            toast.error('Select a pool first')
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center space-x-3"
                      >
                        <Repeat className="h-4 w-4" />
                        <span>Migrate</span>
                        <ArrowUpRight className="h-4 w-4 ml-auto" />
                      </button>
                      <button
                        onClick={() => {
                          setShowMoreDropdown(false)
                          handleV2Navigation()
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center space-x-3"
                      >
                        <Droplets className="h-4 w-4" />
                        <span>V2 liquidity</span>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </button>
                      <button
                        onClick={() => {
                          setShowMoreDropdown(false)
                          // Handle learn
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center space-x-3"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Learn</span>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* New Position Button */}
              <button
                onClick={handleNewPosition}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span className="text-white font-medium">New position</span>
              </button>
            </div>
          </div>

          {/* V3 Content */}
          {loading ? (
            <div className="text-center py-20">
                  {/* Quick link to new position */}
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/pools/add')}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Create a new V3 position ↗
                    </button>
                  </div>

              <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Loading your positions...
              </h3>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <Wallet className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Your active V3 liquidity positions will appear here.
              </h3>
              {!isConnected ? (
                <div className="mt-8">
                  <WalletConnectButton
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                    text="Connect a wallet"
                  />
                </div>
              ) : positions.length === 0 ? (
                <div className="mt-8 space-y-4">
                  <p className="text-gray-400">No liquidity positions found.</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        // Learn about providing liquidity
                        window.open('https://docs.uniswap.org/concepts/protocol/concentrated-liquidity', '_blank')
                      }}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Learn about providing liquidity ↗
                    </button>
                    <button
                      onClick={() => {
                        // Top pools
                        window.open('https://info.uniswap.org/#/pools', '_blank')
                      }}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Top pools ↗
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mt-4">
                    Check out our v3 LP walkthrough and migration guides.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Explore Uniswap Analytics.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <PositionRow key={position.id} position={position} onManage={() => navigate(`/pools/v3/positions/${position.tokenId}`)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  // Zentra-style V2 interface
  if (activeView === 'v2') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* V2 Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Your V2 liquidity</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // Create a pair
                  navigate('/pools/v2/create')
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200 text-white"
              >
                Create a pair
              </button>
              <button
                onClick={() => {
                  // Import pool
                  navigate('/pools/v2/import')
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200 text-white"
              >
                Import pool
              </button>
              <button
                onClick={() => {
                  // Add V2 liquidity
                  navigate('/pools/v2/add')
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200 text-white"
              >
                Add V2 liquidity
              </button>
            </div>
          </div>

          {/* Liquidity Provider Rewards Banner */}
          <div className="mb-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Liquidity provider rewards
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Liquidity providers earn a 0.3% fee on all trades proportional to their share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
                </p>
                <button
                  onClick={() => {
                    // Read more about providing liquidity
                    window.open('https://docs.uniswap.org/concepts/protocol/fees', '_blank')
                  }}
                  className="text-green-400 hover:text-green-300 text-sm underline"
                >
                  Read more about providing liquidity
                </button>
              </div>
            </div>
          </div>

          {/* V2 Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Loading your liquidity...
              </h3>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-6">Connect to a wallet to view your liquidity.</p>
              <WalletConnectButton
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                text="Connect a wallet"
              />
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-6">No liquidity found.</p>
              <p className="text-gray-500 text-sm">
                Don't see a pool you joined?
                <button
                  onClick={() => navigate('/pools/v2/import')}
                  className="text-blue-400 hover:text-blue-300 underline ml-1"
                >
                  Import it.
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* V2 Pool List */}
              <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/30 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm text-gray-400 font-medium">
                  <div className="flex-1">Pool</div>
                  <div className="text-right min-w-[100px]">Your Liquidity</div>
                  <div className="text-right min-w-[100px]">Pool Share</div>
                  <div className="text-right min-w-[80px]">APR</div>
                  <div className="ml-4 w-[80px]"></div>
                </div>
              </div>

              {pools.map((pool) => (
                <div key={pool.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    {/* Pool Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                            {pool.token0.symbol[0]}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                            {pool.token1.symbol[0]}
                          </div>
                        </div>
                        <div>
                          <div className="text-white font-semibold">{pool.token0.symbol}/{pool.token1.symbol}</div>
                          <div className="text-gray-400 text-sm">V2 Pool</div>
                        </div>
                      </div>
                    </div>

                    {/* Your Liquidity */}
                    <div className="text-right min-w-[100px]">
                      <div className="text-white font-medium">${Number(pool.userLiquidityUsd || '0').toLocaleString()}</div>
                      <div className="text-gray-400 text-sm">Your Liquidity</div>
                    </div>

                    {/* Pool Share */}
                    <div className="text-right min-w-[100px]">
                      <div className="text-white font-medium">0%</div>
                      <div className="text-gray-400 text-sm">Pool Share</div>
                    </div>

                    {/* APR */}
                    <div className="text-right min-w-[80px]">
                      <div className="text-green-400 font-semibold">{pool.apr}%</div>
                      <div className="text-gray-400 text-sm">APR</div>
                    </div>

                    {/* Action Button */}
                    <div className="ml-4">
                      <button
                        onClick={() => handleOpenAddLiquidity(pool)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Add Liquidity Modal
  const AddLiquidityModal = () => {
    if (!showAddLiquidityModal || !selectedPool) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Add Liquidity</h3>
            <button
              onClick={() => setShowAddLiquidityModal(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Token A Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {selectedPool.token0.symbol} Amount
              </label>
              <input
                type="number"
                placeholder="0.0"
                value={liquidityAmounts.tokenA}
                onChange={(e) => setLiquidityAmounts(prev => ({ ...prev, tokenA: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>

            {/* Token B Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {selectedPool.token1.symbol} Amount
              </label>
              <input
                type="number"
                placeholder="0.0"
                value={liquidityAmounts.tokenB}
                onChange={(e) => setLiquidityAmounts(prev => ({ ...prev, tokenB: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>

            {/* Add Liquidity Button */}
            <button
              onClick={handleAddLiquidityToPool}
              disabled={loading || !liquidityAmounts.tokenA || !liquidityAmounts.tokenB}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Adding Liquidity...</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Add Liquidity</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render the appropriate view
  if (activeView === 'v3') {
    return (
      <>
        {/* V3 Interface */}
        <div className="min-h-screen bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header - Exact Zentra Style */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">Pools</h1>
              <div className="flex items-center space-x-4">
                {/* More Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200"
                  >
                    <span className="text-white">More</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {showMoreDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-50">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowMoreDropdown(false)
                            if (selectedPool?.token0?.address && selectedPool?.token1?.address) {
                              navigate(`/v2/add-liquidity?tokenA=${selectedPool.token0.address}&tokenB=${selectedPool.token1.address}`)
                            } else {
                              toast.error('Select a pool first')
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center space-x-3"
                        >
                          <Repeat className="h-4 w-4" />
                          <span>Migrate</span>
                          <ArrowUpRight className="h-4 w-4 ml-auto" />
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreDropdown(false)
                            handleV2Navigation()
                          }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center space-x-3"
                        >
                          <Droplets className="h-4 w-4" />
                          <span>V2 liquidity</span>
                          <ExternalLink className="h-4 w-4 ml-auto" />
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreDropdown(false)
                            // Handle learn
                          }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center space-x-3"
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>Learn</span>
                          <ExternalLink className="h-4 w-4 ml-auto" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* New Position Button */}
                <button
                  onClick={handleNewPosition}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-white font-medium">New position</span>
                </button>
              </div>
            </div>

            {/* V3 Content */}
            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Loading your positions...
                </h3>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Your active V3 liquidity positions will appear here.
                </h3>
                {!isConnected ? (
                  <div className="mt-8">
                    <WalletConnectButton
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                      text="Connect a wallet"
                    />
                  </div>
                ) : positions.length === 0 ? (
                  <div className="mt-8 space-y-4">
                    <p className="text-gray-400">No liquidity positions found.</p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => {
                          // Learn about providing liquidity
                          window.open('https://docs.uniswap.org/concepts/protocol/concentrated-liquidity', '_blank')
                        }}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Learn about providing liquidity ↗
                      </button>

                      <div className="mt-6">
                        <button
                          onClick={() => navigate('/pools/add')}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Create a new V3 position ↗
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          // Top pools
                          window.open('https://info.uniswap.org/#/pools', '_blank')
                        }}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Top pools ↗
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm mt-4">
                      Check out our v3 LP walkthrough and migration guides.
                    </p>
                    <p className="text-gray-500 text-sm">
                      Explore Uniswap Analytics.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {positions.map((position) => (
                      <PositionRow key={position.id} position={position} onManage={() => navigate(`/pools/v3/positions/${position.tokenId}`)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <AddLiquidityModal />
      </>
    )
  }

  if (activeView === 'v2') {
    return (
      <>
        {/* V2 Interface */}
        <div className="min-h-screen bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* V2 Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">Your V2 liquidity</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    // Create a pair
                    navigate('/pools/v2/create')
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200 text-white"
                >
                  Create a pair
                </button>
                <button
                  onClick={() => {
                    // Import pool
                    navigate('/pools/v2/import')
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200 text-white"
                >
                  Import pool
                </button>
                <button
                  onClick={() => {
                    // Add V2 liquidity
                    navigate('/pools/v2/add')
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200 text-white"
                >
                  Add V2 liquidity
                </button>
              </div>
            </div>

            {/* Liquidity Provider Rewards Banner */}
            <div className="mb-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Liquidity provider rewards
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Liquidity providers earn a 0.3% fee on all trades proportional to their share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
                  </p>
                  <button
                    onClick={() => {
                      // Read more about providing liquidity
                      window.open('https://docs.uniswap.org/concepts/protocol/fees', '_blank')
                    }}
                    className="text-green-400 hover:text-green-300 text-sm underline"
                  >
                    Read more about providing liquidity
                  </button>
                </div>
              </div>
            </div>

            {/* V2 Content */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Loading your liquidity...
                </h3>
              </div>
            ) : !isConnected ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-6">Connect to a wallet to view your liquidity.</p>
                <WalletConnectButton
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                  text="Connect a wallet"
                />
              </div>
            ) : pools.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-6">No liquidity found.</p>
                <p className="text-gray-500 text-sm">
                  Don't see a pool you joined?
                  <button
                    onClick={() => navigate('/pools/v2/import')}
                    className="text-blue-400 hover:text-blue-300 underline ml-1"
                  >
                    Import it.
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* V2 Pool List */}
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/30 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm text-gray-400 font-medium">
                    <div className="flex-1">Pool</div>
                    <div className="text-right min-w-[100px]">Your Liquidity</div>
                    <div className="text-right min-w-[100px]">Pool Share</div>
                    <div className="text-right min-w-[80px]">APR</div>
                    <div className="ml-4 w-[80px]"></div>
                  </div>
                </div>

                {pools.map((pool) => (
                  <div key={pool.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      {/* Pool Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex -space-x-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                              {pool.token0.symbol[0]}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center border-2 border-gray-900 text-white text-xs font-bold">
                              {pool.token1.symbol[0]}
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">{pool.token0.symbol}/{pool.token1.symbol}</div>
                            <div className="text-gray-400 text-sm">V2 Pool</div>
                          </div>
                        </div>
                      </div>

                      {/* Your Liquidity */}
                      <div className="text-right min-w-[100px]">
                        <div className="text-white font-medium">${Number(pool.userLiquidityUsd || '0').toLocaleString()}</div>
                        <div className="text-gray-400 text-sm">Your Liquidity</div>
                      </div>

                      {/* Pool Share */}
                      <div className="text-right min-w-[100px]">
                        <div className="text-white font-medium">0%</div>
                        <div className="text-gray-400 text-sm">Pool Share</div>
                      </div>

                      {/* APR */}
                      <div className="text-right min-w-[80px]">
                        <div className="text-green-400 font-semibold">{pool.apr}%</div>
                        <div className="text-gray-400 text-sm">APR</div>
                      </div>

                      {/* Action Button */}
                      <div className="ml-4">
                        <button
                          onClick={() => handleOpenAddLiquidity(pool)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <AddLiquidityModal />
      </>
    )
  }

  // Default return (should not reach here)
  return null
}

export default Pools
