# PumpDeFi Deployment Notes (Core Testnet)

This document pins the latest deployed addresses and steps to reproduce.

## Network
- Chain: Core Testnet (id: 1114)
- RPC: https://rpc.test2.btcs.network
- Explorer: https://scan.test2.btcs.network

## Key Addresses
- WCORE: 0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9
- TokenFactory: (see environment or previous deployment notes)
- LaunchPad: (see environment or previous deployment notes)

### DEX (V2-style)
- PoolFactory (PUMPDeFi LP / PLP): 0x5125e8020cA0066a9072A4B9ad54d80D4e6C7980
- SwapRouter (for the above factory): 0xF928FBDbD3041fbe9Fbd9A602c8D952167AFf5A0

Note: The LP token metadata is baked into Pool.sol (name: "PUMPDeFi LP", symbol: "PLP") and applies to new pools created by this factory. Existing pools from prior factories retain their original ERC-20 metadata.

## Frontend Environment
Create or update `frontend/.env.local`:

```
VITE_POOL_FACTORY_ADDRESS=0x5125e8020cA0066a9072A4B9ad54d80D4e6C7980
VITE_SWAP_ROUTER_ADDRESS=0xF928FBDbD3041fbe9Fbd9A602c8D952167AFf5A0
```

Then rebuild:

```
cd frontend
npm run build
npm run preview
```

## Deploying the New DEX Core
Foundry script: `contracts/script/DeployNewDex.s.sol`

Required env:
- `PRIVATE_KEY` (funded on Core testnet, hex prefixed)
- `WCORE_ADDRESS` (existing WCORE token address)

Example:

```
cd contracts
forge build
export PRIVATE_KEY=0x...your_pk
export WCORE_ADDRESS=0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9
forge script script/DeployNewDex.s.sol:DeployNewDex \
  --rpc-url https://rpc.test2.btcs.network \
  --broadcast \
  --legacy \
  --gas-price 1000000000 \
  -vvv
```

## Migration Helper
The Pools page includes a "Migrate" action in the "More" menu that opens the V2 Add Liquidity page with tokenA/tokenB prefilled to simplify moving liquidity from legacy pools to the new factory’s pools.

