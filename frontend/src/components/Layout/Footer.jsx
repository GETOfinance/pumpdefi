import { Link } from 'react-router-dom'
import { 
  Twitter, 
  MessageCircle, 
  Github, 
  ExternalLink,
  Zap
} from 'lucide-react'
import { APP_CONFIG } from '../../config/chains'

const Footer = () => {
  const footerNavigation = {
    product: [
      { name: 'Token Factory', href: '/factory' },
      { name: 'LaunchPad', href: '/launchpad' },
      { name: 'Swap', href: '/swap' },
      { name: 'Pools', href: '/pools' },
    ],
    resources: [
      { name: 'Analytics', href: '/analytics' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Documentation', href: '#' },
      { name: 'API', href: '#' },
    ],
    company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
    ],
  }

  const socialLinks = [
    {
      name: 'Twitter',
      href: APP_CONFIG.SOCIAL_LINKS.twitter,
      icon: Twitter,
    },
    {
      name: 'Telegram',
      href: APP_CONFIG.SOCIAL_LINKS.telegram,
      icon: MessageCircle,
    },
    {
      name: 'GitHub',
      href: APP_CONFIG.SOCIAL_LINKS.github,
      icon: Github,
    },
  ]

  return (
    <footer className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-800/30 transition-all duration-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">
                {APP_CONFIG.APP_NAME}
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-300 text-base mt-4 transition-colors duration-200">
              {APP_CONFIG.APP_DESCRIPTION}
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase transition-colors duration-200">
                  Product
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.product.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Resources
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.resources.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-base text-gray-300 hover:text-white transition-colors duration-200"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Company
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.company.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-base text-gray-300 hover:text-white transition-colors duration-200"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Legal
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.legal.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-base text-gray-300 hover:text-white transition-colors duration-200"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800/30 pt-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <a
                href="https://scan.test2.btcs.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-1"
              >
                <span className="text-sm">Core Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              &copy; 2025 {APP_CONFIG.APP_NAME}. All rights reserved. Built on Core Blockchain.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
