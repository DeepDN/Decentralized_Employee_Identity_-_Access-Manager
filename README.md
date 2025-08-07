# Decentralized Employee Identity & Access Manager

A comprehensive solution for managing employee identities and access using Self-Sovereign Identity (SSI) standards, Verifiable Credentials, and blockchain technology.

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade

## Current Status: Backend Operational

The backend API is fully functional and ready for development. All core endpoints are working and the system is stable.

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git
cd Decentralized_Employee_Identity_-_Access-Manager/backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start the Backend
```bash
# Development mode
npm run dev

# Production mode  
npm start
```

### 4. Test the API
```bash
# Health check
curl http://localhost:3001/health

# Test protected endpoint
curl -H "Authorization: Bearer test-token" http://localhost:3001/api/employees
```

The backend will be running at `http://localhost:3001`

## Current Implementation

### What's Working
- Backend API Server - Express.js server with all endpoints
- Authentication Middleware - Token-based authentication
- CORS Configuration - Proper cross-origin setup
- Error Handling - Comprehensive error management
- Logging System - Request and error logging
- Health Monitoring - System status endpoints
- Environment Configuration - Flexible config management

### In Development
- Database integration (DynamoDB)
- DID (Decentralized Identity) implementation
- Verifiable Credentials system
- AWS services integration
- Frontend applications

## API Endpoints

### Public Endpoints
- `GET /health` - System health check and status

### Protected Endpoints (require Authorization header)
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/credentials` - List all credentials
- `POST /api/credentials` - Issue new credential
- `GET /api/did` - List all DIDs
- `POST /api/did/create` - Create new DID
- `GET /api/access-logs` - View access logs

### Verification Endpoints (public)
- `POST /api/verify/credential` - Verify credential authenticity

### Example API Usage

```bash
# Health Check
curl http://localhost:3001/health

# Create Employee (requires auth)
curl -X POST \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@company.com","department":"Engineering"}' \
  http://localhost:3001/api/employees

# Verify Credential (public)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"credential":"credential-jwt-token"}' \
  http://localhost:3001/api/verify/credential
```

## Architecture

### Current Architecture (Simplified)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │ Employee Wallet │    │  Verifier Apps  │
│    (Planned)    │    │    (Planned)    │    │ (GitHub, Slack) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │           Express.js Backend API                │
         │  ┌─────────────┐  ┌─────────────┐              │
         │  │ Employee    │  │ Credential  │              │
         │  │ Management  │  │ Management  │              │
         │  └─────────────┘  └─────────────┘              │
         │  ┌─────────────┐  ┌─────────────┐              │
         │  │ DID Service │  │ Verification│              │
         │  │ (Planned)   │  │ Service     │              │
         │  └─────────────┘  └─────────────┘              │
         └─────────────────────────────────────────────────┘
                                 │
    ┌────────────┬────────────────┼────────────────┬────────────┐
    │            │                │                │            │
┌───▼───┐   ┌───▼───┐        ┌───▼───┐       ┌───▼───┐   ┌───▼───┐
│AWS KMS│   │DynamoDB│       │Lambda │       │  S3   │   │Polygon│
│(Plan) │   │(Plan) │        │(Plan) │       │(Plan) │   │(Plan) │
└───────┘   └───────┘        └───────┘       └───────┘   └───────┘
```

## Technology Stack

### Backend (Current)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: Token-based middleware
- **Security**: Helmet, CORS
- **Logging**: Built-in console logging
- **Environment**: dotenv configuration

### Backend (Planned)
- **Identity SDK**: Alternative DID libraries
- **Database**: AWS DynamoDB
- **Serverless**: AWS Lambda
- **Security**: AWS KMS, Cognito

### Blockchain (Planned)
- **Network**: Polygon Mumbai Testnet
- **Smart Contracts**: Solidity
- **Development**: Hardhat
- **Standards**: W3C DIDs, Verifiable Credentials

### Infrastructure (Planned)
- **Cloud Provider**: AWS
- **IaC**: CloudFormation
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch
- **Storage**: S3

