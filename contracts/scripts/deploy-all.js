const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy PADToken
  console.log("\nDeploying PADToken...");
  const PADToken = await hre.ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.waitForDeployment();
  console.log("PADToken deployed to:", await padToken.getAddress());

  // Deploy TierCalculator
  console.log("\nDeploying TierCalculator...");
  const TierCalculator = await hre.ethers.getContractFactory("TierCalculator");
  const tierCalculator = await TierCalculator.deploy();
  await tierCalculator.waitForDeployment();
  console.log("TierCalculator deployed to:", await tierCalculator.getAddress());

  // Deploy NFTFactory
  console.log("\nDeploying PADNFTFactory...");
  const PADNFTFactory = await hre.ethers.getContractFactory("PADNFTFactory");
  const nftFactory = await PADNFTFactory.deploy();
  await nftFactory.waitForDeployment();
  console.log("PADNFTFactory deployed to:", await nftFactory.getAddress());

  // Deploy MultiStakeManager
  console.log("\nDeploying MultiStakeManager...");
  const MultiStakeManager = await hre.ethers.getContractFactory("MultiStakeManager");
  const stakeManager = await MultiStakeManager.deploy(
    await padToken.getAddress(),
    await tierCalculator.getAddress(),
    await nftFactory.getAddress()
  );
  await stakeManager.waitForDeployment();
  console.log("MultiStakeManager deployed to:", await stakeManager.getAddress());

  // Deploy TierMonitor
  console.log("\nDeploying TierMonitor...");
  const TierMonitor = await hre.ethers.getContractFactory("TierMonitor");
  const tierMonitor = await TierMonitor.deploy(await stakeManager.getAddress());
  await tierMonitor.waitForDeployment();
  console.log("TierMonitor deployed to:", await tierMonitor.getAddress());

  // Setup roles and permissions
  console.log("\nSetting up roles and permissions...");
  
  // Grant MINTER_ROLE to MultiStakeManager
  const MINTER_ROLE = await nftFactory.MINTER_ROLE();
  const grantRoleTx = await nftFactory.grantRole(MINTER_ROLE, await stakeManager.getAddress());
  await grantRoleTx.wait();
  console.log("Granted MINTER_ROLE to MultiStakeManager");

  // Verify contracts on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await padToken.deployTransaction.wait(6);
    await tierCalculator.deployTransaction.wait(6);
    await nftFactory.deployTransaction.wait(6);
    await stakeManager.deployTransaction.wait(6);
    await tierMonitor.deployTransaction.wait(6);

    console.log("\nVerifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: await padToken.getAddress(),
        constructorArguments: [],
      });
      console.log("PADToken verified on Etherscan");

      await hre.run("verify:verify", {
        address: await tierCalculator.getAddress(),
        constructorArguments: [],
      });
      console.log("TierCalculator verified on Etherscan");

      await hre.run("verify:verify", {
        address: await nftFactory.getAddress(),
        constructorArguments: [],
      });
      console.log("PADNFTFactory verified on Etherscan");

      await hre.run("verify:verify", {
        address: await stakeManager.getAddress(),
        constructorArguments: [
          await padToken.getAddress(),
          await tierCalculator.getAddress(),
          await nftFactory.getAddress(),
        ],
      });
      console.log("MultiStakeManager verified on Etherscan");

      await hre.run("verify:verify", {
        address: await tierMonitor.getAddress(),
        constructorArguments: [await stakeManager.getAddress()],
      });
      console.log("TierMonitor verified on Etherscan");
    } catch (error) {
      console.error("Error verifying contracts:", error);
    }
  }

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("PADToken:", await padToken.getAddress());
  console.log("TierCalculator:", await tierCalculator.getAddress());
  console.log("PADNFTFactory:", await nftFactory.getAddress());
  console.log("MultiStakeManager:", await stakeManager.getAddress());
  console.log("TierMonitor:", await tierMonitor.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 