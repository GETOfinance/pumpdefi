import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Header from './Header'
import Sidebar from './Sidebar'
import { APP_CONFIG } from '../../config/chains'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen transition-colors duration-200">
      <Helmet>
        <title>{APP_CONFIG.APP_NAME} - {APP_CONFIG.APP_DESCRIPTION}</title>
        <meta name="description" content={APP_CONFIG.APP_DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Helmet>
      
      {/* Header */}
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
        />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
