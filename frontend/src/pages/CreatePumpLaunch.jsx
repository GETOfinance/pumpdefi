import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import {
  Zap,
  ArrowLeft,
  TrendingUp,
  Target,
  DollarSign,
  Clock,
  Info,
  Upload,
  Wallet,
  CheckCircle,
  Flame
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePumpSaleOperations } from '../hooks/useContracts'
import { useTokenOperations } from '../hooks/useContracts'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'

import WalletConnectButton from '../components/WalletConnectButton'

const CreatePumpLaunch = () => {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const { createSale } = usePumpSaleOperations()
  const { approveToken } = useTokenOperations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [txHash, setTxHash] = useState(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Token Information
    tokenAddress: '',
    tokenName: '',
    tokenSymbol: '',
    launchAmount: '',

    // Pump Configuration
    initialPrice: '',
    targetPrice: '',
    liquidityAmount: '',
    pumpDuration: '24', // hours

    // Marketing & Momentum
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    logoFile: null,

    // Advanced Settings
    maxBuyAmount: '',
    sellTaxRate: '5', // percentage
    marketingWallet: ''
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

    try {
      setIsSubmitting(true)

      const amount = parseEther(formData.launchAmount || '0')
      const durationHours = Number(formData.pumpDuration || '24')
      const now = Math.floor(Date.now() / 1000)
      const startTime = now + 5 * 60 // start in 5 minutes
      const endTime = startTime + durationHours * 3600

      // Validate inputs
      if (!formData.tokenAddress) throw new Error('Token address is required')
      if (amount <= 0n) throw new Error('Launch amount must be greater than 0')

      // Map UI prices to on-chain values using BigInt math (avoid scientific notation)
      const baseWei = parseEther(formData.initialPrice || '0.0001')
      const targetWei = formData.targetPrice ? parseEther(formData.targetPrice) : baseWei
      if (targetWei < baseWei) {
        toast.error('Target price must be greater than or equal to initial price')
        setIsSubmitting(false)
        return
      }
      // slope = (targetWei - baseWei) per 1e18 token sold, scaled to wei per 1e18 token per 1e18 sold
      // slopeWei = (deltaWei * 1e18) / totalForSale(1e18)
      const ONE_ETHER = 1000000000000000000n
      const delta = targetWei - baseWei
      const slope = delta > 0n ? (delta * ONE_ETHER) / amount : 0n
      const basePrice = baseWei

      // Precompute display slope and end price for UI
      const displaySlope = amount > 0n ? Number((targetWei - baseWei) * 1000000000000000000n / amount) / 1e18 : 0
      const endPrice = Number(formatEther(targetWei))


      // 1) Approve bonding factory to pull tokens
      setIsApproving(true)
      toast.loading('Approving tokens to factory...', { id: 'pump-approve' })
      const approvalTx = await approveToken(formData.tokenAddress, amount, import.meta.env.VITE_BONDING_FACTORY_ADDRESS)
      toast.success('Approval submitted', { id: 'pump-approve' })

      // 2) Create sale
      toast.loading('Creating pump sale...', { id: 'pump-create' })
      const tx = await createSale({
        token: formData.tokenAddress,
        totalForSale: amount,
        startTime,
        endTime,
        basePrice,
        slope
      })
      setTxHash(tx)

      toast.success('Pump sale creation submitted', { id: 'pump-create' })
      toast('Redirecting to LaunchPad...', { icon: '🚀' })
      navigate('/launchpad')

    } catch (err) {
      console.error('Pump launch create error', err)
      toast.error(err?.shortMessage || err?.message || 'Failed to create pump sale')
    } finally {
      setIsApproving(false)
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: 'Token Setup', icon: Zap },
    { id: 2, name: 'Pump Config', icon: TrendingUp },
    { id: 3, name: 'Marketing', icon: Flame },
    { id: 4, name: 'Launch', icon: CheckCircle }
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 mb-6 animate-glow">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Create Pump Launch</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            High-energy launch with immediate trading and momentum building
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
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
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
          {/* Step 1: Token Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Token Setup</h2>

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
                    placeholder="e.g., 1000000"
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
                    placeholder="e.g., PumpCoin"
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

          {/* Step 2: Pump Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Pump Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Initial Price (CORE)
                  </label>
                  <input
                    type="number"
                    name="initialPrice"
                    value={formData.initialPrice}
                    onChange={handleInputChange}
                    placeholder="e.g., 0.001"
                    step="0.000001"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Target Price (CORE)
                  </label>
                  <input
                    type="number"
                    name="targetPrice"
                    value={formData.targetPrice}
                    onChange={handleInputChange}
                    placeholder="e.g., 0.01"
                    step="0.000001"
                    className="input"
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setFormData(f=>({ ...f, targetPrice: f.initialPrice ? String(Number(f.initialPrice) * 2) : '' }))}>x2</button>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setFormData(f=>({ ...f, targetPrice: f.initialPrice ? String(Number(f.initialPrice) * 3) : '' }))}>x3</button>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setFormData(f=>({ ...f, targetPrice: f.initialPrice ? String(Number(f.initialPrice) * 5) : '' }))}>x5</button>
                  </div>

                  {/* Inline Feedback */}
                  <div className="col-span-1 md:col-span-2">
	                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-sm text-gray-300">
	                  <div className="flex flex-wrap gap-6">
	                    <div>
	                      <div className="text-gray-400">Computed Slope</div>
	                      <div className="text-white font-semibold">
	                        {/* slope = (target - initial)/launchAmount in CORE per token per token */}
	                        {(() => {
	                          const initial = Number(formData.initialPrice || '0')
	                          const target = Number(formData.targetPrice || initial)
	                          const supply = Number(formData.launchAmount || '0')
	                          if (!initial || !supply) return '—'
	                          const s = (target - initial) / supply
	                          return s > 0 ? s.toFixed(12) + ' CORE/token/token' : '0'
	                        })()}
	                      </div>
	                    </div>
	                    <div>
	                      <div className="text-gray-400">Start Price</div>
	                      <div className="text-white font-semibold">{formData.initialPrice || '0'} CORE</div>
	                    </div>
	                    <div>
	                      <div className="text-gray-400">Target/End Price</div>
	                      <div className="text-white font-semibold">{formData.targetPrice || formData.initialPrice || '0'} CORE</div>
	                    </div>
	                    <div>
	                      <div className="text-gray-400">Duration</div>
	                      <div className="text-white font-semibold">{formData.pumpDuration} hours</div>
	                    </div>
	                  </div>
	                </div>
	              </div>

                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Initial Liquidity (CORE)
                  </label>
                  <input
                    type="number"
                    name="liquidityAmount"
                    value={formData.liquidityAmount}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    step="0.01"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Pump Duration (Hours)
                  </label>
                  <select
                    name="pumpDuration"
                    value={formData.pumpDuration}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="48">48 Hours</option>
                    <option value="72">72 Hours</option>

	                  <div className="flex gap-2 mt-2">
	                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setFormData(f=>({ ...f, pumpDuration: '6' }))}>6h</button>
	                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setFormData(f=>({ ...f, pumpDuration: '12' }))}>12h</button>
	                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setFormData(f=>({ ...f, pumpDuration: '24' }))}>24h</button>
	                  </div>

                    <option value="168">7 Days</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Max Buy Amount (% of supply)
                  </label>
                  <input
                    type="number"
                    name="maxBuyAmount"
                    value={formData.maxBuyAmount}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    min="0.1"
                    max="10"
                    step="0.1"
                    className="input"
                    required
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
                    placeholder="e.g., 5"
                    min="0"
                    max="25"
                    step="0.1"
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
                isConnected ? (
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Launch Pump
                  </button>
                ) : (
                  <WalletConnectButton
                    className="btn btn-primary btn-lg"
                    text="Connect Wallet to Launch"
                  />
                )
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="mt-12 card p-8">
        <div className="flex items-start">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mr-4 flex-shrink-0">
            <Info className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              Pump Launch Features
            </h3>
            <ul className="text-gray-300 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></span>
                Instant liquidity provision and trading
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></span>
                Momentum-based price discovery
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></span>
                Anti-dump mechanisms and sell taxes
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></span>
                Quick market entry and visibility
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePumpLaunch
