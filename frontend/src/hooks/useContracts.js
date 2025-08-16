import { useMemo } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { getContract, parseAbi } from 'viem'
import { CONTRACT_ADDRESSES, V3_ADDRESSES } from '../config/chains'
import {
  TOKEN_FACTORY_ABI,
  LAUNCH_PAD_ABI,
  POOL_FACTORY_ABI,
  POOL_ABI,
  SWAP_ROUTER_ABI,
  WCORE_ABI,
  ERC20_ABI,
  BONDING_SALE_ABI,
  BONDING_FACTORY_ABI,
} from '../config/abis'

export const useContracts = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const contracts = useMemo(() => {
    if (!publicClient) return {}

    // viem v1 expects publicClient and walletClient as top-level properties
    const baseConfig = {
      publicClient,
      walletClient: walletClient || undefined,
    }

    return {
      // WCORE Contract (shared)
      wcore: getContract({
        address: CONTRACT_ADDRESSES.WCORE,
        abi: WCORE_ABI,
        ...baseConfig,
      }),

      // V2 Token Factory
      tokenFactory: getContract({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
        abi: TOKEN_FACTORY_ABI,
        ...baseConfig,
      }),

      // V2 LaunchPad (Fair Launch)
      launchPad: getContract({
        address: CONTRACT_ADDRESSES.LAUNCH_PAD,
        abi: LAUNCH_PAD_ABI,
        ...baseConfig,
      }),

      // Bonding/Pump Factory (optional until deployed)
      ...(CONTRACT_ADDRESSES.BONDING_FACTORY ? {
        bondingFactory: getContract({
          address: CONTRACT_ADDRESSES.BONDING_FACTORY,
          abi: BONDING_FACTORY_ABI,
          ...baseConfig,
        })
      } : {}),

      // V2 Pool Factory
      poolFactory: CONTRACT_ADDRESSES.POOL_FACTORY ? getContract({
        address: CONTRACT_ADDRESSES.POOL_FACTORY,
        abi: POOL_FACTORY_ABI,
        ...baseConfig,
      }) : null,

      // V2 Swap Router
      swapRouter: getContract({
        address: CONTRACT_ADDRESSES.SWAP_ROUTER,
        abi: SWAP_ROUTER_ABI,
        ...baseConfig,
      }),

      // V3 position manager
      v3PositionManager: getContract({
        address: V3_ADDRESSES.V3_POSITION_MANAGER,
        abi: [
          'function factory() view returns (address)',
          'function WETH9() view returns (address)'
        ],
        ...baseConfig,
      }),

      // V3 factory
      v3Factory: getContract({
        address: V3_ADDRESSES.V3_FACTORY,
        abi: [
          'function owner() view returns (address)'
        ],
        ...baseConfig,
      }),

      // V3 router
      v3Router: getContract({
        address: V3_ADDRESSES.V3_SWAP_ROUTER,
        abi: [
          'function factory() view returns (address)',
          'function WETH9() view returns (address)'
        ],
        ...baseConfig,
      }),

      // Helper function to get ERC20 contract
      getERC20Contract: (tokenAddress) => {
        if (!tokenAddress) return null
        return getContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          ...baseConfig,
        })
      },

      // Helper function to get any contract
      getContractInstance: (contractAddress, abi) => {
        if (!contractAddress || !abi) return null
        return getContract({
          address: contractAddress,
          abi: abi,
          ...baseConfig,
        })
      },

      // Expose clients for direct use
      publicClient,
      walletClient
    }
  }, [publicClient, walletClient])

  return contracts
}

