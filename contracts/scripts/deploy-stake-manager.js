const hre = require("hardhat");

async function main() {
  console.log("Starting MultiStakeManager deployment...");

  // Get deployed contract addresses
  const padTokenAddress = process.env.PAD_TOKEN_ADDRESS;
  const tierCalculatorAddress = process.env.TIER_CALCULATOR_ADDRESS;

  if (!padTokenAddress || !tierCalculatorAddress) {
    throw new Error("Please set PAD_TOKEN_ADDRESS and TIER_CALCULATOR_ADDRESS in .env");
  }

  // Deploy MultiStakeManager
  const MultiStakeManager = await hre.ethers.getContractFactory("MultiStakeManager");
  const multiStakeManager = await MultiStakeManager.deploy(
    padTokenAddress,
    tierCalculatorAddress
  );
  await multiStakeManager.waitForDeployment();
  console.log("MultiStakeManager deployed to:", await multiStakeManager.getAddress());

  // Verify contract on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await multiStakeManager.deployTransaction.wait(6);

    console.log("Verifying MultiStakeManager...");
    await hre.run("verify:verify", {
      address: await multiStakeManager.getAddress(),
      constructorArguments: [
        padTokenAddress,
        tierCalculatorAddress
      ],
    });
  }

  console.log("MultiStakeManager deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 