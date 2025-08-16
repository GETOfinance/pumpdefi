import { useState, useEffect } from 'react'
import { useAccount, useBalance, useWaitForTransaction, usePublicClient } from 'wagmi'
import { parseEther, parseUnits, formatUnits, isAddress } from 'viem'
import { toast } from 'react-hot-toast'
import { ArrowLeftRight, Settings, Loader2, ChevronDown } from 'lucide-react'
import { useDEXOperations, useWCOREOperations, useTokenOperations } from '../hooks/useContracts'
import { CONTRACT_ADDRESSES } from '../config/chains'
import WalletConnectButton from '../components/WalletConnectButton'
import { tokenListManager } from '../config/tokens'
import { useDeployedTokens } from '../hooks/useDeployedTokens'
import { getContract } from 'viem'
import { ERC20_ABI } from '../config/abis'

const Swap = () => {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { swapTokens, getAmountsOut, swapExactCOREForTokens, swapExactTokensForCORE } = useDEXOperations()
  const { deposit, withdraw } = useWCOREOperations()
  const { approveToken } = useTokenOperations()

  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [fromToken, setFromToken] = useState({
    address: 'CORE',
    symbol: 'CORE',
    name: 'Core',
    decimals: 18,
    logoURI: ''
  })
  const [toToken, setToToken] = useState({
    address: CONTRACT_ADDRESSES.WCORE,
    symbol: 'WCORE',
    name: 'Wrapped Core',
    decimals: 18,
    logoURI: ''
  })
  const [isSwapping, setIsSwapping] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [approvalTxHash, setApprovalTxHash] = useState(null)
  const [slippage, setSlippage] = useState(0.5)
  const [showTokenSelector, setShowTokenSelector] = useState(null)
  const [priceImpact, setPriceImpact] = useState(0)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [swapPath, setSwapPath] = useState([])
  const [routeInfo, setRouteInfo] = useState(null) // { path, expectedOut, minOut }
  const [quoteError, setQuoteError] = useState('')
  const [pendingImportToken, setPendingImportToken] = useState(null)
  const [showImportConfirm, setShowImportConfirm] = useState(false)


  // Dynamic token list: default + deployed tokens + custom
  const { tokens: deployedTokens } = useDeployedTokens()
  const tokenList = [
    { address: 'CORE', symbol: 'CORE', name: 'Core', decimals: 18, logoURI: '' },
    { address: CONTRACT_ADDRESSES.WCORE, symbol: 'WCORE', name: 'Wrapped Core', decimals: 18, logoURI: '' },
    ...deployedTokens,
    ...tokenListManager.getAllTokens().filter(t => t.address !== 'CORE' && t.address.toLowerCase() !== CONTRACT_ADDRESSES.WCORE.toLowerCase())
  ]

  // Robust ERC20 metadata fetch with bytes32 fallbacks
  const hexToAscii = (hex) => {
    try {
      const str = (hex || '').startsWith('0x') ? hex.slice(2) : (hex || '')
      let out = ''
      for (let i = 0; i < str.length; i += 2) {
        const code = parseInt(str.slice(i, i + 2), 16)
        if (!code) break
        out += String.fromCharCode(code)
      }
      return out
    } catch {
      return ''
    }
  }

  const ERC20_BYTES32_ABI = [
    { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
    { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  ]

  const fetchTokenMetadata = async (addr) => {
    let symbol = '', name = '', decimals = 18
    try {
      symbol = await publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: 'symbol' })
    } catch {}
    if (!symbol) {
      try {
        const symB32 = await publicClient.readContract({ address: addr, abi: ERC20_BYTES32_ABI, functionName: 'symbol' })
        symbol = hexToAscii(symB32)
      } catch {}
    }

    try {
      name = await publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: 'name' })
    } catch {}
    if (!name) {
      try {
        const nameB32 = await publicClient.readContract({ address: addr, abi: ERC20_BYTES32_ABI, functionName: 'name' })
        name = hexToAscii(nameB32)
      } catch {}
    }

    try {
      const dec = await publicClient.readContract({ address: addr, abi: ERC20_ABI, functionName: 'decimals' })
      decimals = Number(dec) || 18
    } catch {}

    return { symbol: symbol || 'TKN', name: name || 'Unknown Token', decimals }
  }

  const { data: fromBalance } = useBalance({
    address: address,
    token: fromToken.address === 'CORE' ? undefined : fromToken.address,
    enabled: !!address,
  })

  const { data: toBalance } = useBalance({
    address: address,
    token: toToken.address === 'CORE' ? undefined : toToken.address,
    enabled: !!address,
  })

  const { isLoading: isWaitingForTx, isSuccess: txSuccess } = useWaitForTransaction({
    hash: txHash,
    enabled: !!txHash,
  })

  const { isLoading: isWaitingForApproval, isSuccess: approvalSuccess } = useWaitForTransaction({
    hash: approvalTxHash,
    enabled: !!approvalTxHash,
  })

  // Handle successful transaction
  useEffect(() => {
    if (txSuccess) {
      toast.success('Swap completed successfully!')
      setIsSwapping(false)
      setTxHash(null)
      setFromAmount('')
      setToAmount('')
    }
  }, [txSuccess])

  // Handle successful approval
  useEffect(() => {
    if (approvalSuccess && approvalTxHash && !txHash) {
      toast.success('Token approved! Proceeding with swap...')
      setIsApproving(false)
      setNeedsApproval(false)
      // Proceed with the actual swap
      executeSwap()
    }
  }, [approvalSuccess, approvalTxHash, txHash])

  const handleTokenSelect = async (token, type) => {
    // If user pasted an address, or selected a token without decimals/name/symbol, auto-detect
    let selected = token
    if (token.address && token.address.startsWith('0x') && (!token.decimals || !token.symbol)) {
      try {
        const meta = await fetchTokenMetadata(token.address)
        selected = { ...token, ...meta }
        // Show import confirmation before adding a brand-new token
        setPendingImportToken({ token: selected, side: type })
        setShowImportConfirm(true)
        return
      } catch {
        // leave as-is if read fails
      }
    }

    if (type === 'from') {
      setFromToken(selected)
    } else {
      setToToken(selected)
    }
    setShowTokenSelector(null)
  }

  const handleSwapTokens = () => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  // Calculate output amount when input changes
  useEffect(() => {
    if (fromAmount && fromToken && toToken && parseFloat(fromAmount) > 0) {
      calculateOutputAmount()
    } else {
      setToAmount('')
    }
  }, [fromAmount, fromToken, toToken])

  const calculateOutputAmount = async () => {
    try {
      if (fromToken.address === 'CORE' && toToken.address === CONTRACT_ADDRESSES.WCORE) {
        setToAmount(fromAmount)
        setPriceImpact(0)
        setNeedsApproval(false)
      } else if (fromToken.address === CONTRACT_ADDRESSES.WCORE && toToken.address === 'CORE') {
        setToAmount(fromAmount)
        setPriceImpact(0)
        setNeedsApproval(false) // unwrap WCORE -> CORE doesn't need approval
      } else {
        const amountIn = parseUnits(fromAmount, fromToken.decimals || 18)
        let path

        if (fromToken.address === 'CORE') {
          path = [CONTRACT_ADDRESSES.WCORE, toToken.address]
          setNeedsApproval(false)
        } else if (toToken.address === 'CORE') {
          path = [fromToken.address, CONTRACT_ADDRESSES.WCORE]
          setNeedsApproval(true)
        } else {
          path = [fromToken.address, toToken.address]
          setNeedsApproval(true)
        }
        setSwapPath(path)

        const amounts = await getAmountsOut(amountIn, path)
        if (!amounts || amounts.length < 2) {
          setQuoteError('Route unavailable or insufficient liquidity for this pair.')
          setToAmount('')
          setRouteInfo(null)
          return
        }
        setQuoteError('')
        const expectedOut = amounts[amounts.length - 1]
        const outputAmount = formatUnits(expectedOut, toToken.decimals || 18)
        setToAmount(outputAmount)
        const bps = BigInt(Math.floor((Number(slippage) || 0.5) * 100))
        const minOut = expectedOut - (expectedOut * bps) / 10000n
        setRouteInfo({ path, expectedOut: outputAmount, minOut: formatUnits(minOut, toToken.decimals || 18) })

        const expectedInput = parseFloat(fromAmount)
        const actualOutput = parseFloat(outputAmount)
        const impact = expectedInput > 0 ? ((expectedInput - actualOutput) / expectedInput) * 100 : 0
        setPriceImpact(Math.max(0, impact))
      }
    } catch (error) {
      console.error('Error calculating output amount:', error)
      setToAmount('')
      setPriceImpact(0)
    }
  }

  const handleSwap = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!fromAmount || !toAmount) {
      toast.error('Please enter an amount')
      return
    }

    // Check if we need approval first
    if (needsApproval && fromToken.address !== 'CORE' && fromToken.address !== CONTRACT_ADDRESSES.WCORE) {
      try {
        setIsApproving(true)
        toast.loading('Approving token...', { id: 'approval' })

        const amountIn = parseEther(fromAmount)
        const tx = await approveToken(fromToken.address, amountIn, CONTRACT_ADDRESSES.SWAP_ROUTER)
        setApprovalTxHash(tx)

        toast.success('Approval submitted!', { id: 'approval' })
      } catch (error) {
        console.error('Error approving token:', error)
        setIsApproving(false)
        toast.error('Token approval failed', { id: 'approval' })
      }
    } else {
      // No approval needed, proceed directly with swap
      executeSwap()
    }
  }

  const executeSwap = async () => {
    setIsSwapping(true)

    try {
      let tx

      if (fromToken.address === 'CORE' && toToken.address === CONTRACT_ADDRESSES.WCORE) {
        // Wrap CORE to WCORE
        tx = await deposit(parseEther(fromAmount))
      } else if (fromToken.address === CONTRACT_ADDRESSES.WCORE && toToken.address === 'CORE') {
        // Unwrap WCORE to CORE
        tx = await withdraw(parseEther(fromAmount))
      } else {
        // DEX swaps with precise integer slippage math
        const amountIn = parseUnits(fromAmount, fromToken.decimals || 18)
        let path
        if (fromToken.address === 'CORE') {
          path = [CONTRACT_ADDRESSES.WCORE, toToken.address]
        } else if (toToken.address === 'CORE') {
          path = [fromToken.address, CONTRACT_ADDRESSES.WCORE]
        } else {
          path = [fromToken.address, toToken.address]
        }
        // compute expectedOut and minOut using getAmountsOut
        const amounts = await getAmountsOut(amountIn, path)
        if (!amounts || amounts.length < 2) throw new Error('Route unavailable or insufficient liquidity')
        const expectedOut = amounts[amounts.length - 1]
        const bps = BigInt(Math.floor((Number(slippage) || 0.5) * 100)) // e.g., 0.5 -> 50 bps
        const amountOutMin = expectedOut - (expectedOut * bps) / 10000n
        const deadline = Math.floor(Date.now() / 1000) + 1200 // 20 minutes

        if (fromToken.address === 'CORE') {
          // CORE to Token swap
          tx = await swapExactCOREForTokens(amountIn, amountOutMin, path, address, deadline)
        } else if (toToken.address === 'CORE') {
          // Token to CORE swap
          tx = await swapExactTokensForCORE(amountIn, amountOutMin, path, address, deadline)
        } else {
          // Token to Token swap
          tx = await swapTokens(amountIn, amountOutMin, path, address, deadline)
        }
      }

      setTxHash(tx)
      toast.success('Swap submitted! Waiting for confirmation...')
    } catch (error) {
      console.error('Error swapping tokens:', error)
      setIsSwapping(false)

      if (error.message.includes('User rejected')) {
        toast.error('Transaction rejected by user')
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction')
      } else if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        toast.error('Insufficient output amount. Try increasing slippage.')
      } else if (error.message.includes('INSUFFICIENT_LIQUIDITY')) {
        toast.error('Insufficient liquidity for this trade')
      } else {
        toast.error(error?.shortMessage || 'Swap failed. Please try again.')
      }
    }
  }

  const switchTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount

    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 mb-6 animate-glow">
          <ArrowLeftRight className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Swap</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Trade tokens with optimal routing and minimal slippage
        </p>
      </div>

      {/* Swap Interface */}
      <div className="card p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white">Swap Tokens</h2>
          <button className="p-3 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800/50 transition-colors duration-200">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* From Token */}
        <div className="mb-6">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-300 font-medium">From</span>
              <span className="text-sm text-gray-400">Balance: 0.00</span>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-gray-500 border-none outline-none"
              />
              <button
                onClick={() => setShowTokenSelector('from')}
                className="flex items-center space-x-2 bg-gray-700/50 rounded-xl px-4 py-3 border border-gray-600/50 hover:border-purple-500/50 transition-colors duration-200"
              >
                <span className="text-sm font-medium text-white">{fromToken.symbol}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleSwapTokens}
            className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-110 shadow-lg"
          >
            <ArrowLeftRight className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* To Token */}
        <div className="mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-300 font-medium">To</span>
              <span className="text-sm text-gray-400">Balance: 0.00</span>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-gray-500 border-none outline-none"
                readOnly
              />
              <button
                onClick={() => setShowTokenSelector('to')}
                className="flex items-center space-x-2 bg-gray-700/50 rounded-xl px-4 py-3 border border-gray-600/50 hover:border-purple-500/50 transition-colors duration-200"
              >
                <span className="text-sm font-medium text-white">{toToken.symbol}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        {isConnected ? (
          <button
            onClick={handleSwap}
            disabled={isApproving || isSwapping || isWaitingForTx || isWaitingForApproval || !fromAmount || !toAmount}
            className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApproving || isWaitingForApproval ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {isWaitingForApproval ? 'Confirming Approval...' : 'Approving Token...'}
              </>
            ) : isSwapping || isWaitingForTx ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {isWaitingForTx ? 'Confirming Swap...' : 'Swapping...'}
        {/* Route/Quote Info */}
        {quoteError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="text-red-400 text-sm font-medium">{quoteError}</div>
          </div>
        )}
        {routeInfo && !quoteError && (
          <div className="mt-4 p-4 bg-gray-800/40 border border-gray-700/40 rounded-xl text-sm text-gray-300">
            <div className="mb-1">Route: {routeInfo.path.map((a, i) => i===0 ? a : ` → ${a}`)}</div>
            <div>Expected Out: {routeInfo.expectedOut}</div>
            <div>Min Out (@{slippage}% slippage): {routeInfo.minOut}</div>
          </div>
        )}

              </>
            ) : (
              <>
                <ArrowLeftRight className="h-5 w-5 mr-2" />
                {needsApproval && fromToken.address !== 'CORE' ? 'Approve & Swap' : 'Swap Tokens'}
              </>
            )}
          </button>
        ) : (
          <WalletConnectButton
            className="w-full btn btn-primary btn-lg"
            text="Connect Wallet to Swap"
          />
        )}

        {/* Price Impact Warning */}
        {priceImpact > 5 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-400 text-sm font-medium">
                High Price Impact: {priceImpact.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Token Selector Modal */}
        {showTokenSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Select Token</h3>
                <button
                  onClick={() => setShowTokenSelector(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

	              {/* Paste token address */}
	              <div className="mt-4">
	                <label className="text-sm text-gray-400">Paste token contract address</label>
	                <div className="mt-2 flex space-x-2">
	                  <input
	                    type="text"
	                    placeholder="0x..."
	                    className="flex-1 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
	                    onKeyDown={async (e) => {
	                      if (e.key === 'Enter') {
	                        const val = e.currentTarget.value.trim()
	                        if (!isAddress(val)) {
	                          toast.error('Invalid token address')
	                          return
	                        }
	                        try {
	                          const { symbol, name, decimals } = await fetchTokenMetadata(val)
	                          const t = { address: val, symbol, name, decimals, logoURI: '' }
	                          setPendingImportToken({ token: t, side: showTokenSelector })
	                          setShowImportConfirm(true)
	                          e.currentTarget.value = ''
	                          return
	                        } catch (err) {
	                          console.error('Token metadata fetch failed', err)
	                          toast.error('Failed to load token metadata')
	                        }
	                      }
	                    }}
	                  />
	                </div>
	              </div>


	          {/* Import Token Confirmation Modal */}
	          {showImportConfirm && pendingImportToken && (
	            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
	              <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 w-full max-w-md">
	                <div className="mb-4">
	                  <h3 className="text-lg font-bold text-white">Import Token</h3>
	                  <p className="text-gray-400 text-sm mt-1">Make sure this is the correct token.</p>
	                </div>
	                <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 space-y-1 text-sm">
	                  <div className="flex justify-between"><span className="text-gray-400">Symbol</span><span className="text-white font-medium">{pendingImportToken.token.symbol}</span></div>
	                  <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white">{pendingImportToken.token.name}</span></div>
	                  <div className="flex justify-between"><span className="text-gray-400">Decimals</span><span className="text-white">{pendingImportToken.token.decimals}</span></div>
	                  <div className="flex justify-between"><span className="text-gray-400">Address</span><span className="text-white break-all">{pendingImportToken.token.address}</span></div>
	                </div>
	                <div className="flex items-center justify-end space-x-3 mt-6">
	                  <button onClick={() => { setShowImportConfirm(false); setPendingImportToken(null) }} className="px-4 py-2 rounded-lg border border-gray-700/60 text-gray-300 hover:bg-gray-800/50">Cancel</button>
	                  <button onClick={() => { tokenListManager.addToken(pendingImportToken.token); handleTokenSelect(pendingImportToken.token, pendingImportToken.side); setShowImportConfirm(false); setPendingImportToken(null) }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">Import & Select</button>
	                </div>
	              </div>
	            </div>
	          )}


              <div className="space-y-2">
                {tokenList.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token, showTokenSelector)}
                    className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-800/50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{token.symbol[0]}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{token.symbol}</div>
                      <div className="text-gray-400 text-sm">{token.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Swap
