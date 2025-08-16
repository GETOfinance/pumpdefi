import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Menu,
  X,
  Zap,
  Factory,
  Rocket,
  ArrowLeftRight,
  Droplets
} from 'lucide-react'
import ThemeToggle from '../ThemeToggle'

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Factory', href: '/factory', icon: Factory },
    {
      name: 'LaunchPad',
      href: '/launchpad',
      icon: Rocket,
      dropdown: [
        { name: 'All Launches', href: '/launchpad' },
        { name: 'Fair Launch', href: '/launchpad/create/fair' },
        { name: 'Pump Launch', href: '/launchpad/create/pump' }
      ]
    },
    { name: 'Swap', href: '/swap', icon: ArrowLeftRight },
    { name: 'Pools', href: '/pools', icon: Droplets },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-gray-800/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl font-bold gradient-text">PumpDeFi</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.href)
                      ? 'bg-purple-600/20 text-white border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <div className="hidden md:flex items-center">
              <ThemeToggle />
            </div>

            {/* Connect Wallet */}
            <div className="flex items-center">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading'
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === 'authenticated')

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="btn btn-primary"
                            >
                              Connect Wallet
                            </button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="btn btn-secondary"
                            >
                              Wrong network
                            </button>
                          )
                        }

                        return (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={openChainModal}
                              className="btn btn-secondary btn-sm"
                              type="button"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                    marginRight: 4,
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 16, height: 16 }}
                                    />
                                  )}
                                </div>
                              )}
                              {chain.name}
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="btn btn-primary"
                            >
                              {account.displayName}
                              {account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ''}
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile Theme Toggle */}
            <div className="md:hidden">
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/30">
            {navigation.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-purple-600/20 text-gray-900 dark:text-white border border-purple-500/30'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            

          </div>
        </div>
      )}
    </header>
  )
}

export default Header
