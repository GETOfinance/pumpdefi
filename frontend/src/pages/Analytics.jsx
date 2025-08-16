import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart3, TrendingUp, DollarSign, Users, Activity } from 'lucide-react'
import { API_CONFIG } from '../config/chains'

const Analytics = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ tokenCount: 0, poolCount: 0, salesCount: 0, topPools: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_CONFIG.BACKEND_URL}/api/analytics/overview`)
        if (!mounted) return
        if (res.data?.success) setData(res.data)
      } catch (e) {
        if (!mounted) return
        setError('Failed to load analytics')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-green-600 to-yellow-600 mb-6 animate-glow">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Analytics</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Track platform metrics and token performance
        </p>
      </div>

      {loading && <div className="text-gray-400">Loading analytics...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="token-card">
              <div className="text-gray-400 text-sm">Total Tokens</div>
              <div className="text-white text-3xl font-bold">{data.tokenCount}</div>
            </div>
            <div className="token-card">
              <div className="text-gray-400 text-sm">Total Pools</div>
              <div className="text-white text-3xl font-bold">{data.poolCount}</div>
            </div>
            <div className="token-card">
              <div className="text-gray-400 text-sm">Pump Sales</div>
              <div className="text-white text-3xl font-bold">{data.salesCount}</div>
            </div>
          </div>

          <div className="token-card">
            <div className="text-white text-xl font-semibold mb-4">Top Pools by WCORE Liquidity</div>
            {data.topPools.length === 0 ? (
              <div className="text-gray-400">No pools found</div>
            ) : (
              <div className="space-y-3">
                {data.topPools.map(p => (
                  <div key={p.pool} className="flex justify-between text-sm">
                    <div className="text-gray-300 truncate mr-3">{p.pool}</div>
                    <div className="text-gray-400 truncate">{p.token0} / {p.token1}</div>
                    <div className="text-white font-medium">{(Number(p.wcoreLiquidity)/1e18).toFixed(2)} WCORE est.</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics
