# PumpDeFi – Feature Overview and Capabilities

A comprehensive DeFi suite on the Core testnet blockchain (chain id 1114), combining a token launchpad, AMM/DEX, liquidity management (V2 + V3 UX), airdrops, staking, lending, escrow, affiliate tracking, and analytics.

This document details the major features exposed in the frontend, the APIs in the backend, and the corresponding smart contracts.

## Network
- Chain: Core Testnet (id: 1114)
- Currency: tCORE2 (CORE)
- RPC: https://rpc.test2.btcs.network
- Explorer: https://scan.test2.btcs.network

Deployed Smart Contract Addresses (Core Testnet):
- Core Asset
  - WCORE: 0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9

- Token Creation & Launch
  - TokenFactory: 0x95ee06ec2D944B891E82CEd2F1404FBB8A36dA44
  - LaunchPad: 0x99fA2C17fC269FA23ADd4E71cDE3210B1174f3B8
  - BondingSaleFactory: set via env if deployed (VITE_BONDING_FACTORY_ADDRESS)

- AMM / DEX (V2)
  - PoolFactory (PUMPDeFi LP / PLP): 0x5125e8020cA0066a9072A4B9ad54d80D4e6C7980
  - SwapRouter (V2): 0xF928FBDbD3041fbe9Fbd9A602c8D952167AFf5A0

- Airdrop
  - StandardAirdrop: 0x5d65639702612243a3484875320d6d293057c5a7
  - MerkleAirdrop: 0x13f9Caf7253E51f01B2309A3263D0bf2EE6Bdb41

- Locks
  - LockManager: 0x32BC3202d410d4aE76C1f973517B13986Ac967cF

- Escrow
  - EscrowHub/Factory: set via env if deployed (VITE_ESCROW_FACTORY_ADDRESS)

- Affiliate / Referral
  - AffiliateManager: set via env if deployed (VITE_AFFILIATE_MANAGER_ADDRESS)

- Staking
  - StakingManager: set via env if deployed (VITE_STAKING_MANAGER_ADDRESS)

- Lending
  - LendManager: set via env if deployed (VITE_LEND_MANAGER_ADDRESS)
  - BorrowManager: set via env if deployed (VITE_BORROW_MANAGER_ADDRESS)

- Uniswap V3 Integration
  - V3 Factory: 0x13f9caf7253e51f01b2309a3263d0bf2ee6bdb41
  - V3 Position Manager: 0x5ca23cd0d991257ca55accd8e749b138e77440ec
  - V3 Swap Router: 0x413ef18afa122d459605d2e74d60b788ba8fdb5b

---

## Feature Matrix

- Token Factory (ERC20 creation)
- Token Launchpad (Fair Launch + Bonding Curve “Pump Sale”)
- AMM/DEX (V2-style pools, swaps, liquidity; V3 UX for positions)
- Airdrop (Standard + Merkle)
- Staking
- Lending (v1) and Lending V2
- Escrow (CORE-native)
- Affiliate/Referral (on-chain + off-chain assist)
- Portfolio, Markets, Analytics
- Oracles (fixed price, pool TWAP, router)
- Token/time Locks

---

## Token Factory
Frontend: `src/pages/TokenFactory.jsx`
Contracts: `src/tokens/BasicERC20.sol`, `src/tokens/TaxToken.sol`, `src/factory/TokenFactory.sol`

Create ERC20 tokens with multiple presets:
- Basic Token
  - Standard ERC20
  - Mintable
  - Burnable
  - Trading control (as surfaced in UI)
- Tax Token
  - All Basic features
  - Configurable buy/sell taxes
  - Tax-exclusion list
  - AMM detection support
- Advanced Token (coming soon in UI)

Quality-of-life:
- Connection tests and simulated creation to validate parameters before sending a transaction
- Clear error handling (insufficient funds, user rejected, revert reasons)

Notes:
- UI references a creation fee; check current deployment/policy before mainnet use.

---

## Launchpad
Frontend: `src/pages/CreateFairLaunch.jsx`, `src/pages/CreatePumpLaunch.jsx`, `src/pages/PumpSale.jsx`, `src/pages/LaunchPad.jsx`
Contracts: `src/launchpad/LaunchPad.sol`, `src/launchpad/BondingSaleFactory.sol`, `src/launchpad/BondingTokenSale.sol`

