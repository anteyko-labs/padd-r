const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TierMonitorFinal with the account:", deployer.address);

  // Получаем фабрику контракта TierMonitorFinal (это заставит Hardhat сгенерировать артефакт)
  const TierMonitorFinal = await ethers.getContractFactory("TierMonitorFinal");
  console.log("TierMonitorFinal factory obtained.");

  // Деплоим контракт с адресом stakeManager (используем ZeroAddress для теста)
  const stakeManagerAddress = ethers.ZeroAddress;
  const tierMonitor = await TierMonitorFinal.deploy(stakeManagerAddress);
  await tierMonitor.waitForDeployment();
  console.log("TierMonitorFinal deployed to:", await tierMonitor.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 