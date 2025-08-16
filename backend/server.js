const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const uploadRoutes = require('./routes/upload');
const priceRoutes = require('./routes/price');
const rpcRoutes = require('./routes/rpc');
const tokenRoutes = require('./routes/tokens');
const launchpadRoutes = require('./routes/launchpad');
const poolRoutes = require('./routes/pools');
const airdropRoutes = require('./routes/airdrop');
const pumpRoutes = require('./routes/pump');
const analyticsRoutes = require('./routes/analytics');
const affiliateRoutes = require('./routes/affiliate');
const stakingRoutes = require('./routes/staking');
const lendRoutes = require('./routes/lend');
const borrowRoutes = require('./routes/borrow');

const lendingV2Routes = require('./routes/lendingv2');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration (allow multiple localhost ports for dev/preview)
const envOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:3000'
]
const allowedOrigins = envOrigins.length ? Array.from(new Set([...envOrigins, ...defaultOrigins])) : defaultOrigins
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    return cb(null, allowedOrigins.includes(origin))
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version
  });
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/rpc', rpcRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/launchpad', launchpadRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/airdrop', airdropRoutes);
app.use('/api/pump', pumpRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/lendingv2', lendingV2Routes);

app.use('/api/lend', lendRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/portfolio', require('./routes/portfolio'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      message: 'Please check your request body format'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request body exceeds size limit'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export app for testing, and start server only when run directly
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Zentra Core Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    console.log(`⛓️  Core RPC: ${process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network'}`);
  });
}
