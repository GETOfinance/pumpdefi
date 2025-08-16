const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Core testnet provider
const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network');

// Contract addresses (will be populated after deployment)
const CONTRACT_ADDRESSES = {
  TOKEN_FACTORY: process.env.TOKEN_FACTORY_ADDRESS,
  LAUNCH_PAD: process.env.LAUNCH_PAD_ADDRESS,
  POOL_FACTORY: process.env.POOL_FACTORY_ADDRESS,
  SWAP_ROUTER: process.env.SWAP_ROUTER_ADDRESS,
  WCORE: process.env.WCORE_ADDRESS
};

// Token Factory ABI (simplified)
const TOKEN_FACTORY_ABI = [
  'event TokenCreated(address indexed tokenAddress, uint8 indexed tokenType, address indexed creator, string name, string symbol, uint256 totalSupply)',
  'function getAllTokens() view returns (address[])',
  'function getUserTokens(address user) view returns (address[])',
  'function getTokenCount() view returns (uint256)',
  'function tokenInfo(address) view returns (address tokenAddress, uint8 tokenType, address creator, uint256 createdAt, string name, string symbol, uint256 totalSupply)'
];

// ERC20 ABI (simplified)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
  'function tradingEnabled() view returns (bool)'
];

// Get all tokens created through the factory
router.get('/all', async (req, res) => {
  try {
    if (!CONTRACT_ADDRESSES.TOKEN_FACTORY) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Token factory contract not deployed yet'
      });
    }

    const tokenFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.TOKEN_FACTORY,
      TOKEN_FACTORY_ABI,
      provider
    );

    const tokenAddresses = await tokenFactory.getAllTokens();
    const tokenCount = await tokenFactory.getTokenCount();

    // Get detailed info for each token
    const tokens = await Promise.allSettled(
      tokenAddresses.map(async (address) => {
        const [tokenInfo, tokenContract] = await Promise.all([
          tokenFactory.tokenInfo(address),
          new ethers.Contract(address, ERC20_ABI, provider)
        ]);

        const [totalSupply, tradingEnabled] = await Promise.all([
          tokenContract.totalSupply(),
          tokenContract.tradingEnabled().catch(() => false)
        ]);

        return {
          address,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          totalSupply: totalSupply.toString(),
          creator: tokenInfo.creator,
          createdAt: Number(tokenInfo.createdAt),
          tokenType: Number(tokenInfo.tokenType),
          tradingEnabled
        };
      })
    );

    const successfulTokens = tokens
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    res.status(200).json({
      success: true,
      totalCount: Number(tokenCount),
      tokens: successfulTokens
    });

  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch tokens',
      message: error.message
    });
  }
});

// Get tokens created by a specific user
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid user address'
      });
    }

    if (!CONTRACT_ADDRESSES.TOKEN_FACTORY) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Token factory contract not deployed yet'
      });
    }

    const tokenFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.TOKEN_FACTORY,
      TOKEN_FACTORY_ABI,
      provider
    );

    const userTokens = await tokenFactory.getUserTokens(address);

    // Get detailed info for each token
    const tokens = await Promise.allSettled(
      userTokens.map(async (tokenAddress) => {
        const [tokenInfo, tokenContract] = await Promise.all([
          tokenFactory.tokenInfo(tokenAddress),
          new ethers.Contract(tokenAddress, ERC20_ABI, provider)
        ]);

        const [totalSupply, tradingEnabled] = await Promise.all([
          tokenContract.totalSupply(),
          tokenContract.tradingEnabled().catch(() => false)
        ]);

        return {
          address: tokenAddress,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          totalSupply: totalSupply.toString(),
          creator: tokenInfo.creator,
          createdAt: Number(tokenInfo.createdAt),
          tokenType: Number(tokenInfo.tokenType),
          tradingEnabled
        };
      })
    );

    const successfulTokens = tokens
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    res.status(200).json({
      success: true,
      userAddress: address,
      count: successfulTokens.length,
      tokens: successfulTokens
    });

  } catch (error) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch user tokens',
      message: error.message
    });
  }
});

