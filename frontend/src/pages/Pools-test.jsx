import { useState } from 'react'
import { Plus } from 'lucide-react'

const PoolsTest = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pools</h1>
          <p className="text-gray-400">
            Provide liquidity to earn fees and rewards
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
            <span>Import</span>
          </button>
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Position</span>
          </button>
        </div>
      </div>

      {/* Test Content */}
      <div className="text-center py-20">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-12 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Pools Page Test
          </h3>
          <p className="text-gray-400 text-lg mb-6">
            This is a test version to verify the page loads correctly.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PoolsTest
