import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Rocket, Plus, Calendar, Users, DollarSign, Clock, TrendingUp, Star, Zap, Shield, Target } from 'lucide-react'

import { useEffect } from 'react'
import axios from 'axios'
import { API_CONFIG } from '../config/chains'

const LaunchPad = () => {
  const [activeTab, setActiveTab] = useState('active')
  const [pumpSales, setPumpSales] = useState([])
  const [loadingPump, setLoadingPump] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingPump(true)
        const res = await axios.get(`${API_CONFIG.BACKEND_URL}/api/pump/sales`)
        if (res.data?.success) setPumpSales(res.data.sales)
      } catch (e) {
        // ignore for now
      } finally {
        setLoadingPump(false)
      }
    }
    load()
  }, [])


  const tabs = [
    { id: 'active', name: 'Active Launches', count: 12 },
    { id: 'upcoming', name: 'Upcoming', count: 5 },
    { id: 'completed', name: 'Completed', count: 89 },
  ]

  const launchTypes = [
    {
      id: 'fair-launch',
      title: 'Fair Launch',
      description: 'Equal opportunity for all participants with transparent distribution',
      icon: Shield,
      color: 'from-blue-600 to-cyan-600',
      features: [
        'Equal participation opportunity',
        'Transparent token distribution',
        'Anti-bot protection',
        'Time-based allocation',
        'Community-driven pricing'
      ],
      href: '/launchpad/create/fair'
    },
    {
      id: 'pump-launch',
      title: 'Pump Launch',
      description: 'High-energy launch with immediate trading and liquidity',
      icon: Zap,
      color: 'from-purple-600 to-pink-600',
      features: [
        'Instant liquidity provision',
        'Immediate trading enabled',
        'Price discovery mechanism',
        'Momentum-based launch',
        'Quick market entry'
      ],
      href: '/launchpad/create/pump'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 mb-6 animate-glow">
          <Rocket className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">LaunchPad</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
          Choose your launch strategy and bring your token to market
        </p>

        {/* Launch Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {launchTypes.map((launch) => {
            const IconComponent = launch.icon
            return (
              <Link
                key={launch.id}
                to={launch.href}
                className="feature-card group text-left"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${launch.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{launch.title}</h3>
                <p className="text-gray-300 mb-6">{launch.description}</p>
                <ul className="space-y-2 mb-6">
                  {launch.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-center">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center text-purple-400 font-semibold group-hover:text-white transition-colors">
                  <span>Create {launch.title}</span>
                  <Rocket className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700/30 mb-12">
        <nav className="-mb-px flex justify-center space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-6 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-white bg-purple-600/10 rounded-t-xl'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {tab.name}
              <span className={`ml-2 py-1 px-3 rounded-full text-xs font-medium ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Active Launches */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Fair Launch */}
          <div className="token-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">CoreDeFi</h3>
                  <p className="text-sm text-gray-400">CDEFI</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">
                Fair Launch
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">67%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full" style={{width: '67%'}}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Raised: 67 CORE</span>
                <span className="text-gray-400">Goal: 100 CORE</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
              <span>Ends in 2d 14h</span>
              <span>234 participants</span>
            </div>

            <button className="w-full btn btn-primary">
              Participate
            </button>
          </div>

          {/* Example Pump Launch */}
          <div className="token-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">PumpCoin</h3>
                  <p className="text-sm text-gray-400">PUMP</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">
                Pump Launch
              </span>
            </div>

            <div className="space-y-3 mb-4">

	          {/* Live Pump Sales */}
	          {loadingPump ? (
	            <div className="col-span-3 text-gray-400">Loading pump sales...</div>
	          ) : pumpSales.length > 0 ? (
	            pumpSales.map((s) => (
	              <div key={s.sale} className="token-card">
	                <div className="flex items-center justify-between mb-4">
	                  <div className="flex items-center space-x-3">
	                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
	                      <Zap className="h-6 w-6 text-white" />
	                    </div>
	                    <div>
	                      <h3 className="text-lg font-bold text-white">Bonding Sale</h3>
	                      <p className="text-sm text-gray-400 break-all">{s.token}</p>
	                    </div>
	                  </div>
	                  <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">
	                    Pump Launch
	                  </span>
	                </div>
	                <div className="space-y-3 mb-4 text-sm">
	                  <div className="flex justify-between"><span className="text-gray-400">Raised</span><span className="text-white">{(Number(s.totalRaised)/1e18).toFixed(4)} CORE</span></div>
	                  <div className="flex justify-between"><span className="text-gray-400">Sold</span><span className="text-white">{(Number(s.totalSold)/1e18).toFixed(2)} / {(Number(s.totalForSale)/1e18).toFixed(2)}</span></div>
	                  <div className="flex justify-between"><span className="text-gray-400">Ends</span><span className="text-white">{new Date(s.endTime*1000).toLocaleString()}</span></div>
	                </div>
	                <Link to={`/launchpad/pump/${s.sale}`} className="w-full btn btn-primary inline-block text-center">Participate</Link>
	              </div>
	            ))
	          ) : (
	            <div className="col-span-3 text-gray-500">No pump sales yet. Create one!</div>
	          )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price</span>
                <span className="text-green-400">+245% 🚀</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Current: 0.0045 CORE</span>
                <span className="text-gray-400">Target: 0.01 CORE</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full" style={{width: '45%'}}></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
              <span>Live for 8h</span>
              <span>$12.4K volume</span>
            </div>

            <button className="w-full btn btn-primary">
              Trade Now
            </button>
          </div>

          {/* Coming Soon Card */}
          <div className="token-card border-dashed border-gray-600">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Your Launch Here</h3>
              <p className="text-gray-400 text-sm mb-4">Create your own fair or pump launch</p>
              <Link to="/launchpad/create/fair" className="btn btn-outline btn-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Launches */}
      {activeTab === 'upcoming' && (
        <div className="text-center py-20">
          <div className="card p-12 max-w-2xl mx-auto">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Upcoming Launches
            </h3>
            <p className="text-gray-300">
              5 exciting projects are preparing to launch soon. Stay tuned!
            </p>
          </div>
        </div>
      )}

      {/* Completed Launches */}
      {activeTab === 'completed' && (
        <div className="text-center py-20">
          <div className="card p-12 max-w-2xl mx-auto">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Completed Launches
            </h3>
            <p className="text-gray-300">
              89 successful launches with over $2.4M raised for the community.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LaunchPad
