# Decentralized Employee Identity & Access Manager

**A comprehensive solution for managing employee identities and access using Self-Sovereign Identity (SSI) standards, Verifiable Credentials, and blockchain technology.**

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Decentralized Employee Identity & Access Manager enables organizations to issue, manage, and verify employee credentials using blockchain technology and Self-Sovereign Identity standards. The system provides secure, automated, and decentralized access management for applications like GitHub, Slack, AWS, and other enterprise tools.

### Key Benefits

- **Decentralized Identity**: Employees own and control their digital identities
- **Secure Access**: Cryptographically signed credentials with blockchain anchoring
- **Automated Verification**: Real-time credential verification for third-party applications
- **Audit Trail**: Immutable access logs stored on blockchain
- **Standards Compliant**: Built on W3C DID and Verifiable Credentials standards

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │ Employee Wallet │    │  Verifier Apps  │
│    (React)      │    │    (React)      │    │ (GitHub, Slack) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              API Gateway                        │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │           Express.js Backend                    │
         │  ┌─────────────┐  ┌─────────────┐              │
         │  │ DID Service │  │ VC Service  │              │
         │  └─────────────┘  └─────────────┘              │
         └─────────────────────────────────────────────────┘
                                 │
    ┌────────────┬────────────────┼────────────────┬────────────┐
    │            │                │                │            │
┌───▼───┐   ┌───▼───┐        ┌───▼───┐       ┌───▼───┐   ┌───▼───┐
│AWS KMS│   │DynamoDB│       │Lambda │       │  S3   │   │Polygon│
│       │   │       │        │       │       │       │   │Testnet│
└───────┘   └───────┘        └───────┘       └───────┘   └───────┘
```

---

## Features

### Admin Dashboard
- Employee onboarding and profile management
- Credential issuance and revocation
- Access policy configuration
- Audit logs and monitoring
- Real-time notifications

### Employee Wallet
- View and manage credentials
- Present credentials to verifiers
- Approve access requests
- Secure key management
- QR code generation

### Verification API
- Verify employee credentials
- Integration with third-party apps
- QR code verification
- Real-time validation
- Batch verification support

### Security Features
- Private keys stored in AWS KMS
- MFA authentication via AWS Cognito
- Immutable access logs on blockchain
- Credential revocation support
- Zero-trust architecture

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Identity SDK**: Veramo SDK
- **Database**: AWS DynamoDB
- **Serverless**: AWS Lambda
- **Security**: AWS KMS, Cognito

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Query
- **Routing**: React Router

### Blockchain
- **Network**: Polygon Mumbai Testnet
- **Smart Contracts**: Solidity
- **Development**: Hardhat
- **Standards**: W3C DIDs, Verifiable Credentials

### Infrastructure
- **Cloud Provider**: AWS
- **IaC**: CloudFormation
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch
- **Storage**: S3

---

## Project Structure

```
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   │   ├── didService.js
│   │   │   ├── credentialService.js
│   │   │   ├── blockchainService.js
│   │   │   ├── dynamoService.js
│   │   │   └── kmsService.js
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── lambda/              # AWS Lambda functions
│   │   ├── didHandler.js
│   │   └── credentialHandler.js
│   └── tests/               # Backend tests
├── frontend/                # React Admin Dashboard
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   └── utils/           # Frontend utilities
│   └── public/              # Static assets
├── wallet/                  # Employee Wallet (React)
│   ├── src/
│   │   ├── components/      # Wallet components
│   │   ├── pages/           # Wallet pages
│   │   ├── services/        # Wallet services
│   │   └── utils/           # Wallet utilities
│   └── public/              # Wallet assets
├── contracts/               # Smart contracts
│   ├── contracts/
│   │   └── EmployeeIdentityRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── test/                # Contract tests
├── infrastructure/          # AWS CloudFormation
│   ├── staging.yaml
│   └── production.yaml
├── docs/                    # Documentation
│   ├── api.md
│   ├── architecture.md
│   └── deployment.md
├── scripts/                 # Deployment scripts
│   └── setup.sh
├── .github/workflows/       # GitHub Actions
│   └── ci-cd.yml
├── package.json             # Root package.json
├── .env.example             # Environment template
└── README.md                # This file
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (version 9 or higher)
- **Git**
- **AWS CLI** (configured with appropriate credentials)
- **Docker** (optional, for local DynamoDB)

### System Requirements
- **OS**: Linux, macOS, or Windows
- **Memory**: 4GB RAM minimum
- **Storage**: 2GB free space

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git
cd Decentralized_Employee_Identity_-_Access-Manager
```

### 2. Run Setup Script

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Manual Installation (Alternative)

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install wallet dependencies
cd wallet && npm install && cd ..

# Install contract dependencies
cd contracts && npm install && cd ..
```

---

## Configuration

### 1. Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_KMS_KEY_ID=your_kms_key_id

# DynamoDB Tables
DYNAMODB_EMPLOYEES_TABLE=employees
DYNAMODB_CREDENTIALS_TABLE=credentials
DYNAMODB_ACCESS_LOGS_TABLE=access_logs

# Blockchain Configuration
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_PRIVATE_KEY=your_polygon_private_key

