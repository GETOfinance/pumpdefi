// Debug script to check contract state and parameters
import { createPublicClient, http, parseEther, formatEther } from 'viem'

// Core testnet configuration
const coreTestnet = {
  id: 1114,
  name: 'Core Testnet',
  network: 'core-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Core',
    symbol: 'CORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test2.btcs.network'],
    },
    public: {
      http: ['https://rpc.test2.btcs.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Core Scan', url: 'https://scan.test.btcs.network' },
  },
}

const client = createPublicClient({
  chain: coreTestnet,
  transport: http()
})

const TOKEN_FACTORY_ADDRESS = '0x95ee06ec2D944B891E82CEd2F1404FBB8A36dA44' // This should now be correct

// Simplified ABI for testing
const SIMPLE_ABI = [
  {
    "type": "function",
    "name": "createBasicToken",
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "decimals", "type": "uint8"},
      {"name": "totalSupply", "type": "uint256"},
      {"name": "tokenOwner", "type": "address"}
    ],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "creationFee",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  }
]

async function debugContract() {
  try {
    console.log('🔍 Debugging Token Factory Contract...')
    console.log('📍 Contract Address:', TOKEN_FACTORY_ADDRESS)
    
    // Check if contract exists
    const code = await client.getBytecode({ address: TOKEN_FACTORY_ADDRESS })
    console.log('📄 Contract Code Length:', code ? code.length : 'No code found')
    
    if (!code || code === '0x') {
      console.error('❌ Contract not deployed at this address!')
      return
    }
    
    // Try to read creation fee
    try {
      const creationFee = await client.readContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: SIMPLE_ABI,
        functionName: 'creationFee',
      })
      console.log('💰 Creation Fee:', formatEther(creationFee), 'CORE')
    } catch (error) {
      console.error('❌ Failed to read creation fee:', error.message)
    }
    
    // Try to read owner
    try {
      const owner = await client.readContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: SIMPLE_ABI,
        functionName: 'owner',
      })
      console.log('👤 Contract Owner:', owner)
    } catch (error) {
      console.error('❌ Failed to read owner:', error.message)
    }
    
    // Test parameters that would be sent
    const testParams = {
      name: "Test Token",
      symbol: "TEST",
      decimals: 18,
      totalSupply: parseEther("1000000"),
      tokenOwner: "0x1234567890123456789012345678901234567890" // dummy address
    }
    
    console.log('🧪 Test Parameters:')
    console.log('  Name:', testParams.name)
    console.log('  Symbol:', testParams.symbol)
    console.log('  Decimals:', testParams.decimals)
    console.log('  Total Supply:', formatEther(testParams.totalSupply))
    console.log('  Token Owner:', testParams.tokenOwner)
    
    // Try to simulate the call (this won't actually execute)
    try {
      const result = await client.simulateContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: SIMPLE_ABI,
        functionName: 'createBasicToken',
        args: [
          testParams.name,
          testParams.symbol,
          testParams.decimals,
          testParams.totalSupply,
          testParams.tokenOwner
        ],
        value: parseEther('0.01'), // 0.01 CORE
        account: testParams.tokenOwner
      })
      console.log('✅ Contract simulation successful!')
      console.log('📤 Expected result:', result.result)
    } catch (error) {
      console.error('❌ Contract simulation failed:', error.message)
      console.error('📋 Full error:', error)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugContract()
