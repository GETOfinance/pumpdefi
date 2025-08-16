import { useMemo } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { LENDING_POOL_ABI, ERC20_ABI } from '../config/abis'

const POOL_ADDR = import.meta.env.VITE_LENDING_POOL_ADDRESS || import.meta.env.LENDING_POOL_ADDRESS || (typeof process !== 'undefined' ? process.env.LENDING_POOL_ADDRESS : '')

export function useLendingV2() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const pool = useMemo(() => ({ address: POOL_ADDR, abi: LENDING_POOL_ABI }), [])

  async function approveIfNeeded(token, owner, spender, amount) {
    const allowance = await publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: 'allowance', args: [owner, spender] })
    if (allowance < amount) {
      await walletClient.writeContract({ address: token, abi: ERC20_ABI, functionName: 'approve', args: [spender, amount] })
    }
  }

  return {
    address,
    pool,
    async deposit(asset, amount) {
      if (!walletClient) throw new Error('No wallet')
      await approveIfNeeded(asset, address, pool.address, amount)
      return walletClient.writeContract({ address: pool.address, abi: pool.abi, functionName: 'deposit', args: [asset, amount] })
    },
    async withdraw(asset, amount) {
      if (!walletClient) throw new Error('No wallet')
      return walletClient.writeContract({ address: pool.address, abi: pool.abi, functionName: 'withdraw', args: [asset, amount] })
    },
    async borrow(asset, amount) {
      if (!walletClient) throw new Error('No wallet')
      return walletClient.writeContract({ address: pool.address, abi: pool.abi, functionName: 'borrow', args: [asset, amount] })
    },
    async repay(asset, amount) {
      if (!walletClient) throw new Error('No wallet')
      await approveIfNeeded(asset, address, pool.address, amount)
      return walletClient.writeContract({ address: pool.address, abi: pool.abi, functionName: 'repay', args: [asset, amount] })
    },
    async setUseAsCollateral(asset, use) {
      if (!walletClient) throw new Error('No wallet')
      return walletClient.writeContract({ address: pool.address, abi: pool.abi, functionName: 'setUserUseReserveAsCollateral', args: [asset, use] })
    }
  }
}

