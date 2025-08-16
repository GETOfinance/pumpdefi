## PumpDeFi — About the Project

PumpDeFi is a comprehensive DeFi suite built for the Core blockchain (Core Testnet, chain id 1114). It combines a token Pump launchpad, AMM/DEX, liquidity management (V2 + V3 UX), airdrops, staking, lending, escrow, affiliate tracking, and analytics into a single cohesive platform.

Its goals are to make token creation, fair public launches, and on‑chain market making accessible to both developers and non‑technical founders, while providing traders and liquidity providers with a frictionless experience.

---

### Key Capabilities at a Glance
- Token Factory (multiple token presets)
- Launchpad (Fair Launch + Bonding Curve “Pump Sale”)
- AMM/DEX (V2 pools, swaps, liquidity; V3‑style positions UI)
- Airdrop (Standard & Merkle)
- Staking, Lending (v1 & v2)
- CORE‑native Escrow
- Affiliate/Referral (on‑chain)
- Portfolio, Markets, Analytics
- Oracles (fixed price, pool TWAP, router aggregation)
- Token/Time Locks

---

## Features in Detail

### 1) Token Factory
Create ERC‑20 tokens with professional presets and safety features:
- Basic Token
  - Standard ERC‑20 with Mint/Burn
  - Trading controls surfaced in the UI
- Tax Token
  - Configurable buy/sell taxes
  - Tax exclusions and AMM detection support
- Advanced Token (upcoming)
  - Reward distribution and automation features

Developer/UX niceties:
- Connection checks to deployed contracts before sending transactions
- Simulation tools to validate parameters (supply/decimals/etc.)
- Clear error handling (user reject, insufficient funds, revert reasons)


### 2) Launchpad
Two primary sale flows are supported:
- Fair Launch
  - Time‑windowed distribution without bonding curves
  - Contributors claim tokens post‑finalization
- Pump Sale (Bonding Curve)
  - Linear price curve P(x) = basePrice + slope × sold
  - UI shows: start/end, total for sale, sold, raised, token address
  - Buy with CORE; quotes and math via viem

Affiliate integration:
- Onchain conversion capture for campaign attribution
- Optional on‑chain reward distribution via AffiliateManager


### 3) AMM / DEX (V2)
A Uniswap V2‑style AMM with CORE ↔ WCORE wrapping support:
- Swap
  - CORE <→ WCORE
  - Token <→ Token with WCORE route when required
  - Slippage control, deadline enforcement, minOut calculations
  - Token import by address with robust metadata fallback
  - Route visibility + price impact indicator
- Pools (V2)
  - Create pairs/pools
  - Add liquidity (token‑token or token‑CORE via WCORE)
  - Import existing pools
  - Display reserves, TVL, user LP balances/share



### 4) V3‑Style Positions UX (Hybrid)
- Displays positions similar to Uniswap V3 by reading Position Manager events and `positions(tokenId)`
- Guides users through creating new concentrated‑liquidity positions
- Values positions using helper math + backend price endpoints
- Note: Core AMM contracts shipped here are V2‑style; V3 UX integrates with configured V3 contracts when available


### 5) Airdrops
- Standard Airdrop
  - Direct recipient lists
- Merkle Airdrop
  - Gas‑efficient claims using proofs
- Backend helpers for CSV uploads, validation, and summarization


### 6) Staking
- Stake/unstake wired to StakingManager Smart Contract
- Backend endpoints to assist with pricing/queries where useful


### 7) Lending
- Lend/borrow flows with position management
- Lending with an interest rate model and pool‑level accounting enhancements


### 8) CORE‑Native Escrow
- Buyer/seller escrow for CORE transfers
- States: Pending, Delivered, Refunded, Expired
- Flat settlement fee goes to deployer; expirations/clear times enforced


### 9) Affiliate / Referral
- On‑chain rewards via AffiliateManager (campaignId + ref)
- On‑chain analytics capture for conversion attribution (e.g., Pump Sale buys)


### 10) Locks
- Token/time lock mechanisms via LockManager


### 11) Markets, Analytics, Portfolio
- Markets & Analytics: Aggregate stats, fee/volume insights (as available)
- Portfolio: User‑centric view across pools, staking, lending, and router aggregation helpers

---

## Tech Stack

### Smart Contracts
- Language: Solidity
- Framework/Tooling: Foundry (Forge, Anvil, Cast)
- Contracts: TokenFactory, PoolFactory, SwapRouter, WCORE, airdrops (Standard/Merkle), LaunchPad & BondingSale, StakingManager, Lending, EscrowHub, LockManager, Oracle utilities

### Frontend
- React + Vite
- Wagmi + viem (wallets, RPC, contract reads/writes)
- Tailwind CSS + custom component styles
- Lucide icons, React Hot Toast, Axios (API calls)

### Backend
- Node.js + Express
- Ethers.js (Core RPC interactions) and Axios
- Multer + CSV parsing for airdrop tooling
- Helmet, CORS, compression, morgan (security & ops)

---

## Architecture Overview
Monorepo layout (top‑level `core/`):
- contracts/ — Solidity contracts (Foundry)
- frontend/ — React app (Vite)
- backend/ — Node/Express API server
- docs/ — Documentation and deployment notes
- scripts/ — Utilities (indexing, deploy helpers)

---

## Network
- Chain: Core Testnet (id: 1114)
- RPC: https://rpc.test2.btcs.network
- Explorer: https://scan.test2.btcs.network

## Deployed Smart Contracts (Core Testnet)

This table lists the latest deployed contract addresses used by PumpDeFi on Core Testnet (chain id 1114). Each address links to the Core Testnet explorer.

| Module | Contract | Address | Explorer |
|---|---|---|---|
| Core | WCORE | `0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9` | https://scan.test2.btcs.network/address/0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9 |
| Token | TokenFactory | `0x95ee06ec2D944B891E82CEd2F1404FBB8A36dA44` | https://scan.test2.btcs.network/address/0x95ee06ec2D944B891E82CEd2F1404FBB8A36dA44 |
| Launchpad | LaunchPad | `0x99fA2C17fC269FA23ADd4E71cDE3210B1174f3B8` | https://scan.test2.btcs.network/address/0x99fA2C17fC269FA23ADd4E71cDE3210B1174f3B8 |
| AMM/DEX (V2) | PoolFactory (PUMPDeFi LP/PLP) | `0x5125e8020cA0066a9072A4B9ad54d80D4e6C7980` | https://scan.test2.btcs.network/address/0x5125e8020ca0066a9072a4b9ad54d80d4e6c7980 |
| AMM/DEX (V2) | SwapRouter | `0xF928FBDbD3041fbe9Fbd9A602c8D952167AFf5A0` | https://scan.test2.btcs.network/address/0xF928FBDbD3041fbe9Fbd9A602c8D952167AFf5A0 |
| Airdrop | StandardAirdrop | `0x5d65639702612243a3484875320d6d293057c5a7` | https://scan.test2.btcs.network/address/0x5d65639702612243a3484875320d6d293057c5a7 |
| Airdrop | MerkleAirdrop | `0x13f9Caf7253E51f01B2309A3263D0bf2EE6Bdb41` | https://scan.test2.btcs.network/address/0x13f9Caf7253E51f01B2309A3263D0bf2EE6Bdb41 |
| Locks | LockManager | `0x32BC3202d410d4aE76C1f973517B13986Ac967cF` | https://scan.test2.btcs.network/address/0x32BC3202d410d4aE76C1f973517B13986Ac967cF |
| Uniswap V3 | V3 Factory | `0x13f9caf7253e51f01b2309a3263d0bf2ee6bdb41` | https://scan.test2.btcs.network/address/0x13f9caf7253e51f01b2309a3263d0bf2ee6bdb41 |
| Uniswap V3 | V3 Position Manager | `0x5ca23cd0d991257ca55accd8e749b138e77440ec` | https://scan.test2.btcs.network/address/0x5ca23cd0d991257ca55accd8e749b138e77440ec |
| Uniswap V3 | V3 Swap Router | `0x413ef18afa122d459605d2e74d60b788ba8fdb5b` | https://scan.test2.btcs.network/address/0x413ef18afa122d459605d2e74d60b788ba8fdb5b |



## 🌐 Core Testnet Details

- **Chain ID**: 1114 (0x45a)
- **Currency**: tCORE2
- **RPC URL**: https://rpc.test2.btcs.network
- **Explorer**: https://scan.test2.btcs.network/
- **Block Gas Limit**: 50,000,000

## 🏗️ Architecture

```
zentra-core/
├── contracts/          # Smart contracts (Foundry)
├── frontend/           # React frontend application
├── backend/            # Node.js API services
├── subgraph/           # The Graph indexing
├── docs/               # Documentation
└── scripts/            # Deployment scripts
```

## 🚀 Features

### Token Launchpad
- **Basic ERC20**: Standard token creation
- **Tax Token**: Configurable buy/sell taxation
- **Advanced Token**: Reward distribution mechanisms
- **Fair Launch**: Timestamp-based distribution events

### DEX (Decentralized Exchange)
- **Swap Interface**: Multi-token trading
- **Liquidity Pools**: Automated market making
- **Pool Factory**: Dynamic pool creation
- **Optimized Routing**: Efficient trade execution

### Infrastructure
- **Oracle Integration**: Real-time price feeds
- **IPFS Storage**: Decentralized asset storage
- **Subgraph Indexing**: Efficient data queries
- **Security Framework**: Multi-layered protection

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity + Foundry
- **Frontend**: React + Vite + Wagmi
- **Backend**: Node.js + Express
- **Oracle**: Configurable price feeds

## 📦 Quick Start

```bash
# Clone and setup
git clone <repo>
cd core

# Install dependencies
npm run install:all

# Deploy contracts
cd contracts
forge script script/Deploy.s.sol --rpc-url $CORE_RPC_URL --broadcast

# Start backend
cd ../backend
npm start

# Start frontend
cd ../frontend
npm run dev
```

## 🔧 Development

Each component can be developed independently:

```bash
# Smart contracts
cd contracts && forge test

# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev

# Subgraph
cd subgraph && npm run build
```

## 📚 Documentation

- [Smart Contracts](./docs/contracts.md)
- [API Reference](./docs/api.md)
- [Frontend Guide](./docs/frontend.md)
- [Deployment](./docs/deployment.md)

### Pinned Addresses (Core Testnet)
- PoolFactory (PUMPDeFi LP/PLP): 0x5125e8020cA0066a9072A4B9ad54d80D4e6C7980
- SwapRouter: 0xF928FBDbD3041fbe9Fbd9A602c8D952167AFf5A0
- WCORE: 0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9


## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.