Two principal sale types:
- Fair Launch
  - Scheduled time window
  - Time-based distribution mechanics (no bonding curve)
- Pump Sale (Bonding Curve)
  - Linear bonding curve pricing with parameters: `basePrice`, `slope`
  - Public sale info: start/end times, total for sale, total sold, total raised, token address
  - Buy with CORE; reads/quotes via `viem`

Affiliate integration with Pump Sale:
- Off-chain conversion capture via frontend utility (`utils/affiliate`) and backend analytics
- Optional on-chain rewards via `AffiliateManager` (if address configured): buyers can trigger rewards referencing `campaignId` and `ref` (wallet address)

---

## AMM/DEX (V2-style)
Frontend: `src/pages/Swap.jsx`, `src/pages/Pools.jsx`, V2 helpers: `V2AddLiquidity.jsx`, `V2CreatePair.jsx`, `V2ImportPair.jsx`
Contracts: `src/dex/PoolFactory.sol`, `src/dex/Pool.sol`, `src/dex/SwapRouter.sol`, `src/interfaces/IWCORE.sol`, `src/tokens/WCORE.sol`

Core features:
- Swap
  - CORE <-> WCORE wrapping/unwrapping
  - Token-to-token swaps through paths (with WCORE routing when needed)
  - Slippage control; minOut calculations; deadline handling
  - Dynamic token discovery/import and metadata fallback (bytes32 symbol/name)
  - Price impact indication and route display
- Pools (V2)
  - Create pair/pool
  - Add liquidity (token-token or token-CORE via WCORE)
  - Import existing pool
  - View user LP balances, pool share, reserves and TVL

Notes:
- Error mapping provides clearer DEX messages (e.g., INSUFFICIENT_OUTPUT_AMOUNT, INVALID_PATH, POOL_EXISTS)
- WCORE address and router/factory pinned in chain config

### V3 UX (Hybrid)
Frontend: `src/pages/Pools.jsx` (V3 view), `src/pages/V3NewPosition.jsx`, `src/pages/V3ManagePosition.jsx`
Libraries: `contracts/lib/v3-core`, `contracts/lib/v3-periphery`

- Displays Uniswap V3-style positions by reading the NonFungiblePositionManager events and `positions(tokenId)`
- Provides a “new position” flow UI
- Uses helper math (`utils/v3Math`) and backend prices to value positions

Note: The core AMM contracts shipped here are V2-style; the V3 experience integrates with V3-compatible contracts available on the network (addresses configured via `V3_ADDRESSES`).

---

## Airdrops
Frontend: `src/pages/Airdrop.jsx`
Backend: `backend/routes/airdrop.js`
Contracts: `src/airdrop/StandardAirdrop.sol`, `src/airdrop/MerkleAirdrop.sol`

- Standard Airdrop
  - Direct list distribution
- Merkle Airdrop
  - Gas-efficient proof-based claiming

Backend helpers:
- CSV upload + parsing
- CORE RPC provider integration
- Endpoints accept lists/uploads and coordinate claims/distributions

---

## Staking
Frontend: `src/pages/Stake.jsx`, `src/pages/BankStake.jsx`
Contracts: `src/staking/StakingManager.sol`

- Stake/unstake flows surfaced in UI
- Backend endpoints: `backend/routes/staking.js`

---

## Lending (v1) and Lending V2
Frontend: `src/pages/BankLend.jsx`, `src/pages/BankBorrow.jsx`, `src/pages/LendingManage.jsx`
Contracts:
- v1: `src/lending/LendManager.sol`, `src/borrowing/BorrowManager.sol`
- v2: `src/lendingV2/LendingPool.sol`, `src/lendingV2/InterestRateModel.sol`
Backend: `backend/routes/lend.js`, `backend/routes/borrow.js`, `backend/routes/lendingv2.js`

- Supply/borrow UI, manage positions
- Interest rate model and pool-level accounting (v2)

---

## Escrow (CORE-native)
Frontend: `src/pages/Escrow.jsx`
Contract: `src/escrow/EscrowHub.sol`

- Simple buyer-seller escrow for CORE
- States: Pending, Delivered, Refunded, Expired
- Flat fee on settlement sent to deployer (see contract comment)
- Timeouts: `expireAt`, `clearAt`

