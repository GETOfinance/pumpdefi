import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransaction } from 'wagmi'
import { Link, useNavigate } from 'react-router-dom'
import { parseEther } from 'viem'
import { toast } from 'react-hot-toast'
import { useLaunchOperations, useTokenOperations } from '../hooks/useContracts'
import {
  Shield,
  ArrowLeft,
  Calendar,
  Info,
  Wallet,
  CheckCircle,
  Loader2
} from 'lucide-react'

const CreateFairLaunch = () => {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const { createLaunch } = useLaunchOperations()
  const { approveToken } = useTokenOperations()
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [approvalTxHash, setApprovalTxHash] = useState(null)

  // Monitor transaction confirmations
  const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransaction({
    hash: txHash,
    enabled: !!txHash,
  })

  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess } = useWaitForTransaction({
    hash: approvalTxHash,
    enabled: !!approvalTxHash,
  })

  // Handle successful approval - proceed to create launch
  useEffect(() => {
    if (isApprovalSuccess && approvalTxHash && !txHash) {
      createLaunchAfterApproval()
    }
  }, [isApprovalSuccess, approvalTxHash, txHash])

  // Handle successful launch creation
  useEffect(() => {
    if (isTxSuccess && txHash) {
      toast.success('Fair Launch created and confirmed on blockchain!')
      setTimeout(() => {
        navigate('/launchpad')
      }, 1500)
    }
  }, [isTxSuccess, txHash, navigate])

  const createLaunchAfterApproval = async () => {
    try {
      setIsApproving(false)
      setIsCreating(true)
      toast.success('Token approved! Creating Fair Launch...', { id: 'approval-wait' })

      // Convert form data to contract parameters
      const launchData = {
        tokenAddress: formData.tokenAddress,
        totalAmount: parseEther(formData.launchAmount.toString()),
        startTime: Math.floor(new Date(formData.startTime).getTime() / 1000),
        endTime: Math.floor(new Date(formData.endTime).getTime() / 1000),
        minContribution: parseEther(formData.minContribution.toString() || '0.01'),
        maxContribution: parseEther(formData.maxContribution.toString() || '10'),
        metadataURI: JSON.stringify({
          name: formData.tokenName,
          symbol: formData.tokenSymbol,
          description: formData.description,
          website: formData.website,
          twitter: formData.twitter,
          telegram: formData.telegram,
          softCap: formData.softCap,
          hardCap: formData.hardCap
        })
      }

      console.log('🚀 Creating Fair Launch with data:', launchData)

      const tx = await createLaunch(launchData)
      setTxHash(tx)

      toast.success('Fair Launch creation submitted! Waiting for confirmation...')

    } catch (error) {
      console.error('Error creating Fair Launch:', error)
      toast.error(`Failed to create Fair Launch: ${error.message}`)
      setIsCreating(false)
    }
  }

  const [formData, setFormData] = useState({
    // Token Information
    tokenAddress: '',
    tokenName: '',
    tokenSymbol: '',
    tokenDecimals: 18,
    totalSupply: '',
    
    // Launch Configuration
    launchAmount: '',
    startTime: '',
    endTime: '',
    minContribution: '',
    maxContribution: '',
    softCap: '',
    hardCap: '',
    
    // Additional Settings
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    logoFile: null
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({
      ...prev,
      logoFile: file
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate form data
    if (!formData.tokenAddress || !formData.launchAmount || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const launchAmount = parseEther(formData.launchAmount.toString())

      // Step 1: Approve token transfer
      setIsApproving(true)
      toast.loading('Approving token transfer...', { id: 'approving' })

      const approvalTx = await approveToken(formData.tokenAddress, launchAmount)
      setApprovalTxHash(approvalTx)

      toast.success('Token approval submitted!', { id: 'approving' })
      toast.loading('Waiting for approval confirmation...', { id: 'approval-wait' })

      // Wait for approval confirmation before proceeding
      // This will be handled by the useEffect below

    } catch (error) {
      console.error('Error in Fair Launch creation process:', error)
      toast.error(`Failed: ${error.message}`, { id: 'approving' })
      setIsApproving(false)
      setIsCreating(false)
    }
  }

  const steps = [
    { id: 1, name: 'Token Details', icon: Shield },
    { id: 2, name: 'Launch Config', icon: Calendar },
    { id: 3, name: 'Project Info', icon: Info },
    { id: 4, name: 'Review & Deploy', icon: CheckCircle }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <Link 
          to="/launchpad" 
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to LaunchPad
        </Link>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 mb-6 animate-glow">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Create Fair Launch</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Launch your token with transparent, equal opportunity distribution
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
                    : isCompleted
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Token Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Token Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Launch Amount
                  </label>
                  <input
                    type="number"
                    name="launchAmount"
                    value={formData.launchAmount}
                    onChange={handleInputChange}
                    placeholder="e.g., 500000"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Token Name
                  </label>
                  <input
                    type="text"
                    name="tokenName"
                    value={formData.tokenName}
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
                    name="tokenSymbol"
                    value={formData.tokenSymbol}
                    onChange={handleInputChange}
                    placeholder="e.g., PUMP"
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Launch Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Launch Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Min Contribution (CORE)
                  </label>
                  <input
                    type="number"
                    name="minContribution"
                    value={formData.minContribution}
                    onChange={handleInputChange}
                    placeholder="e.g., 0.1"
                    step="0.01"
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Max Contribution (CORE)
                  </label>
                  <input
                    type="number"
                    name="maxContribution"
                    value={formData.maxContribution}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    step="0.01"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Soft Cap (CORE)
                  </label>
                  <input
                    type="number"
                    name="softCap"
                    value={formData.softCap}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                    step="0.01"
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Hard Cap (CORE)
                  </label>
                  <input
                    type="number"
                    name="hardCap"
                    value={formData.hardCap}
                    onChange={handleInputChange}
                    placeholder="e.g., 100"
                    step="0.01"
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn btn-outline"
              >
                Previous
              </button>
            )}
            
            <div className="ml-auto">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="btn btn-primary"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary btn-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isConnected || isApproving || isCreating || isWaitingForTx || isWaitingForApproval}
                >
                  {isApproving || isWaitingForApproval ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {isWaitingForApproval ? 'Confirming Approval...' : 'Approving Token...'}
                    </>
                  ) : isCreating || isWaitingForTx ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {isWaitingForTx ? 'Confirming Launch...' : 'Creating Launch...'}
                    </>
                  ) : isConnected ? (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Create Fair Launch
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </button>
              )}
            </div>
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
              Fair Launch Benefits
            </h3>
            <ul className="text-gray-300 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-3"></span>
                Equal opportunity for all participants
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-3"></span>
                Transparent token distribution mechanism
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-3"></span>
                Anti-bot protection and fair pricing
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-3"></span>
                Community-driven price discovery
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateFairLaunch
