const hre = require("hardhat");

async function main() {
  console.log("Starting PADToken deployment...");

  // Deploy PADToken
  const PADToken = await hre.ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.waitForDeployment();
  console.log("PADToken deployed to:", await padToken.getAddress());

  // Verify contract on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await padToken.deployTransaction.wait(6);

    console.log("Verifying PADToken...");
    await hre.run("verify:verify", {
      address: await padToken.getAddress(),
      constructorArguments: [],
    });
  }

  console.log("PADToken deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 