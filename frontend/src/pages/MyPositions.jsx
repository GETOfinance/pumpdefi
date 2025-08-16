import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function MyPositions() {
  const { address } = useAccount()
  const [rows, setRows] = useState([])
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      if (!address) return
      try {
        setLoading(true)
        const r = await fetch(`${API}/api/lendingv2/positions/${address}`)
        const j = await r.json()
        if (!j.success) throw new Error(j.error || 'failed')
        setRows(j.reserves || [])
        setAccount(j.account)
      } catch (e) {
        setError(e.message)
      } finally { setLoading(false) }
    })()
  }, [address])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <h1 className="text-3xl font-bold gradient-text">My Positions</h1>
      {!address && <div>Connect wallet</div>}
      {loading && <div>Loading positions...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !error && address && (
        <>
          <div className="card p-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-400">Collateral (USD@LT)</div>
                <div className="text-lg">{account ? Number(account[0]) / 1e18 : 0}</div>
              </div>
              <div>
                <div className="text-gray-400">Debt (USD)</div>
                <div className="text-lg">{account ? Number(account[1]) / 1e18 : 0}</div>
              </div>
              <div>
                <div className="text-gray-400">Health Factor</div>
                <div className="text-lg">{account ? Number(account[2]) / 1e18 : 0}</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="p-2">Asset</th>
                  <th className="p-2">aToken</th>
                  <th className="p-2">Supplied</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => (
                  <tr key={i} className="border-t border-gray-800">
                    <td className="p-2 font-mono text-xs">{m.asset}</td>
                    <td className="p-2 font-mono text-xs">{m.aToken}</td>
                    <td className="p-2">{Number(m.supplied) / 1e18}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

