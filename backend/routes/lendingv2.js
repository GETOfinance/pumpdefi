const express = require('express')
const { ethers } = require('ethers')
const router = express.Router()

const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || process.env.RPC_URL || 'https://rpc.test2.btcs.network')

const LENDING_POOL_ABI = [
  'function getReserves() view returns (address[])',
  'function getReserveData(address asset) view returns (address,address,address,uint8,uint256,uint256,uint40,uint256,uint16,uint16,uint16,uint16,uint256,uint256,uint256,uint256,bool)',
  'function getUserAccountData(address user) view returns (uint256 collateralUsd, uint256 debtUsd, uint256 healthFactor)',
]

const A_TOKEN_ABI = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
]

const ADDR = {
  POOL: process.env.LENDING_POOL_ADDRESS,
}

const RAY = ethers.parseUnits('1', 27)

function rayMul(a, b) { return (a * b) / RAY }

function toNumber(x, decimals = 18) {
  try { return Number(ethers.formatUnits(x, decimals)) } catch { return 0 }
}

router.get('/markets', async (req, res) => {
  try {
    if (!ADDR.POOL) return res.status(503).json({ success: false, error: 'No pool address configured' })
    const pool = new ethers.Contract(ADDR.POOL, LENDING_POOL_ABI, provider)
    const assets = await pool.getReserves()
    const rows = []
    for (const asset of assets) {
      const r = await pool.getReserveData(asset)
      const [ _asset, aToken, _debtToken, _dec, liquidityIndex, borrowIndex, _last, totalDebtScaled, ltvBps, ltBps, lbBps, reserveFactorBps, base, slope1, slope2, kink, active ] = r
      const a = new ethers.Contract(aToken, A_TOKEN_ABI, provider)
      const aSupplyShares = await a.totalSupply()
      const liquidityUnderlying = (aSupplyShares * liquidityIndex) / RAY
      const debtUnderlying = (totalDebtScaled * borrowIndex) / RAY
      const utilizationRay = liquidityUnderlying === 0n ? 0n : (debtUnderlying * RAY) / liquidityUnderlying
      // IR model
      const U = utilizationRay
      const baseRay = base
      const slope1Ray = slope1
      const slope2Ray = slope2
      const kinkRay = kink
      let borrowRateRay
      if (U <= kinkRay) borrowRateRay = baseRay + (slope1Ray * U) / kinkRay
      else borrowRateRay = baseRay + slope1Ray + (slope2Ray * (U - kinkRay)) / (RAY - kinkRay)
      const reserveFactorRay = BigInt(reserveFactorBps) * 10n ** 23n
      const supplyRateRay = rayMul(rayMul(borrowRateRay, U), (RAY - reserveFactorRay))
      // APRs
      const borrowApr = Number(borrowRateRay) / Number(RAY)
      const supplyApr = Number(supplyRateRay) / Number(RAY)
      rows.push({
        asset,
        aToken,
        decimals: Number(_dec),
        active,
        liquidity: toNumber(liquidityUnderlying),
        debt: toNumber(debtUnderlying),
        utilization: Number(U) / Number(RAY),
        params: { ltvBps: Number(ltvBps), liqThresholdBps: Number(ltBps), liqBonusBps: Number(lbBps), reserveFactorBps: Number(reserveFactorBps) },
        rates: { supplyApr, borrowApr }
      })
    }
    res.json({ success: true, markets: rows })
  } catch (e) {
    console.error('markets', e)
    res.status(500).json({ success: false, error: e.message })
  }
})

router.get('/positions/:address', async (req, res) => {
  try {
    const user = req.params.address
    if (!ethers.isAddress(user)) return res.status(400).json({ success: false, error: 'Bad address' })
    if (!ADDR.POOL) return res.status(503).json({ success: false, error: 'No pool address configured' })
    const pool = new ethers.Contract(ADDR.POOL, LENDING_POOL_ABI, provider)
    const assets = await pool.getReserves()
    const userReserves = []
    for (const asset of assets) {
      const r = await pool.getReserveData(asset)
      const [ , aToken, , , liquidityIndex ] = r
      const a = new ethers.Contract(aToken, A_TOKEN_ABI, provider)
      const shares = await a.balanceOf(user)
      const supplied = (shares * liquidityIndex) / RAY
      userReserves.push({ asset, aToken, supplied: supplied.toString() })
    }
    const account = await pool.getUserAccountData(user)
    const accountData = {
      collateralUsd: account[0].toString(),
      debtUsd: account[1].toString(),
      healthFactor: account[2].toString()
    }
    res.json({ success: true, reserves: userReserves, account: accountData })
  } catch (e) {
    console.error('positions', e)
    res.status(500).json({ success: false, error: e.message })
  }
})

module.exports = router

