# Deployed Smart Contracts (Core Testnet)

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

Optional managers (set via env when deployed):
- BondingSaleFactory, EscrowHub/Factory, AffiliateManager, StakingManager, LendManager, BorrowManager

Source of truth:
- Frontend config: `frontend/src/config/chains.js`
- Env file: `contracts/deployment-addresses.env`
- Deployment notes: `docs/deployment.md`

