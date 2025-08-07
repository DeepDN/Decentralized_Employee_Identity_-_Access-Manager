const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Route imports
const employeeRoutes = require('./controllers/employeeController');
const credentialRoutes = require('./controllers/credentialController');
const didRoutes = require('./controllers/didController');
const verificationRoutes = require('./controllers/verificationController');
const accessLogRoutes = require('./controllers/accessLogController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.WALLET_URL || 'http://localhost:3002'
  ],
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/employees', authMiddleware, employeeRoutes);
app.use('/api/credentials', authMiddleware, credentialRoutes);
app.use('/api/did', authMiddleware, didRoutes);
app.use('/api/verify', verificationRoutes); // Public verification endpoint
app.use('/api/access-logs', authMiddleware, accessLogRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
