const hre = require("hardhat");

async function main() {
  console.log("Deploying TierMonitorFinal to Sepolia...");

  // Получаем контракты, которые уже задеплоены на Sepolia
  const padToken = await hre.ethers.getContractAt("PADToken", "YOUR_PAD_TOKEN_ADDRESS");
  const tierCalculator = await hre.ethers.getContractAt("TierCalculator", "YOUR_TIER_CALCULATOR_ADDRESS");
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", "YOUR_NFT_FACTORY_ADDRESS");
  const stakeManager = await hre.ethers.getContractAt("MultiStakeManager", "YOUR_STAKE_MANAGER_ADDRESS");

  // Деплоим TierMonitorFinal
  const TierMonitorFinal = await hre.ethers.getContractFactory("TierMonitorFinal");
  const tierMonitor = await TierMonitorFinal.deploy(await stakeManager.getAddress());
  await tierMonitor.waitForDeployment();

  console.log("TierMonitorFinal deployed to:", await tierMonitor.getAddress());

  // Настраиваем параметры
  const tx1 = await tierMonitor.setBatchSize(10);
  await tx1.wait();
  console.log("Batch size set to 10");

  const tx2 = await tierMonitor.setGasLimit(500000);
  await tx2.wait();
  console.log("Gas limit set to 500000");

  const tx3 = await tierMonitor.setMinWaitTime(3600); // 1 hour
  await tx3.wait();
  console.log("Min wait time set to 1 hour");

  // Регистрируем Keepers
  console.log("\nRegistering Keepers...");
  console.log("1. Go to https://keepers.chain.link/sepolia");
  console.log("2. Click 'Register new Upkeep'");
  console.log("3. Choose 'Custom Logic'");
  console.log("4. Enter contract address:", await tierMonitor.getAddress());
  console.log("5. Enter name: 'PADD-R Tier Monitor'");
  console.log("6. Enter check data: 0x");
  console.log("7. Set gas limit to 500000");
  console.log("8. Set minimum balance to 0.1 ETH");
  console.log("9. Set trigger to 'Log trigger'");
  console.log("\nAfter registration, verify contract on Etherscan:");
  console.log("npx hardhat verify --network sepolia", await tierMonitor.getAddress(), await stakeManager.getAddress());

  // Сохраняем адреса в файл для последующего использования
  const fs = require('fs');
  const addresses = {
    tierMonitor: await tierMonitor.getAddress(),
    stakeManager: await stakeManager.getAddress(),
    padToken: await padToken.getAddress(),
    tierCalculator: await tierCalculator.getAddress(),
    nftFactory: await nftFactory.getAddress(),
    network: "sepolia"
  };
  fs.writeFileSync('deployed-addresses.sepolia.json', JSON.stringify(addresses, null, 2));
  console.log("\nDeployed addresses saved to deployed-addresses.sepolia.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 