const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Deploy PADToken
  console.log("Deploying PADToken...");
  const PADToken = await hre.ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.waitForDeployment();
  console.log("PADToken deployed to:", await padToken.getAddress());

  // Deploy TierCalculator
  console.log("Deploying TierCalculator...");
  const TierCalculator = await hre.ethers.getContractFactory("TierCalculator");
  const tierCalculator = await TierCalculator.deploy();
  await tierCalculator.waitForDeployment();
  console.log("TierCalculator deployed to:", await tierCalculator.getAddress());

  // Deploy MultiStakeManager
  console.log("Deploying MultiStakeManager...");
  const MultiStakeManager = await hre.ethers.getContractFactory("MultiStakeManager");
  const multiStakeManager = await MultiStakeManager.deploy(
    await padToken.getAddress(),
    await tierCalculator.getAddress()
  );
  await multiStakeManager.waitForDeployment();
  console.log("MultiStakeManager deployed to:", await multiStakeManager.getAddress());

  // Verify contracts on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await padToken.deployTransaction.wait(6);
    await tierCalculator.deployTransaction.wait(6);
    await multiStakeManager.deployTransaction.wait(6);

    console.log("Verifying contracts...");
    await hre.run("verify:verify", {
      address: await padToken.getAddress(),
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: await tierCalculator.getAddress(),
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: await multiStakeManager.getAddress(),
      constructorArguments: [
        await padToken.getAddress(),
        await tierCalculator.getAddress(),
      ],
    });
  }

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 