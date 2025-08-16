import { useEffect, useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { toast } from 'react-hot-toast'
import { parseUnits, isAddress, getAddress } from 'viem'
import { CONTRACT_ADDRESSES } from '../config/chains'
import { ERC20_ABI } from '../config/abis'
import { LOCK_MANAGER_ABI } from '../hooks/useLockManager'
import { useContracts } from '../hooks/useContracts'
import {
  Lock,
  Shield,
  Clock,
  Key,
  Calendar,
  DollarSign,
  Info,
  Unlock,
  Timer,
  CheckCircle,
  AlertTriangle,
  Wallet
} from 'lucide-react'
import ManageLocks from '../components/locks/ManageLocks'
import WalletConnectButton from '../components/WalletConnectButton'


const LockPage = () => {
  const { address, isConnected } = useAccount()
  const contracts = useContracts()
  const [activeTab, setActiveTab] = useState('create')
  const [formData, setFormData] = useState({
    tokenAddress: '',
    amount: '',
    unlockDate: '',
    beneficiary: '',
    description: '',
    isRevocable: false
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    if (!CONTRACT_ADDRESSES.LOCK_MANAGER) {
      toast.error('Lock manager address not configured')
      return
    }
    try {
      const unlockTime = Math.floor(new Date(formData.unlockDate).getTime() / 1000)
      const beneficiary = formData.beneficiary || address
      // Validate inputs
      if (!formData.tokenAddress || !formData.amount || !formData.unlockDate) {
        toast.error('Please fill in all required fields')
        return
      }

      // Normalize & validate token address
      const tokenAddr = formData.tokenAddress.trim()
      if (!isAddress(tokenAddr)) {
        toast.error('Invalid token address')
        return
      }
      const checksummedToken = getAddress(tokenAddr)

      if (unlockTime <= Math.floor(Date.now() / 1000)) {
        toast.error('Unlock date must be in the future')
        return
      }

      // Ensure wallet client is available for write operations
      if (!contracts.walletClient) {
        toast.error('Please connect your wallet to proceed')
        return
      }

      // read decimals
      let decimals = 18
      try {
        const tokenContract = contracts.getERC20Contract(checksummedToken)
        if (!tokenContract?.read?.decimals) throw new Error('Token contract not available')
        decimals = Number(await tokenContract.read.decimals()) || 18
      } catch (e) {
        console.warn('Could not read token decimals, using 18:', e)
      }

      const amount = parseUnits(formData.amount, decimals)

      toast.loading('Approving tokens...', { id: 'lock' })

      // Approve lock manager to pull tokens using wallet client directly
      const approveHash = await contracts.walletClient.writeContract({
        address: checksummedToken,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.LOCK_MANAGER, amount],
        account: address,
      })

      // wait for approval mined
      await contracts.publicClient.waitForTransactionReceipt({ hash: approveHash })

      toast.loading('Creating lock...', { id: 'lock' })

      // Create the lock using wallet client directly
      const lockHash = await contracts.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.LOCK_MANAGER,
        abi: LOCK_MANAGER_ABI,
        functionName: 'createLock',
        args: [
          checksummedToken,
          amount,
          BigInt(unlockTime),
          beneficiary,
          !!formData.isRevocable,
          formData.description || ''
        ],
        account: address,
      })

      await contracts.publicClient.waitForTransactionReceipt({ hash: lockHash })
      toast.success('Lock created successfully!', { id: 'lock' })

      // Reset form
      setFormData({
        tokenAddress: '',
        amount: '',
        unlockDate: '',
        beneficiary: '',
        description: '',
        isRevocable: false
      })
    } catch (err) {
      console.error('Lock creation error:', err)
      console.error('Error details:', {
        message: err?.message,
        shortMessage: err?.shortMessage,
        cause: err?.cause,
        details: err?.details,
        stack: err?.stack
      })

      let errorMessage = 'Failed to create lock'
      if (err?.shortMessage) {
        errorMessage = err.shortMessage
      } else if (err?.message) {
        errorMessage = err.message
      } else if (err?.details) {
        errorMessage = err.details
      }

      toast.error(errorMessage, { id: 'lock' })
    }
  }

  const tabs = [
    { id: 'create', name: 'Create Lock', icon: Lock },
    { id: 'manage', name: 'Manage Locks', icon: Key },
    { id: 'history', name: 'History', icon: Calendar }
  ]

  const lockTypes = [
    {
      id: 'token',
      title: 'Token Lock',
      description: 'Lock tokens for a specific period to build trust and prevent dumps',
      features: [
        'Time-based unlocking',
        'Beneficiary assignment',
        'Revocable/Non-revocable',
        'Partial unlock support'
      ],
      icon: Lock,
      color: 'from-purple-600 to-indigo-600'
    },
    {
      id: 'liquidity',
      title: 'Liquidity Lock',
      description: 'Lock LP tokens to ensure liquidity stability and build investor confidence',
      features: [
        'LP token locking',
        'Extended lock periods',
        'Automatic renewal',
        'Proof of lock certificate'
      ],
      icon: Shield,
      color: 'from-blue-600 to-purple-600'
    },
    {
      id: 'vesting',
      title: 'Vesting Schedule',
      description: 'Create vesting schedules for team tokens with gradual release',
      features: [
        'Linear vesting',
        'Cliff periods',
        'Multiple beneficiaries',
        'Milestone-based release'
      ],
      icon: Timer,
      color: 'from-indigo-600 to-blue-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 mb-6 animate-glow">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Token Lock</h1>
      {!CONTRACT_ADDRESSES.LOCK_MANAGER && (
        <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-sm text-center">
          Lock manager contract is not configured. Please set VITE_LOCK_MANAGER_ADDRESS to enable Token Lock.
        </div>
      )}

        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Secure token locks and vesting schedules to build trust and ensure project stability
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700/30 mb-12">
        <nav className="-mb-px flex justify-center space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-gray-900 dark:text-white bg-purple-600/10 rounded-t-xl'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Create Lock Tab */}
      {activeTab === 'create' && (
        <div className="space-y-8">
          {/* Lock Type Selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Choose Lock Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {lockTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <div
                    key={type.id}
                    className="feature-card group cursor-pointer"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{type.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{type.description}</p>
                    <ul className="space-y-2 mb-6">
                      {type.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-3"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full btn btn-primary">
                      Create {type.title}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lock Creation Form */}
          <div className="card p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Lock Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Token Contract Address
                </label>
                <input
                  type="text"
                  name="tokenAddress"
                  value={formData.tokenAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Amount to Lock
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="e.g., 10000"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Unlock Date
                  </label>
                  <input
                    type="datetime-local"
                    name="unlockDate"
                    value={formData.unlockDate}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Beneficiary Address
                </label>
                <input
                  type="text"
                  name="beneficiary"
                  value={formData.beneficiary}
                  onChange={handleInputChange}
                  placeholder={address || "0x..."}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose of this lock..."
                  rows={3}
                  className="input"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isRevocable"
                  checked={formData.isRevocable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Make this lock revocable (can be cancelled before unlock date)
                </label>
              </div>

              <div className="flex justify-center pt-6">
                {isConnected ? (
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg group"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Create Lock
                    <Shield className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 animate-glow">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">Connect your wallet to create locks</p>
                    <WalletConnectButton className="btn btn-primary btn-lg" />
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Locks Tab */}
      {activeTab === 'manage' && (
        <ManageLocks address={address} />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="text-center py-20">
          <div className="card p-12 max-w-2xl mx-auto">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Lock History
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              View your completed locks, withdrawal history, and lock statistics.
            </p>
          </div>


        </div>
      )}

      {/* Information Panel */}
      <div className="mt-12 card p-8">
        <div className="flex items-start">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mr-4 flex-shrink-0">
            <Info className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Token Lock Benefits
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-3"></span>
                Build investor confidence with locked tokens
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-3"></span>
                Prevent token dumps and price manipulation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-3"></span>
                Create vesting schedules for team allocations
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-3"></span>
                Secure liquidity with LP token locks
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LockPage
