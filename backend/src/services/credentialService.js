const { createAgent } = require('@veramo/core');
const { CredentialPlugin } = require('@veramo/credential-w3c');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const didService = require('./didService');
const { blockchainService } = require('./blockchainService');
const { dynamoService } = require('./dynamoService');

class CredentialService {
  constructor() {
    this.agent = null;
    this.initializeAgent();
  }

  async initializeAgent() {
    try {
      this.agent = createAgent({
        plugins: [
          new CredentialPlugin()
        ]
      });
      logger.info('Credential Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Credential Service:', error);
      throw error;
    }
  }

  async issueEmployeeCredential(employeeData, issuerDID) {
    try {
      logger.info(`Issuing credential for employee: ${employeeData.employeeId}`);

      const credentialSubject = {
        id: employeeData.did,
        employeeId: employeeData.employeeId,
        name: employeeData.name,
        email: employeeData.email,
        department: employeeData.department,
        role: employeeData.role,
        accessLevel: employeeData.accessLevel,
        startDate: employeeData.startDate,
        deviceIds: employeeData.deviceIds || [],
        permissions: employeeData.permissions || []
      };

      const credential = await this.agent.createVerifiableCredential({
        credential: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://schema.org',
            {
              'EmployeeCredential': 'https://example.com/schemas/EmployeeCredential',
              'employeeId': 'https://schema.org/identifier',
              'department': 'https://schema.org/department',
              'accessLevel': 'https://example.com/schemas/accessLevel',
              'permissions': 'https://example.com/schemas/permissions'
            }
          ],
          type: ['VerifiableCredential', 'EmployeeCredential'],
          issuer: { id: issuerDID },
          issuanceDate: new Date().toISOString(),
          expirationDate: this.calculateExpirationDate(employeeData.contractType),
          credentialSubject
        },
        proofFormat: 'jwt'
      });

      // Store credential metadata in DynamoDB
      await this.storeCredentialMetadata(credential);

      // Anchor credential hash on blockchain
      await this.anchorCredentialOnBlockchain(credential);

      logger.info(`Credential issued successfully for employee: ${employeeData.employeeId}`);
      return credential;
    } catch (error) {
      logger.error('Error issuing credential:', error);
      throw new Error(`Failed to issue credential: ${error.message}`);
    }
  }

  async issueAccessCredential(employeeId, accessData, issuerDID) {
    try {
      logger.info(`Issuing access credential for employee: ${employeeId}`);

      const employee = await dynamoService.getEmployee(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const credentialSubject = {
        id: employee.did,
        employeeId: employeeId,
        accessType: accessData.accessType, // 'github', 'slack', 'aws', etc.
        permissions: accessData.permissions,
        resources: accessData.resources,
        validFrom: new Date().toISOString(),
        validUntil: accessData.validUntil
      };

      const credential = await this.agent.createVerifiableCredential({
        credential: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
              'AccessCredential': 'https://example.com/schemas/AccessCredential',
              'accessType': 'https://example.com/schemas/accessType',
              'permissions': 'https://example.com/schemas/permissions',
              'resources': 'https://example.com/schemas/resources'
            }
          ],
          type: ['VerifiableCredential', 'AccessCredential'],
          issuer: { id: issuerDID },
          issuanceDate: new Date().toISOString(),
          expirationDate: accessData.validUntil,
          credentialSubject
        },
        proofFormat: 'jwt'
      });

      await this.storeCredentialMetadata(credential);
      await this.anchorCredentialOnBlockchain(credential);

      return credential;
    } catch (error) {
      logger.error('Error issuing access credential:', error);
      throw new Error(`Failed to issue access credential: ${error.message}`);
    }
  }

  async verifyCredential(credentialJWT) {
    try {
      logger.info('Verifying credential');

      const verification = await this.agent.verifyCredential({
        credential: credentialJWT
      });

      // Additional checks
      const isValid = verification.verified && 
                     !this.isCredentialExpired(verification.verifiableCredential) &&
                     !await this.isCredentialRevoked(verification.verifiableCredential);

      return {
        verified: isValid,
        credential: verification.verifiableCredential,
        verificationResult: verification
      };
    } catch (error) {
      logger.error('Error verifying credential:', error);
      throw new Error(`Failed to verify credential: ${error.message}`);
    }
  }

  async revokeCredential(credentialId, reason = 'No reason provided') {
    try {
      logger.info(`Revoking credential: ${credentialId}`);

      // Update credential status in DynamoDB
      await dynamoService.updateCredentialStatus(credentialId, 'revoked', reason);

      // Record revocation on blockchain
      await blockchainService.recordRevocation(credentialId, reason);

      logger.info(`Credential revoked successfully: ${credentialId}`);
      return { success: true, credentialId, reason };
    } catch (error) {
      logger.error('Error revoking credential:', error);
      throw new Error(`Failed to revoke credential: ${error.message}`);
    }
  }

  async getCredentialsByEmployee(employeeId) {
    try {
      return await dynamoService.getCredentialsByEmployee(employeeId);
    } catch (error) {
      logger.error('Error getting credentials by employee:', error);
      throw new Error(`Failed to get credentials: ${error.message}`);
    }
  }

  async storeCredentialMetadata(credential) {
    try {
      const metadata = {
        credentialId: credential.id || uuidv4(),
        type: credential.type,
        issuer: credential.issuer.id,
        subject: credential.credentialSubject.id,
        employeeId: credential.credentialSubject.employeeId,
        issuanceDate: credential.issuanceDate,
        expirationDate: credential.expirationDate,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await dynamoService.storeCredential(metadata);
      return metadata;
    } catch (error) {
      logger.error('Error storing credential metadata:', error);
      throw error;
    }
  }

  async anchorCredentialOnBlockchain(credential) {
    try {
      const credentialHash = this.generateCredentialHash(credential);
      await blockchainService.anchorCredential(credential.id, credentialHash);
      logger.info(`Credential anchored on blockchain: ${credential.id}`);
    } catch (error) {
      logger.error('Error anchoring credential on blockchain:', error);
      // Don't throw error - blockchain anchoring is optional
    }
  }

  generateCredentialHash(credential) {
    const crypto = require('crypto');
    const credentialString = JSON.stringify(credential, Object.keys(credential).sort());
    return crypto.createHash('sha256').update(credentialString).digest('hex');
  }

  calculateExpirationDate(contractType = 'permanent') {
    const now = new Date();
    switch (contractType) {
      case 'temporary':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days
      case 'contract':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
      case 'permanent':
      default:
        return new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 5 years
    }
  }

  isCredentialExpired(credential) {
    if (!credential.expirationDate) return false;
    return new Date(credential.expirationDate) < new Date();
  }

  async isCredentialRevoked(credential) {
    try {
      const metadata = await dynamoService.getCredential(credential.id);
      return metadata && metadata.status === 'revoked';
    } catch (error) {
      logger.error('Error checking credential revocation status:', error);
      return false;
    }
  }
}

module.exports = new CredentialService();
