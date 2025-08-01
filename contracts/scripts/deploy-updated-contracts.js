const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying updated contracts...");

  // Получаем аккаунт
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Развертываем TierCalculator
  console.log("\n📊 Deploying TierCalculator...");
  const TierCalculator = await hre.ethers.getContractFactory("TierCalculator");
  const tierCalculator = await TierCalculator.deploy();
  await tierCalculator.waitForDeployment();
  console.log("✅ TierCalculator deployed to:", await tierCalculator.getAddress());

  // 2. Развертываем PADToken (если нужно)
  console.log("\n🪙 Deploying PADToken...");
  const PADToken = await hre.ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.waitForDeployment();
  console.log("✅ PADToken deployed to:", await padToken.getAddress());

  // 3. Развертываем MultiStakeManager
  console.log("\n🔒 Deploying MultiStakeManager...");
  const MultiStakeManager = await hre.ethers.getContractFactory("MultiStakeManager");
  const multiStakeManager = await MultiStakeManager.deploy(
    await padToken.getAddress(),
    await tierCalculator.getAddress()
  );
  await multiStakeManager.waitForDeployment();
  console.log("✅ MultiStakeManager deployed to:", await multiStakeManager.getAddress());

  // 4. Развертываем PADNFTFactory
  console.log("\n🎨 Deploying PADNFTFactory...");
  const PADNFTFactory = await hre.ethers.getContractFactory("PADNFTFactory");
  const nftFactory = await PADNFTFactory.deploy(
    await multiStakeManager.getAddress(),
    await tierCalculator.getAddress()
  );
  await nftFactory.waitForDeployment();
  console.log("✅ PADNFTFactory deployed to:", await nftFactory.getAddress());

  // 5. Настраиваем роли и связи
  console.log("\n🔗 Setting up contracts...");
  
  // Даем роль MINTER_ROLE MultiStakeManager в NFT Factory
  const MINTER_ROLE = await nftFactory.MINTER_ROLE();
  await nftFactory.grantRole(MINTER_ROLE, await multiStakeManager.getAddress());
  console.log("✅ Granted MINTER_ROLE to MultiStakeManager");

  // Устанавливаем NFT Factory в MultiStakeManager
  await multiStakeManager.setNFTFactory(await nftFactory.getAddress());
  console.log("✅ Set NFT Factory in MultiStakeManager");

  // Даем роль MINTER_ROLE deployer в NFT Factory (для тестирования)
  await nftFactory.grantRole(MINTER_ROLE, deployer.address);
  console.log("✅ Granted MINTER_ROLE to deployer");

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("PADToken:", await padToken.getAddress());
  console.log("TierCalculator:", await tierCalculator.getAddress());
  console.log("MultiStakeManager:", await multiStakeManager.getAddress());
  console.log("PADNFTFactory:", await nftFactory.getAddress());

  // Сохраняем адреса в файл
  const fs = require('fs');
  const addresses = {
    PAD_TOKEN_ADDRESS: await padToken.getAddress(),
    TIER_CALCULATOR_ADDRESS: await tierCalculator.getAddress(),
    STAKE_MANAGER_ADDRESS: await multiStakeManager.getAddress(),
    NFT_FACTORY_ADDRESS: await nftFactory.getAddress(),
    network: hre.network.name,
    deployer: deployer.address
  };

  fs.writeFileSync(
    `deployed-addresses-${hre.network.name}.json`,
    JSON.stringify(addresses, null, 2)
  );
  console.log(`\n💾 Addresses saved to deployed-addresses-${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 