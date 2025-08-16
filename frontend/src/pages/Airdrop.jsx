import { useState, useEffect } from 'react'
import { useAccount, useContractWrite, useContractRead } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Gift,
  Upload,
  Users,
  Calendar,
  DollarSign,
  Info,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Wallet,
  ExternalLink,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import WalletConnectButton from '../components/WalletConnectButton'
import { API_CONFIG, CONTRACT_ADDRESSES } from '../config/chains'
import { STANDARD_AIRDROP_ABI, MERKLE_AIRDROP_ABI, ERC20_ABI } from '../config/abis'

const Airdrop = () => {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('create')
  const [selectedAirdropType, setSelectedAirdropType] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [airdrops, setAirdrops] = useState([])
  const [recipients, setRecipients] = useState([])
  const [merkleData, setMerkleData] = useState(null)
  const [creationFees, setCreationFees] = useState({ standard: '0', merkle: '0' })

  const [formData, setFormData] = useState({
    tokenAddress: '',
    totalAmount: '',
    startDate: '',
    endDate: '',
    description: '',
    csvFile: null
  })

  // Fetch creation fees on component mount
  useEffect(() => {
    fetchCreationFees()
    fetchAirdrops()
  }, [])

  const fetchCreationFees = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BACKEND_URL}/api/airdrop/creation-fees`)
      if (response.data.success) {
        setCreationFees(response.data.fees)
      }
    } catch (error) {
      console.error('Error fetching creation fees:', error)
    }
  }

  const fetchAirdrops = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BACKEND_URL}/api/airdrop/all`)
      if (response.data.success) {
        setAirdrops(response.data.airdrops)
      }
    } catch (error) {
      console.error('Error fetching airdrops:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFormData(prev => ({ ...prev, csvFile: file }))

    // Process CSV file
    try {
      setLoading(true)
      const formDataObj = new FormData()
      formDataObj.append('csvFile', file)

      const response = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/airdrop/process-csv`,
        formDataObj,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      if (response.data.success) {
        setRecipients(response.data.recipients)
        setFormData(prev => ({
          ...prev,
          totalAmount: response.data.totalAmount.toString()
        }))
        toast.success(`Processed ${response.data.totalRecipients} recipients`)

        if (response.data.errors && response.data.errors.length > 0) {
          toast.warning(`${response.data.errors.length} rows had errors`)
        }
      }
    } catch (error) {
      console.error('Error processing CSV:', error)
      toast.error('Failed to process CSV file')
    } finally {
      setLoading(false)
    }
  }

  const generateMerkleTree = async () => {
    if (recipients.length === 0) {
      toast.error('Please upload a CSV file with recipients first')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/airdrop/generate-merkle-tree`,
        { recipients }
      )

      if (response.data.success) {
        setMerkleData(response.data)
        toast.success('Merkle tree generated successfully')
      }
    } catch (error) {
      console.error('Error generating merkle tree:', error)
      toast.error('Failed to generate merkle tree')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!formData.tokenAddress || !formData.totalAmount) {
      toast.error('Please fill in all required fields')
      return
    }

    if (selectedAirdropType === 'standard' && recipients.length === 0) {
      toast.error('Please upload a CSV file with recipients')
      return
    }

    if (selectedAirdropType === 'merkle' && !merkleData) {
      toast.error('Please generate merkle tree first')
      return
    }

    // Implementation for smart contract interaction will be added here
    toast.info('Smart contract integration will be implemented')
  }

  const tabs = [
    { id: 'create', name: 'Create Airdrop', icon: Gift },
    { id: 'manage', name: 'Manage Airdrops', icon: Users },
    { id: 'history', name: 'History', icon: Calendar }
  ]

  const airdropTypes = [
    {
      id: 'standard',
      title: 'Standard Airdrop',
      description: 'Distribute tokens to a list of addresses with equal or custom amounts',
      features: [
        'CSV upload support',
        'Custom amounts per address',
        'Batch distribution',
        'Immediate distribution'
      ],
      icon: Gift,
      color: 'from-green-600 to-emerald-600',
      fee: creationFees.standard
    },
    {
      id: 'merkle',
      title: 'Merkle Airdrop',
      description: 'Gas-efficient airdrop using Merkle tree for large distributions',
      features: [
        'Extremely gas efficient',
        'Claim-based distribution',
        'Proof verification',
        'Large scale support'
      ],
      icon: CheckCircle,
      color: 'from-blue-600 to-cyan-600',
      fee: creationFees.merkle
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 mb-6 animate-glow">
          <Gift className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Token Airdrop</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Distribute tokens efficiently to multiple addresses with advanced features
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
                    ? 'border-green-500 text-gray-900 dark:text-white bg-green-600/10 rounded-t-xl'
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

      {/* Create Airdrop Tab */}
      {activeTab === 'create' && (
        <div className="space-y-8">
          {/* Airdrop Type Selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Choose Airdrop Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {airdropTypes.map((type) => {
                const IconComponent = type.icon
                const isSelected = selectedAirdropType === type.id
                return (
                  <div
                    key={type.id}
                    className={`feature-card group cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'hover:ring-1 hover:ring-purple-300'
                    }`}
                    onClick={() => setSelectedAirdropType(type.id)}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{type.title}</h3>
                      {type.fee && (
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {formatEther(type.fee)} CORE
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{type.description}</p>
                    <ul className="space-y-2 mb-6">
                      {type.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></span>
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

          {/* Airdrop Creation Form */}
          <div className="card p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create {selectedAirdropType === 'standard' ? 'Standard' : 'Merkle'} Airdrop
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Fee: {formatEther(creationFees[selectedAirdropType] || '0')} CORE
              </div>
            </div>
            
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
                    Total Amount
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    placeholder="e.g., 10000"
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Recipient Count
                  </label>
                  <input
                    type="number"
                    name="recipientCount"
                    value={formData.recipientCount}
                    onChange={handleInputChange}
                    placeholder="e.g., 100"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Recipients CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Upload CSV file with addresses and amounts
                  </p>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="csv-upload"
                    className={`btn btn-outline cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : 'Choose File'}
                  </label>
                  {formData.csvFile && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      ✓ {formData.csvFile.name}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Format: address[,amount] per line. Header row optional.
                  </p>
                </div>

                {/* Recipients Summary */}
                {recipients.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Recipients Loaded: {recipients.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const csvContent = "data:text/csv;charset=utf-8," +
                            "address,amount\n" +
                            recipients.map(r => `${r.address},${r.amount}`).join("\n");
                          const link = document.createElement("a");
                          link.setAttribute("href", encodeURI(csvContent));
                          link.setAttribute("download", "recipients.csv");
                          link.click();
                        }}
                        className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Total Amount: {recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(6)} tokens
                    </div>
                  </div>
                )}
              </div>

              {/* Merkle Tree Generation for Merkle Airdrops */}
              {selectedAirdropType === 'merkle' && recipients.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Merkle Tree
                  </label>
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {!merkleData ? (
                      <button
                        type="button"
                        onClick={generateMerkleTree}
                        disabled={loading}
                        className="btn btn-secondary w-full"
                      >
                        {loading ? 'Generating...' : 'Generate Merkle Tree'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm font-medium">Merkle Tree Generated</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                          Root: {merkleData.merkleRoot}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const dataStr = JSON.stringify(merkleData, null, 2);
                            const dataBlob = new Blob([dataStr], {type: 'application/json'});
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'merkle-data.json';
                            link.click();
                          }}
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Merkle Data
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your airdrop campaign..."
                  rows={3}
                  className="input"
                />
              </div>

              <div className="flex justify-center pt-6">
                {isConnected ? (
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg group"
                  >
                    <Gift className="h-5 w-5 mr-2" />
                    Create Airdrop
                    <CheckCircle className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mx-auto mb-6 animate-glow">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">Connect your wallet to create airdrops</p>
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
        </div>
      )}

      {/* Manage Airdrops Tab */}
      {activeTab === 'manage' && (
        <div className="card p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Airdrops</h2>
            <button
              onClick={fetchAirdrops}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {!isConnected ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Connect your wallet to view and manage your airdrops
              </p>
              <WalletConnectButton />
            </div>
          ) : airdrops.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Airdrops Yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create your first airdrop to start distributing tokens
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="btn btn-primary"
              >
                Create Airdrop
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Airdrops Found: {airdrops.length}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Airdrop management interface will be enhanced once contracts are deployed
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="btn btn-primary"
              >
                Create New Airdrop
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="text-center py-20">
          <div className="card p-12 max-w-2xl mx-auto">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Airdrop History
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              View your completed airdrop campaigns, distribution statistics, and historical data.
            </p>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="mt-12 card p-8">
        <div className="flex items-start">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mr-4 flex-shrink-0">
            <Info className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Airdrop Features
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></span>
                Batch token distribution to multiple addresses
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></span>
                CSV file upload for easy recipient management
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></span>
                Gas-optimized smart contracts for cost efficiency
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></span>
                Merkle tree airdrops for large-scale distributions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Airdrop
