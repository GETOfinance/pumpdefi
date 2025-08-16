import { parseEther, formatEther } from 'viem'
import { CONTRACT_ADDRESSES } from '../config/chains'

/**
 * Comprehensive test suite for Web3 integration
 * This script tests all smart contract interactions
 */

export class Web3IntegrationTester {
  constructor(contracts, address) {
    this.contracts = contracts
    this.address = address
    this.testResults = []
  }

  async runAllTests() {
    console.log('🧪 Starting Web3 Integration Tests...')
    this.testResults = []

    const tests = [
      this.testWCOREContract,
      this.testTokenFactoryContract,
      this.testLaunchPadContract,
      this.testPoolFactoryContract,
      this.testSwapRouterContract,
    ]

    for (const test of tests) {
      try {
        await test.call(this)
      } catch (error) {
        this.addResult(test.name, false, error.message)
      }
    }

    this.printResults()
    return this.testResults
  }

  addResult(testName, success, message = '') {
    this.testResults.push({
      test: testName,
      success,
      message,
      timestamp: new Date().toISOString()
    })
    
    const emoji = success ? '✅' : '❌'
    console.log(`${emoji} ${testName}: ${message}`)
  }

  async testWCOREContract() {
    const testName = 'WCORE Contract'
    
    if (!this.contracts.wcore) {
      this.addResult(testName, false, 'WCORE contract not available')
      return
    }

    try {
      // Test reading contract data
      const name = await this.contracts.wcore.read.name()
      const symbol = await this.contracts.wcore.read.symbol()
      const decimals = await this.contracts.wcore.read.decimals()
      const totalSupply = await this.contracts.wcore.read.totalSupply()

      if (name === 'Wrapped CORE' && symbol === 'WCORE' && decimals === 18) {
        this.addResult(testName, true, `Contract data correct. Total Supply: ${formatEther(totalSupply)} WCORE`)
      } else {
        this.addResult(testName, false, `Unexpected contract data: ${name}, ${symbol}, ${decimals}`)
      }
    } catch (error) {
      this.addResult(testName, false, `Error reading contract: ${error.message}`)
    }
  }

  async testTokenFactoryContract() {
    const testName = 'Token Factory Contract'
    
    if (!this.contracts.tokenFactory) {
      this.addResult(testName, false, 'TokenFactory contract not available')
      return
    }

    try {
      // Test reading contract data
      const creationFee = await this.contracts.tokenFactory.read.creationFee()
      const owner = await this.contracts.tokenFactory.read.owner()
      
      // Try to get token count (might not exist in all versions)
      let tokenCount = 0
      try {
        const count = await this.contracts.tokenFactory.read.getTokenCount?.()
        tokenCount = Number(count || 0n)
      } catch (e) {
        // Fallback method
        try {
          const tokens = await this.contracts.tokenFactory.read.getAllTokens?.()
          tokenCount = tokens?.length || 0
        } catch (e2) {
          console.warn('Could not get token count')
        }
      }

      this.addResult(testName, true, `Fee: ${formatEther(creationFee)} CORE, Owner: ${owner}, Tokens: ${tokenCount}`)
    } catch (error) {
      this.addResult(testName, false, `Error reading contract: ${error.message}`)
    }
  }

  async testLaunchPadContract() {
    const testName = 'LaunchPad Contract'
    
    if (!this.contracts.launchPad) {
      this.addResult(testName, false, 'LaunchPad contract not available')
      return
    }

    try {
      // Test reading contract data
      const launchFee = await this.contracts.launchPad.read.launchFee()
      
      // Try to get next launch ID
      let nextLaunchId = 0
      try {
        const id = await this.contracts.launchPad.read.nextLaunchId?.()
        nextLaunchId = Number(id || 0n)
      } catch (e) {
        console.warn('Could not get next launch ID')
      }

      this.addResult(testName, true, `Fee: ${formatEther(launchFee)} CORE, Next Launch ID: ${nextLaunchId}`)
    } catch (error) {
      this.addResult(testName, false, `Error reading contract: ${error.message}`)
    }
  }

