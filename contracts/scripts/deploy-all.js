const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy PADToken (100 млн)
  console.log("\nDeploying PADToken...");
  const PADToken = await hre.ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.waitForDeployment();
  const padTokenAddress = await padToken.getAddress();
  console.log("PADToken deployed to:", padTokenAddress);

  // 2. Deploy TierCalculator
  console.log("\nDeploying TierCalculator...");
  const TierCalculator = await hre.ethers.getContractFactory("TierCalculator");
  const tierCalculator = await TierCalculator.deploy();
  await tierCalculator.waitForDeployment();
  const tierCalculatorAddress = await tierCalculator.getAddress();
  console.log("TierCalculator deployed to:", tierCalculatorAddress);

  // 3. Deploy MultiStakeManager (только с адресом токена)
  console.log("\nDeploying MultiStakeManager...");
  const MultiStakeManager = await hre.ethers.getContractFactory("MultiStakeManager");
  const stakeManager = await MultiStakeManager.deploy(padTokenAddress);
  await stakeManager.waitForDeployment();
  const stakeManagerAddress = await stakeManager.getAddress();
  console.log("MultiStakeManager deployed to:", stakeManagerAddress);

  // 4. Deploy PADNFTFactory (с адресами stakeManager и tierCalculator)
  console.log("\nDeploying PADNFTFactory...");
  const PADNFTFactory = await hre.ethers.getContractFactory("PADNFTFactory");
  const nftFactory = await PADNFTFactory.deploy(stakeManagerAddress, tierCalculatorAddress);
  await nftFactory.waitForDeployment();
  const nftFactoryAddress = await nftFactory.getAddress();
  console.log("PADNFTFactory deployed to:", nftFactoryAddress);

  // 5. setNFTFactory в MultiStakeManager
  console.log("\nSetting NFTFactory in MultiStakeManager...");
  const setNftTx = await stakeManager.setNFTFactory(nftFactoryAddress);
  await setNftTx.wait();
  console.log("NFTFactory set in MultiStakeManager");

  // 6. Выдать MINTER_ROLE для MultiStakeManager в NFTFactory
  console.log("\nGranting MINTER_ROLE to MultiStakeManager in NFTFactory...");
  const MINTER_ROLE = await nftFactory.MINTER_ROLE();
  const grantRoleTx = await nftFactory.grantRole(MINTER_ROLE, stakeManagerAddress);
  await grantRoleTx.wait();
  console.log("MINTER_ROLE granted to MultiStakeManager");

  // 7. Вывести адреса для .env и фронта
  console.log("\n================ DEPLOYMENT SUMMARY ================");
  console.log("PAD_TOKEN_ADDRESS=", padTokenAddress);
  console.log("STAKE_MANAGER_ADDRESS=", stakeManagerAddress);
  console.log("NFT_FACTORY_ADDRESS=", nftFactoryAddress);
  console.log("TIER_CALCULATOR_ADDRESS=", tierCalculatorAddress);
  console.log("====================================================");
  console.log("\nAdd these addresses to your .env and frontend config!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 