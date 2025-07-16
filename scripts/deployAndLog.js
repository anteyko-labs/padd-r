require("dotenv").config();
const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Deploy PADToken
  const PADToken = await ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.deployed();
  console.log("PADToken:", padToken.address);

  // 2. Deploy TierCalculator
  const TierCalculator = await ethers.getContractFactory("TierCalculator");
  const tierCalc = await TierCalculator.deploy();
  await tierCalc.deployed();
  console.log("TierCalculator:", tierCalc.address);

  // 3. Deploy PADNFTFactory
  const PADNFTFactory = await ethers.getContractFactory("PADNFTFactory");
  const padNftFactory = await PADNFTFactory.deploy(
    deployer.address,
    tierCalc.address
  );
  await padNftFactory.deployed();
  console.log("PADNFTFactory:", padNftFactory.address);

  // 4. Deploy MultiStakeManager
  const MultiStakeManager = await ethers.getContractFactory("MultiStakeManager");
  const stakeManager = await MultiStakeManager.deploy(padToken.address);
  await stakeManager.deployed();
  console.log("MultiStakeManager:", stakeManager.address);

  // 5. Сохраняем адреса в файл
  const addresses = {
    PADToken: padToken.address,
    TierCalculator: tierCalc.address,
    PADNFTFactory: padNftFactory.address,
    MultiStakeManager: stakeManager.address
  };
  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\nВсе адреса сохранены в addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 