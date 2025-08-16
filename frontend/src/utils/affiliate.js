import axios from 'axios'
import { API_CONFIG } from '../config/chains'

const REF_KEY = 'pumpdefi_ref'
const CAMPAIGN_KEY = 'pumpdefi_campaign'

export const storeReferral = (ref, campaign) => {
  try {
    if (ref) localStorage.setItem(REF_KEY, ref)
    if (campaign != null) localStorage.setItem(CAMPAIGN_KEY, String(campaign))
  } catch {}
}

export const getStoredReferral = () => {
  try {
    const ref = localStorage.getItem(REF_KEY)
    const campaignStr = localStorage.getItem(CAMPAIGN_KEY)
    const campaign = campaignStr ? BigInt(campaignStr) : null
    return { ref, campaign }
  } catch {
    return { ref: null, campaign: null }
  }
}

export const captureVisit = async (ref) => {
  try {
    if (!ref) return
    await axios.get(`${API_CONFIG.BACKEND_URL}/api/affiliate/visit`, { params: { ref } })
  } catch (e) {
    // silent fail
  }
}

export const captureConversion = async ({ ref, amountWei, sale }) => {
  try {
    if (!ref || !amountWei) return
    await axios.post(`${API_CONFIG.BACKEND_URL}/api/affiliate/convert`, { ref, amountWei, sale })
  } catch (e) {
    // silent fail
  }
}

export const getAffiliateStats = async (address) => {
  try {
    const res = await axios.get(`${API_CONFIG.BACKEND_URL}/api/affiliate/${address}`)
    return res.data
  } catch (e) {
    return { success: false, error: e?.message }
  }
}

