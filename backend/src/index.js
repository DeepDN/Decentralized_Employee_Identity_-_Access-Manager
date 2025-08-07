const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Simple logger
const logger = {
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.WALLET_URL || 'http://localhost:3002',
    ],
    credentials: true,
  }),
);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn('No authorization header provided');
    return res.status(401).json({ error: 'Authorization header required' });
  }
  logger.info('Auth middleware passed');
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.get('/api/employees', authMiddleware, (req, res) => {
  logger.info('GET /api/employees');
  res.json({
    message: 'Employee API working',
    employees: [],
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/employees', authMiddleware, (req, res) => {
  logger.info('POST /api/employees', req.body);
  res.json({
    message: 'Employee created successfully',
    employee: { id: Date.now(), ...req.body },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/credentials', authMiddleware, (req, res) => {
  logger.info('GET /api/credentials');
  res.json({
    message: 'Credential API working',
    credentials: [],
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/credentials', authMiddleware, (req, res) => {
  logger.info('POST /api/credentials', req.body);
  res.json({
    message: 'Credential created successfully',
    credential: { id: Date.now(), ...req.body },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/did', authMiddleware, (req, res) => {
  logger.info('GET /api/did');
  res.json({
    message: 'DID API working',
    dids: [],
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/did/create', authMiddleware, (req, res) => {
  logger.info('POST /api/did/create', req.body);
  const { employeeId, didMethod } = req.body;
  res.json({
    message: 'DID creation initiated',
    did: `did:key:${Date.now()}`,
    employeeId,
    didMethod: didMethod || 'did:key',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/verify/credential', (req, res) => {
  logger.info('POST /api/verify/credential', req.body);
  res.json({
    message: 'Credential verification completed',
    verified: true,
    credential: req.body,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/access-logs', authMiddleware, (req, res) => {
  logger.info('GET /api/access-logs');
  res.json({
    message: 'Access logs API working',
    logs: [],
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, _next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Available endpoints:');
  logger.info('  GET  /health');
  logger.info('  GET  /api/employees');
  logger.info('  POST /api/employees');
  logger.info('  GET  /api/credentials');
  logger.info('  POST /api/credentials');
  logger.info('  GET  /api/did');
  logger.info('  POST /api/did/create');
  logger.info('  POST /api/verify/credential');
  logger.info('  GET  /api/access-logs');
});

module.exports = app;
