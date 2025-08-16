// Quick smoke checks for V3 contracts on Core Testnet (CommonJS)
const { createPublicClient, http, defineChain } = require('viem')

// Inline chain and addresses to avoid import.meta/env issues
const coreTestnet = defineChain({
  id: 1114,
  name: 'Core Testnet',
  nativeCurrency: { decimals: 18, name: 'Core', symbol: 'CORE' },
  rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] }, public: { http: ['https://rpc.test2.btcs.network'] } },
  blockExplorers: { default: { name: 'Core Scan', url: 'https://scan.test2.btcs.network' } },
  testnet: true,
})

const CONTRACT_ADDRESSES = {
  WCORE: '0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9',
}
const V3_ADDRESSES = {
  V3_FACTORY: '0x13f9caf7253e51f01b2309a3263d0bf2ee6bdb41',
  V3_POSITION_MANAGER: '0x5ca23cd0d991257ca55accd8e749b138e77440ec',
  V3_SWAP_ROUTER: '0x413ef18afa122d459605d2e74d60b788ba8fdb5b',
}

const client = createPublicClient({ chain: coreTestnet, transport: http() })

const ABIS = {
  FACTORY: [
    { type: 'function', name: 'owner', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }
  ],
  NPM: [
    { type: 'function', name: 'factory', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
    { type: 'function', name: 'WETH9', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }
  ],
  ROUTER: [
    { type: 'function', name: 'factory', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
    { type: 'function', name: 'WETH9', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }
  ]
}

async function main() {
  console.log('Core Testnet:', coreTestnet.id, coreTestnet.name)

  // Factory
  const owner = await client.readContract({ address: V3_ADDRESSES.V3_FACTORY, abi: ABIS.FACTORY, functionName: 'owner' })
  console.log('V3_FACTORY.owner =', owner)

  // NPM
  const npmFactory = await client.readContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: ABIS.NPM, functionName: 'factory' })
  const npmWcore = await client.readContract({ address: V3_ADDRESSES.V3_POSITION_MANAGER, abi: ABIS.NPM, functionName: 'WETH9' })
  console.log('NPM.factory =', npmFactory)
  console.log('NPM.WCORE =', npmWcore)

  // Router
  const routerFactory = await client.readContract({ address: V3_ADDRESSES.V3_SWAP_ROUTER, abi: ABIS.ROUTER, functionName: 'factory' })
  const routerWcore = await client.readContract({ address: V3_ADDRESSES.V3_SWAP_ROUTER, abi: ABIS.ROUTER, functionName: 'WETH9' })
  console.log('Router.factory =', routerFactory)
  console.log('Router.WCORE =', routerWcore)

  // Sanity checks
  console.log('Match: router.factory == V3_FACTORY', routerFactory.toLowerCase() === V3_ADDRESSES.V3_FACTORY.toLowerCase())
  console.log('Match: npm.factory == V3_FACTORY', npmFactory.toLowerCase() === V3_ADDRESSES.V3_FACTORY.toLowerCase())
  console.log('Match: npm.WCORE == WCORE', npmWcore.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase())
  console.log('Match: router.WCORE == WCORE', routerWcore.toLowerCase() === CONTRACT_ADDRESSES.WCORE.toLowerCase())
}

main().catch((e) => { console.error(e); process.exit(1) })

