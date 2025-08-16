import { createPublicClient, http, parseEther, formatEther } from 'viem'
import { coreTestnet } from '../config/chains'
import { CONTRACT_ADDRESSES } from '../config/chains'
import { TOKEN_FACTORY_ABI, WCORE_ABI } from '../config/abis'

// Create a public client for reading contract data
const publicClient = createPublicClient({
  chain: coreTestnet,
  transport: http('https://rpc.test2.btcs.network')
})

export const testContractConnections = async () => {
  console.log('🧪 Testing contract connections...')
  
  const results = {
    wcore: { success: false, data: null, error: null },
    tokenFactory: { success: false, data: null, error: null },
  }

  // Test WCORE contract
  try {
    console.log('Testing WCORE contract...')
    const wcoreName = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.WCORE,
      abi: WCORE_ABI,
      functionName: 'name',
    })
    
    const wcoreSymbol = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.WCORE,
      abi: WCORE_ABI,
      functionName: 'symbol',
    })
    
    const wcoreTotalSupply = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.WCORE,
      abi: WCORE_ABI,
      functionName: 'totalSupply',
    })

    results.wcore = {
      success: true,
      data: {
        name: wcoreName,
        symbol: wcoreSymbol,
        totalSupply: formatEther(wcoreTotalSupply),
        address: CONTRACT_ADDRESSES.WCORE
      },
      error: null
    }
    
    console.log('✅ WCORE contract test passed:', results.wcore.data)
  } catch (error) {
    results.wcore.error = error.message
    console.error('❌ WCORE contract test failed:', error)
  }

  // Test TokenFactory contract
  try {
    console.log('Testing TokenFactory contract...')
    const creationFee = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'creationFee',
    })
    
    const owner = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'owner',
    })

    // Try to get token count (might fail on some contract versions)
    let tokenCount = 0
    try {
      const allTokens = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'getAllTokens',
      })
      tokenCount = allTokens.length
    } catch (e) {
      console.warn('Could not get token count:', e.message)
    }

    results.tokenFactory = {
      success: true,
      data: {
        creationFee: formatEther(creationFee),
        owner,
        tokenCount,
        address: CONTRACT_ADDRESSES.TOKEN_FACTORY
      },
      error: null
    }
    
    console.log('✅ TokenFactory contract test passed:', results.tokenFactory.data)
  } catch (error) {
    results.tokenFactory.error = error.message
    console.error('❌ TokenFactory contract test failed:', error)
  }

  return results
}

export const simulateTokenCreation = async (tokenData) => {
  console.log('🧪 Simulating token creation...')
  
  try {
    // Get creation fee
    const creationFee = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'creationFee',
    })

    console.log('Creation fee required:', formatEther(creationFee), 'CORE')
    console.log('Token data to create:', tokenData)

    // Simulate the contract call (this won't actually execute)
    const simulationResult = await publicClient.simulateContract({
      address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'createBasicToken',
      args: [
        tokenData.name,
        tokenData.symbol,
        tokenData.decimals,
        tokenData.totalSupply,
        tokenData.owner || '0x0000000000000000000000000000000000000000'
      ],
      value: creationFee,
      account: '0x0000000000000000000000000000000000000000' // Dummy account for simulation
    })

    console.log('✅ Token creation simulation successful')
    return {
      success: true,
      creationFee: formatEther(creationFee),
      simulation: simulationResult
    }
  } catch (error) {
    console.error('❌ Token creation simulation failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Test function that can be called from browser console
window.testContracts = testContractConnections
window.simulateToken = simulateTokenCreation

export default {
  testContractConnections,
  simulateTokenCreation
}