// Get detailed information about a specific token
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid token address'
      });
    }

    const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);

    // Get basic token info
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply()
    ]);

    // Try to get additional info if it's from our factory
    let factoryInfo = null;
    if (CONTRACT_ADDRESSES.TOKEN_FACTORY) {
      try {
        const tokenFactory = new ethers.Contract(
          CONTRACT_ADDRESSES.TOKEN_FACTORY,
          TOKEN_FACTORY_ABI,
          provider
        );
        factoryInfo = await tokenFactory.tokenInfo(address);
      } catch (error) {
        // Token not from our factory, that's okay
      }
    }

    // Try to get owner and trading status
    let owner = null;
    let tradingEnabled = null;
    try {
      [owner, tradingEnabled] = await Promise.all([
        tokenContract.owner(),
        tokenContract.tradingEnabled()
      ]);
    } catch (error) {
      // Not all tokens have these functions
    }

    const tokenInfo = {
      address,
      name,
      symbol,
      decimals,
      totalSupply: totalSupply.toString(),
      owner,
      tradingEnabled
    };

    if (factoryInfo) {
      tokenInfo.creator = factoryInfo.creator;
      tokenInfo.createdAt = Number(factoryInfo.createdAt);
      tokenInfo.tokenType = Number(factoryInfo.tokenType);
      tokenInfo.fromFactory = true;
    } else {
      tokenInfo.fromFactory = false;
    }

    res.status(200).json({
      success: true,
      token: tokenInfo
    });

  } catch (error) {
    console.error('Error fetching token info:', error);
    
    if (error.code === 'CALL_EXCEPTION') {
      return res.status(404).json({
        error: 'Token not found',
        message: 'Unable to fetch token information. Token may not exist or contract may not be a valid ERC20 token.'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch token information',
      message: error.message
    });
  }
});

// Get token balance for a specific address
router.get('/:tokenAddress/balance/:userAddress', async (req, res) => {
  try {
    const { tokenAddress, userAddress } = req.params;
    
    if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(userAddress)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide valid token and user addresses'
      });
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [balance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(userAddress),
      tokenContract.decimals(),
      tokenContract.symbol()
    ]);

    res.status(200).json({
      success: true,
      tokenAddress,
      userAddress,
      balance: balance.toString(),
      balanceFormatted: ethers.formatUnits(balance, decimals),
      decimals,
      symbol
    });

  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({
      error: 'Failed to fetch token balance',
      message: error.message
    });
  }
});

// Search tokens by name or symbol
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Search query must be at least 2 characters long'
      });
    }

    if (!CONTRACT_ADDRESSES.TOKEN_FACTORY) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Token factory contract not deployed yet'
      });
    }

    const tokenFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.TOKEN_FACTORY,
      TOKEN_FACTORY_ABI,
      provider
    );

    const tokenAddresses = await tokenFactory.getAllTokens();

    // Search through tokens
    const searchResults = await Promise.allSettled(
      tokenAddresses.map(async (address) => {
        const tokenInfo = await tokenFactory.tokenInfo(address);
        
        const nameMatch = tokenInfo.name.toLowerCase().includes(query.toLowerCase());
        const symbolMatch = tokenInfo.symbol.toLowerCase().includes(query.toLowerCase());
        
        if (nameMatch || symbolMatch) {
          const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
          const [totalSupply, tradingEnabled] = await Promise.all([
            tokenContract.totalSupply(),
            tokenContract.tradingEnabled().catch(() => false)
          ]);

          return {
            address,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            totalSupply: totalSupply.toString(),
            creator: tokenInfo.creator,
            createdAt: Number(tokenInfo.createdAt),
            tokenType: Number(tokenInfo.tokenType),
            tradingEnabled,
            relevance: nameMatch ? 2 : 1 // Name matches are more relevant
          };
        }
        return null;
      })
    );

    const results = searchResults
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value)
      .sort((a, b) => b.relevance - a.relevance); // Sort by relevance

    res.status(200).json({
      success: true,
      query,
      count: results.length,
      tokens: results
    });

  } catch (error) {
    console.error('Error searching tokens:', error);
    res.status(500).json({
      error: 'Failed to search tokens',
      message: error.message
    });
  }
});

module.exports = router;
