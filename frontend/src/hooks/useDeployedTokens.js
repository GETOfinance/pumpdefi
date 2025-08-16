import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { getContract } from 'viem'
import { CONTRACT_ADDRESSES } from '../config/chains'
import { TOKEN_FACTORY_ABI, ERC20_ABI } from '../config/abis'

export const useDeployedTokens = () => {
  const publicClient = usePublicClient()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!publicClient) return
      setLoading(true)
      try {
        const tf = getContract({ address: CONTRACT_ADDRESSES.TOKEN_FACTORY, abi: TOKEN_FACTORY_ABI, client: { public: publicClient } })
        const addrs = await tf.read.getAllTokens()
        const results = []
        for (const addr of addrs) {
          try {
            const erc = getContract({ address: addr, abi: ERC20_ABI, client: { public: publicClient } })
            const [symbol, name, decimals] = await Promise.all([
              erc.read.symbol().catch(() => 'TKN'),
              erc.read.name().catch(() => 'Token'),
              erc.read.decimals().catch(() => 18)
            ])
            results.push({ address: addr, symbol, name, decimals, logoURI: '' })
          } catch {}
        }
        if (!cancelled) setTokens(results)
      } catch (e) {
        if (!cancelled) setTokens([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [publicClient])

  return { tokens, loading }
}

