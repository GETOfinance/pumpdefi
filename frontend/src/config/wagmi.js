import { configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { coreTestnet } from './chains'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [coreTestnet],
  [publicProvider()]
)

// Only use injected wallets to avoid WalletConnect errors in development
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains }),
    ],
  },
])

export const wagmiConfig = createConfig({
  // Disable autoConnect to avoid noisy errors when no wallet is installed
  autoConnect: false,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { chains }
