const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

class DynamoService {
  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    
    this.tables = {
      employees: process.env.DYNAMODB_EMPLOYEES_TABLE || 'employees',
      credentials: process.env.DYNAMODB_CREDENTIALS_TABLE || 'credentials',
      accessLogs: process.env.DYNAMODB_ACCESS_LOGS_TABLE || 'access_logs'
    };
  }

  // Employee operations
  async createEmployee(employeeData) {
    try {
      const employee = {
        employeeId: employeeData.employeeId || uuidv4(),
        ...employeeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const command = new PutCommand({
        TableName: this.tables.employees,
        Item: employee,
        ConditionExpression: 'attribute_not_exists(employeeId)'
      });

      await this.docClient.send(command);
      logger.info(`Employee created: ${employee.employeeId}`);
      return employee;
    } catch (error) {
      logger.error('Error creating employee:', error);
      throw new Error(`Failed to create employee: ${error.message}`);
    }
  }

  async getEmployee(employeeId) {
    try {
      const command = new GetCommand({
        TableName: this.tables.employees,
        Key: { employeeId }
      });

      const result = await this.docClient.send(command);
      return result.Item;
    } catch (error) {
      logger.error('Error getting employee:', error);
      throw new Error(`Failed to get employee: ${error.message}`);
    }
  }

  async updateEmployee(employeeId, updates) {
    try {
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach(key => {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      });

      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      updateExpression.push('#updatedAt = :updatedAt');

      const command = new UpdateCommand({
        TableName: this.tables.employees,
        Key: { employeeId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.docClient.send(command);
      logger.info(`Employee updated: ${employeeId}`);
      return result.Attributes;
    } catch (error) {
      logger.error('Error updating employee:', error);
      throw new Error(`Failed to update employee: ${error.message}`);
    }
  }

  async deleteEmployee(employeeId) {
    try {
      const command = new DeleteCommand({
        TableName: this.tables.employees,
        Key: { employeeId }
      });

      await this.docClient.send(command);
      logger.info(`Employee deleted: ${employeeId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting employee:', error);
      throw new Error(`Failed to delete employee: ${error.message}`);
    }
  }

  async listEmployees(limit = 50, lastEvaluatedKey = null) {
    try {
      const command = new ScanCommand({
        TableName: this.tables.employees,
        Limit: limit,
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
      });

      const result = await this.docClient.send(command);
      return {
        employees: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey
      };
    } catch (error) {
      logger.error('Error listing employees:', error);
      throw new Error(`Failed to list employees: ${error.message}`);
    }
  }

  // Credential operations
  async storeCredential(credentialData) {
    try {
      const credential = {
        credentialId: credentialData.credentialId || uuidv4(),
        ...credentialData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: this.tables.credentials,
        Item: credential
      });

      await this.docClient.send(command);
      logger.info(`Credential stored: ${credential.credentialId}`);
      return credential;
    } catch (error) {
      logger.error('Error storing credential:', error);
      throw new Error(`Failed to store credential: ${error.message}`);
    }
  }

  async getCredential(credentialId) {
    try {
      const command = new GetCommand({
        TableName: this.tables.credentials,
        Key: { credentialId }
      });

      const result = await this.docClient.send(command);
      return result.Item;
    } catch (error) {
      logger.error('Error getting credential:', error);
      throw new Error(`Failed to get credential: ${error.message}`);
    }
  }

  async getCredentialsByEmployee(employeeId) {
    try {
      const command = new QueryCommand({
        TableName: this.tables.credentials,
        IndexName: 'EmployeeIdIndex', // Assumes GSI exists
        KeyConditionExpression: 'employeeId = :employeeId',
        ExpressionAttributeValues: {
          ':employeeId': employeeId
        }
      });

      const result = await this.docClient.send(command);
      return result.Items;
    } catch (error) {
      logger.error('Error getting credentials by employee:', error);
      throw new Error(`Failed to get credentials by employee: ${error.message}`);
    }
  }

  async updateCredentialStatus(credentialId, status, reason = null) {
    try {
      const command = new UpdateCommand({
        TableName: this.tables.credentials,
        Key: { credentialId },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt' + (reason ? ', #reason = :reason' : ''),
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
          ...(reason && { '#reason': 'revocationReason' })
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
          ...(reason && { ':reason': reason })
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.docClient.send(command);
      logger.info(`Credential status updated: ${credentialId} -> ${status}`);
      return result.Attributes;
    } catch (error) {
      logger.error('Error updating credential status:', error);
      throw new Error(`Failed to update credential status: ${error.message}`);
    }
  }

  // Access log operations
  async logAccess(accessData) {
    try {
      const accessLog = {
        logId: uuidv4(),
        ...accessData,
        timestamp: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: this.tables.accessLogs,
        Item: accessLog
      });

      await this.docClient.send(command);
      logger.info(`Access logged: ${accessLog.logId}`);
      return accessLog;
    } catch (error) {
      logger.error('Error logging access:', error);
      throw new Error(`Failed to log access: ${error.message}`);
    }
  }

  async getAccessLogs(employeeId, limit = 50, startTime = null, endTime = null) {
    try {
      let keyConditionExpression = 'employeeId = :employeeId';
      const expressionAttributeValues = {
        ':employeeId': employeeId
      };

      if (startTime && endTime) {
        keyConditionExpression += ' AND #timestamp BETWEEN :startTime AND :endTime';
        expressionAttributeValues[':startTime'] = startTime;
        expressionAttributeValues[':endTime'] = endTime;
      }

      const command = new QueryCommand({
        TableName: this.tables.accessLogs,
        IndexName: 'EmployeeIdTimestampIndex', // Assumes GSI exists
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: {
          '#timestamp': 'timestamp'
        },
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
        ScanIndexForward: false // Most recent first
      });

      const result = await this.docClient.send(command);
      return result.Items;
    } catch (error) {
      logger.error('Error getting access logs:', error);
      throw new Error(`Failed to get access logs: ${error.message}`);
    }
  }
}

module.exports = { dynamoService: new DynamoService() };