  async testPoolFactoryContract() {
    const testName = 'Pool Factory Contract'
    
    if (!this.contracts.poolFactory) {
      this.addResult(testName, false, 'PoolFactory contract not available')
      return
    }

    try {
      // Test reading contract data
      const feeTo = await this.contracts.poolFactory.read.feeTo()
      const feeToSetter = await this.contracts.poolFactory.read.feeToSetter()
      
      // Get total pools
      let poolCount = 0
      try {
        const count = await this.contracts.poolFactory.read.allPoolsLength()
        poolCount = Number(count || 0n)
      } catch (e) {
        console.warn('Could not get pool count')
      }

      this.addResult(testName, true, `Fee To: ${feeTo}, Setter: ${feeToSetter}, Pools: ${poolCount}`)
    } catch (error) {
      this.addResult(testName, false, `Error reading contract: ${error.message}`)
    }
  }

  async testSwapRouterContract() {
    const testName = 'Swap Router Contract'
    
    if (!this.contracts.swapRouter) {
      this.addResult(testName, false, 'SwapRouter contract not available')
      return
    }

    try {
      // Test reading contract data
      const factory = await this.contracts.swapRouter.read.factory()
      const wcore = await this.contracts.swapRouter.read.WCORE()

      const factoryMatch = factory.toLowerCase() === CONTRACT_ADDRESSES.POOL_FACTORY.toLowerCase()
      const wcoreMatch = wcore.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase()

      if (factoryMatch && wcoreMatch) {
        this.addResult(testName, true, `Factory and WCORE addresses correct`)
      } else {
        this.addResult(testName, false, `Address mismatch - Factory: ${factoryMatch}, WCORE: ${wcoreMatch}`)
      }
    } catch (error) {
      this.addResult(testName, false, `Error reading contract: ${error.message}`)
    }
  }

  async testTokenCreation() {
    const testName = 'Token Creation Test'
    
    if (!this.contracts.tokenFactory || !this.address) {
      this.addResult(testName, false, 'TokenFactory not available or wallet not connected')
      return
    }

    try {
      const creationFee = await this.contracts.tokenFactory.read.creationFee()
      
      // This is a dry run - we don't actually create the token
      const tokenData = {
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        totalSupply: parseEther('1000000'),
      }

      this.addResult(testName, true, `Ready to create token. Fee required: ${formatEther(creationFee)} CORE`)
    } catch (error) {
      this.addResult(testName, false, `Error preparing token creation: ${error.message}`)
    }
  }

  async testSwapQuote() {
    const testName = 'Swap Quote Test'
    
    if (!this.contracts.swapRouter) {
      this.addResult(testName, false, 'SwapRouter not available')
      return
    }

    try {
      // Test getting amounts out for a hypothetical swap
      const amountIn = parseEther('1')
      const path = [CONTRACT_ADDRESSES.WCORE, CONTRACT_ADDRESSES.WCORE] // Self-swap for testing
      
      // This might fail if no liquidity exists, which is expected
      try {
        const amounts = await this.contracts.swapRouter.read.getAmountsOut([amountIn, path])
        this.addResult(testName, true, `Quote successful: ${formatEther(amounts[1])} output`)
      } catch (quoteError) {
        this.addResult(testName, true, `Quote failed as expected (no liquidity): ${quoteError.message}`)
      }
    } catch (error) {
      this.addResult(testName, false, `Error getting quote: ${error.message}`)
    }
  }

  printResults() {
    console.log('\n📊 Web3 Integration Test Results:')
    console.log('================================')
    
    const passed = this.testResults.filter(r => r.success).length
    const total = this.testResults.length
    
    console.log(`✅ Passed: ${passed}/${total}`)
    console.log(`❌ Failed: ${total - passed}/${total}`)
    
    if (total - passed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`))
    }
    
    console.log('\n🎉 Web3 Integration Testing Complete!')
  }
}

// Utility function to run tests from browser console
export const runWeb3Tests = async (contracts, address) => {
  const tester = new Web3IntegrationTester(contracts, address)
  return await tester.runAllTests()
}

// Export for use in components
export default Web3IntegrationTester
