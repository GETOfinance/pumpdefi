import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function Markets() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const r = await fetch(`${API}/api/lendingv2/markets`)
        const j = await r.json()
        if (!j.success) throw new Error(j.error || 'failed')
        setRows(j.markets || [])
      } catch (e) {
        setError(e.message)
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Markets</h1>
      {loading && <div>Loading markets...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !error && (
        <div className="card p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="p-2">Asset</th>
                <th className="p-2">aToken</th>
                <th className="p-2">Liquidity</th>
                <th className="p-2">Debt</th>
                <th className="p-2">Utilization</th>
                <th className="p-2">Supply APR</th>
                <th className="p-2">Borrow APR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="p-2 font-mono text-xs">{m.asset}</td>
                  <td className="p-2 font-mono text-xs">{m.aToken}</td>
                  <td className="p-2">{m.liquidity?.toFixed?.(4)}</td>
                  <td className="p-2">{m.debt?.toFixed?.(4)}</td>
                  <td className="p-2">{(m.utilization * 100).toFixed(2)}%</td>
                  <td className="p-2">{(m.rates?.supplyApr * 100).toFixed(2)}%</td>
                  <td className="p-2">{(m.rates?.borrowApr * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

