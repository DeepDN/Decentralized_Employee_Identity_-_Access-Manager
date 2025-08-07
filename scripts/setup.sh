#!/bin/bash

# Decentralized Employee Identity & Access Manager Setup Script
# Repository: https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git
# Developed by: Deepak Nemade

set -e

echo "Setting up Decentralized Employee Identity Manager..."
echo "Repository: https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git"
echo "Developed by: Deepak Nemade"
echo ""

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "ERROR: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "ERROR: Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "ERROR: npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo "WARNING: AWS CLI is not installed. Some features may not work."
        echo "         Install from: https://aws.amazon.com/cli/"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo "ERROR: Git is not installed. Please install Git."
        exit 1
    fi
    
    echo "SUCCESS: Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    # Root dependencies
    echo "Installing root dependencies..."
    npm install
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Wallet dependencies
    echo "Installing wallet dependencies..."
    cd wallet
    npm install
    cd ..
    
    # Contract dependencies
    echo "Installing contract dependencies..."
    cd contracts
    npm install
    cd ..
    
    echo "SUCCESS: Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    echo "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "Created .env file from .env.example"
        echo "WARNING: Please update the .env file with your configuration"
    else
        echo "SUCCESS: .env file already exists"
    fi
    
    # Create logs directory
    mkdir -p backend/logs
    mkdir -p logs
    
    echo "SUCCESS: Environment setup completed"
}

# Setup database (local DynamoDB)
setup_database() {
    echo "Setting up local database..."
    
    # Check if Docker is available for local DynamoDB
    if command -v docker &> /dev/null; then
        echo "Docker found. You can run local DynamoDB with:"
        echo "   docker run -p 8000:8000 amazon/dynamodb-local:latest"
    else
        echo "WARNING: Docker not found. Install Docker to run local DynamoDB for development."
    fi
    
    echo "SUCCESS: Database setup instructions provided"
}

# Setup AWS resources (optional)
setup_aws() {
    echo "AWS Setup (optional)..."
    
    if command -v aws &> /dev/null; then
        echo "AWS CLI found. To deploy to AWS:"
        echo "1. Configure AWS credentials: aws configure"
        echo "2. Deploy staging: npm run deploy:staging"
        echo "3. Deploy production: npm run deploy:prod"
    else
        echo "AWS CLI not found. Install it to deploy to AWS."
    fi
    
    echo "SUCCESS: AWS setup instructions provided"
}

# Setup smart contracts
setup_contracts() {
    echo "Setting up smart contracts..."
    
    cd contracts
    
    # Compile contracts
    echo "Compiling smart contracts..."
    npm run compile
    
    # Run tests
    echo "Running contract tests..."
    npm test
    
    cd ..
    
    echo "SUCCESS: Smart contracts setup completed"
}

# Create sample data
create_sample_data() {
    echo "Creating sample data..."
    
    # Create sample environment for development
    cat > .env.development << EOF
# Development Environment
# Repository: https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git
# Developed by: Deepak Nemade

NODE_ENV=development
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
WALLET_URL=http://localhost:3002

# Local DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
AWS_REGION=us-east-1

# Sample keys (DO NOT USE IN PRODUCTION)
JWT_SECRET=development-secret-key-change-in-production
VERAMO_KMS_SECRET_KEY=development-veramo-secret-change-in-production

# Polygon Mumbai Testnet (for development)
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
# Add your test private key here
POLYGON_PRIVATE_KEY=your-test-private-key-here
EOF
    
    echo "SUCCESS: Sample data and development environment created"
}

# Setup Git hooks
setup_git_hooks() {
    echo "Setting up Git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Run linting
npm run lint
if [ $? -ne 0 ]; then
    echo "ERROR: Linting failed. Please fix the issues before committing."
    exit 1
fi

# Run tests
npm run test
if [ $? -ne 0 ]; then
    echo "ERROR: Tests failed. Please fix the issues before committing."
    exit 1
fi

echo "SUCCESS: Pre-commit checks passed"
EOF
    
    chmod +x .git/hooks/pre-commit
    
    echo "SUCCESS: Git hooks setup completed"
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo ""
    
    check_prerequisites
    install_dependencies
    setup_environment
    setup_database
    setup_aws
    setup_contracts
    create_sample_data
    setup_git_hooks
    
    echo ""
    echo "Setup completed successfully!"
    echo ""
    echo "Repository: https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git"
    echo "Developed by: Deepak Nemade"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your configuration"
    echo "2. Start local DynamoDB: docker run -p 8000:8000 amazon/dynamodb-local:latest"
    echo "3. Start development servers: npm run dev"
    echo "4. Open Admin Dashboard: http://localhost:3000"
    echo "5. Open Employee Wallet: http://localhost:3002"
    echo ""
    echo "Documentation:"
    echo "- API Documentation: docs/api.md"
    echo "- Architecture Guide: docs/architecture.md"
    echo "- Deployment Guide: docs/deployment.md"
    echo ""
    echo "Development commands:"
    echo "- npm run dev          # Start all services"
    echo "- npm run build        # Build all applications"
    echo "- npm run test         # Run all tests"
    echo "- npm run lint         # Lint all code"
    echo ""
    echo "Happy coding!"
}

# Run main function
main "$@"
