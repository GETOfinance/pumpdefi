const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Core testnet provider
const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network');

// Contract addresses
const CONTRACT_ADDRESSES = {
  POOL_FACTORY: process.env.POOL_FACTORY_ADDRESS,
  SWAP_ROUTER: process.env.SWAP_ROUTER_ADDRESS
};

// Pool Factory ABI
const POOL_FACTORY_ABI = [
  'event PoolCreated(address indexed token0, address indexed token1, address pool, uint256 poolCount)',
  'function getPool(address tokenA, address tokenB) view returns (address pool)',
  'function allPools(uint256) view returns (address pool)',
  'function allPoolsLength() view returns (uint256)'
];

// Pool ABI
const POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

// ERC20 ABI for token info
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

// Get all pools
router.get('/all', async (req, res) => {
  try {
    if (!CONTRACT_ADDRESSES.POOL_FACTORY) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Pool factory contract not deployed yet'
      });
    }

    const poolFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.POOL_FACTORY,
      POOL_FACTORY_ABI,
      provider
    );

    const poolCount = await poolFactory.allPoolsLength();
    const totalPools = Number(poolCount);

    if (totalPools === 0) {
      return res.status(200).json({
        success: true,
        totalCount: 0,
        pools: []
      });
    }

    // Get all pool addresses
    const poolAddresses = await Promise.all(
      Array.from({ length: totalPools }, (_, i) => poolFactory.allPools(i))
    );

    // Get detailed info for each pool
    const pools = await Promise.allSettled(
      poolAddresses.map(async (poolAddress) => {
        const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
        
        const [token0Address, token1Address, reserves, totalSupply] = await Promise.all([
          poolContract.token0(),
          poolContract.token1(),
          poolContract.getReserves(),
          poolContract.totalSupply()
        ]);

        // Get token info
        const [token0Contract, token1Contract] = [
          new ethers.Contract(token0Address, ERC20_ABI, provider),
          new ethers.Contract(token1Address, ERC20_ABI, provider)
        ];

        const [
          [token0Name, token0Symbol, token0Decimals],
          [token1Name, token1Symbol, token1Decimals]
        ] = await Promise.all([
          Promise.all([
            token0Contract.name(),
            token0Contract.symbol(),
            token0Contract.decimals()
          ]),
          Promise.all([
            token1Contract.name(),
            token1Contract.symbol(),
            token1Contract.decimals()
          ])
        ]);

        return {
          address: poolAddress,
          token0: {
            address: token0Address,
            name: token0Name,
            symbol: token0Symbol,
            decimals: token0Decimals
          },
          token1: {
            address: token1Address,
            name: token1Name,
            symbol: token1Symbol,
            decimals: token1Decimals
          },
          reserves: {
            reserve0: reserves.reserve0.toString(),
            reserve1: reserves.reserve1.toString(),
            blockTimestampLast: Number(reserves.blockTimestampLast)
          },
          totalSupply: totalSupply.toString(),
          pair: `${token0Symbol}/${token1Symbol}`
        };
      })
    );

    const successfulPools = pools
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    res.status(200).json({
      success: true,
      totalCount: successfulPools.length,
      pools: successfulPools
    });

  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({
      error: 'Failed to fetch pools',
      message: error.message
    });
  }
});

// Get pool for specific token pair
router.get('/pair/:token0/:token1', async (req, res) => {
  try {
    const { token0, token1 } = req.params;
    
    if (!ethers.isAddress(token0) || !ethers.isAddress(token1)) {
      return res.status(400).json({
        error: 'Invalid addresses',
        message: 'Please provide valid token addresses'
      });
    }

    if (!CONTRACT_ADDRESSES.POOL_FACTORY) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Pool factory contract not deployed yet'
      });
    }

    const poolFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.POOL_FACTORY,
      POOL_FACTORY_ABI,
      provider
    );

    const poolAddress = await poolFactory.getPool(token0, token1);
    
    if (poolAddress === ethers.ZeroAddress) {
      return res.status(404).json({
        error: 'Pool not found',
        message: `No pool exists for the token pair ${token0}/${token1}`
      });
    }

    // Get pool details
    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
    
    const [actualToken0, actualToken1, reserves, totalSupply] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.getReserves(),
      poolContract.totalSupply()
    ]);

    // Get token info
    const [token0Contract, token1Contract] = [
      new ethers.Contract(actualToken0, ERC20_ABI, provider),
      new ethers.Contract(actualToken1, ERC20_ABI, provider)
    ];

    const [
      [token0Name, token0Symbol, token0Decimals],
      [token1Name, token1Symbol, token1Decimals]
    ] = await Promise.all([
      Promise.all([
        token0Contract.name(),
        token0Contract.symbol(),
        token0Contract.decimals()
      ]),
      Promise.all([
        token1Contract.name(),
        token1Contract.symbol(),
        token1Contract.decimals()
      ])
    ]);

    const pool = {
      address: poolAddress,
      token0: {
        address: actualToken0,
        name: token0Name,
        symbol: token0Symbol,
        decimals: token0Decimals
      },
      token1: {
        address: actualToken1,
        name: token1Name,
        symbol: token1Symbol,
        decimals: token1Decimals
      },
      reserves: {
        reserve0: reserves.reserve0.toString(),
        reserve1: reserves.reserve1.toString(),
        blockTimestampLast: Number(reserves.blockTimestampLast)
      },
      totalSupply: totalSupply.toString(),
      pair: `${token0Symbol}/${token1Symbol}`
    };

    res.status(200).json({
      success: true,
      pool
    });

  } catch (error) {
    console.error('Error fetching pool:', error);
    res.status(500).json({
      error: 'Failed to fetch pool',
      message: error.message
    });
  }
});

