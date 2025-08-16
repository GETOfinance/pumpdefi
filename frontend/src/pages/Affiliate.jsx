import { useMemo, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Copy, Share2, Users, PlusCircle, Coins } from 'lucide-react'
import WalletConnectButton from '../components/WalletConnectButton'
import { API_CONFIG, CONTRACT_ADDRESSES } from '../config/chains'
import { getContract, isAddress, parseUnits } from 'viem'
import { AFFILIATE_MANAGER_ABI, ERC20_ABI } from '../config/abis'
import AffiliateStatusCard from './AffiliateStatusCard'

const Affiliate = () => {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [token, setToken] = useState('')
  const [amount, setAmount] = useState('0')
  const [decimals, setDecimals] = useState(18)
  const [campaignId, setCampaignId] = useState(null)

  const referralLink = useMemo(() => {
    const base = window.location.origin
    const ref = address || ''
    const cid = campaignId ? `&campaign=${campaignId}` : ''
    return `${base}/launchpad?ref=${ref}${cid}`
  }, [address, campaignId])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast.success('Referral link copied')
    } catch (e) {
      toast.error('Failed to copy link')
    }
  }

  const simulateVisit = async () => {
    if (!address) return
    try {
      const res = await axios.get(`${API_CONFIG.BACKEND_URL}/api/affiliate/visit`, { params: { ref: address } })
      if (res.data?.success) {
        toast.success('Visit tracked')
      }
    } catch (e) {
      toast.error('Failed to track visit')
    }
  }

  const createCampaign = async () => {
    try {
      if (!walletClient) { toast.error('Connect wallet'); return }
      if (!isAddress(token)) { toast.error('Invalid token'); return }
      const affiliateWrite = getContract({ address: CONTRACT_ADDRESSES.AFFILIATE_MANAGER, abi: AFFILIATE_MANAGER_ABI, walletClient })
      const affiliateRead = getContract({ address: CONTRACT_ADDRESSES.AFFILIATE_MANAGER, abi: AFFILIATE_MANAGER_ABI, publicClient })
      // fetch token decimals
      let dec = decimals
      try {
        const erc = getContract({ address: token, abi: ERC20_ABI, publicClient })
        const d = await erc.read.decimals()
        dec = Number(d)
        setDecimals(dec)
      } catch {}
      const amt = parseUnits(amount, dec)
      const nextId = await affiliateRead.read.nextId()
      const fee = await affiliateRead.read.CREATION_FEE()
      await affiliateWrite.write.createCampaign([token, amt], { value: fee })
      setCampaignId(Number(nextId))
      toast.success('Campaign created: ' + nextId)
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Create failed')
    }
  }

  const fundCampaign = async () => {
    try {
      if (!walletClient) { toast.error('Connect wallet'); return }
      if (!campaignId) { toast.error('No campaign'); return }
      if (!isAddress(token)) { toast.error('Invalid token'); return }
      const amt = parseUnits(amount, decimals)
      const affiliate = getContract({ address: CONTRACT_ADDRESSES.AFFILIATE_MANAGER, abi: AFFILIATE_MANAGER_ABI, walletClient })
      const erc = getContract({ address: token, abi: ERC20_ABI, walletClient })
      await erc.write.approve([CONTRACT_ADDRESSES.AFFILIATE_MANAGER, amt])
      await affiliate.write.fund([BigInt(campaignId), amt])
      toast.success('Campaign funded')
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Fund failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Affiliate</h1>
        <p className="text-gray-400">Create a campaign, fund it with your token, and share your link. Ref wallet receives rewards automatically after buys.</p>
      </div>

      {!isConnected ? (
        <div className="text-center py-16 card">
          <p className="text-gray-300 mb-6">Connect your wallet to get your referral link.</p>
          <WalletConnectButton className="btn btn-primary" text="Connect Wallet" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-3">Create Campaign</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <input className="input" placeholder="Token address" value={token} onChange={e => setToken(e.target.value)} />
              <input className="input" placeholder="Reward amount (token units)" value={amount} onChange={e => setAmount(e.target.value)} />
              <button className="btn btn-primary" onClick={createCampaign}><PlusCircle className="h-4 w-4 mr-2" /> Create</button>
            </div>
            <div className="text-xs text-gray-500">A creation fee of 5 CORE will be charged and sent to the AffiliateManager owner.</div>
            <div className="grid md:grid-cols-3 gap-3">
              <input className="input" placeholder="Campaign ID" value={campaignId || ''} onChange={e => setCampaignId(e.target.value)} />
              <input className="input" placeholder="Fund amount (token units)" value={amount} onChange={e => setAmount(e.target.value)} />
              <button className="btn btn-secondary" onClick={fundCampaign}><Coins className="h-4 w-4 mr-2" /> Fund</button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Your Referral Link</h2>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="flex-1 bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3 font-mono text-sm text-gray-300 break-all">
                {referralLink}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={copyLink}><Copy className="h-4 w-4 mr-2" /> Copy</button>
                <button className="btn btn-outline" onClick={() => { navigator.share ? navigator.share({ url: referralLink }) : copyLink() }}><Share2 className="h-4 w-4 mr-2" /> Share</button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Share /launchpad?ref=YOU&campaign=ID so buys trigger rewards to the ref wallet.</div>
          </div>

          <div className="card p-6">
            <AffiliateStatusCard />
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Stats (Demo)</h2>
            <p className="text-gray-400 text-sm mb-3">Clicks tracked server-side. Rewards are on-chain via AffiliateManager.</p>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={simulateVisit}>Simulate Referral Visit</button>
            </div>
          </div>
          </div>
      )}
    </div>
)
}

export default Affiliate
