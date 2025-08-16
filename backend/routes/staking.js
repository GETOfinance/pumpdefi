const express = require('express')
const { ethers } = require('ethers')
const router = express.Router()

const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network')

const STAKING_MANAGER_ABI = [
  'function nextId() view returns (uint256)',
  'function getCampaign(uint256 id) view returns (tuple(address creator,address stakeToken,address rewardToken,uint256 amountPerPeriod,uint256 periodSeconds,uint256 rewardPerSec,uint256 accRewardPerShare,uint256 lastRewardTime,uint256 totalStaked,bool active))',
  'function users(uint256 id, address user) view returns (uint256 amount, uint256 rewardDebt, uint256 lockedUntil)',
  'function pendingReward(uint256 id, address account) view returns (uint256)'
]

const ADDR = {
  STAKING_MANAGER: process.env.STAKING_MANAGER_ADDRESS
}

router.get('/campaign/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id)
    if (!ADDR.STAKING_MANAGER) return res.status(503).json({ success: false, error: 'No staking contract' })
    const mgr = new ethers.Contract(ADDR.STAKING_MANAGER, STAKING_MANAGER_ABI, provider)
    const info = await mgr.getCampaign(id)
    res.json({ success: true, info })
  } catch (e) {
    console.error('staking campaign', e)
    res.status(500).json({ success: false, error: e.message })
  }
})

router.get('/user/:id/:address', async (req, res) => {
  try {
    const id = BigInt(req.params.id)
    const address = req.params.address
    if (!ethers.isAddress(address)) return res.status(400).json({ success: false, error: 'Bad address' })
    if (!ADDR.STAKING_MANAGER) return res.status(503).json({ success: false, error: 'No staking contract' })
    const mgr = new ethers.Contract(ADDR.STAKING_MANAGER, STAKING_MANAGER_ABI, provider)
    const user = await mgr.users(id, address)
    const pending = await mgr.pendingReward(id, address)
    res.json({ success: true, user, pending: pending.toString() })
  } catch (e) {
    console.error('staking user', e)
    res.status(500).json({ success: false, error: e.message })
  }
})

module.exports = router

