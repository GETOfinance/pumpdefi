// Contract ABIs for PumpDeFi

import { parseAbi } from 'viem'

export const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
])

export const WCORE_ABI = [
  ...ERC20_ABI,
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'event Deposit(address indexed dst, uint256 wad)',
  'event Withdrawal(address indexed src, uint256 wad)',
]

export const TOKEN_FACTORY_ABI = [
  'function createBasicToken(string name, string symbol, uint8 decimals, uint256 totalSupply, address tokenOwner) payable returns (address)',
  'function createTaxToken(string name, string symbol, uint8 decimals, uint256 totalSupply, address tokenOwner, uint256 buyTaxRate, uint256 sellTaxRate, address taxRecipient) payable returns (address)',
  'function getAllTokens() view returns (address[])',
  'function getUserTokens(address user) view returns (address[])',
  'function getTokenCount() view returns (uint256)',
  'function tokenInfo(address) view returns (address tokenAddress, uint8 tokenType, address creator, uint256 createdAt, string name, string symbol, uint256 totalSupply)',
  'function allTokens(uint256) view returns (address)',
  'function userTokens(address, uint256) view returns (address)',
  'function creationFee() view returns (uint256)',
  'function feeRecipient() view returns (address)',
  'function owner() view returns (address)',
  'function setCreationFee(uint256 newFee)',
  'function setFeeRecipient(address newRecipient)',
  'function withdrawFees()',
  'event TokenCreated(address indexed tokenAddress, uint8 indexed tokenType, address indexed creator, string name, string symbol, uint256 totalSupply)',
  'event CreationFeeUpdated(uint256 oldFee, uint256 newFee)',
  'event FeeRecipientUpdated(address oldRecipient, address newRecipient)',
]

export const LAUNCH_PAD_ABI = [
  'function createLaunch(address token, uint256 totalAmount, uint256 startTime, uint256 endTime, uint256 minContribution, uint256 maxContribution, string metadataURI) payable returns (uint256)',
  'function contribute(uint256 launchId) payable',
  'function claimTokens(uint256 launchId)',
  'function finalizeLaunch(uint256 launchId)',
  'function cancelLaunch(uint256 launchId)',
  'function claimRefund(uint256 launchId)',
  'function launches(uint256) view returns (address token, address creator, uint256 totalAmount, uint256 startTime, uint256 endTime, uint256 minContribution, uint256 maxContribution, uint256 totalRaised, uint256 totalContributors, bool finalized, bool cancelled, string metadataURI)',
  'function contributions(uint256, address) view returns (uint256 amount, bool claimed)',
  'function getUserLaunches(address user) view returns (uint256[])',
  'function nextLaunchId() view returns (uint256)',
  'function launchFee() view returns (uint256)',
  'event LaunchCreated(uint256 indexed launchId, address indexed token, address indexed creator, uint256 totalAmount, uint256 startTime, uint256 endTime)',
  'event ContributionMade(uint256 indexed launchId, address indexed contributor, uint256 amount)',
  'event TokensClaimed(uint256 indexed launchId, address indexed contributor, uint256 tokenAmount)',
  'event LaunchFinalized(uint256 indexed launchId, uint256 totalRaised)',
  'event LaunchCancelled(uint256 indexed launchId)'
]

export const BONDING_SALE_ABI = [
  'function token() view returns (address)',
  'function startTime() view returns (uint256)',
  'function endTime() view returns (uint256)',
  'function basePrice() view returns (uint256)',
  'function slope() view returns (uint256)',
  'function totalForSale() view returns (uint256)',
  'function totalSold() view returns (uint256)',
  'function totalRaised() view returns (uint256)',
  'function buy() payable returns (uint256)',
  'function finalize()',
  'function cancel()'
]

export const BONDING_FACTORY_ABI = [
  'event SaleCreated(address indexed sale, address indexed token, address indexed creator)',
  'function createSale(address token,uint256 totalForSale,uint256 startTime,uint256 endTime,uint256 basePrice,uint256 slope) returns (address)',
  'function allSalesLength() view returns (uint256)',
  'function getSales(uint256 start,uint256 count) view returns (address[])',
  'function getCreatorSales(address creator) view returns (address[])'
]



export const POOL_FACTORY_ABI = [
  'function createPool(address tokenA, address tokenB) returns (address pool)',
  'function getPool(address tokenA, address tokenB) view returns (address pool)',
  'function allPools(uint256) view returns (address pool)',
  'function allPoolsLength() view returns (uint256)',
  'function feeTo() view returns (address)',
  'function feeToSetter() view returns (address)',
  'event PoolCreated(address indexed token0, address indexed token1, address pool, uint256 poolCount)',
]

