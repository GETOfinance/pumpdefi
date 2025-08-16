import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { useContracts } from './useContracts'

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalValueLocked: '0',
    totalVolume24h: '0',
    totalTokensCreated: 0,
    totalLaunches: 0,
    totalPools: 0,
    activeUsers24h: 0,
    loading: true,
    error: null
  })

  const contracts = useContracts()
  const publicClient = usePublicClient()

  useEffect(() => {
    loadAnalytics()
  }, [contracts])

  const loadAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true, error: null }))

      // Get basic contract data
      const [
        totalTokens,
        totalLaunches,
        totalPools,
        wcoreBalance
      ] = await Promise.allSettled([
        getTotalTokensCreated(),
        getTotalLaunches(),
        getTotalPools(),
        getWCOREBalance()
      ])

      // Calculate TVL (simplified - just WCORE balance for now)
      const tvl = wcoreBalance.status === 'fulfilled' ? wcoreBalance.value : '0'

      // Mock data for now - in production, this would come from subgraph/indexer
      const mockVolume24h = '156000' // $156K
      const mockActiveUsers = 1247

      setAnalytics({
        totalValueLocked: tvl,
        totalVolume24h: mockVolume24h,
        totalTokensCreated: totalTokens.status === 'fulfilled' ? totalTokens.value : 0,
        totalLaunches: totalLaunches.status === 'fulfilled' ? totalLaunches.value : 0,
        totalPools: totalPools.status === 'fulfilled' ? totalPools.value : 0,
        activeUsers24h: mockActiveUsers,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  const getTotalTokensCreated = async () => {
    if (!contracts.tokenFactory) return 0

    try {
      // Try to get token count - this might not exist in current contract
      const count = await contracts.tokenFactory.read.getTokenCount?.() || 0n
      return Number(count)
    } catch (error) {
      // Fallback: try to get all tokens length
      try {
        const tokens = await contracts.tokenFactory.read.getAllTokens?.() || []
        return tokens.length
      } catch (fallbackError) {
        console.warn('Could not get token count:', fallbackError)
        return 0
      }
    }
  }

  const getTotalLaunches = async () => {
    if (!contracts.launchPad) return 0

    try {
      const nextId = await contracts.launchPad.read.nextLaunchId?.() || 0n
      return Number(nextId)
    } catch (error) {
      console.warn('Could not get launch count:', error)
      return 0
    }
  }

  const getTotalPools = async () => {
    if (!contracts.poolFactory) return 0

    try {
      const count = await contracts.poolFactory.read.allPoolsLength?.() || 0n
      return Number(count)
    } catch (error) {
      console.warn('Could not get pool count:', error)
      return 0
    }
  }

  const getWCOREBalance = async () => {
    if (!contracts.wcore) return '0'

    try {
      const balance = await contracts.wcore.read.totalSupply?.() || 0n
      return formatEther(balance)
    } catch (error) {
      console.warn('Could not get WCORE balance:', error)
      return '0'
    }
  }

  const refreshAnalytics = () => {
    loadAnalytics()
  }

  return {
    ...analytics,
    refreshAnalytics
  }
}

// Hook for token analytics
export const useTokenAnalytics = (tokenAddress) => {
  const [tokenData, setTokenData] = useState({
    price: '0',
    volume24h: '0',
    marketCap: '0',
    holders: 0,
    totalSupply: '0',
    loading: true,
    error: null
  })

  const contracts = useContracts()

  useEffect(() => {
    if (tokenAddress) {
      loadTokenAnalytics()
    }
  }, [tokenAddress, contracts])

  const loadTokenAnalytics = async () => {
    try {
      setTokenData(prev => ({ ...prev, loading: true, error: null }))

      const tokenContract = contracts.getERC20Contract(tokenAddress)
      if (!tokenContract) {
        throw new Error('Invalid token address')
      }

      const [totalSupply, tokenInfo] = await Promise.allSettled([
        tokenContract.read.totalSupply(),
        contracts.tokenFactory?.read.tokenInfo([tokenAddress])
      ])

      // Mock price data - in production, this would come from price oracle
      const mockPrice = '0.001'
      const mockVolume = '12500'
      const mockHolders = 156

      const supply = totalSupply.status === 'fulfilled' ? formatEther(totalSupply.value) : '0'
      const marketCap = (parseFloat(supply) * parseFloat(mockPrice)).toString()

      setTokenData({
        price: mockPrice,
        volume24h: mockVolume,
        marketCap: marketCap,
        holders: mockHolders,
        totalSupply: supply,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading token analytics:', error)
      setTokenData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  return tokenData
}

// Hook for launch analytics
export const useLaunchAnalytics = (launchId) => {
  const [launchData, setLaunchData] = useState({
    totalRaised: '0',
    totalContributors: 0,
    progress: 0,
    timeRemaining: 0,
    isActive: false,
    loading: true,
    error: null
  })

  const contracts = useContracts()

  useEffect(() => {
    if (launchId !== undefined && launchId !== null) {
      loadLaunchAnalytics()
    }
  }, [launchId, contracts])

  const loadLaunchAnalytics = async () => {
    try {
      setLaunchData(prev => ({ ...prev, loading: true, error: null }))

      if (!contracts.launchPad) {
        throw new Error('LaunchPad contract not available')
      }

      const launchInfo = await contracts.launchPad.read.launches([launchId])
      
      const totalRaised = formatEther(launchInfo[7] || 0n) // totalRaised
      const totalContributors = Number(launchInfo[8] || 0n) // totalContributors
      const totalAmount = formatEther(launchInfo[2] || 0n) // totalAmount
      const endTime = Number(launchInfo[4] || 0n) // endTime
      
      const progress = totalAmount > 0 ? (parseFloat(totalRaised) / parseFloat(totalAmount)) * 100 : 0
      const timeRemaining = Math.max(0, endTime - Math.floor(Date.now() / 1000))
      const isActive = timeRemaining > 0 && !launchInfo[9] && !launchInfo[10] // not finalized and not cancelled

      setLaunchData({
        totalRaised,
        totalContributors,
        progress: Math.min(100, progress),
        timeRemaining,
        isActive,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading launch analytics:', error)
      setLaunchData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  return launchData
}

// Utility functions for formatting analytics data
export const formatAnalyticsNumber = (value, type = 'number') => {
  const num = parseFloat(value) || 0

  switch (type) {
    case 'currency':
      if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
      if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`
      return `$${num.toFixed(2)}`
    
    case 'percentage':
      return `${num.toFixed(2)}%`
    
    case 'compact':
      if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
      return num.toFixed(0)
    
    default:
      return num.toLocaleString()
  }
}

export const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return 'Ended'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
