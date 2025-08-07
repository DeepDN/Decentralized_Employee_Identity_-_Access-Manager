const { createAgent } = require('@veramo/core');
const { DIDManager } = require('@veramo/did-manager');
const { EthrDIDProvider } = require('@veramo/did-provider-ethr');
const { KeyDIDProvider } = require('@veramo/did-provider-key');
const { WebDIDProvider } = require('@veramo/did-provider-web');
const { DIDResolverPlugin } = require('@veramo/did-resolver');
const { KeyManager } = require('@veramo/key-manager');
const { KMSLocal } = require('@veramo/kms-local');
const { Resolver } = require('did-resolver');
const { getResolver as ethrDidResolver } = require('ethr-did-resolver');
const { getResolver as webDidResolver } = require('web-did-resolver');
const { getResolver as keyDidResolver } = require('key-did-resolver');
const { logger } = require('../utils/logger');
const { kmsService } = require('./kmsService');

class DIDService {
  constructor() {
    this.agent = null;
    this.initializeAgent();
  }

  async initializeAgent() {
    try {
      // Configure DID resolvers
      const resolver = new Resolver({
        ...ethrDidResolver({ 
          infuraProjectId: process.env.INFURA_PROJECT_ID,
          networks: [
            {
              name: 'polygon-mumbai',
              rpcUrl: process.env.POLYGON_RPC_URL,
              registry: '0x41D788c9c5D335362D713152F407692c5EEAfAae'
            }
          ]
        }),
        ...webDidResolver(),
        ...keyDidResolver()
      });

      this.agent = createAgent({
        plugins: [
          new KeyManager({
            store: new KMSLocal({
              secretKey: process.env.VERAMO_KMS_SECRET_KEY
            }),
            kms: {
              local: new KMSLocal({
                secretKey: process.env.VERAMO_KMS_SECRET_KEY
              })
            }
          }),
          new DIDManager({
            store: {
              // In production, use a proper database store
              get: async (args) => { /* implement */ },
              set: async (args) => { /* implement */ },
              delete: async (args) => { /* implement */ }
            },
            defaultProvider: 'did:ethr:polygon-mumbai',
            providers: {
              'did:ethr:polygon-mumbai': new EthrDIDProvider({
                defaultKms: 'local',
                network: 'polygon-mumbai',
                rpcUrl: process.env.POLYGON_RPC_URL,
                gas: 1000001,
                ttl: 60 * 60 * 24 * 30 * 12 + 1
              }),
              'did:key': new KeyDIDProvider({
                defaultKms: 'local'
              }),
              'did:web': new WebDIDProvider({
                defaultKms: 'local'
              })
            }
          }),
          new DIDResolverPlugin({
            resolver
          })
        ]
      });

      logger.info('DID Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DID Service:', error);
      throw error;
    }
  }

  async createDID(employeeId, didMethod = 'did:key') {
    try {
      logger.info(`Creating DID for employee: ${employeeId} using method: ${didMethod}`);

      const identifier = await this.agent.didManagerCreate({
        provider: didMethod,
        alias: `employee-${employeeId}`,
        options: {
          keyType: 'Secp256k1'
        }
      });

      // Store DID metadata in AWS KMS for additional security
      await kmsService.storeDIDMetadata(employeeId, {
        did: identifier.did,
        controllerKeyId: identifier.controllerKeyId,
        createdAt: new Date().toISOString()
      });

      logger.info(`DID created successfully: ${identifier.did}`);
      return identifier;
    } catch (error) {
      logger.error('Error creating DID:', error);
      throw new Error(`Failed to create DID: ${error.message}`);
    }
  }

  async resolveDID(did) {
    try {
      logger.info(`Resolving DID: ${did}`);
      
      const resolution = await this.agent.resolveDid({ didUrl: did });
      
      if (resolution.didResolutionMetadata.error) {
        throw new Error(`DID resolution failed: ${resolution.didResolutionMetadata.error}`);
      }

      return resolution.didDocument;
    } catch (error) {
      logger.error('Error resolving DID:', error);
      throw new Error(`Failed to resolve DID: ${error.message}`);
    }
  }

  async updateDID(did, updates) {
    try {
      logger.info(`Updating DID: ${did}`);

      // Implementation depends on DID method
      // For did:ethr, we can update on-chain
      // For did:key, DIDs are immutable
      // For did:web, we update the hosted document

      if (did.startsWith('did:ethr')) {
        // Update Ethereum-based DID
        const result = await this.agent.didManagerUpdate({
          did,
          document: updates
        });
        return result;
      } else if (did.startsWith('did:web')) {
        // Update web-based DID document
        // This would involve updating the hosted JSON document
        throw new Error('Web DID updates not implemented yet');
      } else {
        throw new Error('DID method does not support updates');
      }
    } catch (error) {
      logger.error('Error updating DID:', error);
      throw new Error(`Failed to update DID: ${error.message}`);
    }
  }

  async revokeDID(did) {
    try {
      logger.info(`Revoking DID: ${did}`);

      // Mark DID as revoked in our system
      // For blockchain-based DIDs, we might need to update on-chain
      const result = await this.agent.didManagerDelete({ did });
      
      logger.info(`DID revoked successfully: ${did}`);
      return result;
    } catch (error) {
      logger.error('Error revoking DID:', error);
      throw new Error(`Failed to revoke DID: ${error.message}`);
    }
  }

  async listDIDs() {
    try {
      const identifiers = await this.agent.didManagerFind();
      return identifiers;
    } catch (error) {
      logger.error('Error listing DIDs:', error);
      throw new Error(`Failed to list DIDs: ${error.message}`);
    }
  }

  async getDIDByAlias(alias) {
    try {
      const identifiers = await this.agent.didManagerFind({
        alias
      });
      return identifiers[0] || null;
    } catch (error) {
      logger.error('Error getting DID by alias:', error);
      throw new Error(`Failed to get DID by alias: ${error.message}`);
    }
  }
}

module.exports = new DIDService();