export const POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function mint(address to) returns (uint256 liquidity)',
  'function burn(address to) returns (uint256 amount0, uint256 amount1)',
  'function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data)',
  'function skim(address to)',
  'function sync()',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Mint(address indexed sender, uint256 amount0, uint256 amount1)',
  'event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)',
  'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]

export const SWAP_ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function addLiquidityCORE(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountCOREMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountCORE, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
  'function removeLiquidityCORE(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountCOREMin, address to, uint256 deadline) returns (uint256 amountToken, uint256 amountCORE)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapExactCOREForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
  'function swapTokensForExactCORE(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapExactTokensForCORE(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapCOREForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
  'function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) pure returns (uint256 amountB)',
  'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256 amountOut)',
  'function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) pure returns (uint256 amountIn)',
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)',
  'function factory() view returns (address)',
  'function WCORE() view returns (address)',
]

export const AFFILIATE_MANAGER_ABI = [
  'event CampaignCreated(uint256 indexed id, address indexed creator, address indexed token, uint256 amountPerAction)',
  'event CampaignFunded(uint256 indexed id, address indexed funder, uint256 amount)',
  'event RewardPaid(uint256 indexed id, address indexed to, uint256 amount)',
  'event CampaignActiveSet(uint256 indexed id, bool active)',
  'function CREATION_FEE() view returns (uint256)',
  'function owner() view returns (address)',
  'function nextId() view returns (uint256)',
  'function campaigns(uint256) view returns (address creator, address token, uint256 amountPerAction, uint256 balance, bool active)',
  'function createCampaign(address token, uint256 amountPerAction) payable returns (uint256 id)',
  'function setActive(uint256 id, bool active)',
  'function fund(uint256 id, uint256 amount)',
  'function reward(uint256 id, address to)'
]

export const STAKING_MANAGER_ABI = [
  'event CampaignCreated(uint256 indexed id, address indexed creator, address stakeToken, address rewardToken, uint256 amountPerPeriod, uint256 periodSeconds)',
  'event CampaignFunded(uint256 indexed id, address indexed funder, uint256 amount)',
  'event Staked(uint256 indexed id, address indexed user, uint256 amount, uint256 lockedUntil)',
  'event Unstaked(uint256 indexed id, address indexed user, uint256 amount)',
  'event Claimed(uint256 indexed id, address indexed user, uint256 amount)',
  'event CampaignActiveSet(uint256 indexed id, bool active)',
  'function nextId() view returns (uint256)',
  'function CREATION_FEE() view returns (uint256)',
  'function createCampaign(address stakeToken, address rewardToken, uint256 amountPerPeriod, uint256 periodSeconds) payable returns (uint256)',
  'function setActive(uint256 id, bool active)',
  'function fund(uint256 id, uint256 amount)',
  'function pendingReward(uint256 id, address account) view returns (uint256)',
  'function stake(uint256 id, uint256 amount, uint256 lockSeconds)',
  'function claim(uint256 id)',
  'function unstake(uint256 id, uint256 amount)',
  'function getCampaign(uint256 id) view returns (tuple(address creator,address stakeToken,address rewardToken,uint256 amountPerPeriod,uint256 periodSeconds,uint256 rewardPerSec,uint256 accRewardPerShare,uint256 lastRewardTime,uint256 totalStaked,bool active))',
  'function users(uint256 id, address user) view returns (uint256 amount, uint256 rewardDebt, uint256 lockedUntil)'
]


export const LEND_MANAGER_ABI = [
  'event CampaignCreated(uint256 indexed id, address indexed creator, address assetToken, address rewardToken, uint256 amountPerPeriod, uint256 periodSeconds)',
  'event CampaignFunded(uint256 indexed id, address indexed funder, uint256 amount)',
  'event Supplied(uint256 indexed id, address indexed user, uint256 amount, uint256 lockedUntil)',
  'event Withdrawn(uint256 indexed id, address indexed user, uint256 amount)',
  'event Claimed(uint256 indexed id, address indexed user, uint256 amount)',
  'event CampaignActiveSet(uint256 indexed id, bool active)',
  'function owner() view returns (address)',
  'function CREATION_FEE() view returns (uint256)',
  'function nextId() view returns (uint256)',
  'function createCampaign(address assetToken, address rewardToken, uint256 amountPerPeriod, uint256 periodSeconds) payable returns (uint256)',
  'function setActive(uint256 id, bool active)',
  'function fund(uint256 id, uint256 amount)',
  'function pendingReward(uint256 id, address account) view returns (uint256)',
  'function supply(uint256 id, uint256 amount, uint256 lockSeconds)',
  'function claim(uint256 id)',
  'function withdraw(uint256 id, uint256 amount)',
  'function getCampaign(uint256 id) view returns (tuple(address creator,address assetToken,address rewardToken,uint256 amountPerPeriod,uint256 periodSeconds,uint256 rewardPerSec,uint256 accRewardPerShare,uint256 lastRewardTime,uint256 totalSupplied,bool active))',
  'function users(uint256 id, address user) view returns (uint256 amount, uint256 rewardDebt, uint256 lockedUntil)'
]

