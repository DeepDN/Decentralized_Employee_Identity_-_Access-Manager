const express = require('express');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const credentialService = require('../services/credentialService');
const { dynamoService } = require('../services/dynamoService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Verify credential (public endpoint)
router.post('/credential', async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Credential is required'
      });
    }
    
    const verification = await credentialService.verifyCredential(credential);
    
    // Log verification attempt
    if (verification.credential) {
      await dynamoService.logAccess({
        employeeId: verification.credential.credentialSubject.employeeId,
        action: 'credential_verification',
        verifierApp: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip,
        success: verification.verified,
        credentialType: verification.credential.type
      });
    }
    
    res.json({
      success: true,
      data: {
        verified: verification.verified,
        credential: verification.credential,
        verificationDetails: {
          issuer: verification.credential?.issuer,
          issuanceDate: verification.credential?.issuanceDate,
          expirationDate: verification.credential?.expirationDate,
          credentialSubject: verification.credential?.credentialSubject
        }
      }
    });
  } catch (error) {
    logger.error('Credential verification error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid credential format or verification failed'
    });
  }
});

// Generate QR code for credential presentation
router.post('/qr-code', async (req, res, next) => {
  try {
    const { credential, size = 200 } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Credential is required'
      });
    }
    
    // Generate QR code containing the credential
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(credential), {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        format: 'data:image/png;base64'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify employee access for specific app
router.post('/access/:appName', async (req, res, next) => {
  try {
    const { appName } = req.params;
    const { credential, requiredPermissions = [] } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Credential is required'
      });
    }
    
    // Verify the credential first
    const verification = await credentialService.verifyCredential(credential);
    
    if (!verification.verified) {
      await dynamoService.logAccess({
        employeeId: 'unknown',
        action: 'access_denied',
        verifierApp: appName,
        ipAddress: req.ip,
        success: false,
        reason: 'Invalid credential'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credential'
      });
    }
    
    const credentialSubject = verification.credential.credentialSubject;
    
    // Check if credential grants access to the requested app
    const hasAccess = checkAppAccess(credentialSubject, appName, requiredPermissions);
    
    // Log access attempt
    await dynamoService.logAccess({
      employeeId: credentialSubject.employeeId,
      action: hasAccess ? 'access_granted' : 'access_denied',
      verifierApp: appName,
      ipAddress: req.ip,
      success: hasAccess,
      requestedPermissions: requiredPermissions,
      userPermissions: credentialSubject.permissions
    });
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this application'
      });
    }
    
    res.json({
      success: true,
      data: {
        accessGranted: true,
        employee: {
          id: credentialSubject.employeeId,
          name: credentialSubject.name,
          email: credentialSubject.email,
          department: credentialSubject.department,
          role: credentialSubject.role
        },
        permissions: credentialSubject.permissions,
        accessLevel: credentialSubject.accessLevel
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get verification status for a credential
router.get('/status/:credentialId', async (req, res, next) => {
  try {
    const { credentialId } = req.params;
    
    const credential = await dynamoService.getCredential(credentialId);
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found'
      });
    }
    
    const isExpired = new Date(credential.expirationDate) < new Date();
    const isRevoked = credential.status === 'revoked';
    
    res.json({
      success: true,
      data: {
        credentialId,
        status: credential.status,
        isValid: !isExpired && !isRevoked,
        isExpired,
        isRevoked,
        issuanceDate: credential.issuanceDate,
        expirationDate: credential.expirationDate,
        ...(isRevoked && { revocationReason: credential.revocationReason })
      }
    });
  } catch (error) {
    next(error);
  }
});

// Batch verify multiple credentials
router.post('/batch', async (req, res, next) => {
  try {
    const { credentials } = req.body;
    
    if (!Array.isArray(credentials) || credentials.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of credentials is required'
      });
    }
    
    if (credentials.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 credentials allowed per batch'
      });
    }
    
    const verificationPromises = credentials.map(async (credential, index) => {
      try {
        const verification = await credentialService.verifyCredential(credential);
        return {
          index,
          verified: verification.verified,
          credential: verification.credential,
          error: null
        };
      } catch (error) {
        return {
          index,
          verified: false,
          credential: null,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(verificationPromises);
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: credentials.length,
          verified: results.filter(r => r.verified).length,
          failed: results.filter(r => !r.verified).length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to check app access
function checkAppAccess(credentialSubject, appName, requiredPermissions) {
  const userPermissions = credentialSubject.permissions || [];
  const accessLevel = credentialSubject.accessLevel || 'basic';
  
  // Define app-specific access rules
  const appAccessRules = {
    'github': {
      requiredLevel: 'standard',
      requiredPermissions: ['code_access']
    },
    'slack': {
      requiredLevel: 'basic',
      requiredPermissions: ['communication']
    },
    'aws': {
      requiredLevel: 'admin',
      requiredPermissions: ['infrastructure_access']
    },
    'jira': {
      requiredLevel: 'standard',
      requiredPermissions: ['project_management']
    },
    'google-workspace': {
      requiredLevel: 'basic',
      requiredPermissions: ['email_access', 'document_access']
    }
  };
  
  const appRule = appAccessRules[appName.toLowerCase()];
  
  if (!appRule) {
    // If no specific rule, check if user has any of the required permissions
    return requiredPermissions.length === 0 || 
           requiredPermissions.some(perm => userPermissions.includes(perm));
  }
  
  // Check access level
  const levelHierarchy = { 'basic': 1, 'standard': 2, 'admin': 3 };
  const userLevel = levelHierarchy[accessLevel] || 0;
  const requiredLevel = levelHierarchy[appRule.requiredLevel] || 0;
  
  if (userLevel < requiredLevel) {
    return false;
  }
  
  // Check required permissions
  const allRequiredPermissions = [...appRule.requiredPermissions, ...requiredPermissions];
  return allRequiredPermissions.every(perm => userPermissions.includes(perm));
}

module.exports = router;