// Hook for token operations
export const useTokenOperations = () => {
  const contracts = useContracts()
  const { address } = useAccount()

  const createBasicToken = async (tokenData) => {
    if (!contracts.tokenFactory || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const creationFee = await contracts.tokenFactory.read.creationFee()

      const tx = await contracts.tokenFactory.write.createBasicToken([
        tokenData.name,
        tokenData.symbol,
        tokenData.decimals,
        tokenData.totalSupply,
        address // token owner
      ], {
        value: creationFee,
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error creating token:', error)
      throw error
    }
  }

  const getTokenInfo = async (tokenAddress) => {
    if (!contracts.tokenFactory || !tokenAddress) return null

    try {
      const tokenInfo = await contracts.tokenFactory.read.tokenInfo([tokenAddress])
      return tokenInfo
    } catch (error) {
      console.error('Error getting token info:', error)
      return null
    }
  }

  const getUserTokens = async (userAddress) => {
    if (!contracts.tokenFactory || !userAddress) return []

    try {
      const tokens = await contracts.tokenFactory.read.userTokens([userAddress])
      return tokens
    } catch (error) {
      console.error('Error getting user tokens:', error)
      return []
    }
  }

  const approveToken = async (tokenAddress, amount, spenderAddress = null) => {
    if (!tokenAddress || amount == null || !address) {
      throw new Error('Token address, amount, and wallet connection required')
    }

    try {
      // Create a contract instance for the specific token using helper (ensures clients)
      const tokenContract = contracts.getERC20Contract(tokenAddress)
      if (!tokenContract) throw new Error('ERC20 contract not available')

      // Use provided spender or default to LaunchPad
      const spender = spenderAddress || CONTRACT_ADDRESSES.LAUNCH_PAD

      const tx = await tokenContract.write.approve([spender, amount], {
        account: address
      })
      return tx
    } catch (error) {
      console.error('Error approving token:', error)
      throw error
    }
  }

  return {
    createBasicToken,
    getTokenInfo,
    getUserTokens,
    approveToken,
  }
}

// Hook for launch operations
export const useLaunchOperations = () => {
  const contracts = useContracts()
  const { address } = useAccount()

  const createLaunch = async (launchData) => {
    if (!contracts.launchPad || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const launchFee = await contracts.launchPad.read.launchFee()

      const tx = await contracts.launchPad.write.createLaunch([
        launchData.tokenAddress,
        launchData.totalAmount,
        launchData.startTime,
        launchData.endTime,
        launchData.minContribution,
        launchData.maxContribution,
        launchData.metadataURI || ""
      ], {
        value: launchFee,
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error creating launch:', error)
      throw error
    }
  }

  const contribute = async (launchId, amount) => {
    if (!contracts.launchPad || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.launchPad.write.contribute([launchId], {
        value: amount,
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error contributing to launch:', error)
      throw error
    }
  }

  const getLaunchInfo = async (launchId) => {
    if (!contracts.launchPad) return null

    try {
      const launchInfo = await contracts.launchPad.read.launches([launchId])
      return launchInfo
    } catch (error) {
      console.error('Error getting launch info:', error)
      return null
    }
  }

  return {
    createLaunch,
    contribute,
    getLaunchInfo,
  }
}

// Hook for bonding/pump sale operations
export const usePumpSaleOperations = () => {
  const base = useContracts()
  const { address } = useAccount()

  const createSale = async ({ token, totalForSale, startTime, endTime, basePrice, slope }) => {
    if (!base.bondingFactory || !address) {
      throw new Error('Bonding factory not available or wallet not connected')
    }
    try {
      const tx = await base.bondingFactory.write.createSale([
        token,
        totalForSale,
        startTime,
        endTime,
        basePrice,
        slope
      ], { account: address })
      return tx
    } catch (e) {
      console.error('Error creating bonding sale:', e)
      throw e
    }
  }

  const buy = async (saleAddress, value) => {
    if (!saleAddress || !address) throw new Error('Missing sale or wallet')
    try {
      const sale = getContract({ address: saleAddress, abi: BONDING_SALE_ABI, publicClient: base.publicClient, walletClient: base.walletClient })
      const tx = await sale.write.buy([], { value, account: address })
      return tx
    } catch (e) {
      console.error('Error buying from sale:', e)
      throw e
    }
  }

  return { createSale, buy }
}

// Hook for DEX operations
export const useDEXOperations = () => {
  const contracts = useContracts()
  const { address } = useAccount()

  const createPool = async (tokenA, tokenB) => {
    if (!contracts.poolFactory || !address) {
      if (!contracts.poolFactory) throw new Error('Pool factory not configured')
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await contracts.poolFactory.write.createPool([tokenA, tokenB], {
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error creating pool:', error)
      throw error
    }
  }

  const getPool = async (tokenA, tokenB) => {
    if (!contracts.poolFactory) return null

    try {
      const poolAddress = await contracts.poolFactory.read.getPool([tokenA, tokenB])
      return poolAddress
    } catch (error) {
      console.error('Error getting pool:', error)
      return null
    }
  }

  const swapTokens = async (amountIn, amountOutMin, path, to, deadline) => {
    if (!contracts.swapRouter || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.swapRouter.write.swapExactTokensForTokens([
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
      ], {
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error swapping tokens:', error)
      throw error
    }
  }

  const getAmountsOut = async (amountIn, path) => {
    if (!contracts.swapRouter) return null

    try {
      const amounts = await contracts.swapRouter.read.getAmountsOut([amountIn, path])
      return amounts
    } catch (error) {
      console.error('Error getting amounts out:', error)
      return null
    }
  }

  const swapExactCOREForTokens = async (amountIn, amountOutMin, path, to, deadline) => {
    if (!contracts.swapRouter || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.swapRouter.write.swapExactCOREForTokens([
        amountOutMin,
        path,
        to,
        deadline
      ], {
        value: amountIn,
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error swapping CORE for tokens:', error)
      throw error
    }
  }

  const swapExactTokensForCORE = async (amountIn, amountOutMin, path, to, deadline) => {
    if (!contracts.swapRouter || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.swapRouter.write.swapExactTokensForCORE([
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
      ], {
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error swapping tokens for CORE:', error)
      throw error
    }
  }

  const addLiquidity = async (tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline) => {
    if (!contracts.swapRouter || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.swapRouter.write.addLiquidity([
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline
      ], {
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error adding liquidity:', error)
      throw error
    }
  }

  const addLiquidityCORE = async (token, amountTokenDesired, amountTokenMin, amountCOREMin, to, deadline, coreValue) => {
    if (!contracts.swapRouter || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.swapRouter.write.addLiquidityCORE([
        token,
        amountTokenDesired,
        amountTokenMin,
        amountCOREMin,
        to,
        deadline
      ], {
        value: coreValue,
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error adding CORE liquidity:', error)
      throw error
    }
  }

  const removeLiquidity = async (tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline) => {
    if (!contracts.swapRouter || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.swapRouter.write.removeLiquidity([
        tokenA,
        tokenB,
        liquidity,
        amountAMin,
        amountBMin,
        to,
        deadline
      ], {
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error removing liquidity:', error)
      throw error
    }
  }

  const removeLiquidityCORE = async (token, liquidity, amountTokenMin, amountCOREMin, to, deadline) => {
    if (!contracts.swapRouter || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.swapRouter.write.removeLiquidityCORE([
        token,
        liquidity,
        amountTokenMin,
        amountCOREMin,
        to,
        deadline
      ], {
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error removing CORE liquidity:', error)
      throw error
    }
  }

  const getAllPools = async () => {
    if (!contracts.poolFactory) return []

    try {
      const poolsLength = await contracts.poolFactory.read.allPoolsLength()
      const pools = []

      for (let i = 0; i < poolsLength; i++) {
        const poolAddress = await contracts.poolFactory.read.allPools([i])
        pools.push(poolAddress)
      }

      return pools
    } catch (error) {
      console.error('Error getting all pools:', error)
      return []
    }
  }

  const getPoolInfo = async (poolAddress) => {
    if (!poolAddress || !contracts.publicClient) return null

    try {
      // Get pool contract instance
      const poolContract = getContract({
        address: poolAddress,
        abi: POOL_ABI,
        publicClient: contracts.publicClient,
        walletClient: contracts.walletClient
      })

      const [token0, token1, reserves, totalSupply] = await Promise.all([
        poolContract.read.token0(),
        poolContract.read.token1(),
        poolContract.read.getReserves(),
        poolContract.read.totalSupply()
      ])

      return {
        address: poolAddress,
        token0,
        token1,
        reserve0: reserves[0],
        reserve1: reserves[1],
        totalSupply,
        blockTimestampLast: reserves[2]
      }
    } catch (error) {
      console.error('Error getting pool info:', error)
      return null
    }
  }

  return {
    createPool,
    getPool,
    swapTokens,
    getAmountsOut,
    swapExactCOREForTokens,
    swapExactTokensForCORE,
    addLiquidity,
    addLiquidityCORE,
    removeLiquidity,
    removeLiquidityCORE,
    getAllPools,
    getPoolInfo,
  }
}

// Hook for WCORE operations
export const useWCOREOperations = () => {
  const contracts = useContracts()
  const { address } = useAccount()

  const deposit = async (amount) => {
    if (!contracts.wcore || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.wcore.write.deposit([], {
        value: amount,
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error depositing CORE:', error)
      throw error
    }
  }

  const withdraw = async (amount) => {
    if (!contracts.wcore || !address) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const tx = await contracts.wcore.write.withdraw([amount], {
        account: address
      })

      return tx
    } catch (error) {
      console.error('Error withdrawing CORE:', error)
      throw error
    }
  }

  const getBalance = async (userAddress) => {
    if (!contracts.wcore) return null

    try {
      const balance = await contracts.wcore.read.balanceOf([userAddress || address])
      return balance
    } catch (error) {
      console.error('Error getting WCORE balance:', error)
      return null
    }
  }

  return {
    deposit,
    withdraw,
    getBalance,
  }
}