export const BORROW_MANAGER_ABI = [
  'event CampaignCreated(uint256 indexed id, address indexed creator, address collateralToken, address rewardToken, uint256 amountPerPeriod, uint256 periodSeconds)',
  'event CampaignFunded(uint256 indexed id, address indexed funder, uint256 amount)',
  'event Collateralized(uint256 indexed id, address indexed user, uint256 amount, uint256 lockedUntil)',
  'event Decollateralized(uint256 indexed id, address indexed user, uint256 amount)',
  'event Claimed(uint256 indexed id, address indexed user, uint256 amount)',
  'event CampaignActiveSet(uint256 indexed id, bool active)',
  'function owner() view returns (address)',
  'function CREATION_FEE() view returns (uint256)',
  'function nextId() view returns (uint256)',
  'function createCampaign(address collateralToken, address rewardToken, uint256 amountPerPeriod, uint256 periodSeconds) payable returns (uint256)',
  'function setActive(uint256 id, bool active)',
  'function fund(uint256 id, uint256 amount)',
  'function pendingReward(uint256 id, address account) view returns (uint256)',
  'function provideCollateral(uint256 id, uint256 amount, uint256 lockSeconds)',
  'function claim(uint256 id)',
  'function withdrawCollateral(uint256 id, uint256 amount)',
  'function getCampaign(uint256 id) view returns (tuple(address creator,address collateralToken,address rewardToken,uint256 amountPerPeriod,uint256 periodSeconds,uint256 rewardPerSec,uint256 accRewardPerShare,uint256 lastRewardTime,uint256 totalCollateral,bool active))',
  'function users(uint256 id, address user) view returns (uint256 amount, uint256 rewardDebt, uint256 lockedUntil)'
]


export const BASIC_TOKEN_ABI = [
  ...ERC20_ABI,
  'function owner() view returns (address)',
  'function tradingEnabled() view returns (bool)',
  'function enableTrading()',
  'function transferOwnership(address newOwner)',
  'function mint(address to, uint256 amount)',
  'function burn(uint256 amount)',
  'event TradingEnabled()',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
]

export const TAX_TOKEN_ABI = [
  ...BASIC_TOKEN_ABI,
  'function buyTaxRate() view returns (uint256)',
  'function sellTaxRate() view returns (uint256)',
  'function taxRecipient() view returns (address)',
  'function isExcludedFromTax(address) view returns (bool)',
  'function isAMM(address) view returns (bool)',
  'function setTaxRates(uint256 buyTaxRate, uint256 sellTaxRate)',
  'function setTaxRecipient(address taxRecipient)',
  'function excludeFromTax(address account, bool excluded)',
  'function setAMMPair(address pair, bool isAMM)',
  'event TaxRatesUpdated(uint256 buyTaxRate, uint256 sellTaxRate)',
  'event TaxRecipientUpdated(address indexed oldRecipient, address indexed newRecipient)',
  'event ExcludedFromTax(address indexed account, bool excluded)',
  'event AMMPairUpdated(address indexed pair, bool isAMM)',
]

// Minimal Uniswap V3 NonfungiblePositionManager ABI for mint/increase/decrease/collect & positions
export const V3_NPM_ABI = [
  'function factory() view returns (address)',
  'function WETH9() view returns (address)',
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) returns (address pool)',
  'function mint((address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,address recipient,uint256 deadline)) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function increaseLiquidity((uint256 tokenId,uint256 amount0Desired,uint256 amount1Desired,uint256 amount0Min,uint256 amount1Min,uint256 deadline)) payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function decreaseLiquidity((uint256 tokenId,uint128 liquidity,uint256 amount0Min,uint256 amount1Min,uint256 deadline)) returns (uint256 amount0, uint256 amount1)',
  'function collect((uint256 tokenId,address recipient,uint128 amount0Max,uint128 amount1Max)) returns (uint256 amount0, uint256 amount1)',
  // ERC721 minimal
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
]

// Uniswap V3 Factory + Pool minimal ABIs
export const V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'
]

export const V3_POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() view returns (uint128)'
]


