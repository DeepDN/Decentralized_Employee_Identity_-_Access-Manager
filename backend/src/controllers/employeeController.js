const express = require('express');
const { body, validationResult } = require('express-validator');
const { dynamoService } = require('../services/dynamoService');
const didService = require('../services/didService');
const credentialService = require('../services/credentialService');
const { requireRole } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateEmployee = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('accessLevel').isIn(['basic', 'standard', 'admin']).withMessage('Invalid access level')
];

// Create new employee
router.post('/', requireRole(['admin', 'hr']), validateEmployee, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const employeeData = req.body;
    
    // Create DID for employee
    const identifier = await didService.createDID(employeeData.employeeId || null);
    
    // Add DID to employee data
    employeeData.did = identifier.did;
    employeeData.didDocument = identifier;
    
    // Create employee record
    const employee = await dynamoService.createEmployee(employeeData);
    
    // Issue initial employee credential
    const issuerDID = req.user.did || 'did:key:organization'; // Organization's DID
    const credential = await credentialService.issueEmployeeCredential(employee, issuerDID);
    
    logger.info(`Employee created successfully: ${employee.employeeId}`);
    
    res.status(201).json({
      success: true,
      data: {
        employee,
        credential: credential.proof.jwt // Return JWT format
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all employees
router.get('/', requireRole(['admin', 'hr']), async (req, res, next) => {
  try {
    const { limit = 50, lastEvaluatedKey } = req.query;
    
    const result = await dynamoService.listEmployees(
      parseInt(limit),
      lastEvaluatedKey ? JSON.parse(lastEvaluatedKey) : null
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get employee by ID
router.get('/:employeeId', requireRole(['admin', 'hr', 'employee']), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    // Check if user can access this employee's data
    if (req.user.role === 'employee' && req.user.employeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const employee = await dynamoService.getEmployee(employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
});

// Update employee
router.put('/:employeeId', requireRole(['admin', 'hr']), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.employeeId;
    delete updates.did;
    delete updates.createdAt;
    
    const updatedEmployee = await dynamoService.updateEmployee(employeeId, updates);
    
    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    // If role or permissions changed, issue new credential
    if (updates.role || updates.accessLevel || updates.permissions) {
      const issuerDID = req.user.did || 'did:key:organization';
      const newCredential = await credentialService.issueEmployeeCredential(updatedEmployee, issuerDID);
      
      return res.json({
        success: true,
        data: {
          employee: updatedEmployee,
          newCredential: newCredential.proof.jwt
        }
      });
    }
    
    res.json({
      success: true,
      data: updatedEmployee
    });
  } catch (error) {
    next(error);
  }
});

// Delete employee (soft delete - revoke credentials)
router.delete('/:employeeId', requireRole(['admin', 'hr']), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { reason = 'Employee offboarding' } = req.body;
    
    // Get employee's credentials
    const credentials = await credentialService.getCredentialsByEmployee(employeeId);
    
    // Revoke all credentials
    const revocationPromises = credentials.map(cred => 
      credentialService.revokeCredential(cred.credentialId, reason)
    );
    await Promise.all(revocationPromises);
    
    // Update employee status
    await dynamoService.updateEmployee(employeeId, { 
      status: 'inactive',
      offboardingDate: new Date().toISOString(),
      offboardingReason: reason
    });
    
    logger.info(`Employee offboarded: ${employeeId}`);
    
    res.json({
      success: true,
      message: 'Employee offboarded successfully',
      revokedCredentials: credentials.length
    });
  } catch (error) {
    next(error);
  }
});

// Get employee's credentials
router.get('/:employeeId/credentials', requireRole(['admin', 'hr', 'employee']), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    // Check access permissions
    if (req.user.role === 'employee' && req.user.employeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const credentials = await credentialService.getCredentialsByEmployee(employeeId);
    
    res.json({
      success: true,
      data: credentials
    });
  } catch (error) {
    next(error);
  }
});

// Issue access credential for employee
router.post('/:employeeId/access-credentials', requireRole(['admin', 'hr']), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const accessData = req.body;
    
    const issuerDID = req.user.did || 'did:key:organization';
    const credential = await credentialService.issueAccessCredential(employeeId, accessData, issuerDID);
    
    res.status(201).json({
      success: true,
      data: {
        credential: credential.proof.jwt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get employee's DID document
router.get('/:employeeId/did', requireRole(['admin', 'hr', 'employee']), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    // Check access permissions
    if (req.user.role === 'employee' && req.user.employeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const employee = await dynamoService.getEmployee(employeeId);
    if (!employee || !employee.did) {
      return res.status(404).json({
        success: false,
        error: 'Employee DID not found'
      });
    }
    
    const didDocument = await didService.resolveDID(employee.did);
    
    res.json({
      success: true,
      data: didDocument
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
