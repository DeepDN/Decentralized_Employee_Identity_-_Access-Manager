const { createAgent } = require('@veramo/core');
const { DIDManager } = require('@veramo/did-manager');
const { EthrDIDProvider } = require('@veramo/did-provider-ethr');
const { KeyDIDProvider } = require('@veramo/did-provider-key');
const { DIDResolverPlugin } = require('@veramo/did-resolver');
const { KeyManager } = require('@veramo/key-manager');
const { KMSLocal } = require('@veramo/kms-local');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Initialize Veramo agent
let agent;

const initializeAgent = () => {
  if (!agent) {
    agent = createAgent({
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
            get: async (args) => {
              const command = new GetCommand({
                TableName: process.env.DYNAMODB_DIDS_TABLE,
                Key: { did: args.did }
              });
              const result = await docClient.send(command);
              return result.Item;
            },
            set: async (args) => {
              const command = new PutCommand({
                TableName: process.env.DYNAMODB_DIDS_TABLE,
                Item: {
                  did: args.did,
                  ...args,
                  createdAt: new Date().toISOString()
                }
              });
              await docClient.send(command);
              return args;
            },
            delete: async (args) => {
              // Implementation for delete
              return true;
            }
          },
          defaultProvider: 'did:key',
          providers: {
            'did:key': new KeyDIDProvider({
              defaultKms: 'local'
            }),
            'did:ethr:polygon-mumbai': new EthrDIDProvider({
              defaultKms: 'local',
              network: 'polygon-mumbai',
              rpcUrl: process.env.POLYGON_RPC_URL,
              gas: 1000001,
              ttl: 60 * 60 * 24 * 30 * 12 + 1
            })
          }
        }),
        new DIDResolverPlugin({
          resolver: new (require('did-resolver').Resolver)({
            ...require('ethr-did-resolver').getResolver({
              infuraProjectId: process.env.INFURA_PROJECT_ID,
              networks: [
                {
                  name: 'polygon-mumbai',
                  rpcUrl: process.env.POLYGON_RPC_URL,
                  registry: '0x41D788c9c5D335362D713152F407692c5EEAfAae'
                }
              ]
            }),
            ...require('key-did-resolver').getResolver()
          })
        })
      ]
    });
  }
  return agent;
};

exports.handler = async (event, context) => {
  console.log('DID Handler invoked:', JSON.stringify(event, null, 2));

  try {
    const agent = initializeAgent();
    const { action, ...params } = JSON.parse(event.body || '{}');

    let result;

    switch (action) {
      case 'create':
        result = await createDID(agent, params);
        break;
      case 'resolve':
        result = await resolveDID(agent, params);
        break;
      case 'update':
        result = await updateDID(agent, params);
        break;
      case 'list':
        result = await listDIDs(agent, params);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: result
      })
    };

  } catch (error) {
    console.error('DID Handler error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

async function createDID(agent, params) {
  const { employeeId, didMethod = 'did:key', keyType = 'Secp256k1' } = params;

  const identifier = await agent.didManagerCreate({
    provider: didMethod,
    alias: `employee-${employeeId}`,
    options: { keyType }
  });

  // Store additional metadata
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_EMPLOYEES_TABLE,
    Key: { employeeId },
    UpdateExpression: 'SET did = :did, didDocument = :didDocument, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':did': identifier.did,
      ':didDocument': identifier,
      ':updatedAt': new Date().toISOString()
    }
  });

  await docClient.send(command);

  return identifier;
}

async function resolveDID(agent, params) {
  const { did } = params;

  const resolution = await agent.resolveDid({ didUrl: did });

  if (resolution.didResolutionMetadata.error) {
    throw new Error(`DID resolution failed: ${resolution.didResolutionMetadata.error}`);
  }

  return resolution.didDocument;
}

async function updateDID(agent, params) {
  const { did, updates } = params;

  // Implementation depends on DID method
  if (did.startsWith('did:ethr')) {
    const result = await agent.didManagerUpdate({
      did,
      document: updates
    });
    return result;
  } else {
    throw new Error('DID method does not support updates');
  }
}

async function listDIDs(agent, params) {
  const identifiers = await agent.didManagerFind(params);
  return identifiers;
}
