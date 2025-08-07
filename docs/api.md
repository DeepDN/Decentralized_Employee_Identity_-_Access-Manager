# API Documentation

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade

## Overview

The Employee Identity API provides endpoints for managing decentralized employee identities, issuing and verifying credentials, and tracking access logs.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Staging**: `https://api-staging.employee-identity.example.com/api`
- **Production**: `https://api.employee-identity.example.com/api`

## Authentication

All API endpoints (except verification endpoints) require authentication using JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

## Endpoints

### Employee Management

#### Create Employee
```http
POST /employees
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "department": "Engineering",
  "role": "Software Engineer",
  "accessLevel": "standard",
  "permissions": ["code_access", "project_management"],
  "contractType": "permanent"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employee": {
      "employeeId": "emp_123456",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "credential": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ..."
  }
}
```

#### Get All Employees
```http
GET /employees?limit=50&lastEvaluatedKey=<key>
```

#### Get Employee by ID
```http
GET /employees/{employeeId}
```

#### Update Employee
```http
PUT /employees/{employeeId}
```

#### Delete Employee (Offboard)
```http
DELETE /employees/{employeeId}
```

**Request Body:**
```json
{
  "reason": "Employee resignation"
}
```

### Credential Management

#### Issue Employee Credential
```http
POST /employees/{employeeId}/access-credentials
```

**Request Body:**
```json
{
  "accessType": "github",
  "permissions": ["read", "write"],
  "resources": ["repo:company/project"],
  "validUntil": "2024-12-31T23:59:59Z"
}
```

#### Get Employee Credentials
```http
GET /employees/{employeeId}/credentials
```

#### Revoke Credential
```http
POST /credentials/{credentialId}/revoke
```

**Request Body:**
```json
{
  "reason": "Access no longer required"
}
```

### Verification (Public Endpoints)

#### Verify Credential
```http
POST /verify/credential
```

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "credential": {
      "type": ["VerifiableCredential", "EmployeeCredential"],
      "credentialSubject": {
        "id": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
        "employeeId": "emp_123456",
        "name": "John Doe",
        "department": "Engineering",
        "role": "Software Engineer",
        "accessLevel": "standard"
      },
      "issuer": "did:key:z6MkfrQWqQvQaWLS35H2id1In6epaMpsAX8wTxkQMHHbhkkr",
      "issuanceDate": "2024-01-15T10:30:00Z",
      "expirationDate": "2025-01-15T10:30:00Z"
    }
  }
}
```

#### Verify App Access
```http
POST /verify/access/{appName}
```

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ...",
  "requiredPermissions": ["code_access"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessGranted": true,
    "employee": {
      "id": "emp_123456",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "department": "Engineering",
      "role": "Software Engineer"
    },
    "permissions": ["code_access", "project_management"],
    "accessLevel": "standard"
  }
}
```

#### Generate QR Code
```http
POST /verify/qr-code
```

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ...",
  "size": 200
}
```

#### Get Credential Status
```http
GET /verify/status/{credentialId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credentialId": "cred_123456",
    "status": "active",
    "isValid": true,
    "isExpired": false,
    "isRevoked": false,
    "issuanceDate": "2024-01-15T10:30:00Z",
    "expirationDate": "2025-01-15T10:30:00Z"
  }
}
```

### DID Management

#### Get Employee DID
```http
GET /employees/{employeeId}/did
```

#### Create DID
```http
POST /did/create
```

**Request Body:**
```json
{
  "employeeId": "emp_123456",
  "didMethod": "did:key",
  "keyType": "Secp256k1"
}
```

#### Resolve DID
```http
POST /did/resolve
```

**Request Body:**
```json
{
  "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
}
```

### Access Logs

#### Get Access Logs
```http
GET /access-logs?employeeId={employeeId}&limit=50&startTime={iso_date}&endTime={iso_date}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated endpoints**: 1000 requests per hour per user
- **Verification endpoints**: 100 requests per minute per IP
- **Batch operations**: 10 requests per minute per user

## Webhooks

The system supports webhooks for real-time notifications:

### Events

- `credential.issued` - When a new credential is issued
- `credential.revoked` - When a credential is revoked
- `access.granted` - When access is granted to an application
- `access.denied` - When access is denied

### Webhook Payload

```json
{
  "event": "credential.issued",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "credentialId": "cred_123456",
    "employeeId": "emp_123456",
    "type": "EmployeeCredential"
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const EmployeeIdentityAPI = require('@company/employee-identity-sdk');

const client = new EmployeeIdentityAPI({
  baseURL: 'https://api.employee-identity.example.com',
  apiKey: 'your-api-key'
});

// Create employee
const employee = await client.employees.create({
  name: 'John Doe',
  email: 'john.doe@company.com',
  department: 'Engineering',
  role: 'Software Engineer'
});

// Verify credential
const verification = await client.verify.credential(credentialJWT);
```

### Python

```python
from employee_identity import EmployeeIdentityClient

client = EmployeeIdentityClient(
    base_url='https://api.employee-identity.example.com',
    api_key='your-api-key'
)

# Create employee
employee = client.employees.create({
    'name': 'John Doe',
    'email': 'john.doe@company.com',
    'department': 'Engineering',
    'role': 'Software Engineer'
})

# Verify credential
verification = client.verify.credential(credential_jwt)
```

---

**Repository:** [https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git](https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git)  
**Developed by:** Deepak Nemade
