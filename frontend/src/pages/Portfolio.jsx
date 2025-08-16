import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import axios from 'axios'
import { Briefcase, Copy } from 'lucide-react'
import { toast } from 'react-hot-toast'
import WalletConnectButton from '../components/WalletConnectButton'
import { API_CONFIG } from '../config/chains'

const Portfolio = () => {
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(false)
  const [tokens, setTokens] = useState([])
  const [native, setNative] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!isConnected || !address) return
      try {
        setLoading(true)
        const res = await axios.get(`${API_CONFIG.BACKEND_URL}/api/portfolio/${address}`)
        if (!mounted) return
        if (res.data?.success) {
          setTokens(res.data.tokens || [])
          setNative(res.data.native || null)
        }
      } catch (e) {
        if (!mounted) return
        setError('Failed to load portfolio')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [isConnected, address])

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-8 animate-glow">
            <Briefcase className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Portfolio</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect your wallet to view your token portfolio, track performance, and manage your DeFi positions.
          </p>
          <WalletConnectButton
            className="btn btn-primary btn-lg"
            text="Connect Wallet to View Portfolio"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-yellow-600 to-orange-600 mb-6 animate-glow">
          <Briefcase className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Portfolio</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Track your tokens, positions, and performance
        </p>
      </div>

      {loading && <div className="text-gray-400">Loading portfolio...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          {native && (
            <div className="token-card mb-6">
              <div className="text-gray-400 text-sm">CORE (native)</div>
              <div className="text-white text-2xl font-bold">{(Number(native.balanceWei)/1e18).toFixed(4)} CORE</div>
              <div className="text-gray-500 text-xs flex items-center gap-2">
                Address: <span className="font-mono text-gray-400">{address.slice(0,6)}...{address.slice(-4)}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(address); toast.success('Address copied') }}
                  className="inline-flex items-center text-gray-400 hover:text-white"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.length === 0 ? (
              <div className="text-gray-400">No tracked tokens found for your address.</div>
            ) : (
              tokens.map(t => (
                <div key={t.address} className="token-card">
                  <div className="text-gray-400 text-sm">{t.name || 'Token'} ({t.symbol || 'TKN'})</div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-white text-xl font-semibold font-mono">{t.address.slice(0,6)}...{t.address.slice(-4)}</div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(t.address); toast.success('Token address copied') }}
                      className="inline-flex items-center text-gray-400 hover:text-white"
                      title="Copy token address"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-gray-300">Balance: {(Number(t.balance) / (10 ** (t.decimals || 18))).toFixed(4)}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Portfolio
