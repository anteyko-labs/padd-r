const hre = require("hardhat");

async function main() {
  console.log("🔧 Deploying Fixed Contracts...");

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Развертываем TierCalculator
  console.log("\n📊 Deploying TierCalculator...");
  const TierCalculator = await hre.ethers.getContractFactory("TierCalculator");
  const tierCalculator = await TierCalculator.deploy();
  await tierCalculator.waitForDeployment();
  const tierCalculatorAddress = await tierCalculator.getAddress();
  console.log("✅ TierCalculator deployed to:", tierCalculatorAddress);

  // 2. Развертываем PADToken
  console.log("\n🪙 Deploying PADToken...");
  const PADToken = await hre.ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.waitForDeployment();
  const padTokenAddress = await padToken.getAddress();
  console.log("✅ PADToken deployed to:", padTokenAddress);

  // 3. Развертываем MultiStakeManager (ИСПРАВЛЕННЫЙ)
  console.log("\n🔒 Deploying MultiStakeManager (FIXED)...");
  const MultiStakeManager = await hre.ethers.getContractFactory("MultiStakeManager");
  const multiStakeManager = await MultiStakeManager.deploy(padTokenAddress, tierCalculatorAddress);
  await multiStakeManager.waitForDeployment();
  const multiStakeManagerAddress = await multiStakeManager.getAddress();
  console.log("✅ MultiStakeManager deployed to:", multiStakeManagerAddress);

  // 4. Развертываем PADNFTFactory
  console.log("\n🎨 Deploying PADNFTFactory...");
  const PADNFTFactory = await hre.ethers.getContractFactory("PADNFTFactory");
  const nftFactory = await PADNFTFactory.deploy(multiStakeManagerAddress, tierCalculatorAddress);
  await nftFactory.waitForDeployment();
  const nftFactoryAddress = await nftFactory.getAddress();
  console.log("✅ PADNFTFactory deployed to:", nftFactoryAddress);

  // 5. Настраиваем роли и связи
  console.log("\n🔗 Setting up roles and connections...");

  // Даем роль MINTER_ROLE для MultiStakeManager в PADToken
  const MINTER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MINTER_ROLE"));
  await padToken.grantRole(MINTER_ROLE, multiStakeManagerAddress);
  console.log("✅ MINTER_ROLE granted to MultiStakeManager");

  // Даем роль MINTER_ROLE для MultiStakeManager в PADNFTFactory
  const NFT_MINTER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MINTER_ROLE"));
  await nftFactory.grantRole(NFT_MINTER_ROLE, multiStakeManagerAddress);
  console.log("✅ MINTER_ROLE granted to MultiStakeManager in NFT Factory");

  // Устанавливаем NFT Factory в MultiStakeManager
  await multiStakeManager.setNFTFactory(nftFactoryAddress);
  console.log("✅ NFT Factory set in MultiStakeManager");

  // 6. Проверяем баланс токенов (они уже минтится в конструкторе)
  console.log("\n💰 Checking token balance...");
  const tokenBalance = await padToken.balanceOf(deployer.address);
  console.log("✅ Token balance:", hre.ethers.formatEther(tokenBalance), "PAD tokens");

  // 7. Выводим итоговые адреса
  console.log("\n🎯 Deployment Summary:");
  console.log("PAD Token:", padTokenAddress);
  console.log("Stake Manager:", multiStakeManagerAddress);
  console.log("NFT Factory:", nftFactoryAddress);
  console.log("Tier Calculator:", tierCalculatorAddress);

  console.log("\n🔧 FIXES Applied:");
  console.log("- Only position owner can mint next NFT");
  console.log("- Strict time interval checks");
  console.log("- Added NextNFTMinted event");
  console.log("- Prevented premature minting");

  console.log("\n✅ All contracts deployed and configured!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 