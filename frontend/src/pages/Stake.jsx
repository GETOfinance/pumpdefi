import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { getContract, isAddress, parseUnits, formatUnits } from 'viem'
import { toast } from 'react-hot-toast'
import { STAKING_MANAGER_ABI, ERC20_ABI } from '../config/abis'
import { CONTRACT_ADDRESSES } from '../config/chains'

const Stake = () => {
  const { isConnected, address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [stakeToken, setStakeToken] = useState('')
  const [rewardToken, setRewardToken] = useState('')
  const [amountPerPeriod, setAmountPerPeriod] = useState('0')
  const [period, setPeriod] = useState('86400') // 1 day default

  const [campaignId, setCampaignId] = useState('')
  const [fundAmount, setFundAmount] = useState('0')

  const [stakeAmount, setStakeAmount] = useState('0')
  const [lockSeconds, setLockSeconds] = useState('0')
  const [pending, setPending] = useState('0')
  const [creationFee, setCreationFee] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const mgr = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, publicClient })
        const fee = await mgr.read.CREATION_FEE()
        setCreationFee(fee)
      } catch {}
    })()
  }, [publicClient])


  const createCampaign = async () => {
    try {
      if (!walletClient) { toast.error('Connect wallet'); return }
      if (!isAddress(stakeToken) || !isAddress(rewardToken)) { toast.error('Invalid token'); return }
      const mgrWrite = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, walletClient })
      const mgrRead = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, publicClient })
      const dec = await (getContract({ address: rewardToken, abi: ERC20_ABI, publicClient }).read.decimals())
      const amt = parseUnits(amountPerPeriod, Number(dec))
      const fee = await mgrRead.read.CREATION_FEE()
      const id = await mgrWrite.write.createCampaign([stakeToken, rewardToken, amt, BigInt(period)], { value: fee })
      toast.success('Created campaign ' + id)
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Create failed')
    }
  }

  const fundCampaign = async () => {
    try {
      if (!walletClient) { toast.error('Connect wallet'); return }
      if (!campaignId) { toast.error('Enter campaign ID'); return }
      const mgr = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, walletClient })
      const info = await mgr.read.getCampaign([BigInt(campaignId)])
      const dec = await (getContract({ address: info.rewardToken, abi: ERC20_ABI, publicClient }).read.decimals())
      const amt = parseUnits(fundAmount, Number(dec))
      const erc = getContract({ address: info.rewardToken, abi: ERC20_ABI, walletClient })
      await erc.write.approve([CONTRACT_ADDRESSES.STAKING_MANAGER, amt])
      await mgr.write.fund([BigInt(campaignId), amt])
      toast.success('Funded')
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Fund failed')
    }
  }

  const doStake = async () => {
    try {
      if (!walletClient) { toast.error('Connect wallet'); return }
      if (!campaignId) { toast.error('Enter campaign ID'); return }
      const mgr = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, walletClient })
      const info = await mgr.read.getCampaign([BigInt(campaignId)])
      const dec = await (getContract({ address: info.stakeToken, abi: ERC20_ABI, publicClient }).read.decimals())
      const amt = parseUnits(stakeAmount, Number(dec))
      const erc = getContract({ address: info.stakeToken, abi: ERC20_ABI, walletClient })
      await erc.write.approve([CONTRACT_ADDRESSES.STAKING_MANAGER, amt])
      await mgr.write.stake([BigInt(campaignId), amt, BigInt(lockSeconds || '0')])
      toast.success('Staked')
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Stake failed')
    }
  }

  const doUnstake = async () => {
    try {
      if (!walletClient) { toast.error('Connect wallet'); return }
      const mgr = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, walletClient })
      const info = await mgr.read.getCampaign([BigInt(campaignId)])
      const dec = await (getContract({ address: info.stakeToken, abi: ERC20_ABI, publicClient }).read.decimals())
      const amt = parseUnits(stakeAmount, Number(dec))
      await mgr.write.unstake([BigInt(campaignId), amt])
      toast.success('Unstaked')
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Unstake failed')
    }
  }

  const doClaim = async () => {
    try {
      if (!walletClient) { toast.error('Connect wallet'); return }
      const mgr = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, walletClient })
      await mgr.write.claim([BigInt(campaignId)])
      toast.success('Claimed')
    } catch (e) {
      console.error(e)
      toast.error(e?.shortMessage || e?.message || 'Claim failed')
    }
  }

  const checkPending = async () => {
    try {
      const mgr = getContract({ address: CONTRACT_ADDRESSES.STAKING_MANAGER, abi: STAKING_MANAGER_ABI, publicClient })
      const p = await mgr.read.pendingReward([BigInt(campaignId), address])
      setPending(p.toString())
    } catch {}
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-bold gradient-text">Stake</h1>

      <div className="card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Create Campaign</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="input" placeholder="Stake token address" value={stakeToken} onChange={e=>setStakeToken(e.target.value)} />
          <input className="input" placeholder="Reward token address" value={rewardToken} onChange={e=>setRewardToken(e.target.value)} />
          <input className="input" placeholder="Amount per period (reward token units)" value={amountPerPeriod} onChange={e=>setAmountPerPeriod(e.target.value)} />
          <select className="input" value={period} onChange={e=>setPeriod(e.target.value)}>
            <option value="3600">Hourly</option>
            <option value="86400">Daily</option>
          </select>
        </div>
        <div className="text-xs text-gray-500">
          Fee: {creationFee ? `${formatUnits(creationFee, 18)} CORE` : '...'} (sent to StakingManager owner)
        </div>
        <button className="btn btn-primary" onClick={createCampaign}>Create</button>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Fund Campaign</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="input" placeholder="Campaign ID" value={campaignId} onChange={e=>setCampaignId(e.target.value)} />
          <input className="input" placeholder="Fund amount (reward token units)" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} />
          <button className="btn btn-secondary" onClick={fundCampaign}>Fund</button>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Stake / Claim / Unstake</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <input className="input" placeholder="Campaign ID" value={campaignId} onChange={e=>setCampaignId(e.target.value)} />
          <input className="input" placeholder="Stake amount (stake token units)" value={stakeAmount} onChange={e=>setStakeAmount(e.target.value)} />
          <input className="input" placeholder="Lock seconds (optional)" value={lockSeconds} onChange={e=>setLockSeconds(e.target.value)} />
          <button className="btn btn-primary" onClick={doStake}>Stake</button>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={doClaim}>Claim</button>
          <button className="btn btn-outline" onClick={doUnstake}>Unstake</button>
          <button className="btn btn-outline" onClick={checkPending}>Check Pending</button>
          <div className="text-gray-400">Pending: {pending}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500">Note: Rewards stream continuously based on an hourly or daily rate; creator must keep the contract funded. Locking prevents unstake until the set time.</div>
    </div>
  )
}

export default Stake