---

## Affiliate / Referral
Frontend: `src/pages/Affiliate.jsx`, `src/pages/AffiliateStatusCard.jsx`, utility `utils/affiliate`
Contract: `src/affiliate/AffiliateManager.sol`
Backend: `backend/routes/affiliate.js`, plus analytics support

- Campaigns with on-chain `reward(campaignId, ref)` calls
- Off-chain analytics capture to attribute conversions (e.g., Pump Sale purchases)

---

## Locks
Frontend: `src/pages/Lock.jsx`
Contract: `src/lock/LockManager.sol`

- Token and/or time-based locking mechanisms (as surfaced by UI)

---

## Oracles and Analytics
Contracts: `src/oracle/FixedPriceOracle.sol`, `src/oracle/OracleRouter.sol`, `src/oracle/PoolTwapOracle.sol`
Backend: `backend/routes/price.js`, `backend/routes/analytics.js`
Frontend: `src/pages/Analytics.jsx`, `src/pages/Markets.jsx`, `src/pages/Portfolio.jsx`

- Fixed-price and router/TWAP oracle utilities
- Price endpoints for token USD estimation used in TVL/position valuation
- Markets and Analytics pages surface aggregate stats
- Portfolio shows user-centric positions across modules

---

## Backend API Surface (High-level)
Mounted in `backend/server.js`:
- `/api/upload` – file uploads (e.g., CSV for airdrops)
- `/api/price` – price/oracle helpers
- `/api/rpc` – Core RPC proxy and helpers (balance, code size, etc.)
- `/api/tokens` – token utilities
- `/api/launchpad` – sale coordination endpoints
- `/api/pools` – pool queries/helpers
- `/api/airdrop` – standard/merkle airdrop endpoints
- `/api/pump` – pump sale helpers
- `/api/analytics` – analytics capture and summaries
- `/api/affiliate` – affiliate campaign utilities
- `/api/staking` – staking helpers
- `/api/lendingv2`, `/api/lend`, `/api/borrow` – lending endpoints
- `/api/portfolio` – user portfolio aggregation

---

## Frontend Navigation (Pages)
- Home: `Home.jsx`
- Swap: `Swap.jsx`
- Pools: `Pools.jsx` (with V2/V3 views)
- V2: `V2CreatePair.jsx`, `V2AddLiquidity.jsx`, `V2ImportPair.jsx`
- V3: `V3NewPosition.jsx`, `V3ManagePosition.jsx`
- Token Factory: `TokenFactory.jsx`, `TokenFactorySimple.jsx`
- Launchpad: `LaunchPad.jsx`, `CreateFairLaunch.jsx`, `CreatePumpLaunch.jsx`, `PumpSale.jsx`
- Airdrop: `Airdrop.jsx`
- Escrow: `Escrow.jsx`
- Lending/Bank: `BankLend.jsx`, `BankBorrow.jsx`, `LendingManage.jsx`
- Staking: `Stake.jsx`, `BankStake.jsx`
- Affiliate: `Affiliate.jsx`, `AffiliateStatusCard.jsx`
- Markets/Analytics/Portfolio: `Markets.jsx`, `Analytics.jsx`, `Portfolio.jsx`, `MyPositions.jsx`
- Locks: `Lock.jsx`

Wallet/Chain:
- Wagmi + `src/config/wagmi.js`; chain/address config in `src/config/chains.js`
- ABIs in `src/config/abis.js`

---

## Security & Notes
- Contracts include modular managers (e.g., TokenFactory, PoolFactory, StakingManager) and are designed for Core testnet.
- Role-based access and pausability are used where appropriate in modules; always review specific contracts before deployment.
- Some UI features reference “coming soon” presets or depend on configured addresses (e.g., V3 Position Manager, AffiliateManager). Ensure `CONTRACT_ADDRESSES` is set for the target network.

---

## Development Quick Start

Monorepo commands from `core/`:
- Install: `npm run install:frontend && npm run install:backend && npm run install:contracts`
- Dev: `npm run dev` (concurrently starts backend + frontend)
- Build: `npm run build`
- Contracts: `cd contracts && forge build && forge test`

Frontend dev server (default): http://localhost:5173
Backend server (default): http://localhost:5000 (CORS allows localhost:5173)

---

## License
MIT (see repository root)