## Project Structure

```
├── backend/                 # Node.js Express API
│   ├── src/
│   │   └── index.js         # Main application file
│   ├── .env                 # Environment configuration
│   ├── .env.example         # Environment template
│   └── package.json         # Dependencies and scripts
├── .env.example             # Environment template
├── .eslintrc.js             # ESLint configuration
├── .prettierrc.js           # Prettier configuration
├── package.json             # Root package.json
└── README.md                # This file
```

## Installation

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (version 9 or higher)
- **Git**

### System Requirements
- **OS**: Linux, macOS, or Windows
- **Memory**: 4GB RAM minimum
- **Storage**: 2GB free space

### 1. Clone the Repository

```bash
git clone https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git
cd Decentralized_Employee_Identity_-_Access-Manager
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# AWS Configuration (for future use)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Frontend URLs for CORS
FRONTEND_URL=http://localhost:3000
WALLET_URL=http://localhost:3002
```

### 4. Start the Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:3001`

## Configuration

### Environment Variables

The backend uses the following environment variables from `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# AWS Configuration (for future use)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB Tables (for future use)
DYNAMODB_EMPLOYEES_TABLE=employees
DYNAMODB_CREDENTIALS_TABLE=credentials
DYNAMODB_ACCESS_LOGS_TABLE=access_logs

# Blockchain Configuration (for future use)
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_PRIVATE_KEY=your_polygon_private_key

# Frontend URLs for CORS
FRONTEND_URL=http://localhost:3000
WALLET_URL=http://localhost:3002

# Veramo Configuration (for future use)
VERAMO_KMS_SECRET_KEY=your_veramo_secret_key
INFURA_PROJECT_ID=your_infura_project_id
```

### Current Configuration Status
- Server Configuration - Port and environment settings
- CORS Configuration - Frontend and wallet URLs
- Authentication - JWT secret placeholder
- AWS Configuration - Ready for future integration
- Blockchain Configuration - Ready for future integration

## Development Roadmap

### Phase 1: Core Backend (Current)
- Basic API structure
- Authentication middleware
- Error handling
- Logging system
- Health monitoring
- All API endpoints functional

### Phase 2: Database Integration (Next)
- Implement DynamoDB integration
- Add data models and schemas
- Implement CRUD operations
- Add data validation

### Phase 3: DID Implementation (Alternative Approach)
Since Veramo has ESM conflicts, consider these alternatives:
- Use `did-jwt` library directly (lighter weight)
- Implement custom DID resolver
- Use `@digitalcredentials/vc` library
- Create wrapper service for DID operations

### Phase 4: Security Enhancements
- Implement proper JWT authentication
- Add rate limiting
- Implement API key management
- Add request validation

### Phase 5: Frontend Development
- Create React admin dashboard
- Build employee wallet interface
- Implement QR code functionality
- Add real-time notifications

### Phase 6: AWS Integration
- AWS KMS integration
- DynamoDB operations
- S3 storage for documents
- CloudWatch logging

### Phase 7: Blockchain Integration
- Smart contract development
- Polygon network integration
- Credential anchoring
- Immutable audit trails

## Code Quality

### Linting and Formatting
```bash
# Root level
npm run lint      # Lint backend code
npm run format    # Format backend code

# Backend specific
cd backend
npm run lint      # Lint backend source
npm run lint:fix  # Auto-fix linting issues
npm run format    # Format backend source
```

### ESLint Configuration
- Environment: Node.js, ES2022, CommonJS
- Style: Single quotes, semicolons required, 2-space indentation
- Quality: No unused variables, prefer const
- Backend-specific: Console.log allowed

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and formatting: `npm run lint && npm run format`
5. Test your changes
6. Submit a pull request

### Development Guidelines

- Follow existing code style
- Write comprehensive tests
- Update documentation
- Use conventional commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- W3C for DID and VC standards
- Polygon for blockchain infrastructure
- AWS for cloud services
- Open source community for various libraries and tools

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade
