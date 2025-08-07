// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EmployeeIdentityRegistry
 * @dev Smart contract for anchoring employee credentials and managing revocations
 * @author Employee Identity Team
 */
contract EmployeeIdentityRegistry is Ownable, Pausable, ReentrancyGuard {
    
    struct CredentialRecord {
        bytes32 credentialHash;
        address issuer;
        uint256 timestamp;
        bool isRevoked;
        string revocationReason;
        uint256 revocationTimestamp;
        address revoker;
    }
    
    // Mapping from credential ID to credential record
    mapping(string => CredentialRecord) public credentials;
    
    // Mapping to track authorized issuers
    mapping(address => bool) public authorizedIssuers;
    
    // Events
    event CredentialAnchored(
        string indexed credentialId,
        bytes32 credentialHash,
        address indexed issuer,
        uint256 timestamp
    );
    
    event CredentialRevoked(
        string indexed credentialId,
        string reason,
        address indexed revoker,
        uint256 timestamp
    );
    
    event IssuerAuthorized(address indexed issuer, address indexed authorizer);
    event IssuerRevoked(address indexed issuer, address indexed revoker);
    
    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner(),
            "Not authorized to issue credentials"
        );
        _;
    }
    
    modifier credentialExists(string memory credentialId) {
        require(
            credentials[credentialId].timestamp != 0,
            "Credential does not exist"
        );
        _;
    }
    
    modifier credentialNotRevoked(string memory credentialId) {
        require(
            !credentials[credentialId].isRevoked,
            "Credential is already revoked"
        );
        _;
    }
    
    constructor() {
        // Owner is automatically an authorized issuer
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Anchor a credential hash on the blockchain
     * @param credentialId Unique identifier for the credential
     * @param credentialHash Hash of the credential data
     */
    function anchorCredential(
        string memory credentialId,
        bytes32 credentialHash
    ) external onlyAuthorizedIssuer whenNotPaused nonReentrant {
        require(bytes(credentialId).length > 0, "Credential ID cannot be empty");
        require(credentialHash != bytes32(0), "Credential hash cannot be empty");
        require(
            credentials[credentialId].timestamp == 0,
            "Credential already exists"
        );
        
        credentials[credentialId] = CredentialRecord({
            credentialHash: credentialHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isRevoked: false,
            revocationReason: "",
            revocationTimestamp: 0,
            revoker: address(0)
        });
        
        emit CredentialAnchored(
            credentialId,
            credentialHash,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Revoke a credential
     * @param credentialId Unique identifier for the credential
     * @param reason Reason for revocation
     */
    function revokeCredential(
        string memory credentialId,
        string memory reason
    ) external 
      credentialExists(credentialId) 
      credentialNotRevoked(credentialId) 
      whenNotPaused 
      nonReentrant {
        
        CredentialRecord storage credential = credentials[credentialId];
        
        // Only the original issuer or owner can revoke
        require(
            msg.sender == credential.issuer || 
            msg.sender == owner() ||
            authorizedIssuers[msg.sender],
            "Not authorized to revoke this credential"
        );
        
        credential.isRevoked = true;
        credential.revocationReason = reason;
        credential.revocationTimestamp = block.timestamp;
        credential.revoker = msg.sender;
        
        emit CredentialRevoked(
            credentialId,
            reason,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Check if a credential is revoked
     * @param credentialId Unique identifier for the credential
     * @return bool True if credential is revoked
     */
    function isCredentialRevoked(string memory credentialId) 
        external 
        view 
        credentialExists(credentialId) 
        returns (bool) {
        return credentials[credentialId].isRevoked;
    }
    
    /**
     * @dev Get credential hash
     * @param credentialId Unique identifier for the credential
     * @return bytes32 Hash of the credential
     */
    function getCredentialHash(string memory credentialId) 
        external 
        view 
        credentialExists(credentialId) 
        returns (bytes32) {
        return credentials[credentialId].credentialHash;
    }
    
    /**
     * @dev Get full credential record
     * @param credentialId Unique identifier for the credential
     * @return CredentialRecord Full credential record
     */
    function getCredentialRecord(string memory credentialId) 
        external 
        view 
        credentialExists(credentialId) 
        returns (CredentialRecord memory) {
        return credentials[credentialId];
    }
    
    /**
     * @dev Verify credential integrity
     * @param credentialId Unique identifier for the credential
     * @param credentialHash Hash to verify against
     * @return bool True if hashes match and credential is not revoked
     */
    function verifyCredential(
        string memory credentialId,
        bytes32 credentialHash
    ) external view credentialExists(credentialId) returns (bool) {
        CredentialRecord memory credential = credentials[credentialId];
        return !credential.isRevoked && 
               credential.credentialHash == credentialHash;
    }
    
    /**
     * @dev Authorize an address to issue credentials
     * @param issuer Address to authorize
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        require(!authorizedIssuers[issuer], "Issuer already authorized");
        
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer, msg.sender);
    }
    
    /**
     * @dev Revoke authorization for an issuer
     * @param issuer Address to revoke authorization from
     */
    function revokeIssuerAuthorization(address issuer) external onlyOwner {
        require(authorizedIssuers[issuer], "Issuer not authorized");
        require(issuer != owner(), "Cannot revoke owner authorization");
        
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer, msg.sender);
    }
    
    /**
     * @dev Check if an address is an authorized issuer
     * @param issuer Address to check
     * @return bool True if authorized
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer] || issuer == owner();
    }
    
    /**
     * @dev Pause the contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Batch anchor multiple credentials (gas optimization)
     * @param credentialIds Array of credential IDs
     * @param credentialHashes Array of credential hashes
     */
    function batchAnchorCredentials(
        string[] memory credentialIds,
        bytes32[] memory credentialHashes
    ) external onlyAuthorizedIssuer whenNotPaused nonReentrant {
        require(
            credentialIds.length == credentialHashes.length,
            "Arrays length mismatch"
        );
        require(credentialIds.length > 0, "Empty arrays");
        require(credentialIds.length <= 50, "Too many credentials"); // Gas limit protection
        
        for (uint256 i = 0; i < credentialIds.length; i++) {
            string memory credentialId = credentialIds[i];
            bytes32 credentialHash = credentialHashes[i];
            
            require(bytes(credentialId).length > 0, "Credential ID cannot be empty");
            require(credentialHash != bytes32(0), "Credential hash cannot be empty");
            require(
                credentials[credentialId].timestamp == 0,
                "Credential already exists"
            );
            
            credentials[credentialId] = CredentialRecord({
                credentialHash: credentialHash,
                issuer: msg.sender,
                timestamp: block.timestamp,
                isRevoked: false,
                revocationReason: "",
                revocationTimestamp: 0,
                revoker: address(0)
            });
            
            emit CredentialAnchored(
                credentialId,
                credentialHash,
                msg.sender,
                block.timestamp
            );
        }
    }
    
    /**
     * @dev Get contract version
     * @return string Version number
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
