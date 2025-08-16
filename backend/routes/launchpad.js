const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Core testnet provider
const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network');

// Contract addresses
const CONTRACT_ADDRESSES = {
  LAUNCH_PAD: process.env.LAUNCH_PAD_ADDRESS
};

// LaunchPad ABI (simplified)
const LAUNCH_PAD_ABI = [
  'event LaunchCreated(uint256 indexed launchId, address indexed token, address indexed creator, uint256 totalAmount, uint256 startTime, uint256 endTime)',
  'event ContributionMade(uint256 indexed launchId, address indexed contributor, uint256 amount)',
  'event TokensClaimed(uint256 indexed launchId, address indexed contributor, uint256 tokenAmount)',
  'event LaunchFinalized(uint256 indexed launchId, uint256 totalRaised)',
  'event LaunchCancelled(uint256 indexed launchId)',
  'function launches(uint256) view returns (address token, address creator, uint256 totalAmount, uint256 startTime, uint256 endTime, uint256 minContribution, uint256 maxContribution, uint256 totalRaised, uint256 totalContributors, bool finalized, bool cancelled, string metadataURI)',
  'function contributions(uint256, address) view returns (uint256 amount, bool claimed)',
  'function getUserLaunches(address user) view returns (uint256[])',
  'function nextLaunchId() view returns (uint256)'
];

// ERC20 ABI for token info
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)'
];

// Get all launches
router.get('/all', async (req, res) => {
  try {
    if (!CONTRACT_ADDRESSES.LAUNCH_PAD) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'LaunchPad contract not deployed yet'
      });
    }

    const launchPad = new ethers.Contract(
      CONTRACT_ADDRESSES.LAUNCH_PAD,
      LAUNCH_PAD_ABI,
      provider
    );

    const nextLaunchId = await launchPad.nextLaunchId();
    const totalLaunches = Number(nextLaunchId) - 1;

    if (totalLaunches <= 0) {
      return res.status(200).json({
        success: true,
        totalCount: 0,
        launches: []
      });
    }

    // Get all launch IDs (starting from 1)
    const launchIds = Array.from({ length: totalLaunches }, (_, i) => i + 1);

    // Fetch launch details
    const launches = await Promise.allSettled(
      launchIds.map(async (launchId) => {
        const launchData = await launchPad.launches(launchId);
        
        // Get token info
        const tokenContract = new ethers.Contract(launchData.token, ERC20_ABI, provider);
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        return {
          launchId,
          token: {
            address: launchData.token,
            name,
            symbol,
            decimals
          },
          creator: launchData.creator,
          totalAmount: launchData.totalAmount.toString(),
          startTime: Number(launchData.startTime),
          endTime: Number(launchData.endTime),
          minContribution: launchData.minContribution.toString(),
          maxContribution: launchData.maxContribution.toString(),
          totalRaised: launchData.totalRaised.toString(),
          totalContributors: Number(launchData.totalContributors),
          finalized: launchData.finalized,
          cancelled: launchData.cancelled,
          metadataURI: launchData.metadataURI,
          status: getLaunchStatus(launchData)
        };
      })
    );

    const successfulLaunches = launches
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .sort((a, b) => b.launchId - a.launchId); // Sort by newest first

    res.status(200).json({
      success: true,
      totalCount: successfulLaunches.length,
      launches: successfulLaunches
    });

  } catch (error) {
    console.error('Error fetching launches:', error);
    res.status(500).json({
      error: 'Failed to fetch launches',
      message: error.message
    });
  }
});

// Get launches by user
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid user address'
      });
    }

    if (!CONTRACT_ADDRESSES.LAUNCH_PAD) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'LaunchPad contract not deployed yet'
      });
    }

    const launchPad = new ethers.Contract(
      CONTRACT_ADDRESSES.LAUNCH_PAD,
      LAUNCH_PAD_ABI,
      provider
    );

    const userLaunchIds = await launchPad.getUserLaunches(address);

    if (userLaunchIds.length === 0) {
      return res.status(200).json({
        success: true,
        userAddress: address,
        count: 0,
        launches: []
      });
    }

    // Fetch launch details
    const launches = await Promise.allSettled(
      userLaunchIds.map(async (launchId) => {
        const launchData = await launchPad.launches(Number(launchId));
        
        // Get token info
        const tokenContract = new ethers.Contract(launchData.token, ERC20_ABI, provider);
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        return {
          launchId: Number(launchId),
          token: {
            address: launchData.token,
            name,
            symbol,
            decimals
          },
          creator: launchData.creator,
          totalAmount: launchData.totalAmount.toString(),
          startTime: Number(launchData.startTime),
          endTime: Number(launchData.endTime),
          minContribution: launchData.minContribution.toString(),
          maxContribution: launchData.maxContribution.toString(),
          totalRaised: launchData.totalRaised.toString(),
          totalContributors: Number(launchData.totalContributors),
          finalized: launchData.finalized,
          cancelled: launchData.cancelled,
          metadataURI: launchData.metadataURI,
          status: getLaunchStatus(launchData)
        };
      })
    );

    const successfulLaunches = launches
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .sort((a, b) => b.launchId - a.launchId);

    res.status(200).json({
      success: true,
      userAddress: address,
      count: successfulLaunches.length,
      launches: successfulLaunches
    });

  } catch (error) {
    console.error('Error fetching user launches:', error);
    res.status(500).json({
      error: 'Failed to fetch user launches',
      message: error.message
    });
  }
});

