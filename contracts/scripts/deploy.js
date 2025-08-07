const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Employee Identity Registry...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const EmployeeIdentityRegistry = await ethers.getContractFactory("EmployeeIdentityRegistry");
  const registry = await EmployeeIdentityRegistry.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("EmployeeIdentityRegistry deployed to:", contractAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  const owner = await registry.owner();
  console.log("Contract owner:", owner);
  console.log("Deployer address:", deployer.address);
  console.log("Owner matches deployer:", owner === deployer.address);

  // Test basic functionality
  console.log("Testing basic functionality...");
  const version = await registry.version();
  console.log("Contract version:", version);

  const isAuthorized = await registry.isAuthorizedIssuer(deployer.address);
  console.log("Deployer is authorized issuer:", isAuthorized);

  console.log("\nDeployment completed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Network:", hre.network.name);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    version: version
  };

  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // If on testnet, add some test data
  if (hre.network.name === "mumbai") {
    console.log("\nAdding test data...");
    
    try {
      // Test anchoring a credential
      const testCredentialId = "test-credential-001";
      const testCredentialHash = ethers.keccak256(ethers.toUtf8Bytes("test credential data"));
      
      const tx = await registry.anchorCredential(testCredentialId, testCredentialHash);
      await tx.wait();
      
      console.log("Test credential anchored:", testCredentialId);
      
      // Verify the credential
      const isRevoked = await registry.isCredentialRevoked(testCredentialId);
      const storedHash = await registry.getCredentialHash(testCredentialId);
      
      console.log("Test credential is revoked:", isRevoked);
      console.log("Stored hash matches:", storedHash === testCredentialHash);
      
    } catch (error) {
      console.error("Error adding test data:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