// Standard Airdrop ABI
export const STANDARD_AIRDROP_ABI = [
  'function nextAirdropId() view returns (uint256)',
  'function creationFee() view returns (uint256)',
  'function airdrops(uint256) view returns (address token, address creator, uint256 totalAmount, uint256 claimedAmount, uint256 startTime, uint256 endTime, bool active, string metadataURI)',
  'function createAirdrop(address token, uint256 totalAmount, uint256 startTime, uint256 endTime, string metadataURI) payable returns (uint256)',
  'function addRecipients(uint256 airdropId, address[] recipients, uint256[] amounts)',
  'function claim(uint256 airdropId)',
  'function cancelAirdrop(uint256 airdropId)',
  'function getUserAirdrops(address user) view returns (uint256[])',
  'function getRecipients(uint256 airdropId) view returns (address[], uint256[])',
  'function getClaimableAmount(uint256 airdropId, address recipient) view returns (uint256)',
  'function getClaimedAmount(uint256 airdropId, address recipient) view returns (uint256)',
  'function isClaimable(uint256 airdropId) view returns (bool)',
  'event AirdropCreated(uint256 indexed airdropId, address indexed token, address indexed creator, uint256 totalAmount, uint256 startTime, uint256 endTime)',
  'event TokensClaimed(uint256 indexed airdropId, address indexed recipient, uint256 amount)',
  'event AirdropCancelled(uint256 indexed airdropId)'
]

// Merkle Airdrop ABI
export const MERKLE_AIRDROP_ABI = [
  'function nextAirdropId() view returns (uint256)',
  'function creationFee() view returns (uint256)',
  'function airdrops(uint256) view returns (address token, address creator, uint256 totalAmount, uint256 claimedAmount, uint256 startTime, uint256 endTime, bool active, string metadataURI, bytes32 merkleRoot)',
  'function createAirdrop(address token, uint256 totalAmount, uint256 startTime, uint256 endTime, string metadataURI) payable returns (uint256)',
  'function setMerkleRoot(uint256 airdropId, bytes32 merkleRoot)',
  'function claim(uint256 airdropId, uint256 amount, bytes32[] merkleProof)',
  'function cancelAirdrop(uint256 airdropId)',
  'function getUserAirdrops(address user) view returns (uint256[])',
  'function getMerkleAirdropInfo(uint256 airdropId) view returns (tuple(address token, address creator, uint256 totalAmount, uint256 claimedAmount, uint256 startTime, uint256 endTime, bool active, string metadataURI, bytes32 merkleRoot))',
  'function hasClaimed(uint256 airdropId, address recipient) view returns (bool)',
  'function verifyMerkleProof(bytes32[] proof, bytes32 root, bytes32 leaf) pure returns (bool)',
  'event AirdropCreated(uint256 indexed airdropId, address indexed token, address indexed creator, uint256 totalAmount, uint256 startTime, uint256 endTime)',
  'event TokensClaimed(uint256 indexed airdropId, address indexed recipient, uint256 amount)',
  'event AirdropCancelled(uint256 indexed airdropId)'
]


// EscrowHub ABI (from mimimoneydev/escrow artifacts)
export const ESCROW_HUB_ABI = [
  'event EscrowCreated(uint256 indexed escrowId,string cid,address buyer,address seller,uint256 indexed amount,uint256 indexed fee,uint8 state)',
  'event EscrowUpdated(uint256 indexed escrowId,string cid,address buyer,address seller,uint256 amount,uint256 fee,uint8 indexed state)',
  'function newEscrow(address _seller,string _cid,uint256 expireIn) payable',
  'function fetchMyEscrows() view returns ((uint256 id,string cid,address buyer,address seller,uint256 amount,uint256 fee,uint256 createdAt,uint256 expireAt,uint256 clearAt,uint8 state)[])',
  'function fetchEscrow(uint256 escrowId) view returns (uint256 id,string cid,address buyer,address seller,uint256 amount,uint256 fee,uint256 createdAt,uint256 expireAt,uint256 clearAt,uint8 state)',
  'function fetchEscrowsPaginated(uint256 cursor,uint256 perPageCount) view returns ((uint256 id,string cid,address buyer,address seller,uint256 amount,uint256 fee,uint256 createdAt,uint256 expireAt,uint256 clearAt,uint8 state)[] data,uint256 totalItemCount,bool hasNextPage,uint256 nextCursor)',
  'function deliver(uint256 _escrowId)',
  'function refund(uint256 _escrowId)',
  'function claimAfterExpire(uint256 _escrowId)'
]

export const LENDING_POOL_ABI = [
  'function deposit(address asset, uint256 amount)',
  'function withdraw(address asset, uint256 amountUnderlying)',
  'function borrow(address asset, uint256 amount)',
  'function repay(address asset, uint256 amount)',
  'function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)',
  'function getReserves() view returns (address[])',
  'function getReserveData(address asset) view returns (address,address,address,uint8,uint256,uint256,uint40,uint256,uint16,uint16,uint16,uint16,uint256,uint256,uint256,uint256,bool)'
]
