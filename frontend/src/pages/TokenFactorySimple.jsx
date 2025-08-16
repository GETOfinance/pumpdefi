import { useState } from 'react'
import { useAccount, useContractWrite, useContractRead, useWaitForTransaction, usePublicClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { Factory, Zap, Settings, Info, Wallet, Loader2 } from 'lucide-react'
import { CONTRACT_ADDRESSES } from '../config/chains'
import WalletConnectButton from '../components/WalletConnectButton'

// Simplified ABI for just the functions we need
const SIMPLE_TOKEN_FACTORY_ABI = [
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
  }
]

const TokenFactorySimple = () => {
  const { address, isConnected } = useAccount()
  const client = usePublicClient()
  const [txHash, setTxHash] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    totalSupply: ''
  })

  // Read creation fee from contract
  const { data: creationFee } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: SIMPLE_TOKEN_FACTORY_ABI,
    functionName: 'creationFee',
  })

  // Contract write hook
  const { writeAsync: writeContract } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: SIMPLE_TOKEN_FACTORY_ABI,
    functionName: 'createBasicToken',
  })

  // Wait for transaction
  const { isLoading: isWaitingForTx } = useWaitForTransaction({
    hash: txHash,
    enabled: !!txHash,
    onSuccess() {
      toast.success('Token created successfully! 🎉')
      setTxHash(null)
      setIsCreating(false)
      setFormData({
        name: '',
        symbol: '',
        decimals: 18,
        totalSupply: ''
      })
    },
    onError(error) {
      console.error('Transaction failed:', error)
      toast.error('Transaction failed: ' + error.message)
      setTxHash(null)
      setIsCreating(false)
    }
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('🚀 Form submitted!')
    console.log('📊 Form data:', formData)
    console.log('🔗 Connected:', isConnected)
    console.log('💰 Creation fee:', creationFee ? formatEther(creationFee) : 'Not loaded')

    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!formData.name || !formData.symbol || !formData.totalSupply) {
      toast.error('Please fill in all required fields')
      return
    }

    // Use default fee if contract fee is not loaded
    const feeToUse = creationFee || parseEther('0.01') // Default 0.01 CORE

    setIsCreating(true)
    toast.loading('Preparing transaction...')

    try {
      console.log('🔧 Creating token with data:', formData)
      console.log('💵 Creation fee:', formatEther(feeToUse), 'CORE')

      const result = await writeContract({
        args: [
          formData.name,
          formData.symbol,
          parseInt(formData.decimals),
          parseEther(formData.totalSupply.toString()),
          address
        ],
        value: feeToUse,
      })

      console.log('✅ Transaction result:', result)
      setTxHash(result.hash)
      toast.dismiss()
      toast.success('Transaction submitted! Waiting for confirmation...')

    } catch (error) {
      console.error('❌ Token creation error:', error)
      toast.dismiss()
      setIsCreating(false)

      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        toast.error('Transaction rejected by user')
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction')
      } else if (error.shortMessage) {
        toast.error('Failed to create token: ' + error.shortMessage)
      } else {
        toast.error('Failed to create token: ' + error.message)
      }
    }
  }



  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 animate-glow">
          <Factory className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Token Factory</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Create your own ERC20 tokens on Core blockchain with just a few clicks
        </p>
      </div>

      {/* Token Creation Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., My Awesome Token"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Symbol *
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., MAT"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Decimals
              </label>
              <input
                type="number"
                name="decimals"
                value={formData.decimals}
                onChange={handleInputChange}
                min="0"
                max="18"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Total Supply *
              </label>
              <input
                type="number"
                name="totalSupply"
                value={formData.totalSupply}
                onChange={handleInputChange}
                placeholder="e.g., 1000000"
                className="input w-full"
                required
              />
            </div>
          </div>

          {/* Creation Fee Display */}
          {creationFee && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Creation Fee:</span>
                <span className="text-purple-400 font-semibold">
                  {formatEther(creationFee)} CORE
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-6 space-x-4">
            {isConnected ? (
              <>
                <button
                  type="submit"
                  disabled={isCreating || isWaitingForTx}
                  className="btn btn-primary btn-lg group disabled:opacity-50 disabled:cursor-not-allowed"
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
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 animate-glow">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-300 mb-6 text-lg">Connect your wallet to create tokens</p>
                <WalletConnectButton 
                  className="btn btn-primary btn-lg"
                  text="Connect Wallet"
                />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default TokenFactorySimple