# API Configuration
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
WALLET_URL=http://localhost:3002

# Security
JWT_SECRET=your_jwt_secret
VERAMO_KMS_SECRET_KEY=your_veramo_secret
```

### 2. AWS Configuration

Configure AWS CLI:

```bash
aws configure
```

### 3. Polygon Wallet Setup

1. Create a wallet on MetaMask
2. Get Mumbai testnet MATIC from faucet
3. Add private key to environment variables

---

## Deployment

### Development Environment

#### 1. Start Local Services

```bash
# Start local DynamoDB (optional)
docker run -p 8000:8000 amazon/dynamodb-local:latest

# Start all development servers
npm run dev
```

#### 2. Access Applications

- **Admin Dashboard**: http://localhost:3000
- **Employee Wallet**: http://localhost:3002
- **API Server**: http://localhost:3001

### Staging Environment

#### 1. Deploy Infrastructure

```bash
# Deploy AWS infrastructure
aws cloudformation deploy \
  --template-file infrastructure/staging.yaml \
  --stack-name employee-identity-staging \
  --parameter-overrides \
    Environment=staging \
    PolygonRpcUrl=$POLYGON_RPC_URL \
    PolygonPrivateKey=$POLYGON_PRIVATE_KEY \
    VeramoKmsSecret=$VERAMO_KMS_SECRET \
  --capabilities CAPABILITY_IAM
```

#### 2. Deploy Smart Contracts

```bash
cd contracts
npm run deploy:mumbai
```

#### 3. Deploy Applications

```bash
# Build applications
npm run build

# Deploy using GitHub Actions or manual deployment
npm run deploy:staging
```

### Production Environment

#### 1. Deploy Infrastructure

```bash
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

#### 2. Deploy Smart Contracts

```bash
cd contracts
npm run deploy:polygon
```

#### 3. Deploy Applications

```bash
npm run deploy:prod
```

### CI/CD Pipeline

The project includes automated deployment via GitHub Actions:

1. **Push to `develop` branch** - Deploys to staging
2. **Push to `main` branch** - Deploys to production
3. **Pull requests** - Runs tests and security scans

---

## Usage

### Admin Workflow

1. **Login** to admin dashboard
2. **Create employee** profile
3. **Issue credentials** with appropriate permissions
4. **Monitor access** logs and audit trails
5. **Revoke credentials** when needed

### Employee Workflow

1. **Login** to employee wallet
2. **View credentials** and their status
3. **Generate QR codes** for verification
4. **Approve access requests** from applications
5. **Monitor access** history

### Verifier Integration

```javascript
// Example: Verify employee credential
const response = await fetch('/api/verify/credential', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ credential: credentialJWT })
});

const { verified, credential } = await response.json();
```

---

## API Documentation

Comprehensive API documentation is available at:
- **Local**: http://localhost:3001/api/docs
- **Documentation**: [docs/api.md](docs/api.md)

### Key Endpoints

- `POST /api/employees` - Create employee
- `GET /api/employees` - List employees
- `POST /api/verify/credential` - Verify credential
- `POST /api/verify/access/{app}` - Verify app access
- `GET /api/access-logs` - Get access logs

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Contract tests
cd contracts && npm test
```

### Integration Tests

```bash
npm run test:integration
```

---

## Monitoring and Maintenance

### Health Checks

- **API Health**: http://localhost:3001/health
- **Database Status**: Monitor DynamoDB metrics
- **Blockchain Status**: Check Polygon network status

### Logs

- **Application Logs**: CloudWatch Logs
- **Access Logs**: DynamoDB access_logs table
- **Blockchain Logs**: Polygon block explorer

### Backup and Recovery

- **Database**: DynamoDB Point-in-Time Recovery enabled
- **Keys**: AWS KMS automatic key rotation
- **Code**: Git repository with branch protection

---

## Security Considerations

### Best Practices Implemented

- **Private keys** encrypted with AWS KMS
- **Multi-factor authentication** via Cognito
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **HTTPS enforcement** in production
- **Regular security audits** via GitHub Actions

### Security Checklist

- [ ] Update all environment variables
- [ ] Enable MFA for AWS accounts
- [ ] Configure proper IAM roles
- [ ] Set up monitoring and alerting
- [ ] Regular dependency updates
- [ ] Security scanning enabled

---

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**
   ```bash
   nvm use 18
   ```

2. **AWS credentials not configured**
   ```bash
   aws configure
   ```

3. **DynamoDB connection issues**
   ```bash
   # Check AWS region and credentials
   aws dynamodb list-tables
   ```

4. **Smart contract deployment fails**
   ```bash
   # Check Polygon network status and wallet balance
   ```

### Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager/issues)
- **Documentation**: Check [docs/](docs/) directory
- **Developer**: Contact Deepak Nemade

---

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new functionality
5. **Submit** a pull request

### Development Guidelines

- Follow existing code style
- Write comprehensive tests
- Update documentation
- Use conventional commit messages

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **W3C** for DID and VC standards
- **Veramo** for identity SDK
- **Polygon** for blockchain infrastructure
- **AWS** for cloud services
- **Open source community** for various libraries and tools

---

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade

---

*For more information, visit the [project documentation](docs/) or contact the developer.*
