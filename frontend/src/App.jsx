import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'

import { wagmiConfig, chains } from './config/wagmi'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import TokenFactory from './pages/TokenFactorySimple'
import LaunchPad from './pages/LaunchPad'
import CreateFairLaunch from './pages/CreateFairLaunch'
import CreatePumpLaunch from './pages/CreatePumpLaunch'
import PumpSale from './pages/PumpSale'
import Airdrop from './pages/Airdrop'
import Lock from './pages/Lock'
import Escrow from './pages/Escrow'
import Swap from './pages/Swap'
import Pools from './pages/Pools'
import V2CreatePair from './pages/V2CreatePair'
import V2ImportPair from './pages/V2ImportPair'
import V2AddLiquidity from './pages/V2AddLiquidity'
import Analytics from './pages/Analytics'
import Portfolio from './pages/Portfolio'
import Affiliate from './pages/Affiliate'

import V3NewPosition from './pages/V3NewPosition'
import V3ManagePosition from './pages/V3ManagePosition'
import BankStake from './pages/BankStake'
import BankLend from './pages/BankLend'
import BankBorrow from './pages/BankBorrow'
import Stake from './pages/Stake'
import Markets from './pages/Markets'
import MyPositions from './pages/MyPositions'
import LendingManage from './pages/LendingManage'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

import { useEffect } from 'react'
import { captureVisit, storeReferral } from './utils/affiliate'

function App() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const ref = url.searchParams.get('ref')
      const campaign = url.searchParams.get('campaign')
      if (ref) {
        captureVisit(ref)
        storeReferral(ref, campaign)
      }
    } catch {}
  }, [])

  return (
    <HelmetProvider>
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider chains={chains}>
            <ThemeProvider>
              <Router>
                <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/factory" element={<TokenFactory />} />
                  <Route path="/launchpad" element={<LaunchPad />} />
                  <Route path="/launchpad/create/fair" element={<CreateFairLaunch />} />
                  <Route path="/launchpad/create/pump" element={<CreatePumpLaunch />} />
                      <Route path="/launchpad/pump/:sale" element={<PumpSale />} />
                  <Route path="/launchpad/:id" element={<LaunchPad />} />
                  <Route path="/airdrop" element={<Airdrop />} />
                  <Route path="/lock" element={<Lock />} />
	                  <Route path="/escrow" element={<Escrow />} />

	                  <Route path="/affiliate" element={<Affiliate />} />

                  <Route path="/swap" element={<Swap />} />
                  <Route path="/pools" element={<Pools />} />
                  <Route path="/pools/add" element={<V3NewPosition />} />
                  <Route path="/pools/v3/positions/:tokenId" element={<V3ManagePosition />} />
                  <Route path="/pools/v2" element={<Pools />} />
                  <Route path="/pools/v2/create" element={<V2CreatePair />} />
                  <Route path="/pools/v2/import" element={<V2ImportPair />} />
                  <Route path="/pools/v2/add" element={<V2AddLiquidity />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/portfolio" element={<Portfolio />} />

                  <Route path="/bank/stake" element={<BankStake />} />
                  <Route path="/bank/lend" element={<BankLend />} />
                  <Route path="/bank/borrow" element={<BankBorrow />} />

                  <Route path="/markets" element={<Markets />} />
                  <Route path="/positions" element={<MyPositions />} />
                  <Route path="/lending/manage" element={<LendingManage />} />
                  <Route path="/stake" element={<Stake />} />
                </Routes>
              </Layout>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: '#4ade80',
                      secondary: '#000',
                    },
                  },
                  error: {
                    duration: 5000,
                    theme: {
                      primary: '#ef4444',
                      secondary: '#000',
                    },
                  },
                }}
              />
              </Router>
            </ThemeProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </HelmetProvider>
  )
}

export default App
