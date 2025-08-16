import { getContract } from 'viem'
import { Pool, Position, nearestUsableTick, TickMath, SqrtPriceMath, encodeSqrtRatioX96, priceToClosestTick } from '@uniswap/v3-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { V3_FACTORY_ABI, V3_POOL_ABI, ERC20_ABI, V3_NPM_ABI } from '../config/abis'
import { V3_ADDRESSES } from '../config/chains'

// Helper to construct a Uniswap V3 Pool object from on-chain reads
export async function buildPool(publicClient, token0, token1, fee) {
  const poolAddress = await publicClient.readContract({
    address: V3_ADDRESSES.V3_FACTORY,
    abi: V3_FACTORY_ABI,
    functionName: 'getPool',
    args: [token0.address, token1.address, fee]
  })
  if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') return null

  const poolContract = getContract({ address: poolAddress, abi: V3_POOL_ABI, client: { public: publicClient } })
  const [{ sqrtPriceX96, tick }, liquidity] = await Promise.all([
    poolContract.read.slot0(),
    poolContract.read.liquidity()
  ])

  return { address: poolAddress, sqrtPriceX96, tick, liquidity }
}

// Build Position object and compute token0/token1 amounts for given liquidity and ticks
export function computePositionAmounts(token0Meta, token1Meta, fee, tickLower, tickUpper, liquidity, sqrtPriceX96) {
  const t0 = new Token(1114, token0Meta.address, token0Meta.decimals, token0Meta.symbol)
  const t1 = new Token(1114, token1Meta.address, token1Meta.decimals, token1Meta.symbol)
  const pool = new Pool(t0, t1, fee, sqrtPriceX96.toString(), liquidity.toString(), tickLower)
  const position = new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
  const amount0 = position.amount0.toSignificant(18)
  const amount1 = position.amount1.toSignificant(18)
  return { amount0, amount1 }
}

// Full valuation: reads prices, builds pool, returns USD valuation of principal + fees owed
export async function valuePositionUSD(publicClient, backendUrl, position, token0Meta, token1Meta) {
  const { fee, tickLower, tickUpper, liquidity, tokensOwed0, tokensOwed1 } = position
  const poolOnchain = await buildPool(publicClient, token0Meta, token1Meta, fee)
  if (!poolOnchain) return { amount0: '0', amount1: '0', valueUsd: 0 }

  const { sqrtPriceX96 } = poolOnchain
  const { amount0, amount1 } = computePositionAmounts(token0Meta, token1Meta, fee, tickLower, tickUpper, liquidity, sqrtPriceX96)

  // Prices
  const [p0, p1] = await Promise.all([
    fetch(`${backendUrl}/api/price/token/${token0Meta.address}`).then(r => r.json()).catch(() => ({ price: 1 })),
    fetch(`${backendUrl}/api/price/token/${token1Meta.address}`).then(r => r.json()).catch(() => ({ price: 1 })),
  ])
  const price0 = p0?.price || 1
  const price1 = p1?.price || 1

  const principalUsd = parseFloat(amount0) * price0 + parseFloat(amount1) * price1
  const feesUsd = Number(tokensOwed0) / (10 ** token0Meta.decimals) * price0 + Number(tokensOwed1) / (10 ** token1Meta.decimals) * price1
  return { amount0, amount1, valueUsd: principalUsd + feesUsd }
}

