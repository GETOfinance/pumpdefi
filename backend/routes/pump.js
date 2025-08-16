const express = require('express')
const { ethers } = require('ethers')
const router = express.Router()

const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network')

const BONDING_FACTORY = process.env.BONDING_FACTORY_ADDRESS || ''

const BONDING_FACTORY_ABI = [
  'event SaleCreated(address indexed sale, address indexed token, address indexed creator)',
  'function allSalesLength() view returns (uint256)',
  'function getSales(uint256 start,uint256 count) view returns (address[])',
  'function getCreatorSales(address creator) view returns (address[])'
]

const BONDING_SALE_ABI = [
  'function token() view returns (address)',
  'function startTime() view returns (uint256)',
  'function endTime() view returns (uint256)',
  'function basePrice() view returns (uint256)',
  'function slope() view returns (uint256)',
  'function totalForSale() view returns (uint256)',
  'function totalSold() view returns (uint256)',
  'function totalRaised() view returns (uint256)'
]

router.get('/sales', async (req, res) => {
  try {
    if (!BONDING_FACTORY) {
      return res.status(503).json({ error: 'Factory not configured' })
    }
    const factory = new ethers.Contract(BONDING_FACTORY, BONDING_FACTORY_ABI, provider)
    const len = Number(await factory.allSalesLength())
    if (!len) return res.json({ success: true, count: 0, sales: [] })

    const addresses = await factory.getSales(0, len)
    const items = await Promise.all(addresses.map(async (addr) => {
      const c = new ethers.Contract(addr, BONDING_SALE_ABI, provider)
      const [token, startTime, endTime, basePrice, slope, totalForSale, totalSold, totalRaised] = await Promise.all([
        c.token(), c.startTime(), c.endTime(), c.basePrice(), c.slope(), c.totalForSale(), c.totalSold(), c.totalRaised()
      ])
      return { sale: addr, token, startTime: Number(startTime), endTime: Number(endTime), basePrice: basePrice.toString(), slope: slope.toString(), totalForSale: totalForSale.toString(), totalSold: totalSold.toString(), totalRaised: totalRaised.toString() }
    }))

    res.json({ success: true, count: items.length, sales: items })
  } catch (e) {
    console.error('pump/sales error', e)
    res.status(500).json({ error: 'Failed to list sales', message: e.message })
  }
})

router.get('/sales/:sale', async (req, res) => {
  try {
    const { sale } = req.params
    if (!ethers.isAddress(sale)) return res.status(400).json({ error: 'Invalid sale address' })

    const c = new ethers.Contract(sale, BONDING_SALE_ABI, provider)
    const [token, startTime, endTime, basePrice, slope, totalForSale, totalSold, totalRaised] = await Promise.all([
      c.token(), c.startTime(), c.endTime(), c.basePrice(), c.slope(), c.totalForSale(), c.totalSold(), c.totalRaised()
    ])

    res.json({ success: true, sale, token, startTime: Number(startTime), endTime: Number(endTime), basePrice: basePrice.toString(), slope: slope.toString(), totalForSale: totalForSale.toString(), totalSold: totalSold.toString(), totalRaised: totalRaised.toString() })
  } catch (e) {
    console.error('pump/sales/:sale error', e)
    res.status(500).json({ error: 'Failed to get sale', message: e.message })
  }
})

module.exports = router
