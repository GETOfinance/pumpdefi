const express = require('express')
const { ethers } = require('ethers')
const router = express.Router()

const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network')

const ADDR = {
  TOKEN_FACTORY: process.env.TOKEN_FACTORY_ADDRESS,
  POOL_FACTORY: process.env.POOL_FACTORY_ADDRESS,
  BONDING_FACTORY: process.env.BONDING_FACTORY_ADDRESS,
  WCORE: process.env.WCORE_ADDRESS,
}

const TOKEN_FACTORY_ABI = [
  'function getTokenCount() view returns (uint256)'
]
const POOL_FACTORY_ABI = [
  'function allPoolsLength() view returns (uint256)',
  'function allPools(uint256) view returns (address)'
]
const POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
]
const BONDING_FACTORY_ABI = [
  'function allSalesLength() view returns (uint256)',
  'function getSales(uint256 start,uint256 count) view returns (address[])'
]

router.get('/overview', async (req, res) => {
  try {
    const tf = ADDR.TOKEN_FACTORY ? new ethers.Contract(ADDR.TOKEN_FACTORY, TOKEN_FACTORY_ABI, provider) : null
    const pf = ADDR.POOL_FACTORY ? new ethers.Contract(ADDR.POOL_FACTORY, POOL_FACTORY_ABI, provider) : null
    const bf = ADDR.BONDING_FACTORY ? new ethers.Contract(ADDR.BONDING_FACTORY, BONDING_FACTORY_ABI, provider) : null

    const [tokenCount, poolCount, salesCount] = await Promise.all([
      tf ? tf.getTokenCount() : 0,
      pf ? pf.allPoolsLength() : 0,
      bf ? bf.allSalesLength() : 0,
    ])

    // Top pools by WCORE liquidity (up to 10)
    const topPools = []
    if (pf) {
      const len = Number(poolCount)
      const count = Math.min(len, 10)
      const addrs = []
      for (let i = 0; i < count; i++) addrs.push(pf.allPools(i))
      const pools = await Promise.all(addrs)
      const details = await Promise.all(pools.map(async (pool) => {
        try {
          const p = new ethers.Contract(pool, POOL_ABI, provider)
          const [t0, t1, reserves] = await Promise.all([p.token0(), p.token1(), p.getReserves()])
          const reserve0 = reserves[0]; const reserve1 = reserves[1]
          let wcoreLiquidity = 0n
          if (ADDR.WCORE && (t0.toLowerCase() === ADDR.WCORE.toLowerCase())) {
            wcoreLiquidity = reserve0 * 2n
          } else if (ADDR.WCORE && (t1.toLowerCase() === ADDR.WCORE.toLowerCase())) {
            wcoreLiquidity = reserve1 * 2n
          }
          return { pool, token0: t0, token1: t1, wcoreLiquidity: wcoreLiquidity.toString() }
        } catch (e) {
          return null
        }
      }))
      details.filter(Boolean).sort((a,b)=> BigInt(b.wcoreLiquidity) - BigInt(a.wcoreLiquidity)).slice(0,5).forEach(x=>topPools.push(x))
    }

    res.json({ success: true, tokenCount: Number(tokenCount), poolCount: Number(poolCount), salesCount: Number(salesCount), topPools })
  } catch (e) {
    console.error('analytics/overview error', e)
    res.status(500).json({ success: false, error: 'Failed to load analytics', message: e.message })
  }
})

module.exports = router

