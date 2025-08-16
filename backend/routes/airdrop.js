const express = require('express');
const { ethers } = require('ethers');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const router = express.Router();

// Core testnet provider
const provider = new ethers.JsonRpcProvider(process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network');

// Contract addresses
const CONTRACT_ADDRESSES = {
  STANDARD_AIRDROP: process.env.STANDARD_AIRDROP_ADDRESS,
  MERKLE_AIRDROP: process.env.MERKLE_AIRDROP_ADDRESS
};

// Airdrop ABI
const AIRDROP_ABI = [
  'function nextAirdropId() view returns (uint256)',
  'function airdrops(uint256) view returns (address token, address creator, uint256 totalAmount, uint256 claimedAmount, uint256 startTime, uint256 endTime, bool active, string metadataURI)',
  'function getUserAirdrops(address user) view returns (uint256[])',
  'function getClaimedAmount(uint256 airdropId, address recipient) view returns (uint256)',
  'function isClaimable(uint256 airdropId) view returns (bool)',
  'function creationFee() view returns (uint256)',
  'event AirdropCreated(uint256 indexed airdropId, address indexed token, address indexed creator, uint256 totalAmount, uint256 startTime, uint256 endTime)',
  'event TokensClaimed(uint256 indexed airdropId, address indexed recipient, uint256 amount)'
];

// Standard Airdrop specific ABI
const STANDARD_AIRDROP_ABI = [
  ...AIRDROP_ABI,
  'function getRecipients(uint256 airdropId) view returns (address[], uint256[])',
  'function getClaimableAmount(uint256 airdropId, address recipient) view returns (uint256)'
];

// Merkle Airdrop specific ABI
const MERKLE_AIRDROP_ABI = [
  ...AIRDROP_ABI,
  'function getMerkleAirdropInfo(uint256 airdropId) view returns (tuple(address token, address creator, uint256 totalAmount, uint256 claimedAmount, uint256 startTime, uint256 endTime, bool active, string metadataURI, bytes32 merkleRoot))',
  'function hasClaimed(uint256 airdropId, address recipient) view returns (bool)',
  'function verifyMerkleProof(bytes32[] memory proof, bytes32 root, bytes32 leaf) pure returns (bool)'
];

// ERC20 ABI for token info
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Get all airdrops (both standard and merkle)
router.get('/all', async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const airdrops = [];

    // Get Standard Airdrops
    if (type === 'all' || type === 'standard') {
      if (CONTRACT_ADDRESSES.STANDARD_AIRDROP) {
        const standardAirdrop = new ethers.Contract(
          CONTRACT_ADDRESSES.STANDARD_AIRDROP,
          STANDARD_AIRDROP_ABI,
          provider
        );

        try {
          const nextId = await standardAirdrop.nextAirdropId();
          const totalAirdrops = Number(nextId) - 1;

          if (totalAirdrops > 0) {
            const airdropIds = Array.from({ length: totalAirdrops }, (_, i) => i + 1);
            const standardAirdrops = await Promise.allSettled(
              airdropIds.map(async (id) => {
                const airdropData = await standardAirdrop.airdrops(id);
                const tokenContract = new ethers.Contract(airdropData.token, ERC20_ABI, provider);
                const [tokenName, tokenSymbol, tokenDecimals] = await Promise.all([
                  tokenContract.name(),
                  tokenContract.symbol(),
                  tokenContract.decimals()
                ]);

                return {
                  id,
                  type: 'standard',
                  token: {
                    address: airdropData.token,
                    name: tokenName,
                    symbol: tokenSymbol,
                    decimals: Number(tokenDecimals)
                  },
                  creator: airdropData.creator,
                  totalAmount: airdropData.totalAmount.toString(),
                  claimedAmount: airdropData.claimedAmount.toString(),
                  startTime: Number(airdropData.startTime),
                  endTime: Number(airdropData.endTime),
                  active: airdropData.active,
                  metadataURI: airdropData.metadataURI,
                  contractAddress: CONTRACT_ADDRESSES.STANDARD_AIRDROP
                };
              })
            );

            airdrops.push(...standardAirdrops
              .filter(result => result.status === 'fulfilled')
              .map(result => result.value)
            );
          }
        } catch (error) {
          console.error('Error fetching standard airdrops:', error);
        }
      }
    }

    // Get Merkle Airdrops
    if (type === 'all' || type === 'merkle') {
      if (CONTRACT_ADDRESSES.MERKLE_AIRDROP) {
        const merkleAirdrop = new ethers.Contract(
          CONTRACT_ADDRESSES.MERKLE_AIRDROP,
          MERKLE_AIRDROP_ABI,
          provider
        );

        try {
          const nextId = await merkleAirdrop.nextAirdropId();
          const totalAirdrops = Number(nextId) - 1;

          if (totalAirdrops > 0) {
            const airdropIds = Array.from({ length: totalAirdrops }, (_, i) => i + 1);
            const merkleAirdrops = await Promise.allSettled(
              airdropIds.map(async (id) => {
                const airdropData = await merkleAirdrop.getMerkleAirdropInfo(id);
                const tokenContract = new ethers.Contract(airdropData.token, ERC20_ABI, provider);
                const [tokenName, tokenSymbol, tokenDecimals] = await Promise.all([
                  tokenContract.name(),
                  tokenContract.symbol(),
                  tokenContract.decimals()
                ]);

                return {
                  id,
                  type: 'merkle',
                  token: {
                    address: airdropData.token,
                    name: tokenName,
                    symbol: tokenSymbol,
                    decimals: Number(tokenDecimals)
                  },
                  creator: airdropData.creator,
                  totalAmount: airdropData.totalAmount.toString(),
                  claimedAmount: airdropData.claimedAmount.toString(),
                  startTime: Number(airdropData.startTime),
                  endTime: Number(airdropData.endTime),
                  active: airdropData.active,
                  metadataURI: airdropData.metadataURI,
                  merkleRoot: airdropData.merkleRoot,
                  contractAddress: CONTRACT_ADDRESSES.MERKLE_AIRDROP
                };
              })
            );

            airdrops.push(...merkleAirdrops
              .filter(result => result.status === 'fulfilled')
              .map(result => result.value)
            );
          }
        } catch (error) {
          console.error('Error fetching merkle airdrops:', error);
        }
      }
    }

    // Sort by newest first
    airdrops.sort((a, b) => b.id - a.id);

    res.status(200).json({
      success: true,
      totalCount: airdrops.length,
      airdrops
    });

  } catch (error) {
    console.error('Error fetching airdrops:', error);
    res.status(500).json({
      error: 'Failed to fetch airdrops',
      message: error.message
    });
  }
});

