import { useState } from 'react'
import { useAccount, useContractWrite, useContractRead, usePrepareContractWrite } from 'wagmi'
import { parseEther } from 'viem'
import { CONTRACT_ADDRESSES } from '../config/chains'
import { TOKEN_FACTORY_ABI } from '../config/abis'

export const useTokenFactory = () => {
  const { address } = useAccount()
  const [isCreating, setIsCreating] = useState(false)

  // Read creation fee
  const { data: creationFee } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'creationFee',
  })

  // Read user tokens
  const { data: userTokens, refetch: refetchUserTokens } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getUserTokens',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  // Prepare contract write
  const { config: contractConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'createBasicToken',
    enabled: false, // We'll enable this dynamically
  })

  const { writeAsync: createTokenWrite } = useContractWrite(contractConfig)

  const createBasicToken = async (tokenData) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    if (!creationFee) {
      throw new Error('Could not fetch creation fee')
    }

    setIsCreating(true)

    try {
      console.log('Creating token with data:', tokenData)
      console.log('Creation fee:', creationFee.toString())

      // Prepare the transaction
      const { config } = await usePrepareContractWrite({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createBasicToken',
        args: [
          tokenData.name,
          tokenData.symbol,
          tokenData.decimals,
          tokenData.totalSupply,
          address
        ],
        value: creationFee,
      })

      // Execute the transaction
      const { hash } = await createTokenWrite?.(config)
      
      if (!hash) {
        throw new Error('Transaction failed to execute')
      }

      console.log('Token creation transaction hash:', hash)
      return hash

    } catch (error) {
      console.error('Token creation error:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  return {
    createBasicToken,
    creationFee,
    userTokens,
    isCreating,
    refetchUserTokens,
  }
}

// Alternative hook using direct contract interaction
export const useTokenFactoryDirect = () => {
  const { address } = useAccount()
  const [isCreating, setIsCreating] = useState(false)

  const createBasicToken = async (tokenData) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsCreating(true)

    try {
      // Import wagmi client
      const { getWalletClient, getPublicClient } = await import('wagmi/actions')
      const { writeContract, readContract } = await import('wagmi/actions')
      
      // Get creation fee
      const creationFee = await readContract({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'creationFee',
      })

      console.log('Creation fee:', creationFee.toString())
      console.log('Token data:', tokenData)

      // Execute contract write
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createBasicToken',
        args: [
          tokenData.name,
          tokenData.symbol,
          tokenData.decimals,
          tokenData.totalSupply,
          address
        ],
        value: creationFee,
      })

      console.log('Transaction hash:', hash)
      return hash

    } catch (error) {
      console.error('Direct token creation error:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  return {
    createBasicToken,
    isCreating,
  }
}

// Hook for reading token factory data
export const useTokenFactoryData = () => {
  const { address } = useAccount()

  const { data: creationFee } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'creationFee',
  })

  const { data: owner } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'owner',
  })

  const { data: userTokens } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getUserTokens',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  const { data: allTokens } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getAllTokens',
  })

  return {
    creationFee,
    owner,
    userTokens: userTokens || [],
    allTokens: allTokens || [],
  }
}

// Simple contract test function
export const testTokenFactoryConnection = async () => {
  try {
    const { readContract } = await import('wagmi/actions')
    
    const creationFee = await readContract({
      address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'creationFee',
    })

    const owner = await readContract({
      address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'owner',
    })

    console.log('TokenFactory connection test successful:')
    console.log('- Creation fee:', creationFee.toString())
    console.log('- Owner:', owner)
    
    return {
      success: true,
      creationFee: creationFee.toString(),
      owner,
    }
  } catch (error) {
    console.error('TokenFactory connection test failed:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