// Get pool details by address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid pool address'
      });
    }

    const poolContract = new ethers.Contract(address, POOL_ABI, provider);
    
    try {
      const [token0Address, token1Address, reserves, totalSupply] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.getReserves(),
        poolContract.totalSupply()
      ]);

      // Get token info
      const [token0Contract, token1Contract] = [
        new ethers.Contract(token0Address, ERC20_ABI, provider),
        new ethers.Contract(token1Address, ERC20_ABI, provider)
      ];

      const [
        [token0Name, token0Symbol, token0Decimals],
        [token1Name, token1Symbol, token1Decimals]
      ] = await Promise.all([
        Promise.all([
          token0Contract.name(),
          token0Contract.symbol(),
          token0Contract.decimals()
        ]),
        Promise.all([
          token1Contract.name(),
          token1Contract.symbol(),
          token1Contract.decimals()
        ])
      ]);

      const pool = {
        address,
        token0: {
          address: token0Address,
          name: token0Name,
          symbol: token0Symbol,
          decimals: token0Decimals
        },
        token1: {
          address: token1Address,
          name: token1Name,
          symbol: token1Symbol,
          decimals: token1Decimals
        },
        reserves: {
          reserve0: reserves.reserve0.toString(),
          reserve1: reserves.reserve1.toString(),
          blockTimestampLast: Number(reserves.blockTimestampLast)
        },
        totalSupply: totalSupply.toString(),
        pair: `${token0Symbol}/${token1Symbol}`
      };

      res.status(200).json({
        success: true,
        pool
      });

    } catch (error) {
      return res.status(404).json({
        error: 'Pool not found',
        message: 'Address is not a valid pool contract'
      });
    }

  } catch (error) {
    console.error('Error fetching pool details:', error);
    res.status(500).json({
      error: 'Failed to fetch pool details',
      message: error.message
    });
  }
});

// Get user's liquidity position in a pool
router.get('/:poolAddress/position/:userAddress', async (req, res) => {
  try {
    const { poolAddress, userAddress } = req.params;
    
    if (!ethers.isAddress(poolAddress) || !ethers.isAddress(userAddress)) {
      return res.status(400).json({
        error: 'Invalid addresses',
        message: 'Please provide valid pool and user addresses'
      });
    }

    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
    
    const [userBalance, totalSupply, reserves] = await Promise.all([
      poolContract.balanceOf(userAddress),
      poolContract.totalSupply(),
      poolContract.getReserves()
    ]);

    // Calculate user's share of the pool
    const sharePercentage = totalSupply > 0 ? 
      (userBalance * BigInt(10000)) / totalSupply : BigInt(0);

    // Calculate user's token amounts
    const userToken0Amount = totalSupply > 0 ? 
      (userBalance * reserves.reserve0) / totalSupply : BigInt(0);
    const userToken1Amount = totalSupply > 0 ? 
      (userBalance * reserves.reserve1) / totalSupply : BigInt(0);

    res.status(200).json({
      success: true,
      poolAddress,
      userAddress,
      position: {
        lpTokenBalance: userBalance.toString(),
        sharePercentage: Number(sharePercentage) / 100, // Convert to percentage
        token0Amount: userToken0Amount.toString(),
        token1Amount: userToken1Amount.toString()
      }
    });

  } catch (error) {
    console.error('Error fetching user position:', error);
    res.status(500).json({
      error: 'Failed to fetch user position',
      message: error.message
    });
  }
});

module.exports = router;