// Get airdrops by user
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid user address'
      });
    }

    const userAirdrops = [];

    // Get user's standard airdrops
    if (CONTRACT_ADDRESSES.STANDARD_AIRDROP) {
      try {
        const standardAirdrop = new ethers.Contract(
          CONTRACT_ADDRESSES.STANDARD_AIRDROP,
          STANDARD_AIRDROP_ABI,
          provider
        );

        const standardIds = await standardAirdrop.getUserAirdrops(address);
        
        if (standardIds.length > 0) {
          const standardAirdrops = await Promise.allSettled(
            standardIds.map(async (id) => {
              const airdropData = await standardAirdrop.airdrops(id);
              return {
                id: Number(id),
                type: 'standard',
                ...airdropData,
                contractAddress: CONTRACT_ADDRESSES.STANDARD_AIRDROP
              };
            })
          );

          userAirdrops.push(...standardAirdrops
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
          );
        }
      } catch (error) {
        console.error('Error fetching user standard airdrops:', error);
      }
    }

    // Get user's merkle airdrops
    if (CONTRACT_ADDRESSES.MERKLE_AIRDROP) {
      try {
        const merkleAirdrop = new ethers.Contract(
          CONTRACT_ADDRESSES.MERKLE_AIRDROP,
          MERKLE_AIRDROP_ABI,
          provider
        );

        const merkleIds = await merkleAirdrop.getUserAirdrops(address);
        
        if (merkleIds.length > 0) {
          const merkleAirdrops = await Promise.allSettled(
            merkleIds.map(async (id) => {
              const airdropData = await merkleAirdrop.getMerkleAirdropInfo(id);
              return {
                id: Number(id),
                type: 'merkle',
                ...airdropData,
                contractAddress: CONTRACT_ADDRESSES.MERKLE_AIRDROP
              };
            })
          );

          userAirdrops.push(...merkleAirdrops
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
          );
        }
      } catch (error) {
        console.error('Error fetching user merkle airdrops:', error);
      }
    }

    res.status(200).json({
      success: true,
      userAddress: address,
      count: userAirdrops.length,
      airdrops: userAirdrops
    });

  } catch (error) {
    console.error('Error fetching user airdrops:', error);
    res.status(500).json({
      error: 'Failed to fetch user airdrops',
      message: error.message
    });
  }
});

