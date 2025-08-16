const express = require('express')
const { ethers } = require('ethers')
const fs = require('fs')
const path = require('path')
const router = express.Router()

// Persistent storage (JSON file). Replace with DB in production.
const dataDir = path.join(__dirname, '..', 'data')
const dataFile = path.join(dataDir, 'affiliate.json')
function ensureStore() {
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }) } catch {}
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ visits: {}, conversions: {}, volumes: {}, rewards: {} }, null, 2))
}
function loadStore() {
  ensureStore()
  try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')) } catch { return { visits: {}, conversions: {}, volumes: {}, rewards: {} } }
}
function saveStore(store) {
  try { fs.writeFileSync(dataFile, JSON.stringify(store, null, 2)) } catch (e) { console.error('affiliate store save error', e) }
}

const store = loadStore()
const visits = new Map(Object.entries(store.visits || {}))
const conversions = new Map(Object.entries(store.conversions || {}))
const volumes = new Map(Object.entries(store.volumes || {}).map(([k, v]) => [k, BigInt(v)]))
const rewards = new Map(Object.entries(store.rewards || {}).map(([k, v]) => [k, BigInt(v)]))

function persist() {
  saveStore({
    visits: Object.fromEntries(visits),
    conversions: Object.fromEntries(conversions),
    volumes: Object.fromEntries(Array.from(volumes.entries()).map(([k, v]) => [k, v.toString()])),
    rewards: Object.fromEntries(Array.from(rewards.entries()).map(([k, v]) => [k, v.toString()])),
  })
}

// Track a referral visit: /api/affiliate/visit?ref=0x...
router.get('/visit', async (req, res) => {
  try {
    const { ref } = req.query
    if (!ref || !ethers.isAddress(ref)) return res.status(400).json({ success: false, error: 'Invalid ref' })
    const key = ref.toLowerCase()
    visits.set(key, (visits.get(key) || 0) + 1)
    persist()
    res.json({ success: true, ref: key, visits: visits.get(key) })
  } catch (e) {
    console.error('affiliate/visit error', e)
    res.status(500).json({ success: false, error: 'Failed to track visit', message: e.message })
  }
})

// Track a conversion (e.g., a buy): body { ref, amountWei, sale }
router.post('/convert', async (req, res) => {
  try {
    const { ref, amountWei, sale } = req.body || {}
    if (!ref || !ethers.isAddress(ref)) return res.status(400).json({ success: false, error: 'Invalid ref' })
    if (!amountWei || isNaN(Number(amountWei))) return res.status(400).json({ success: false, error: 'Invalid amount' })
    const key = ref.toLowerCase()
    const amt = BigInt(amountWei)
    conversions.set(key, (conversions.get(key) || 0) + 1)
    volumes.set(key, (volumes.get(key) || 0n) + amt)
    // Placeholder rewards calc (0 for now). Replace with real formula later.
    rewards.set(key, rewards.get(key) || 0n)
    persist()
    res.json({ success: true, ref: key, conversions: conversions.get(key), volumeWei: volumes.get(key).toString(), sale })
  } catch (e) {
    console.error('affiliate/convert error', e)
    res.status(500).json({ success: false, error: 'Failed to track conversion', message: e.message })
  }
})

// Get affiliate stats for an address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params
    if (!ethers.isAddress(address)) return res.status(400).json({ success: false, error: 'Invalid address' })
    const key = address.toLowerCase()
    const clicks = visits.get(key) || 0
    const signups = conversions.get(key) || 0
    const volumeWei = (volumes.get(key) || 0n).toString()
    const rewardsWei = (rewards.get(key) || 0n).toString()
    res.json({ success: true, address, clicks, signups, volumeWei, rewardsWei })
  } catch (e) {
    console.error('affiliate/:address error', e)
    res.status(500).json({ success: false, error: 'Failed to load affiliate stats', message: e.message })
  }
})

module.exports = router

