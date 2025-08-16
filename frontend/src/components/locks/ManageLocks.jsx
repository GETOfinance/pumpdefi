import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES } from '../../config/chains'
import { LOCK_MANAGER_ABI } from '../../hooks/useLockManager'
import { ERC20_ABI } from '../../config/abis'
import { useContracts } from '../../hooks/useContracts'
import { AlertTriangle, Shield, Unlock } from 'lucide-react'
import { toast } from 'react-hot-toast'

const ManageLocks = ({ address }) => {
  const { address: walletAddress } = useAccount()
  const userAddr = address || walletAddress
  const [locks, setLocks] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalLocks, setTotalLocks] = useState(null)
  const [matchedIds, setMatchedIds] = useState([])
  const contracts = useContracts()

  useEffect(() => {
    const load = async () => {
      if (!CONTRACT_ADDRESSES.LOCK_MANAGER || !userAddr || !contracts?.publicClient || !contracts?.getContractInstance) return
      setLoading(true)
      try {
        const lockManagerContract = contracts.getContractInstance(CONTRACT_ADDRESSES.LOCK_MANAGER, LOCK_MANAGER_ABI)

        // Attempt primary path: user-specific index
        let ids = []
        try {
          ids = await lockManagerContract.read.getUserLocks([userAddr])
        } catch (e) {
          console.warn('getUserLocks failed, falling back to scan', e)
        }

        // Fallback: scan all locks and filter by beneficiary or creator
        if (!ids || ids.length === 0) {
          try {
            const total = await lockManagerContract.read.getTotalLocks()
            setTotalLocks(Number(total))
            const found = []
            for (let i = 0; i < Number(total); i++) {
              const data = await lockManagerContract.read.locks([i])
              if (!data) continue
              const beneficiary = data[2]
              const creator = data[1]
              if (beneficiary?.toLowerCase?.() === userAddr.toLowerCase() || creator?.toLowerCase?.() === userAddr.toLowerCase()) {
                found.push(i)
              }
            }
            ids = found
            setMatchedIds(found)
          } catch (e) {
            console.warn('fallback scan failed', e)
          }
        }

        const out = []
        for (const id of ids) {
          const data = await lockManagerContract.read.locks([id])
          // Unpack tuple by name for clarity (matches Lock struct order)
          const [token, creator, beneficiary, amount, unlockTime, revocable, revoked, withdrawn, description] = data
          // Fetch token metadata in parallel for performance
          let symbol = 'TKN', decimals = 18
          try {
            const tokenContract = contracts.getERC20Contract(token)
            const [sym, dec] = await Promise.all([
              tokenContract.read.symbol(),
              tokenContract.read.decimals(),
            ])
            symbol = sym
            decimals = Number(dec) || 18
          } catch (e) {
            console.warn('token metadata read failed', e)
          }
          out.push({ id, token, creator, beneficiary, amount, unlockTime: Number(unlockTime), revocable, revoked, withdrawn, description, symbol, decimals })
        }
        setLocks(out)
      } catch (e) {
        console.error('Failed to load locks', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userAddr, contracts])

  const onWithdraw = async (lock) => {
    try {
      const now = Math.floor(Date.now()/1000)
      if (lock.withdrawn) return toast.error('Already withdrawn')
      if (now < lock.unlockTime) return toast.error('Not yet unlocked')
      const lockManagerContract = contracts.getContractInstance(CONTRACT_ADDRESSES.LOCK_MANAGER, LOCK_MANAGER_ABI)
      const hash = await lockManagerContract.write.withdraw([lock.id])
      await contracts.publicClient.waitForTransactionReceipt({ hash })
      toast.success('Withdrawn')
      setLocks(locks.map(l => l.id === lock.id ? { ...l, withdrawn: true } : l))
    } catch (e) {
      toast.error(e?.shortMessage || 'Withdraw failed')
    }
  }

  const onRevoke = async (lock) => {
    try {
      if (!lock.revocable) return toast.error('Lock is not revocable')
      if (lock.revoked) return toast.error('Already revoked')
      const lockManagerContract = contracts.getContractInstance(CONTRACT_ADDRESSES.LOCK_MANAGER, LOCK_MANAGER_ABI)
      const hash = await lockManagerContract.write.revoke([lock.id])
      await contracts.publicClient.waitForTransactionReceipt({ hash })
      toast.success('Revoked')
      setLocks(locks.map(l => l.id === lock.id ? { ...l, revoked: true } : l))
    } catch (e) {
      toast.error(e?.shortMessage || 'Revoke failed')
    }
  }

  if (!CONTRACT_ADDRESSES.LOCK_MANAGER) {
    return (
      <div className="text-center py-20">
        <div className="card p-12 max-w-2xl mx-auto">
          <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lock Manager Not Configured</h3>
          <p className="text-gray-600 dark:text-gray-300">Set VITE_LOCK_MANAGER_ADDRESS in your environment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Locks</h3>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : locks.length === 0 ? (
        <div className="text-center text-gray-500">No locks found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locks.map(lock => {
            const now = Math.floor(Date.now()/1000)
            const unlocked = now >= lock.unlockTime
            return (
              <div key={lock.id} className="card p-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">{lock.symbol} Lock</div>
                  <div className={`text-xs px-2 py-1 rounded ${unlocked ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-300'}`}>
                    {unlocked ? 'Unlocked' : 'Locked'}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-4 break-all">{lock.token}</div>
                <div className="text-sm text-gray-300 mb-2">Amount: {(Number(lock.amount) / 10**lock.decimals).toLocaleString()}</div>
                <div className="text-sm text-gray-300 mb-4">Unlocks: {new Date(lock.unlockTime * 1000).toLocaleString()}</div>
                <div className="flex gap-3">
                  <button className="btn btn-primary btn-sm" disabled={!unlocked || lock.withdrawn} onClick={() => onWithdraw(lock)}>
                    <Unlock className="w-4 h-4 mr-1" /> Withdraw
                  </button>
                  <button className="btn btn-secondary btn-sm" disabled={!lock.revocable || lock.revoked} onClick={() => onRevoke(lock)}>
                    <Shield className="w-4 h-4 mr-1" /> Revoke
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ManageLocks