// Get specific launch details
router.get('/:launchId', async (req, res) => {
  try {
    const { launchId } = req.params;
    const id = parseInt(launchId);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Invalid launch ID',
        message: 'Launch ID must be a positive integer'
      });
    }

    if (!CONTRACT_ADDRESSES.LAUNCH_PAD) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'LaunchPad contract not deployed yet'
      });
    }

    const launchPad = new ethers.Contract(
      CONTRACT_ADDRESSES.LAUNCH_PAD,
      LAUNCH_PAD_ABI,
      provider
    );

    const launchData = await launchPad.launches(id);
    
    // Check if launch exists
    if (launchData.token === ethers.ZeroAddress) {
      return res.status(404).json({
        error: 'Launch not found',
        message: `Launch with ID ${id} does not exist`
      });
    }

    // Get token info
    const tokenContract = new ethers.Contract(launchData.token, ERC20_ABI, provider);
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);

    const launch = {
      launchId: id,
      token: {
        address: launchData.token,
        name,
        symbol,
        decimals
      },
      creator: launchData.creator,
      totalAmount: launchData.totalAmount.toString(),
      startTime: Number(launchData.startTime),
      endTime: Number(launchData.endTime),
      minContribution: launchData.minContribution.toString(),
      maxContribution: launchData.maxContribution.toString(),
      totalRaised: launchData.totalRaised.toString(),
      totalContributors: Number(launchData.totalContributors),
      finalized: launchData.finalized,
      cancelled: launchData.cancelled,
      metadataURI: launchData.metadataURI,
      status: getLaunchStatus(launchData)
    };

    res.status(200).json({
      success: true,
      launch
    });

  } catch (error) {
    console.error('Error fetching launch:', error);
    res.status(500).json({
      error: 'Failed to fetch launch',
      message: error.message
    });
  }
});

// Get user contribution for a specific launch
router.get('/:launchId/contribution/:userAddress', async (req, res) => {
  try {
    const { launchId, userAddress } = req.params;
    const id = parseInt(launchId);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Invalid launch ID',
        message: 'Launch ID must be a positive integer'
      });
    }

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid user address'
      });
    }

    if (!CONTRACT_ADDRESSES.LAUNCH_PAD) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'LaunchPad contract not deployed yet'
      });
    }

    const launchPad = new ethers.Contract(
      CONTRACT_ADDRESSES.LAUNCH_PAD,
      LAUNCH_PAD_ABI,
      provider
    );

    const [contribution, launchData] = await Promise.all([
      launchPad.contributions(id, userAddress),
      launchPad.launches(id)
    ]);

    // Calculate potential token allocation
    let tokenAllocation = '0';
    if (contribution.amount > 0 && launchData.totalRaised > 0) {
      const allocation = (contribution.amount * launchData.totalAmount) / launchData.totalRaised;
      tokenAllocation = allocation.toString();
    }

    res.status(200).json({
      success: true,
      launchId: id,
      userAddress,
      contribution: {
        amount: contribution.amount.toString(),
        claimed: contribution.claimed,
        tokenAllocation
      }
    });

  } catch (error) {
    console.error('Error fetching contribution:', error);
    res.status(500).json({
      error: 'Failed to fetch contribution',
      message: error.message
    });
  }
});

// Helper function to determine launch status
function getLaunchStatus(launchData) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = Number(launchData.startTime);
  const endTime = Number(launchData.endTime);

  if (launchData.cancelled) {
    return 'cancelled';
  }
  
  if (launchData.finalized) {
    return 'finalized';
  }
  
  if (now < startTime) {
    return 'upcoming';
  }
  
  if (now >= startTime && now <= endTime) {
    return 'active';
  }
  
  if (now > endTime) {
    return 'ended';
  }
  
  return 'unknown';
}

module.exports = router;
