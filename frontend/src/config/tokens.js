import { useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { CONTRACT_ADDRESSES } from './chains'

// Default token list for Core testnet
export const DEFAULT_TOKENS = [
  {
    address: 'CORE',
    symbol: 'CORE',
    name: 'Core',
    decimals: 18,
    logoURI: '',
    isNative: true,
  },
  {
    address: CONTRACT_ADDRESSES.WCORE,
    symbol: 'WCORE',
    name: 'Wrapped Core',
    decimals: 18,
    logoURI: '',
    isWrapped: true,
  },
]

// Common token pairs for trading
export const COMMON_PAIRS = [
  ['CORE', CONTRACT_ADDRESSES.WCORE],
]

// Token list management
export class TokenListManager {
  constructor() {
    this.tokens = new Map()
    this.loadDefaultTokens()
    this.loadCustomTokens()
  }

  loadDefaultTokens() {
    DEFAULT_TOKENS.forEach(token => {
      this.tokens.set(token.address, token)
    })
  }

  loadCustomTokens() {
    try {
      const saved = localStorage.getItem('pumpdefi_custom_tokens')
      if (saved) {
        const customTokens = JSON.parse(saved)
        customTokens.forEach(token => {
          this.tokens.set(token.address, { ...token, isCustom: true })
        })
      }
    } catch (error) {
      console.error('Error loading custom tokens:', error)
    }
  }

  saveCustomTokens() {
    try {
      const customTokens = Array.from(this.tokens.values())
        .filter(token => token.isCustom)
      localStorage.setItem('pumpdefi_custom_tokens', JSON.stringify(customTokens))
    } catch (error) {
      console.error('Error saving custom tokens:', error)
    }
  }

  addToken(token) {
    const tokenWithMeta = {
      ...token,
      isCustom: !DEFAULT_TOKENS.find(t => t.address === token.address),
      addedAt: Date.now(),
    }
    
    this.tokens.set(token.address, tokenWithMeta)
    
    if (tokenWithMeta.isCustom) {
      this.saveCustomTokens()
    }
    
    return tokenWithMeta
  }

  removeToken(address) {
    const token = this.tokens.get(address)
    if (token && token.isCustom) {
      this.tokens.delete(address)
      this.saveCustomTokens()
      return true
    }
    return false
  }

  getToken(address) {
    return this.tokens.get(address)
  }

  getAllTokens() {
    return Array.from(this.tokens.values())
  }

  getTokensBySymbol(symbol) {
    return Array.from(this.tokens.values())
      .filter(token => token.symbol.toLowerCase().includes(symbol.toLowerCase()))
  }

  searchTokens(query) {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.tokens.values())
      .filter(token => 
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.address.toLowerCase().includes(lowerQuery)
      )
  }

  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address) || address === 'CORE'
  }

  async fetchTokenInfo(address) {
    // This would typically fetch from a contract or API
    // For now, return null to indicate we need manual input
    return null
  }
}

// Global token list manager instance
export const tokenListManager = new TokenListManager()

// Hook for using token list
export const useTokenList = () => {
  const [tokens, setTokens] = useState(tokenListManager.getAllTokens())
  const [searchQuery, setSearchQuery] = useState('')

  const addToken = (token) => {
    const addedToken = tokenListManager.addToken(token)
    setTokens(tokenListManager.getAllTokens())
    return addedToken
  }

  const removeToken = (address) => {
    const removed = tokenListManager.removeToken(address)
    if (removed) {
      setTokens(tokenListManager.getAllTokens())
    }
    return removed
  }

  const searchTokens = (query) => {
    setSearchQuery(query)
    return tokenListManager.searchTokens(query)
  }

  const getFilteredTokens = () => {
    if (!searchQuery) return tokens
    return tokenListManager.searchTokens(searchQuery)
  }

  return {
    tokens,
    searchQuery,
    addToken,
    removeToken,
    searchTokens,
    getFilteredTokens,
    setSearchQuery,
  }
}

// Utility functions
export const formatTokenAmount = (amount, decimals = 18, precision = 6) => {
  if (!amount) return '0'
  
  try {
    const formatted = formatUnits(amount, decimals)
    const num = parseFloat(formatted)
    
    if (num === 0) return '0'
    if (num < 0.000001) return '< 0.000001'
    if (num < 1) return num.toFixed(precision)
    if (num < 1000) return num.toFixed(Math.min(precision, 2))
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K'
    return (num / 1000000).toFixed(2) + 'M'
  } catch (error) {
    return '0'
  }
}

export const parseTokenAmount = (amount, decimals = 18) => {
  if (!amount || amount === '') return 0n
  
  try {
    return parseUnits(amount.toString(), decimals)
  } catch (error) {
    return 0n
  }
}

// Token validation
export const validateTokenData = (token) => {
  const errors = []
  
  if (!token.address || !tokenListManager.isValidAddress(token.address)) {
    errors.push('Invalid token address')
  }
  
  if (!token.symbol || token.symbol.length === 0) {
    errors.push('Token symbol is required')
  }
  
  if (!token.name || token.name.length === 0) {
    errors.push('Token name is required')
  }
  
  if (!token.decimals || token.decimals < 0 || token.decimals > 18) {
    errors.push('Token decimals must be between 0 and 18')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
