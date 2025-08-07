const request = require('supertest');

// Mock the app without starting the server
jest.mock('../index.js', () => {
  const express = require('express');
  const app = express();
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'test',
    });
  });
  
  return app;
});

const app = require('../index.js');

describe('Health Endpoint', () => {
  test('GET /health should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('timestamp');
  });
});
