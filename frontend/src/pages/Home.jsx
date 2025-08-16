import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { useContracts } from '../hooks/useContracts'
import { runWeb3Tests } from '../utils/testWeb3Integration'
import {
  ArrowRight,
  Zap,
  Factory,
  Rocket,
  ArrowLeftRight,
  Droplets,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Star,
  Shield,
  Globe,
  Sparkles,
  BarChart3,
  Briefcase,
  Gift,
  Lock,
  TestTube
} from 'lucide-react'

const Home = () => {
  const { isConnected } = useAccount()
  const contracts = useContracts()
  const [isTestingWeb3, setIsTestingWeb3] = useState(false)

  const handleTestWeb3 = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsTestingWeb3(true)
    toast.loading('Running Web3 integration tests...')

    try {
      const results = await runWeb3Tests(contracts)
      const passed = results.filter(r => r.success).length
      const total = results.length

      toast.dismiss()
      if (passed === total) {
        toast.success(`All ${total} Web3 tests passed! 🎉`)
      } else {
        toast.error(`${passed}/${total} tests passed. Check console for details.`)
      }
    } catch (error) {
      toast.dismiss()
      toast.error('Web3 testing failed: ' + error.message)
    } finally {
      setIsTestingWeb3(false)
    }
  }
  const [stats, setStats] = useState({
    totalTokens: 1247,
    totalVolume: '$2.4M',
    totalUsers: 8934,
    totalLaunches: 156
  })

  const features = [
    {
      icon: Factory,
      title: 'Token Factory',
      description: 'Create custom tokens with advanced features like taxation, rewards, and more',
      href: '/factory',
      color: 'from-purple-500 to-blue-500',
      stats: '1,247 tokens created'
    },
    {
      icon: Rocket,
      title: 'Fair Launch',
      description: 'Launch your tokens with transparent, time-based distribution mechanisms',
      href: '/launchpad',
      color: 'from-blue-500 to-cyan-500',
      stats: '156 launches completed'
    },
    {
      icon: Gift,
      title: 'Token Airdrop',
      description: 'Distribute tokens efficiently to multiple addresses with batch operations',
      href: '/airdrop',
      color: 'from-green-500 to-emerald-500',
      stats: '2.1M tokens distributed'
    },
    {
      icon: Lock,
      title: 'Token Lock',
      description: 'Secure token locks and vesting schedules to build trust and stability',
      href: '/lock',
      color: 'from-purple-500 to-indigo-500',
      stats: '$1.8M tokens locked'
    },
    {
      icon: ArrowLeftRight,
      title: 'DEX Trading',
      description: 'Trade tokens with optimal routing and minimal slippage on our DEX',
      href: '/swap',
      color: 'from-cyan-500 to-teal-500',
      stats: '$2.4M total volume'
    },
    {
      icon: Droplets,
      title: 'Liquidity Pools',
      description: 'Provide liquidity and earn fees from trading activity',
      href: '/pools',
      color: 'from-teal-500 to-green-500',
      stats: '89 active pools'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track platform metrics, token performance, and trading data',
      href: '/analytics',
      color: 'from-green-500 to-yellow-500',
      stats: 'Real-time data'
    },
    {
      icon: Briefcase,
      title: 'Portfolio',
      description: 'Manage your tokens, positions, and track your performance',
      href: '/portfolio',
      color: 'from-yellow-500 to-orange-500',
      stats: 'Personal dashboard'
    }
  ]

  const highlights = [
    {
      icon: Shield,
      title: 'Secure & Audited',
      description: 'Smart contracts audited for maximum security'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built on Core blockchain for optimal performance'
    },
    {
      icon: Globe,
      title: 'Decentralized',
      description: 'Fully decentralized protocol with no central authority'
    },
    {
      icon: Star,
      title: 'Community Driven',
      description: 'Governed by the community for the community'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">PumpDeFi</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The ultimate DeFi platform for creating, launching, and trading tokens on Core blockchain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/factory"
                className="btn btn-primary btn-lg group"
              >
                <Factory className="h-5 w-5 mr-2" />
                Create Token
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/launchpad/create/fair"
                className="btn btn-outline btn-lg group"
              >
                <Shield className="h-5 w-5 mr-2" />
                Fair Launch
              </Link>
              <Link
                to="/launchpad/create/pump"
                className="btn btn-outline btn-lg group"
              >
                <Zap className="h-5 w-5 mr-2" />
                Pump Launch
              </Link>
              {isConnected && (
                <button
                  onClick={handleTestWeb3}
                  disabled={isTestingWeb3}
                  className="btn btn-secondary btn-lg group"
                >
                  <TestTube className="h-5 w-5 mr-2" />
                  {isTestingWeb3 ? 'Testing...' : 'Test Web3'}
                  <Sparkles className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="stats-card text-center">
              <div className="text-3xl font-bold gradient-text mb-2">{stats.totalTokens}</div>
              <div className="text-gray-400 text-sm">Tokens Created</div>
            </div>
            <div className="stats-card text-center">
              <div className="text-3xl font-bold gradient-text mb-2">{stats.totalVolume}</div>
              <div className="text-gray-400 text-sm">Total Volume</div>
            </div>
            <div className="stats-card text-center">
              <div className="text-3xl font-bold gradient-text mb-2">{stats.totalUsers}</div>
              <div className="text-gray-400 text-sm">Active Users</div>
            </div>
            <div className="stats-card text-center">
              <div className="text-3xl font-bold gradient-text mb-2">{stats.totalLaunches}</div>
              <div className="text-gray-400 text-sm">Successful Launches</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Powerful DeFi Tools
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to create, launch, and manage tokens in the DeFi ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Link
                  key={index}
                  to={feature.href}
                  className="feature-card group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 mb-4">{feature.description}</p>
                  <div className="text-sm text-purple-400 font-medium">{feature.stats}</div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Why Choose PumpDeFi?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((highlight, index) => {
              const IconComponent = highlight.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 animate-glow">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{highlight.title}</h3>
                  <p className="text-gray-400">{highlight.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card p-12">
            <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users creating and trading tokens on PumpDeFi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <Link
                  to="/factory"
                  className="btn btn-primary btn-lg"
                >
                  <Factory className="h-5 w-5 mr-2" />
                  Start Creating
                </Link>
              ) : (
                <button className="btn btn-primary btn-lg">
                  Connect Wallet to Start
                </button>
              )}
              <Link
                to="/analytics"
                className="btn btn-outline btn-lg"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
