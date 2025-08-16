import { useEffect, useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { isAddress, parseEther, formatEther } from 'viem'
import WalletConnectButton from '../components/WalletConnectButton'
import { Shield, User, CheckCircle, AlertTriangle, Copy } from 'lucide-react'
import { useContracts } from '../hooks/useContracts'
import { ESCROW_HUB_ABI } from '../config/abis'
import { CONTRACT_ADDRESSES } from '../config/chains'

const Escrow = () => {
  const { address, isConnected } = useAccount()
  const { getContractInstance } = useContracts()
  const [form, setForm] = useState({
    beneficiary: '', // seller
    arbiter: '', // unused in current ABI; placeholder for future
    amount: '', // in CORE (native)
    note: '' // cid or memo
  })
  const [submitting, setSubmitting] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [page, setPage] = useState({ cursor: 0, perPage: 6, total: 0, hasNext: false })

  const [myEscrows, setMyEscrows] = useState([])

  const factoryAddress = import.meta.env.VITE_ESCROW_FACTORY_ADDRESS || ''

  const configured = useMemo(() => {
    return Boolean(factoryAddress && isAddress(factoryAddress))
  }, [factoryAddress])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCreate = async () => {
    if (!isConnected) return toast.error('Connect wallet first')
    if (!configured) return toast.error('Escrow factory not configured')
    if (!isAddress(form.beneficiary)) return toast.error('Invalid beneficiary')
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter amount')
    // Enforce flat 1 CORE fee presence client-side
    const amt = Number(form.amount)
    if (amt <= 1) return toast.error('Amount must be greater than 1 CORE (flat 1 CORE fee applies)')


    try {
      setSubmitting(true)
      const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
      const txHash = await hub.write.newEscrow([
        form.beneficiary,
        form.note || '', // cid/memo
        3 * 24 * 60 * 60 // expireIn: 3 days default
      ], {
        value: parseEther(form.amount),
        account: address
      })
      toast.success('Escrow created: ' + txHash)
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Failed to create escrow')
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch paginated escrows
  useEffect(() => {
    const fetchMine = async () => {
      if (!configured || !isConnected) return
      try {
        setLoadingList(true)
        const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
        const [data, total, hasNext, nextCursor] = await hub.read.fetchEscrowsPaginated([page.cursor, page.perPage])
        setMyEscrows(data)
        setPage(prev => ({ ...prev, total, hasNext, nextCursor }))
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingList(false)
      }
    }
    fetchMine()
  }, [configured, isConnected, address, page.cursor, page.perPage])

  // Auto-refresh on events
  useEffect(() => {
    if (!configured || !isConnected) return
    const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
    const unsubs = []
    try {
      const refresh = async () => {
        try {
          setLoadingList(true)
          const [data, total, hasNext, nextCursor] = await hub.read.fetchEscrowsPaginated([page.cursor, page.perPage])
          setMyEscrows(data); setPage(p => ({ ...p, total, hasNext, nextCursor }))
        } finally { setLoadingList(false) }
      }
      const u1 = hub.watchEvent.EscrowCreated({}, { onLogs: refresh })
      const u2 = hub.watchEvent.EscrowUpdated({}, { onLogs: refresh })
      unsubs.push(u1, u2)
    } catch (e) {
      console.error('event subscribe error', e)
    }
    return () => {
      unsubs.forEach(u => { try { u?.() } catch {} })
    }
  }, [configured, isConnected, address, page.cursor, page.perPage])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Escrow</h1>
        <p className="text-gray-400">Secure, neutral settlement between a depositor and beneficiary with an arbiter.</p>
      </div>

      {!isConnected ? (
        <div className="text-center py-16 card">
          <p className="text-gray-300 mb-6">Connect your wallet to create or manage escrows.</p>
          <WalletConnectButton className="btn btn-primary" text="Connect Wallet" />
        </div>
      ) : (
        <div className="space-y-8">
          {!configured && (
            <div className="card p-4 border border-yellow-700/30 bg-yellow-900/10 text-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold">Escrow factory not configured</div>
                  <div className="text-sm text-yellow-300/90 mt-1">
                    Set VITE_ESCROW_FACTORY_ADDRESS and provide the factory ABI to enable escrow creation and management.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Create Escrow</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Beneficiary</label>
                <input
                  type="text"
                  name="beneficiary"
                  value={form.beneficiary}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Arbiter</label>
                <input
                  type="text"
                  name="arbiter"
                  value={form.arbiter}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (CORE)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g., 2.0 (>= 1 CORE fee + amount)"
                  step="0.0001"
                  className="input"
                />
                <div className="text-xs text-yellow-300 mt-1">Note: A flat 1 CORE fee is charged on settlement (deliver/refund/expire).</div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Note (optional)</label>
                <input
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Purpose or reference"
                  className="input"
                />
              </div>
            </div>

            <div className="mt-6">
              <button className="btn btn-primary" onClick={handleCreate} disabled={submitting || !configured}>
                {submitting ? 'Submitting...' : 'Create Escrow'}
              </button>
            </div>
          </div>



          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">My Escrows</h2>
            <p className="text-gray-400 text-sm mb-3">{configured ? 'Escrows you created or are a party to' : 'Once the factory is configured, your escrows will appear here.'}</p>
            {loadingList ? (
              <div className="text-gray-400">Loading...</div>
            ) : myEscrows.length === 0 ? (
              <div className="text-gray-400">No escrows found.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myEscrows.map((e, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-700 p-4 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><User className="h-4 w-4" /> Seller</div>
                      <button className="inline-flex items-center gap-1 text-gray-400 hover:text-white" onClick={() => { navigator.clipboard.writeText(e.seller); toast.success('Address copied') }}><Copy className="h-3 w-3" /> Copy</button>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-400">
                      <div>Buyer: {e.buyer}</div>
                      <div>Amount: {e.amount ? formatEther(e.amount) : e.amount} CORE</div>
                      <div>Fee: {e.fee ? formatEther(e.fee) : e.fee} CORE</div>
                      <div>State: <span className={
                        e.state === 0 ? 'text-yellow-300' : e.state === 1 ? 'text-green-400' : e.state === 2 ? 'text-red-400' : 'text-gray-400'
                      }>{e.state === 0 ? 'Pending' : e.state === 1 ? 'Delivered' : e.state === 2 ? 'Refunded' : 'Expired'}</span></div>
                      <div>CID: {e.cid}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn btn-xs btn-outline" onClick={async () => {
                        try {
                          const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
                          const tx = await hub.write.deliver([e.id])
                          toast.success('Released: ' + tx)
                        } catch (err) { toast.error(err?.shortMessage || err?.message || 'Failed') }
                      }}>Release</button>
                      <button className="btn btn-xs btn-outline" onClick={async () => {
                        try {
                          const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
                          const tx = await hub.write.refund([e.id])
                          toast.success('Refunded: ' + tx)
                        } catch (err) { toast.error(err?.shortMessage || err?.message || 'Failed') }
                      }}>Refund</button>

                      {/*

	                      <button className="btn btn-xs btn-outline" onClick={async () => {
	                        try {
	                          const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
	                          const now = Math.floor(Date.now() / 1000)
	                          if (e.state !== 0) return toast.error('Only pending escrows can be claimed')
	                          if (now < Number(e.expireAt)) return toast.error('Not expired yet')

	                      <button className="btn btn-xs btn-outline" onClick={async () => {
	                        try {
	                          const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
	                          const now = Math.floor(Date.now() / 1000)
	                          if (e.state !== 0) return toast.error('Only pending escrows can be claimed')
	                          if (now < Number(e.expireAt)) return toast.error('Not expired yet')
	                          const tx = await hub.write.claimAfterExpire([e.id])
	                          toast.success('Claimed after expire: ' + tx)
	                        } catch (err) { toast.error(err?.shortMessage || err?.message || 'Failed') }
	                      }}>Claim After Expire</button>

	                          const tx = await hub.write.claimAfterExpire([e.id])
	                          toast.success('Claimed after expire: ' + tx)
	                        } catch (err) { toast.error(err?.shortMessage || err?.message || 'Failed') }
	                      }}>Claim After Expire</button>
                      */}
                      <button className="btn btn-xs btn-outline" disabled={address?.toLowerCase?.() !== e.buyer?.toLowerCase?.()} onClick={async () => {
                        try {
                          const hub = getContractInstance(factoryAddress, ESCROW_HUB_ABI)
                          const now = Math.floor(Date.now() / 1000)
                          if (e.state !== 0) return toast.error('Only pending escrows can be claimed')
                          if (now < Number(e.expireAt)) return toast.error('Not expired yet')
                          const tx = await hub.write.claimAfterExpire([e.id])
                          toast.success('Claimed after expire: ' + tx)
                        } catch (err) { toast.error(err?.shortMessage || err?.message || 'Failed') }
                      }}>Claim After Expire</button>


                    </div>
                  </div>
                ))}
              </div>



	              {/* Pagination Controls */}
	              <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
	                <div>Total: {page.total}</div>
	                <div className="flex gap-2">
	                  <button className="btn btn-xs btn-outline" disabled={page.cursor === 0 || loadingList} onClick={() => setPage(p => ({ ...p, cursor: Math.max(0, p.cursor - p.perPage) }))}>Prev</button>


	                  <button className="btn btn-xs btn-outline" disabled={!page.hasNext || loadingList} onClick={() => setPage(p => ({ ...p, cursor: p.cursor + p.perPage }))}>Next</button>
	                </div>

	              </div>

              </>


            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Escrow

