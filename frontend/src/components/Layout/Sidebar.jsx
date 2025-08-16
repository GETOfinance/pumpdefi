import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Factory,
  Rocket,
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Briefcase,
  X,
  Zap,
  ExternalLink,
  Twitter,
  MessageCircle,
  Github,
  Gift,
  Lock,
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  Plus,
  ChevronDown,
  ChevronRight,
  Banknote
} from 'lucide-react'
import { useState } from 'react'
import { APP_CONFIG } from '../../config/chains'

const sidebarSections = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: Home, badge: null },
    ]
  },
  {
    title: 'Create',
    items: [
      { name: 'Token Factory', href: '/factory', icon: Factory, badge: 'Hot' },
      { name: 'Fair Launch', href: '/launchpad/create/fair', icon: Rocket, badge: null },
      { name: 'Pump Launch', href: '/launchpad/create/pump', icon: TrendingUp, badge: 'New' },
      { name: 'Airdrop', href: '/airdrop', icon: Gift, badge: null },
      { name: 'Lock', href: '/lock', icon: Lock, badge: null },
      { name: 'Escrow', href: '/escrow', icon: Shield, badge: null },
      { name: 'Affiliate', href: '/affiliate', icon: Users, badge: null },
    ]
  },
  {
    title: 'Trade',
    items: [
      { name: 'Swap', href: '/swap', icon: ArrowLeftRight, badge: null },
      { name: 'Pools', href: '/pools', icon: Droplets, badge: null },
    ]
  },
  {
    title: 'Manage',
    items: [
      { name: 'LaunchPad', href: '/launchpad', icon: Rocket, badge: null },
      { name: 'Portfolio', href: '/portfolio', icon: Briefcase, badge: null },
      { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: null },
    ]
  },
  {
    title: 'Bank',
    items: [
      { name: 'Stake (beta)', href: '/stake', icon: Rocket, badge: null },
      { name: 'Lend', href: '/bank/lend', icon: Banknote, badge: null },
      { name: 'Borrow', href: '/bank/borrow', icon: Banknote, badge: null },
    ]
  }
]

const socialLinks = [
  { name: 'Twitter', href: APP_CONFIG.SOCIAL_LINKS.twitter, icon: Twitter },
  { name: 'Telegram', href: APP_CONFIG.SOCIAL_LINKS.telegram, icon: MessageCircle },
  { name: 'GitHub', href: APP_CONFIG.SOCIAL_LINKS.github, icon: Github },
]

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState({
    'Create': true,
    'Trade': true,
    'Manage': true,
    'Bank': true
  })

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }))
  }

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/30">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200/50 dark:border-gray-800/30">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">
            {APP_CONFIG.APP_NAME}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {sidebarSections.map((section) => (
          <div key={section.title} className="space-y-2">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3">
                {section.title}
              </h3>
              {section.title !== 'Overview' && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {expandedSections[section.title] ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>

            {/* Section Items */}
            {(section.title === 'Overview' || expandedSections[section.title]) && (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const IconComponent = item.icon
                  const itemIsActive = isActive(item.href)

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                        itemIsActive
                          ? 'bg-purple-600/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <div className="flex items-center">
                        <IconComponent
                          className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                            itemIsActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                          }`}
                        />
                        {item.name}
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.badge === 'Hot'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : item.badge === 'New'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Stats */}
      <div className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-800/30">
        <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Platform Stats
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">TVL</span>
              <span className="font-medium text-gray-900 dark:text-white">$2.4K</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
              <span className="font-medium text-gray-900 dark:text-white">$0.5K</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tokens Created</span>
              <span className="font-medium text-gray-900 dark:text-white">7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-800/30">
        <Link to="/factory" className="w-full btn btn-primary btn-sm group block text-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Token
          <Zap className="h-3 w-3 ml-2 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-800/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-3">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
          <a
            href="https://scan.test2.btcs.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 {APP_CONFIG.APP_NAME}. Built on Core Blockchain.
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
                <SidebarContent />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}

export default Sidebar
