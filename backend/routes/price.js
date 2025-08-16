const express = require('express');
const axios = require('axios');
const { ethers } = require('ethers');
const router = express.Router();

// Core testnet provider
const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network');

// Price cache to avoid excessive API calls
const priceCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

// Mock price oracle for Core testnet (replace with actual oracle when available)
const MOCK_PRICES = {
  'CORE': 1.25,
  'WCORE': 1.25,
  'USDC': 1.00,
  'USDT': 1.00,
  'ETH': 2400.00,
  'BTC': 45000.00
};

// Get current CORE price (mock implementation)
router.get('/core', async (req, res) => {
  try {
    const cacheKey = 'CORE_PRICE';
    const cached = priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json(cached.data);
    }

    // In production, this would fetch from a real price oracle
    const priceData = {
      symbol: 'CORE',
      price: MOCK_PRICES.CORE,
      change24h: (Math.random() - 0.5) * 10, // Random change for demo
      timestamp: Date.now(),
      source: 'mock_oracle'
    };

    priceCache.set(cacheKey, {
      data: priceData,
      timestamp: Date.now()
    });

    res.status(200).json(priceData);

  } catch (error) {
    console.error('Error fetching CORE price:', error);
    res.status(500).json({
      error: 'Failed to fetch price',
      message: error.message
    });
  }
});

// Get token price by address
router.get('/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid token address'
      });
    }

    const cacheKey = `TOKEN_PRICE_${address}`;
    const cached = priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json(cached.data);
    }

    // Try to get token info from contract
    const tokenContract = new ethers.Contract(
      address,
      [
        'function symbol() view returns (string)',
        'function name() view returns (string)',
        'function decimals() view returns (uint8)'
      ],
      provider
    );

    let symbol, name, decimals;
    try {
      [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ]);
    } catch (error) {
      return res.status(404).json({
        error: 'Token not found',
        message: 'Unable to fetch token information'
      });
    }

    // Mock price based on symbol or use default
    const price = MOCK_PRICES[symbol] || Math.random() * 100;
    
    const priceData = {
      address,
      symbol,
      name,
      decimals,
      price,
      change24h: (Math.random() - 0.5) * 20,
      timestamp: Date.now(),
      source: 'mock_oracle'
    };

    priceCache.set(cacheKey, {
      data: priceData,
      timestamp: Date.now()
    });

    res.status(200).json(priceData);

  } catch (error) {
    console.error('Error fetching token price:', error);
    res.status(500).json({
      error: 'Failed to fetch token price',
      message: error.message
    });
  }
});

// Get multiple token prices
router.post('/batch', async (req, res) => {
  try {
    const { addresses } = req.body;
    
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide an array of token addresses'
      });
    }

    if (addresses.length > 50) {
      return res.status(400).json({
        error: 'Too many addresses',
        message: 'Maximum 50 addresses allowed per request'
      });
    }

    const prices = await Promise.allSettled(
      addresses.map(async (address) => {
        if (!ethers.isAddress(address)) {
          throw new Error(`Invalid address: ${address}`);
        }

        const cacheKey = `TOKEN_PRICE_${address}`;
        const cached = priceCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.data;
        }

        // Fetch token info (simplified for batch)
        const tokenContract = new ethers.Contract(
          address,
          ['function symbol() view returns (string)'],
          provider
        );

        const symbol = await tokenContract.symbol();
        const price = MOCK_PRICES[symbol] || Math.random() * 100;
        
        const priceData = {
          address,
          symbol,
          price,
          change24h: (Math.random() - 0.5) * 20,
          timestamp: Date.now(),
          source: 'mock_oracle'
        };

        priceCache.set(cacheKey, {
          data: priceData,
          timestamp: Date.now()
        });

        return priceData;
      })
    );

    const results = prices.map((result, index) => ({
      address: addresses[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    res.status(200).json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error fetching batch prices:', error);
    res.status(500).json({
      error: 'Failed to fetch batch prices',
      message: error.message
    });
  }
});

// Get historical price data (mock implementation)
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '24h' } = req.query;

    const basePrice = MOCK_PRICES[symbol.toUpperCase()] || 1.0;
    const dataPoints = period === '24h' ? 24 : period === '7d' ? 7 : 30;
    
    const history = Array.from({ length: dataPoints }, (_, i) => {
      const timestamp = Date.now() - (dataPoints - i - 1) * (period === '24h' ? 3600000 : 86400000);
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const price = basePrice * (1 + variation);
      
      return {
        timestamp,
        price: parseFloat(price.toFixed(6)),
        volume: Math.random() * 1000000 // Mock volume
      };
    });

    res.status(200).json({
      symbol: symbol.toUpperCase(),
      period,
      data: history
    });

  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      error: 'Failed to fetch price history',
      message: error.message
    });
  }
});

// Clear price cache (admin endpoint)
router.delete('/cache', (req, res) => {
  priceCache.clear();
  res.status(200).json({
    success: true,
    message: 'Price cache cleared'
  });
});

module.exports = router;
