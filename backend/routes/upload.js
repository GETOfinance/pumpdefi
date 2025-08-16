const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Initialize Pinata
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and JSON files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only image and JSON files are allowed'), false);
    }
  }
});

// Upload image to IPFS
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please provide an image file'
      });
    }

    const options = {
      pinataMetadata: {
        name: req.body.name || `image-${uuidv4()}`,
        keyvalues: {
          type: 'image',
          uploadedAt: new Date().toISOString(),
          originalName: req.file.originalname
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    // Upload to Pinata
    const result = await pinata.pinFileToIPFS(req.file.buffer, options);
    
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    res.status(200).json({
      success: true,
      ipfsHash: result.IpfsHash,
      ipfsUrl: ipfsUrl,
      size: result.PinSize,
      timestamp: result.Timestamp
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Upload base64 image to IPFS (for compatibility with original Zentra)
router.post('/image-base64', async (req, res) => {
  try {
    const { image, name } = req.body;
    
    if (!image) {
      return res.status(400).json({
        error: 'No image data provided',
        message: 'Please provide base64 image data'
      });
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const options = {
      pinataMetadata: {
        name: name || `image-${uuidv4()}`,
        keyvalues: {
          type: 'image',
          uploadedAt: new Date().toISOString(),
          format: 'base64'
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    // Upload to Pinata
    const result = await pinata.pinFileToIPFS(buffer, options);
    
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    res.status(200).json({
      success: true,
      ipfsHash: result.IpfsHash,
      ipfsUrl: ipfsUrl,
      size: result.PinSize,
      timestamp: result.Timestamp
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Upload JSON metadata to IPFS
router.post('/metadata', async (req, res) => {
  try {
    const { metadata, name } = req.body;
    
    if (!metadata) {
      return res.status(400).json({
        error: 'No metadata provided',
        message: 'Please provide metadata object'
      });
    }

    const options = {
      pinataMetadata: {
        name: name || `metadata-${uuidv4()}`,
        keyvalues: {
          type: 'metadata',
          uploadedAt: new Date().toISOString()
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    // Upload to Pinata
    const result = await pinata.pinJSONToIPFS(metadata, options);
    
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    res.status(200).json({
      success: true,
      ipfsHash: result.IpfsHash,
      ipfsUrl: ipfsUrl,
      size: result.PinSize,
      timestamp: result.Timestamp
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Get pinned files list
router.get('/pinned', async (req, res) => {
  try {
    const result = await pinata.pinList({
      status: 'pinned',
      pageLimit: 100
    });
    
    res.status(200).json({
      success: true,
      count: result.count,
      files: result.rows
    });

  } catch (error) {
    console.error('Error fetching pinned files:', error);
    res.status(500).json({
      error: 'Failed to fetch pinned files',
      message: error.message
    });
  }
});

module.exports = router;
