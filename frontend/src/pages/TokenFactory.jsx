import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { Factory, Zap, Settings, Info, Wallet, Loader2, CheckCircle, AlertCircle, Shield, Star } from 'lucide-react'
import WalletConnectButton from '../components/WalletConnectButton'

const TokenFactory = () => {
  const { address, isConnected } = useAccount()
  const [selectedType, setSelectedType] = useState('basic')
  const [isCreating, setIsCreating] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    totalSupply: '',
    buyTaxRate: 0,
    sellTaxRate: 0,
    taxRecipient: ''
  })

  const { isLoading: isWaitingForTx, isSuccess: txSuccess } = useWaitForTransaction({
    hash: txHash,
    enabled: !!txHash,
  })

  // Load user tokens on mount
  useEffect(() => {
    if (address) {
      loadUserTokens()
    }
  }, [address])

  // Handle successful transaction
  useEffect(() => {
    if (txSuccess) {
      toast.success('Token created successfully!')
      setTxHash(null)
      resetForm()
    }
  }, [txSuccess])

  // Test connection on mount
  useEffect(() => {
    if (isConnected) {
      testConnection()
    }
  }, [isConnected])

  const testConnection = async () => {
    try {
      toast.loading('Testing contract connections...')
      const result = await testContractConnections()
      toast.dismiss()

      if (result.tokenFactory.success && result.wcore.success) {
        toast.success('✅ All contracts connected successfully!')
        console.log('Contract test results:', result)
      } else {
        toast.error('❌ Some contracts failed to connect')
        console.error('Contract test results:', result)
      }
    } catch (error) {
      toast.dismiss()
      toast.error('Connection test failed')
      console.error('Connection test error:', error)
    }
  }

  const handleTestSimulation = async () => {
    if (!formData.name || !formData.symbol || !formData.totalSupply) {
      toast.error('Please fill in token details first')
      return
    }

    try {
      toast.loading('Simulating token creation...')
      const tokenData = {
        name: formData.name,
        symbol: formData.symbol,
        decimals: parseInt(formData.decimals),
        totalSupply: parseEther(formData.totalSupply.toString()),
        owner: address
      }

      const result = await simulateTokenCreation(tokenData)
      toast.dismiss()

      if (result.success) {
        toast.success('✅ Token creation simulation successful!')
        console.log('Simulation result:', result)
      } else {
        toast.error('❌ Simulation failed: ' + result.error)
        console.error('Simulation failed:', result)
      }
    } catch (error) {
      toast.dismiss()
      toast.error('Simulation error')
      console.error('Simulation error:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
      decimals: 18,
      totalSupply: '',
      buyTaxRate: 0,
      sellTaxRate: 0,
      taxRecipient: ''
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!formData.name || !formData.symbol || !formData.totalSupply) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)

    try {
      console.log('Starting token creation...')
      console.log('Form data:', formData)

      const tokenData = {
        name: formData.name,
        symbol: formData.symbol,
        decimals: parseInt(formData.decimals),
        totalSupply: parseEther(formData.totalSupply.toString()),
      }

      console.log('Parsed token data:', tokenData)

      const tx = await createBasicToken(tokenData)
      setTxHash(tx)
      toast.success('Transaction submitted! Waiting for confirmation...')
    } catch (error) {
      console.error('Error creating token:', error)

      // More detailed error handling
      let errorMessage = 'Failed to create token. Please try again.'

      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user'
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Transaction reverted. Check your inputs and try again.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage
      } else if (error.reason) {
        errorMessage = error.reason
      }

      toast.error(errorMessage)
      console.log('Full error object:', error)
    }
  }

  const tokenTypes = [
    {
      id: 'basic',
      name: 'Basic Token',
      description: 'Standard ERC20 token with basic functionality',
      features: ['Standard ERC20', 'Mintable', 'Burnable', 'Trading Control'],
      icon: Zap,
      color: 'blue',
    },
    {
      id: 'tax',
      name: 'Tax Token',
      description: 'Token with configurable buy/sell taxation',
      features: ['All Basic Features', 'Buy/Sell Tax', 'Tax Exclusions', 'AMM Detection'],
      icon: Settings,
      color: 'purple',
    },
    {
      id: 'advanced',
      name: 'Advanced Token',
      description: 'Token with reward distribution and advanced features',
      features: ['All Tax Features', 'Reward Distribution', 'Auto-Liquidity', 'Advanced Controls'],
      icon: Factory,
      color: 'green',
      disabled: true, // Coming soon
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 mb-6 animate-glow">
          <Factory className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Token Factory</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Create professional tokens with advanced features on Core blockchain
        </p>
      </div>

      {/* Token Type Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Choose Token Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tokenTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <div
                key={type.id}
                className={`relative p-8 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  selectedType === type.id
                    ? 'border-purple-500/50 bg-purple-600/10 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700/50 bg-gray-900/40 hover:border-purple-500/30 hover:bg-gray-800/60'
                } ${type.disabled ? 'opacity-50 cursor-not-allowed' : ''} backdrop-blur-sm`}
                onClick={() => !type.disabled && setSelectedType(type.id)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mr-4">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{type.name}</h3>
                </div>
                <p className="text-gray-300 mb-6">{type.description}</p>
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-center">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {type.disabled && (
                  <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    Coming Soon
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Token Creation Form */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Token Details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Token Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., PumpDeFi Token"
                className="input"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Token Symbol
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., PUMP"
                className="input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Decimals
              </label>
              <input
                type="number"
                name="decimals"
                value={formData.decimals}
                onChange={handleInputChange}
                min="0"
                max="18"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Total Supply
              </label>
              <input
                type="number"
                name="totalSupply"
                value={formData.totalSupply}
                onChange={handleInputChange}
                placeholder="e.g., 1000000"
                className="input"
                required
              />
            </div>
          </div>

          {/* Tax Settings (only for tax tokens) */}
          {selectedType === 'tax' && (
            <div className="border-t border-gray-700/30 pt-8">
              <h3 className="text-xl font-bold text-white mb-6">Tax Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Buy Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="buyTaxRate"
                    value={formData.buyTaxRate}
                    onChange={handleInputChange}
                    min="0"
                    max="25"
                    step="0.1"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Sell Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="sellTaxRate"
                    value={formData.sellTaxRate}
                    onChange={handleInputChange}
                    min="0"
                    max="25"
                    step="0.1"
                    className="input"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Tax Recipient Address
                </label>
                <input
                  type="text"
                  name="taxRecipient"
                  value={formData.taxRecipient}
                  onChange={handleInputChange}
                  placeholder={address || "0x..."}
                  className="input"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            {isConnected ? (
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isCreating || isWaitingForTx}
                  className="btn btn-primary btn-lg group disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isCreating || isWaitingForTx ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {isWaitingForTx ? 'Confirming...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Factory className="h-5 w-5 mr-2" />
                      Create Token
                      <Zap className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={testConnection}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Test Connection
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSimulation}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Test Simulation
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 animate-glow">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-300 mb-6 text-lg">Connect your wallet to create tokens</p>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => alert('Please use the Connect Wallet button in the header')}
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="mt-12 card p-8">
        <div className="flex items-start">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center mr-4 flex-shrink-0">
            <Info className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              Token Creation Information
            </h3>
            <ul className="text-gray-300 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></span>
                Creation fee: 0.01 CORE tokens
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></span>
                All tokens are deployed on Core testnet
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></span>
                Basic tokens include standard ERC20 functionality
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></span>
                Tax tokens support configurable buy/sell taxation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></span>
                Advanced tokens with reward distribution coming soon
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenFactory
