const express = require('express');
const axios = require('axios');
const { ethers } = require('ethers');
const router = express.Router();

// Core testnet RPC URL
const CORE_RPC_URL = process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network';

// Create provider instance
const provider = new ethers.JsonRpcProvider(CORE_RPC_URL);

// RPC proxy endpoint
router.post('/proxy', async (req, res) => {
  try {
    const { method, params = [] } = req.body;
    
    if (!method) {
      return res.status(400).json({
        error: 'Missing method',
        message: 'RPC method is required'
      });
    }

    // Forward the RPC call to Core testnet
    const response = await axios.post(CORE_RPC_URL, {
      jsonrpc: '2.0',
      method,
      params,
      id: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    res.status(200).json(response.data);

  } catch (error) {
    console.error('RPC proxy error:', error);
    
    if (error.response) {
      // Forward the error response from the RPC server
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'RPC call failed',
        message: error.message
      });
    }
  }
});

// Get network information
router.get('/network', async (req, res) => {
  try {
    const [network, blockNumber, gasPrice] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      provider.getFeeData()
    ]);

    res.status(200).json({
      chainId: Number(network.chainId),
      name: network.name || 'Core Testnet',
      blockNumber,
      gasPrice: {
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      },
      rpcUrl: CORE_RPC_URL
    });

  } catch (error) {
    console.error('Error fetching network info:', error);
    res.status(500).json({
      error: 'Failed to fetch network information',
      message: error.message
    });
  }
});

// Get block information
router.get('/block/:blockNumber?', async (req, res) => {
  try {
    const { blockNumber } = req.params;
    const blockTag = blockNumber ? parseInt(blockNumber) : 'latest';
    
    const block = await provider.getBlock(blockTag, true); // Include transactions
    
    if (!block) {
      return res.status(404).json({
        error: 'Block not found',
        message: `Block ${blockTag} does not exist`
      });
    }

    res.status(200).json({
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      miner: block.miner,
      difficulty: block.difficulty?.toString(),
      totalDifficulty: block.totalDifficulty?.toString(),
      size: block.length,
      transactionCount: block.transactions.length,
      transactions: block.transactions.slice(0, 10) // Limit to first 10 transactions
    });

  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(500).json({
      error: 'Failed to fetch block information',
      message: error.message
    });
  }
});

// Get transaction information
router.get('/transaction/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!ethers.isHexString(hash, 32)) {
      return res.status(400).json({
        error: 'Invalid transaction hash',
        message: 'Transaction hash must be a valid 32-byte hex string'
      });
    }

    const [tx, receipt] = await Promise.all([
      provider.getTransaction(hash),
      provider.getTransactionReceipt(hash).catch(() => null)
    ]);

    if (!tx) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: `Transaction ${hash} does not exist`
      });
    }

    res.status(200).json({
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      transactionIndex: tx.index,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      gasLimit: tx.gasLimit.toString(),
      gasPrice: tx.gasPrice?.toString(),
      maxFeePerGas: tx.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
      nonce: tx.nonce,
      data: tx.data,
      type: tx.type,
      status: receipt?.status,
      gasUsed: receipt?.gasUsed?.toString(),
      effectiveGasPrice: receipt?.gasPrice?.toString(),
      logs: receipt?.logs || []
    });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction information',
      message: error.message
    });
  }
});

// Get account balance and information
router.get('/account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
      });
    }

    const [balance, nonce, code] = await Promise.all([
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getCode(address)
    ]);

    const isContract = code !== '0x';

    res.status(200).json({
      address,
      balance: balance.toString(),
      balanceEther: ethers.formatEther(balance),
      nonce,
      isContract,
      codeSize: code.length > 2 ? (code.length - 2) / 2 : 0 // Convert hex to bytes
    });

  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({
      error: 'Failed to fetch account information',
      message: error.message
    });
  }
});

// Estimate gas for a transaction
router.post('/estimate-gas', async (req, res) => {
  try {
    const { to, from, value, data } = req.body;
    
    const transaction = {
      to,
      from,
      value: value ? ethers.parseEther(value.toString()) : undefined,
      data
    };

    const gasEstimate = await provider.estimateGas(transaction);
    const feeData = await provider.getFeeData();

    res.status(200).json({
      gasLimit: gasEstimate.toString(),
      gasPrice: feeData.gasPrice?.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
      estimatedCost: feeData.gasPrice ? 
        (gasEstimate * feeData.gasPrice).toString() : null
    });

  } catch (error) {
    console.error('Error estimating gas:', error);
    res.status(500).json({
      error: 'Failed to estimate gas',
      message: error.message
    });
  }
});

// Health check for RPC connection
router.get('/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    res.status(200).json({
      status: 'healthy',
      rpcUrl: CORE_RPC_URL,
      chainId: Number(network.chainId),
      latestBlock: blockNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('RPC health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      rpcUrl: CORE_RPC_URL,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
