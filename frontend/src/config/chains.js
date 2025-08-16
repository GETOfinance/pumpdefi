import { defineChain } from 'viem'

// Core Testnet Chain Configuration
export const coreTestnet = defineChain({
  id: 1114,
  name: 'Core Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'tCORE2',
    symbol: 'tCORE2',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test2.btcs.network'],
    },
    public: {
      http: ['https://rpc.test2.btcs.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Core Testnet Explorer',
      url: 'https://scan.test2.btcs.network',
    },
  },
  testnet: true,
})

// Contract addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  // V2 (existing PumpDeFi DEX)

  WCORE: import.meta.env.VITE_WCORE_ADDRESS || '0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9',
  TOKEN_FACTORY: import.meta.env.VITE_TOKEN_FACTORY_ADDRESS || '0x95ee06ec2D944B891E82CEd2F1404FBB8A36dA44',
  LAUNCH_PAD: import.meta.env.VITE_LAUNCH_PAD_ADDRESS || '0x99fA2C17fC269FA23ADd4E71cDE3210B1174f3B8',
  POOL_FACTORY: import.meta.env.VITE_POOL_FACTORY_ADDRESS || '0x5125e8020cA0066a9072A4B9ad54d80D4e6C7980',
  // Updated Router (deployed on Core Testnet)
  SWAP_ROUTER: import.meta.env.VITE_SWAP_ROUTER_ADDRESS || '0xF928FBDbD3041fbe9Fbd9A602c8D952167AFf5A0',
  STANDARD_AIRDROP: import.meta.env.VITE_STANDARD_AIRDROP_ADDRESS || '0x5d65639702612243a3484875320d6d293057c5a7',
  MERKLE_AIRDROP: import.meta.env.VITE_MERKLE_AIRDROP_ADDRESS || '0x13f9Caf7253E51f01B2309A3263D0bf2EE6Bdb41',
  // Default to known deployed LockManager on Core Testnet; can be overridden via env
  LOCK_MANAGER: import.meta.env.VITE_LOCK_MANAGER_ADDRESS || '0x32BC3202d410d4aE76C1f973517B13986Ac967cF',
  // Bonding/Pump Factory (set via env when deployed)
  BONDING_FACTORY: import.meta.env.VITE_BONDING_FACTORY_ADDRESS || '',
  // Escrow Hub (set via env when deployed)
  ESCROW_FACTORY: import.meta.env.VITE_ESCROW_FACTORY_ADDRESS || '',
  // Affiliate Manager
  AFFILIATE_MANAGER: import.meta.env.VITE_AFFILIATE_MANAGER_ADDRESS || '',
  // Staking Manager
  STAKING_MANAGER: import.meta.env.VITE_STAKING_MANAGER_ADDRESS || '',
  // Lend/Borrow Managers
  LEND_MANAGER: import.meta.env.VITE_LEND_MANAGER_ADDRESS || '',
  BORROW_MANAGER: import.meta.env.VITE_BORROW_MANAGER_ADDRESS || '',
}

// V3 Uniswap Addresses
export const V3_ADDRESSES = {
  V3_FACTORY: import.meta.env.VITE_V3_FACTORY_ADDRESS || '0x13f9caf7253e51f01b2309a3263d0bf2ee6bdb41',
  V3_POSITION_MANAGER: import.meta.env.VITE_V3_POSITION_MANAGER_ADDRESS || '0x5ca23cd0d991257ca55accd8e749b138e77440ec',
  V3_SWAP_ROUTER: import.meta.env.VITE_V3_SWAP_ROUTER_ADDRESS || '0x413ef18afa122d459605d2e74d60b788ba8fdb5b',
}

// API Configuration
export const API_CONFIG = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  SUBGRAPH_URL: import.meta.env.VITE_SUBGRAPH_URL || '',
}

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'PumpDeFi',
  APP_DESCRIPTION: 'The Ultimate DeFi Ecosystem on Core Blockchain',
  CHAIN_ID: 1114,
  NATIVE_TOKEN: {
    symbol: 'tCORE2',
    name: 'Core Testnet Token',
    decimals: 18,
  },
  SUPPORTED_TOKENS: [
    {
      symbol: 'WCORE',
      name: 'Wrapped CORE',
      address: CONTRACT_ADDRESSES.WCORE,
      decimals: 18,
      logo: '/tokens/wcore.png',
    },
    // Add more supported tokens here
  ],
  SOCIAL_LINKS: {
    twitter: 'https://twitter.com/pumpdefi',
    telegram: 'https://t.me/pumpdefi',
    discord: 'https://discord.gg/pumpdefi',
    github: 'https://github.com/pumpdefi',
  },
}

// Token Types
export const TOKEN_TYPES = {
  BASIC: 0,
  TAX: 1,
  ADVANCED: 2,
}

// Launch Status
export const LAUNCH_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  ENDED: 'ended',
  FINALIZED: 'finalized',
  CANCELLED: 'cancelled',
}

// Transaction Types
export const TX_TYPES = {
  TOKEN_CREATE: 'token_create',
  LAUNCH_CREATE: 'launch_create',
  LAUNCH_CONTRIBUTE: 'launch_contribute',
  LAUNCH_CLAIM: 'launch_claim',
  SWAP: 'swap',
  ADD_LIQUIDITY: 'add_liquidity',
  REMOVE_LIQUIDITY: 'remove_liquidity',
}

// Default slippage tolerance (in basis points)
export const DEFAULT_SLIPPAGE = 50 // 0.5%

// Gas limits for different operations
export const GAS_LIMITS = {
  TOKEN_CREATE: 2000000,
  LAUNCH_CREATE: 1500000,
  LAUNCH_CONTRIBUTE: 200000,
  LAUNCH_CLAIM: 300000,
  SWAP: 300000,
  ADD_LIQUIDITY: 400000,
  REMOVE_LIQUIDITY: 400000,
}
