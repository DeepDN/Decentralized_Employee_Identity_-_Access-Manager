const { createAgent } = require('@veramo/core');
const { CredentialPlugin } = require('@veramo/credential-w3c');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ethers } = require('ethers');

// Initialize DynamoDB
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Initialize Veramo agent
let agent;

const initializeAgent = () => {
  if (!agent) {
    agent = createAgent({
      plugins: [
        new CredentialPlugin()
      ]
    });
  }
  return agent;
};

// Initialize blockchain connection
let provider, wallet, contract;

const initializeBlockchain = () => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    wallet = new ethers.Wallet(process.env.POLYGON_PRIVATE_KEY, provider);
    
    if (process.env.CONTRACT_ADDRESS) {
      const contractABI = [
        "function anchorCredential(string memory credentialId, bytes32 credentialHash) public",
        "function revokeCredential(string memory credentialId, string memory reason) public",
        "function isCredentialRevoked(string memory credentialId) public view returns (bool)"
      ];
      
      contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contractABI,
        wallet
      );
    }
  }
};

exports.handler = async (event, context) => {
  console.log('Credential Handler invoked:', JSON.stringify(event, null, 2));

  try {
    const agent = initializeAgent();
    initializeBlockchain();
    
    const { action, ...params } = JSON.parse(event.body || '{}');

    let result;

    switch (action) {
      case 'issue':
        result = await issueCredential(agent, params);
        break;
      case 'verify':
        result = await verifyCredential(agent, params);
        break;
      case 'revoke':
        result = await revokeCredential(params);
        break;
      case 'status':
        result = await getCredentialStatus(params);
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
    console.error('Credential Handler error:', error);

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

async function issueCredential(agent, params) {
  const { employeeData, issuerDID, credentialType = 'EmployeeCredential' } = params;

  const credentialSubject = {
    id: employeeData.did,
    employeeId: employeeData.employeeId,
    name: employeeData.name,
    email: employeeData.email,
    department: employeeData.department,
    role: employeeData.role,
    accessLevel: employeeData.accessLevel,
    startDate: employeeData.startDate,
    permissions: employeeData.permissions || []
  };

  const credential = await agent.createVerifiableCredential({
    credential: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org',
        {
          'EmployeeCredential': 'https://example.com/schemas/EmployeeCredential',
          'employeeId': 'https://schema.org/identifier',
          'department': 'https://schema.org/department',
          'accessLevel': 'https://example.com/schemas/accessLevel'
        }
      ],
      type: ['VerifiableCredential', credentialType],
      issuer: { id: issuerDID },
      issuanceDate: new Date().toISOString(),
      expirationDate: calculateExpirationDate(employeeData.contractType),
      credentialSubject
    },
    proofFormat: 'jwt'
  });

  // Store credential metadata
  const credentialId = credential.id || require('uuid').v4();
  const metadata = {
    credentialId,
    type: credential.type,
    issuer: credential.issuer.id,
    subject: credential.credentialSubject.id,
    employeeId: employeeData.employeeId,
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: process.env.DYNAMODB_CREDENTIALS_TABLE,
    Item: metadata
  });

  await docClient.send(command);

  // Anchor on blockchain if available
  if (contract) {
    try {
      const credentialHash = generateCredentialHash(credential);
      const hashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(credentialHash));
      
      const tx = await contract.anchorCredential(credentialId, hashBytes32, {
        gasLimit: 100000
      });
      
      await tx.wait();
      console.log(`Credential anchored on blockchain: ${credentialId}`);
    } catch (error) {
      console.error('Blockchain anchoring failed:', error);
      // Continue without blockchain anchoring
    }
  }

  return {
    credential,
    metadata
  };
}

async function verifyCredential(agent, params) {
  const { credential } = params;

  const verification = await agent.verifyCredential({
    credential
  });

  // Check if credential is revoked
  const credentialId = verification.verifiableCredential?.id;
  let isRevoked = false;

  if (credentialId) {
    const command = new GetCommand({
      TableName: process.env.DYNAMODB_CREDENTIALS_TABLE,
      Key: { credentialId }
    });

    const result = await docClient.send(command);
    isRevoked = result.Item?.status === 'revoked';
  }

  const isExpired = verification.verifiableCredential?.expirationDate && 
                   new Date(verification.verifiableCredential.expirationDate) < new Date();

  const isValid = verification.verified && !isRevoked && !isExpired;

  return {
    verified: isValid,
    credential: verification.verifiableCredential,
    verificationResult: verification,
    isRevoked,
    isExpired
  };
}

async function revokeCredential(params) {
  const { credentialId, reason = 'No reason provided' } = params;

  // Update credential status in DynamoDB
  const command = new UpdateCommand({
    TableName: process.env.DYNAMODB_CREDENTIALS_TABLE,
    Key: { credentialId },
    UpdateExpression: 'SET #status = :status, #reason = :reason, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#reason': 'revocationReason',
      '#updatedAt': 'updatedAt'
    },
    ExpressionAttributeValues: {
      ':status': 'revoked',
      ':reason': reason,
      ':updatedAt': new Date().toISOString()
    },
    ReturnValues: 'ALL_NEW'
  });

  const result = await docClient.send(command);

  // Record revocation on blockchain if available
  if (contract) {
    try {
      const tx = await contract.revokeCredential(credentialId, reason, {
        gasLimit: 100000
      });
      
      await tx.wait();
      console.log(`Revocation recorded on blockchain: ${credentialId}`);
    } catch (error) {
      console.error('Blockchain revocation failed:', error);
      // Continue without blockchain recording
    }
  }

  return result.Attributes;
}

async function getCredentialStatus(params) {
  const { credentialId } = params;

  const command = new GetCommand({
    TableName: process.env.DYNAMODB_CREDENTIALS_TABLE,
    Key: { credentialId }
  });

  const result = await docClient.send(command);

  if (!result.Item) {
    throw new Error('Credential not found');
  }

  const credential = result.Item;
  const isExpired = new Date(credential.expirationDate) < new Date();
  const isRevoked = credential.status === 'revoked';

  return {
    credentialId,
    status: credential.status,
    isValid: !isExpired && !isRevoked,
    isExpired,
    isRevoked,
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate,
    ...(isRevoked && { revocationReason: credential.revocationReason })
  };
}

function calculateExpirationDate(contractType = 'permanent') {
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

function generateCredentialHash(credential) {
  const crypto = require('crypto');
  const credentialString = JSON.stringify(credential, Object.keys(credential).sort());
  return crypto.createHash('sha256').update(credentialString).digest('hex');
}
