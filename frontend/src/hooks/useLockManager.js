import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { getContract, parseUnits } from 'viem'
import { CONTRACT_ADDRESSES } from '../config/chains'

// Minimal ABI for a token lock manager (example interface)
export const LOCK_MANAGER_ABI = [
  {
    type: 'function',
    name: 'createLock',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'beneficiary', type: 'address' },
      { name: 'revocable', type: 'bool' },
      { name: 'description', type: 'string' }
    ],
    outputs: [{ name: 'lockId', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'locks',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'creator', type: 'address' },
      { name: 'beneficiary', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'revocable', type: 'bool' },
      { name: 'revoked', type: 'bool' },
      { name: 'withdrawn', type: 'bool' },
      { name: 'description', type: 'string' },
    ]
  },
  {
    type: 'function',
    name: 'getTotalLocks',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },

  {
    type: 'function',
    name: 'getUserLocks',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256[]' }]
  },
  { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{ name: 'lockId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'revoke', stateMutability: 'nonpayable', inputs: [{ name: 'lockId', type: 'uint256' }], outputs: [] },
]

export const useLockManager = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const contract = CONTRACT_ADDRESSES.LOCK_MANAGER
    ? getContract({ address: CONTRACT_ADDRESSES.LOCK_MANAGER, abi: LOCK_MANAGER_ABI, publicClient, walletClient: walletClient || undefined })
    : null

  const createLock = async ({ token, amount, decimals, unlockTime, beneficiary, revocable, description }) => {
    if (!contract || !address) throw new Error('Lock manager not configured or wallet not connected')
    const amt = parseUnits(amount, decimals || 18)
    const tx = await contract.write.createLock([token, amt, BigInt(unlockTime), beneficiary, !!revocable, description || ''], { account: address })
    return tx
  }

  const getUserLocks = async (user) => {
    if (!contract) return []
    const ids = await contract.read.getUserLocks([user || address])
    return ids
  }

  const getLock = async (id) => {
    if (!contract) return null
    const data = await contract.read.locks([id])
    return data
  }

  const withdraw = async (id) => {
    if (!contract || !address) throw new Error('Lock manager not configured or wallet not connected')
    return contract.write.withdraw([id], { account: address })
  }

  const revoke = async (id) => {
    if (!contract || !address) throw new Error('Lock manager not configured or wallet not connected')
    return contract.write.revoke([id], { account: address })
  }

  return { createLock, getUserLocks, getLock, withdraw, revoke, contract }
}

