require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy PADToken
  const PADToken = await ethers.getContractFactory("PADToken");
  const padToken = await PADToken.deploy();
  await padToken.waitForDeployment();
  console.log("PADToken deployed to:", await padToken.getAddress());

  // Deploy TierCalculator
  const TierCalculator = await ethers.getContractFactory("TierCalculator");
  const tierCalculator = await TierCalculator.deploy();
  await tierCalculator.waitForDeployment();
  console.log("TierCalculator deployed to:", await tierCalculator.getAddress());

  // Deploy MultiStakeManager (только с адресом PADToken)
  const MultiStakeManager = await ethers.getContractFactory("MultiStakeManager");
  const multiStakeManager = await MultiStakeManager.deploy(await padToken.getAddress());
  await multiStakeManager.waitForDeployment();
  console.log("MultiStakeManager deployed to:", await multiStakeManager.getAddress());

  // Deploy PADNFTFactory (stakeManager, tierCalculator)
  const PADNFTFactory = await ethers.getContractFactory("PADNFTFactory");
  const padNFTFactory = await PADNFTFactory.deploy(
    await multiStakeManager.getAddress(),
    await tierCalculator.getAddress()
  );
  await padNFTFactory.waitForDeployment();
  console.log("PADNFTFactory deployed to:", await padNFTFactory.getAddress());

  // Обновляем адрес NFTFactory в MultiStakeManager
  const updateFactoryTx = await multiStakeManager.setNFTFactory(await padNFTFactory.getAddress());
  await updateFactoryTx.wait();
  console.log("Updated NFTFactory address in MultiStakeManager");

  // Выдаём MINTER_ROLE для MultiStakeManager в PADNFTFactory
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const grantRoleTx = await padNFTFactory.grantRole(MINTER_ROLE, await multiStakeManager.getAddress());
  await grantRoleTx.wait();
  console.log("MINTER_ROLE granted to MultiStakeManager in PADNFTFactory");

  // Mint 1000 токенов на кошелек (адрес из .env)
  const walletAddress = process.env.WALLET_ADDRESS;
  if (!walletAddress) {
    throw new Error("WALLET_ADDRESS не задан в .env");
  }
  const transferTx = await padToken.transfer(walletAddress, ethers.parseEther("1000"));
  await transferTx.wait();
  console.log("Transferred 1000 PADToken на адрес:", walletAddress);

  // Застейкаем 100 токенов (на 1 час) через MultiStakeManager
  const stakeAmount = ethers.parseEther("100");
  const stakeDurationSeconds = 1 * 60 * 60; // 1 час в секундах

  // Перед approve и createPosition добавляем проверки:
  const deployerBalance = await padToken.balanceOf(deployer.address);
  console.log("Balance deployer (или WALLET_ADDRESS) (в wei):", deployerBalance.toString());
  if (BigInt(deployerBalance) < BigInt(stakeAmount)) {
    console.error("Недостаточно баланса на deployer (или WALLET_ADDRESS) для стейкинга.");
    process.exit(1);
  }

  const isPaused = await padToken.paused();
  if (isPaused) {
    console.error("Контракт PADToken стоит на паузе.");
    process.exit(1);
  }

  const hasCooldown = await padToken.hasCooldown(deployer.address);
  if (hasCooldown) {
    console.error("У deployer (или WALLET_ADDRESS) включен cooldown.");
    process.exit(1);
  }

  // Получаем приватный ключ пользователя из .env
  const userPrivateKey = process.env.PRIVATE_KEY;
  const userWallet = new ethers.Wallet(userPrivateKey, ethers.provider);

  // Approve и createPosition делаем от имени пользователя
  const approveTx = await padToken.connect(userWallet).approve(await multiStakeManager.getAddress(), stakeAmount);
  await approveTx.wait();
  console.log("User approved MultiStakeManager to spend 100 PADToken");

  // Выводим адреса для отладки
  const managerAddress = await multiStakeManager.getAddress();
  console.log("walletAddress:", walletAddress);
  console.log("multiStakeManager.address:", managerAddress);

  // Проверяем баланс пользователя
  const userBalance = await padToken.balanceOf(walletAddress);
  console.log("User balance:", ethers.formatEther(userBalance), "PAD");

  // Проверяем allowance
  const allowance = await padToken.allowance(walletAddress, managerAddress);
  console.log("Allowance for MultiStakeManager:", ethers.formatEther(allowance), "PAD");

  // Проверяем статус паузы
  const isTokenPaused = await padToken.paused();
  console.log("Token contract paused:", isTokenPaused);

  // Проверяем, что у нас достаточно баланса и allowance
  if (userBalance < stakeAmount) {
    throw new Error(`Insufficient balance. Have: ${ethers.formatEther(userBalance)} PAD, Need: ${ethers.formatEther(stakeAmount)} PAD`);
  }
  if (allowance < stakeAmount) {
    throw new Error(`Insufficient allowance. Have: ${ethers.formatEther(allowance)} PAD, Need: ${ethers.formatEther(stakeAmount)} PAD`);
  }

  console.log("Creating stake position...");
  console.log("stakeAmount (wei):", stakeAmount.toString());
  console.log("stakeDurationSeconds:", stakeDurationSeconds);

  // Проверяем все условия из createPosition
  console.log("=== Проверки createPosition ===");
  console.log("1. amount > 0:", stakeAmount > 0);
  console.log("2. MIN_STAKE_DURATION (180 days):", 180 * 24 * 60 * 60);
  console.log("   duration >= MIN_STAKE_DURATION:", stakeDurationSeconds >= (180 * 24 * 60 * 60));
  console.log("3. MAX_STAKE_DURATION (3650 days):", 3650 * 24 * 60 * 60);
  console.log("   duration <= MAX_STAKE_DURATION:", stakeDurationSeconds <= (3650 * 24 * 60 * 60));
  
  // Проверяем количество позиций пользователя
  const userPositions = await multiStakeManager.getUserPositions(walletAddress);
  console.log("4. Количество позиций пользователя:", userPositions.length);
  console.log("   MAX_POSITIONS_PER_WALLET (10):", 10);
  console.log("   userPositions.length < MAX_POSITIONS_PER_WALLET:", userPositions.length < 10);
  
  console.log("5. amount <= type(uint128).max:", stakeAmount <= BigInt("340282366920938463463374607431768211455"));
  console.log("6. nftFactory address:", await multiStakeManager.nftFactory());
  console.log("   nftFactory != address(0):", await multiStakeManager.nftFactory() !== ethers.ZeroAddress);
  
  // Проверяем роли в PADNFTFactory
  const hasMinterRole = await padNFTFactory.hasRole(MINTER_ROLE, await multiStakeManager.getAddress());
  console.log("7. MultiStakeManager имеет MINTER_ROLE в PADNFTFactory:", hasMinterRole);
  
  console.log("=== Конец проверок ===");

  const stakeTx = await multiStakeManager.connect(userWallet).createPosition(stakeAmount, stakeDurationSeconds);
  await stakeTx.wait();
  console.log("User staked 100 PADToken (на 1 час) через MultiStakeManager.");

  console.log("Скрипт завершен.");
}

if (require.main === module) {
  main().catch((error) => { console.error(error); process.exit(1); });
} 