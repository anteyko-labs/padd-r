const hre = require("hardhat");

async function main() {
  console.log("Starting TierCalculator deployment...");

  // Deploy TierCalculator
  const TierCalculator = await hre.ethers.getContractFactory("TierCalculator");
  const tierCalculator = await TierCalculator.deploy();
  await tierCalculator.waitForDeployment();
  console.log("TierCalculator deployed to:", await tierCalculator.getAddress());

  // Verify contract on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await tierCalculator.deployTransaction.wait(6);

    console.log("Verifying TierCalculator...");
    await hre.run("verify:verify", {
      address: await tierCalculator.getAddress(),
      constructorArguments: [],
    });
  }

  console.log("TierCalculator deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 