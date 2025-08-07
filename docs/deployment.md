# Deployment Guide

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade

## Quick Deployment Steps

### 1. Prerequisites

```bash
# Install Node.js 18+
node --version  # Should be 18+

# Install AWS CLI
aws --version

# Configure AWS credentials
aws configure
```

### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git
cd Decentralized_Employee_Identity_-_Access-Manager

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Required Environment Variables:**
```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_PRIVATE_KEY=your_polygon_private_key

# Security
JWT_SECRET=your_jwt_secret
VERAMO_KMS_SECRET_KEY=your_veramo_secret
```

### 4. Deploy Infrastructure

```bash
# Deploy to staging
aws cloudformation deploy \
  --template-file infrastructure/staging.yaml \
  --stack-name employee-identity-staging \
  --parameter-overrides \
    Environment=staging \
    PolygonRpcUrl=$POLYGON_RPC_URL \
    PolygonPrivateKey=$POLYGON_PRIVATE_KEY \
    VeramoKmsSecret=$VERAMO_KMS_SECRET \
  --capabilities CAPABILITY_IAM

# Deploy to production
aws cloudformation deploy \
  --template-file infrastructure/production.yaml \
  --stack-name employee-identity-production \
  --parameter-overrides \
    Environment=production \
    PolygonRpcUrl=$POLYGON_MAINNET_RPC_URL \
    PolygonPrivateKey=$POLYGON_PRIVATE_KEY_PROD \
    VeramoKmsSecret=$VERAMO_KMS_SECRET_PROD \
  --capabilities CAPABILITY_IAM
```

### 5. Deploy Smart Contracts

```bash
cd contracts

# Deploy to Mumbai testnet (staging)
npm run deploy:mumbai

# Deploy to Polygon mainnet (production)
npm run deploy:polygon
```

### 6. Build and Deploy Applications

```bash
# Build all applications
npm run build

# Deploy using automated scripts
npm run deploy:staging  # For staging
npm run deploy:prod     # For production
```

## Development Deployment

### Local Development

```bash
# Start local DynamoDB
docker run -p 8000:8000 amazon/dynamodb-local:latest

# Start all services
npm run dev
```

**Access URLs:**
- Admin Dashboard: http://localhost:3000
- Employee Wallet: http://localhost:3002
- API Server: http://localhost:3001

### Testing

```bash
# Run all tests
npm test

# Run specific tests
cd backend && npm test
cd frontend && npm test
cd contracts && npm test
```

## Production Deployment

### AWS Infrastructure

The system uses the following AWS services:

- **API Gateway** - API routing and management
- **Lambda** - Serverless functions
- **DynamoDB** - Database storage
- **S3** - File storage
- **KMS** - Key management
- **Cognito** - Authentication
- **CloudWatch** - Monitoring

### Monitoring

```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix employee-identity

# Monitor DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=employees-production \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### Backup and Recovery

```bash
# Enable DynamoDB Point-in-Time Recovery
aws dynamodb put-backup-policy \
  --table-name employees-production \
  --backup-policy BackupEnabled=true

# Create manual backup
aws dynamodb create-backup \
  --table-name employees-production \
  --backup-name employees-backup-$(date +%Y%m%d)
```

## CI/CD Pipeline

The project includes automated deployment via GitHub Actions:

### Staging Deployment
- Triggered on push to `develop` branch
- Runs tests and security scans
- Deploys to staging environment

### Production Deployment
- Triggered on push to `main` branch
- Requires manual approval
- Deploys to production environment

### GitHub Secrets Required

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
POLYGON_RPC_URL
POLYGON_PRIVATE_KEY
POLYGON_PRIVATE_KEY_PROD
VERAMO_KMS_SECRET
VERAMO_KMS_SECRET_PROD
SNYK_TOKEN
SLACK_WEBHOOK
```

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**
   ```bash
   nvm use 18
   ```

2. **AWS credentials not configured**
   ```bash
   aws configure
   aws sts get-caller-identity
   ```

3. **DynamoDB connection issues**
   ```bash
   aws dynamodb list-tables --region us-east-1
   ```

4. **Smart contract deployment fails**
   ```bash
   # Check network status and wallet balance
   cd contracts
   npx hardhat run scripts/check-balance.js --network mumbai
   ```

### Health Checks

```bash
# API health check
curl http://localhost:3001/health

# Database connectivity
aws dynamodb describe-table --table-name employees-staging

# Blockchain connectivity
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://rpc-mumbai.maticvigil.com
```

### Performance Optimization

1. **Enable DynamoDB Auto Scaling**
2. **Configure CloudFront for frontend**
3. **Optimize Lambda memory allocation**
4. **Enable API Gateway caching**

## Security Checklist

- [ ] Update all environment variables
- [ ] Enable MFA for AWS accounts
- [ ] Configure proper IAM roles
- [ ] Set up monitoring and alerting
- [ ] Regular dependency updates
- [ ] Security scanning enabled
- [ ] Backup and recovery tested

## Support

For deployment issues:
- **GitHub Issues**: [Create an issue](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager/issues)
- **Documentation**: Check [docs/](docs/) directory
- **Developer**: Contact Deepak Nemade

---

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade
