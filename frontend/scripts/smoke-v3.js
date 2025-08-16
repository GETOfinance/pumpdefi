// Quick smoke checks for V3 contracts on Core Testnet
import { createPublicClient, http } from 'viem'
import { coreTestnet, V3_ADDRESSES, CONTRACT_ADDRESSES } from '../src/config/chains'

const client = createPublicClient({ chain: coreTestnet, transport: http() })

const ABIS = {
  FACTORY: [ 'function owner() view returns (address)' ],
  NPM: [ 'function factory() view returns (address)', 'function WETH9() view returns (address)' ],
  ROUTER: [ 'function factory() view returns (address)', 'function WETH9() view returns (address)' ]
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

