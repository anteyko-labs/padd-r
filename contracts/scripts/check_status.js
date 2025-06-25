require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking status with account:", deployer.address);

  // Загружаем адреса из последнего деплоя (или используем фиксированные)
  const walletAddress = process.env.WALLET_ADDRESS;
  if (!walletAddress) {
    throw new Error("WALLET_ADDRESS не задан в .env");
  }

  // Адреса контрактов (замените на актуальные после деплоя)
  const PADToken = await ethers.getContractFactory("PADToken");
  const padToken = PADToken.attach("0x5e36c2e6a50712d09Ea714a356923514B4C2338e");

  const MultiStakeManager = await ethers.getContractFactory("MultiStakeManager");
  const multiStakeManager = MultiStakeManager.attach("0xC54E3B95EC87F4a1E85860E81b4864ac059E1dDf");

  const PADNFTFactory = await ethers.getContractFactory("PADNFTFactory");
  const padNFTFactory = PADNFTFactory.attach("0xDBE1483fE39b26a92FE4B7cc3923c0cc9Ad50237");

  console.log("\n=== ПРОВЕРКА СТАТУСА ===");
  
  // 1. Проверяем баланс токенов
  const tokenBalance = await padToken.balanceOf(walletAddress);
  console.log("1. Баланс PADToken на кошельке:", ethers.formatEther(tokenBalance), "PAD");

  // 2. Проверяем позиции пользователя
  const userPositions = await multiStakeManager.getUserPositions(walletAddress);
  console.log("2. Количество позиций пользователя:", userPositions.length);

  if (userPositions.length > 0) {
    console.log("   Позиции:", userPositions.map(p => p.toString()));
    
    // Проверяем детали первой позиции
    const positionId = userPositions[0];
    const position = await multiStakeManager.positions(positionId);
    console.log("3. Детали позиции", positionId.toString() + ":");
    console.log("   - Amount:", ethers.formatEther(position.amount), "PAD");
    console.log("   - Start Time:", new Date(Number(position.startTime) * 1000).toLocaleString());
    console.log("   - Duration:", position.duration.toString(), "секунд");
    console.log("   - Tier:", position.tier.toString());
    console.log("   - Month Index:", position.monthIndex.toString());
    console.log("   - Is Active:", position.isActive);
    console.log("   - Owner:", position.owner);
    console.log("   - Next Mint At:", new Date(Number(position.nextMintAt) * 1000).toLocaleString());
  }

  // 4. Проверяем NFT баланс
  const nftBalance = await padNFTFactory.balanceOf(walletAddress);
  console.log("4. Количество NFT на кошельке:", nftBalance.toString());

  if (nftBalance > 0) {
    // Получаем все токены пользователя (для ERC721A используем другой подход)
    console.log("   NFT найдены! Для получения деталей используйте Etherscan или проверьте токен ID 0");
    
    // Проверяем первый токен (обычно ID 0 для ERC721A)
    try {
      const tokenId = 0;
      const metadata = await padNFTFactory.nftMetadata(tokenId);
      console.log("   NFT", tokenId.toString() + ":");
      console.log("     - Position ID:", metadata.positionId.toString());
      console.log("     - Amount Staked:", ethers.formatEther(metadata.amountStaked), "PAD");
      console.log("     - Lock Duration Months:", metadata.lockDurationMonths.toString());
      console.log("     - Start Timestamp:", new Date(Number(metadata.startTimestamp) * 1000).toLocaleString());
      console.log("     - Tier Level:", metadata.tierLevel.toString());
      console.log("     - Month Index:", metadata.monthIndex.toString());
      console.log("     - Next Mint On:", new Date(Number(metadata.nextMintOn) * 1000).toLocaleString());
    } catch (error) {
      console.log("   Ошибка при получении метаданных NFT:", error.message);
    }
  }

  // 5. Проверяем allowance
  const allowance = await padToken.allowance(walletAddress, await multiStakeManager.getAddress());
  console.log("5. Allowance для MultiStakeManager:", ethers.formatEther(allowance), "PAD");

  // 6. Проверяем общий supply токенов
  const totalSupply = await padToken.totalSupply();
  console.log("6. Общий supply PADToken:", ethers.formatEther(totalSupply), "PAD");

  console.log("\n=== КОНЕЦ ПРОВЕРКИ ===");
}

if (require.main === module) {
  main().catch((error) => { console.error(error); process.exit(1); });
} 