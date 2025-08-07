const { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } = require('@aws-sdk/client-kms');
const { logger } = require('../utils/logger');

class KMSService {
  constructor() {
    this.kmsClient = new KMSClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.keyId = process.env.AWS_KMS_KEY_ID;
  }

  async encrypt(plaintext) {
    try {
      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(JSON.stringify(plaintext))
      });

      const result = await this.kmsClient.send(command);
      return result.CiphertextBlob;
    } catch (error) {
      logger.error('KMS encryption error:', error);
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  async decrypt(ciphertextBlob) {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: ciphertextBlob
      });

      const result = await this.kmsClient.send(command);
      return JSON.parse(result.Plaintext.toString());
    } catch (error) {
      logger.error('KMS decryption error:', error);
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }

  async generateDataKey() {
    try {
      const command = new GenerateDataKeyCommand({
        KeyId: this.keyId,
        KeySpec: 'AES_256'
      });

      const result = await this.kmsClient.send(command);
      return {
        plaintextKey: result.Plaintext,
        encryptedKey: result.CiphertextBlob
      };
    } catch (error) {
      logger.error('KMS data key generation error:', error);
      throw new Error(`Failed to generate data key: ${error.message}`);
    }
  }

  async storeDIDMetadata(employeeId, didMetadata) {
    try {
      const encryptedMetadata = await this.encrypt(didMetadata);
      
      // Store encrypted metadata with employee record
      // This would typically be stored in DynamoDB with the employee record
      logger.info(`DID metadata encrypted and stored for employee: ${employeeId}`);
      
      return {
        employeeId,
        encryptedMetadata: encryptedMetadata.toString('base64'),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error storing DID metadata:', error);
      throw error;
    }
  }

  async retrieveDIDMetadata(employeeId, encryptedMetadata) {
    try {
      const ciphertextBlob = Buffer.from(encryptedMetadata, 'base64');
      const decryptedMetadata = await this.decrypt(ciphertextBlob);
      
      logger.info(`DID metadata retrieved for employee: ${employeeId}`);
      return decryptedMetadata;
    } catch (error) {
      logger.error('Error retrieving DID metadata:', error);
      throw error;
    }
  }

  async encryptPrivateKey(privateKey) {
    try {
      return await this.encrypt({ privateKey, type: 'secp256k1' });
    } catch (error) {
      logger.error('Error encrypting private key:', error);
      throw error;
    }
  }

  async decryptPrivateKey(encryptedKey) {
    try {
      const decrypted = await this.decrypt(encryptedKey);
      return decrypted.privateKey;
    } catch (error) {
      logger.error('Error decrypting private key:', error);
      throw error;
    }
  }
}

module.exports = { kmsService: new KMSService() };
