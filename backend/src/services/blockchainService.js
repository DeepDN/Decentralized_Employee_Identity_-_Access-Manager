const { ethers } = require('ethers');
const { logger } = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.POLYGON_PRIVATE_KEY, this.provider);
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.contractABI = [
      // Contract ABI will be defined here
      "function anchorCredential(string memory credentialId, bytes32 credentialHash) public",
      "function revokeCredential(string memory credentialId, string memory reason) public",
      "function isCredentialRevoked(string memory credentialId) public view returns (bool)",
      "function getCredentialHash(string memory credentialId) public view returns (bytes32)",
      "event CredentialAnchored(string indexed credentialId, bytes32 credentialHash, address indexed issuer, uint256 timestamp)",
      "event CredentialRevoked(string indexed credentialId, string reason, address indexed revoker, uint256 timestamp)"
    ];
    this.contract = null;
    this.initializeContract();
  }

  async initializeContract() {
    try {
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.wallet
        );
        logger.info('Blockchain service initialized with contract:', this.contractAddress);
      } else {
        logger.warn('No contract address provided, blockchain anchoring disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
    }
  }

  async anchorCredential(credentialId, credentialHash) {
    try {
      if (!this.contract) {
        logger.warn('Contract not initialized, skipping blockchain anchoring');
        return null;
      }

      logger.info(`Anchoring credential on blockchain: ${credentialId}`);

      // Convert hash to bytes32 format
      const hashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(credentialHash));

      const tx = await this.contract.anchorCredential(credentialId, hashBytes32, {
        gasLimit: 100000
      });

      const receipt = await tx.wait();
      
      logger.info(`Credential anchored successfully. TX: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        credentialId,
        credentialHash: hashBytes32
      };
    } catch (error) {
      logger.error('Error anchoring credential on blockchain:', error);
      throw new Error(`Failed to anchor credential: ${error.message}`);
    }
  }

  async recordRevocation(credentialId, reason) {
    try {
      if (!this.contract) {
        logger.warn('Contract not initialized, skipping blockchain revocation');
        return null;
      }

      logger.info(`Recording credential revocation on blockchain: ${credentialId}`);

      const tx = await this.contract.revokeCredential(credentialId, reason, {
        gasLimit: 100000
      });

      const receipt = await tx.wait();
      
      logger.info(`Revocation recorded successfully. TX: ${receipt.transactionHash}`);
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        credentialId,
        reason
      };
    } catch (error) {
      logger.error('Error recording revocation on blockchain:', error);
      throw new Error(`Failed to record revocation: ${error.message}`);
    }
  }

  async isCredentialRevoked(credentialId) {
    try {
      if (!this.contract) {
        return false;
      }

      const isRevoked = await this.contract.isCredentialRevoked(credentialId);
      return isRevoked;
    } catch (error) {
      logger.error('Error checking credential revocation status:', error);
      return false;
    }
  }

  async getCredentialHash(credentialId) {
    try {
      if (!this.contract) {
        return null;
      }

      const hash = await this.contract.getCredentialHash(credentialId);
      return hash;
    } catch (error) {
      logger.error('Error getting credential hash from blockchain:', error);
      return null;
    }
  }

  async getTransactionReceipt(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      logger.error('Error getting transaction receipt:', error);
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  async getBlockchainStatus() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const balance = await this.provider.getBalance(this.wallet.address);

      return {
        network: {
          name: network.name,
          chainId: network.chainId.toString()
        },
        blockNumber,
        walletAddress: this.wallet.address,
        balance: ethers.formatEther(balance),
        contractAddress: this.contractAddress
      };
    } catch (error) {
      logger.error('Error getting blockchain status:', error);
      throw new Error(`Failed to get blockchain status: ${error.message}`);
    }
  }

  // Event listeners for contract events
  setupEventListeners() {
    if (!this.contract) return;

    this.contract.on('CredentialAnchored', (credentialId, credentialHash, issuer, timestamp, event) => {
      logger.info('Credential anchored event:', {
        credentialId,
        credentialHash,
        issuer,
        timestamp: new Date(timestamp * 1000).toISOString(),
        transactionHash: event.transactionHash
      });
    });

    this.contract.on('CredentialRevoked', (credentialId, reason, revoker, timestamp, event) => {
      logger.info('Credential revoked event:', {
        credentialId,
        reason,
        revoker,
        timestamp: new Date(timestamp * 1000).toISOString(),
        transactionHash: event.transactionHash
      });
    });
  }

  // Utility function to estimate gas costs
  async estimateGasCost(operation, ...args) {
    try {
      if (!this.contract) return null;

      let gasEstimate;
      switch (operation) {
        case 'anchorCredential':
          gasEstimate = await this.contract.anchorCredential.estimateGas(...args);
          break;
        case 'revokeCredential':
          gasEstimate = await this.contract.revokeCredential.estimateGas(...args);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      const gasPrice = await this.provider.getFeeData();
      const cost = gasEstimate * gasPrice.gasPrice;

      return {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        estimatedCost: ethers.formatEther(cost),
        estimatedCostWei: cost.toString()
      };
    } catch (error) {
      logger.error('Error estimating gas cost:', error);
      return null;
    }
  }
}

module.exports = { blockchainService: new BlockchainService() };