// Process CSV file for airdrop recipients
router.post('/process-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please provide a CSV file'
      });
    }

    const recipients = [];
    const errors = [];
    let totalAmount = 0;

    // Parse CSV data
    const stream = Readable.from(req.file.buffer);

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row, index) => {
          try {
            // Accept flexible CSVs:
            // - With headers: address[,amount]
            // - Without headers: first column address, second optional amount
            let address = row.address || row.Address || row.ADDRESS
            let amount = row.amount || row.Amount || row.AMOUNT

            const cols = Object.values(row).map(v => (v ?? '').toString().trim()).filter(Boolean)
            if (!address && cols.length >= 1 && ethers.isAddress(cols[0])) {
              address = cols[0]
            }
            if (amount == null && cols.length >= 2) {
              amount = cols[1]
            }

            if (!address) {
              errors.push({ row: index + 1, error: 'Missing address', data: row })
              return
            }
            if (!ethers.isAddress(address)) {
              errors.push({ row: index + 1, error: 'Invalid address format', address })
              return
            }

            let parsedAmount = undefined
            if (amount !== undefined && amount !== '') {
              const n = parseFloat(amount)
              if (!isNaN(n) && n > 0) parsedAmount = n
              else {
                // Keep recipient (address-only), but record amount issue
                errors.push({ row: index + 1, error: 'Invalid amount', amount })
              }
            }

            recipients.push({
              address: address.toLowerCase(),
              amount: parsedAmount ?? 0
            })

            if (parsedAmount) totalAmount += parsedAmount
          } catch (error) {
            errors.push({ row: index + 1, error: error.message, data: row })
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Remove duplicates (keep last occurrence)
    const uniqueRecipients = [];
    const addressMap = new Map();

    recipients.forEach(recipient => {
      addressMap.set(recipient.address, recipient);
    });

    addressMap.forEach(recipient => {
      uniqueRecipients.push(recipient);
    });

    res.status(200).json({
      success: true,
      recipients: uniqueRecipients,
      totalRecipients: uniqueRecipients.length,
      totalAmount,
      duplicatesRemoved: recipients.length - uniqueRecipients.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({
      error: 'Failed to process CSV file',
      message: error.message
    });
  }
});

// Generate merkle tree for merkle airdrop
router.post('/generate-merkle-tree', async (req, res) => {
  try {
    const { recipients } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: 'Invalid recipients',
        message: 'Please provide an array of recipients with address and amount'
      });
    }

    // Validate recipients
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      if (!recipient.address || !recipient.amount) {
        return res.status(400).json({
          error: 'Invalid recipient data',
          message: `Recipient at index ${i} is missing address or amount`
        });
      }

      if (!ethers.isAddress(recipient.address)) {
        return res.status(400).json({
          error: 'Invalid address',
          message: `Invalid address at index ${i}: ${recipient.address}`
        });
      }
    }

    // Generate merkle tree (simplified implementation)
    const leaves = recipients.map(recipient => {
      const amountWei = ethers.parseEther(recipient.amount.toString());
      return ethers.keccak256(
        ethers.solidityPacked(['address', 'uint256'], [recipient.address, amountWei])
      );
    });

    // Simple merkle tree implementation
    function generateMerkleTree(leaves) {
      if (leaves.length === 0) return null;
      if (leaves.length === 1) return leaves[0];

      const tree = [leaves];
      let currentLevel = leaves;

      while (currentLevel.length > 1) {
        const nextLevel = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
          const left = currentLevel[i];
          const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

          const combined = left <= right
            ? ethers.keccak256(ethers.concat([left, right]))
            : ethers.keccak256(ethers.concat([right, left]));

          nextLevel.push(combined);
        }

        tree.push(nextLevel);
        currentLevel = nextLevel;
      }

      return {
        root: currentLevel[0],
        tree,
        leaves
      };
    }

    function generateProof(tree, leafIndex) {
      const proof = [];
      let currentIndex = leafIndex;

      for (let level = 0; level < tree.length - 1; level++) {
        const currentLevel = tree[level];
        const isRightNode = currentIndex % 2 === 1;
        const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

        if (siblingIndex < currentLevel.length) {
          proof.push(currentLevel[siblingIndex]);
        }

        currentIndex = Math.floor(currentIndex / 2);
      }

      return proof;
    }

    const merkleTree = generateMerkleTree(leaves);

    // Generate proofs for all recipients
    const recipientsWithProofs = recipients.map((recipient, index) => ({
      ...recipient,
      leaf: leaves[index],
      proof: generateProof(merkleTree.tree, index)
    }));

    res.status(200).json({
      success: true,
      merkleRoot: merkleTree.root,
      totalRecipients: recipients.length,
      recipients: recipientsWithProofs
    });

  } catch (error) {
    console.error('Error generating merkle tree:', error);
    res.status(500).json({
      error: 'Failed to generate merkle tree',
      message: error.message
    });
  }
});

// Get airdrop details by ID and type
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!['standard', 'merkle'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid airdrop type',
        message: 'Type must be either "standard" or "merkle"'
      });
    }

    const airdropId = parseInt(id);
    if (isNaN(airdropId) || airdropId <= 0) {
      return res.status(400).json({
        error: 'Invalid airdrop ID',
        message: 'Airdrop ID must be a positive number'
      });
    }

    let contractAddress, abi;

    if (type === 'standard') {
      contractAddress = CONTRACT_ADDRESSES.STANDARD_AIRDROP;
      abi = STANDARD_AIRDROP_ABI;
    } else {
      contractAddress = CONTRACT_ADDRESSES.MERKLE_AIRDROP;
      abi = MERKLE_AIRDROP_ABI;
    }

    if (!contractAddress) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: `${type} airdrop contract not deployed yet`
      });
    }

    const airdropContract = new ethers.Contract(contractAddress, abi, provider);

    let airdropData;
    if (type === 'merkle') {
      airdropData = await airdropContract.getMerkleAirdropInfo(airdropId);
    } else {
      airdropData = await airdropContract.airdrops(airdropId);
    }

    // Get token information
    const tokenContract = new ethers.Contract(airdropData.token, ERC20_ABI, provider);
    const [tokenName, tokenSymbol, tokenDecimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);

    const result = {
      id: airdropId,
      type,
      token: {
        address: airdropData.token,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: Number(tokenDecimals)
      },
      creator: airdropData.creator,
      totalAmount: airdropData.totalAmount.toString(),
      claimedAmount: airdropData.claimedAmount.toString(),
      startTime: Number(airdropData.startTime),
      endTime: Number(airdropData.endTime),
      active: airdropData.active,
      metadataURI: airdropData.metadataURI,
      contractAddress
    };

    // Add merkle-specific data
    if (type === 'merkle') {
      result.merkleRoot = airdropData.merkleRoot;
    }

    // Add recipients for standard airdrop
    if (type === 'standard') {
      try {
        const [addresses, amounts] = await airdropContract.getRecipients(airdropId);
        result.recipients = addresses.map((address, index) => ({
          address,
          amount: amounts[index].toString()
        }));
      } catch (error) {
        console.error('Error fetching recipients:', error);
        result.recipients = [];
      }
    }

    res.status(200).json({
      success: true,
      airdrop: result
    });

  } catch (error) {
    console.error('Error fetching airdrop details:', error);
    res.status(500).json({
      error: 'Failed to fetch airdrop details',
      message: error.message
    });
  }
});

// Get creation fees
router.get('/creation-fees', async (req, res) => {
  try {
    const fees = {};

    if (CONTRACT_ADDRESSES.STANDARD_AIRDROP) {
      const standardAirdrop = new ethers.Contract(
        CONTRACT_ADDRESSES.STANDARD_AIRDROP,
        STANDARD_AIRDROP_ABI,
        provider
      );
      fees.standard = (await standardAirdrop.creationFee()).toString();
    }

    if (CONTRACT_ADDRESSES.MERKLE_AIRDROP) {
      const merkleAirdrop = new ethers.Contract(
        CONTRACT_ADDRESSES.MERKLE_AIRDROP,
        MERKLE_AIRDROP_ABI,
        provider
      );
      fees.merkle = (await merkleAirdrop.creationFee()).toString();
    }

    res.status(200).json({
      success: true,
      fees
    });

  } catch (error) {
    console.error('Error fetching creation fees:', error);
    res.status(500).json({
      error: 'Failed to fetch creation fees',
      message: error.message
    });
  }
});

module.exports = router;
