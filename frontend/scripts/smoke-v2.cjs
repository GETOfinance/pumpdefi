// Quick smoke checks for V2 DEX contracts on Core Testnet (CommonJS)
const { createPublicClient, http, defineChain } = require('viem')

const coreTestnet = defineChain({
  id: 1114,
  name: 'Core Testnet',
  nativeCurrency: { decimals: 18, name: 'Core', symbol: 'CORE' },
  rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] }, public: { http: ['https://rpc.test2.btcs.network'] } },
  blockExplorers: { default: { name: 'Core Scan', url: 'https://scan.test2.btcs.network' } },
  testnet: true,
})

const CONTRACTS = {
  WCORE: '0xB433a6F3c690D17E78aa3dD87eC01cdc304278a9',
  POOL_FACTORY: '0xC6dD53Fc5ddAEA85EdbFdD149784C0B3cA6AFbD3',
  SWAP_ROUTER: '0x10c9Ab23a88a17fe62687Df67895F1bC7f6ba05A',
}

const ABIS = {
  POOL_FACTORY: [
    { type: 'function', name: 'allPoolsLength', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  ],
  SWAP_ROUTER: [
    { type: 'function', name: 'factory', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
    { type: 'function', name: 'WCORE', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  ],
}

async function main() {
  const client = createPublicClient({ chain: coreTestnet, transport: http() })
  console.log('Core Testnet:', coreTestnet.id, coreTestnet.name)

  // SwapRouter links
  const factory = await client.readContract({ address: CONTRACTS.SWAP_ROUTER, abi: ABIS.SWAP_ROUTER, functionName: 'factory' })
  const wcore = await client.readContract({ address: CONTRACTS.SWAP_ROUTER, abi: ABIS.SWAP_ROUTER, functionName: 'WCORE' })
  console.log('V2 Router.factory =', factory)
  console.log('V2 Router.WCORE =', wcore)
  console.log('Match: factory == POOL_FACTORY', factory.toLowerCase() === CONTRACTS.POOL_FACTORY.toLowerCase())
  console.log('Match: WCORE == WCORE', wcore.toLowerCase() === CONTRACTS.WCORE.toLowerCase())

  // Pool count
  const count = await client.readContract({ address: CONTRACTS.POOL_FACTORY, abi: ABIS.POOL_FACTORY, functionName: 'allPoolsLength' })
  console.log('V2 Pool count =', count.toString())
}

main().catch((e) => { console.error(e); process.exit(1) })

