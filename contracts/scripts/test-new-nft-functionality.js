const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing new NFT functionality with isInitialStakingNFT...");

  // Новые адреса контрактов
  const nftFactoryAddress = "0xa73877075ED2d1371ae12345E0d28623B77BB777";
  const multiStakeManagerAddress = "0xE3dB5ad755ff62C31C0Ae467237F2Dc1E5B0d54a";
  const padTokenAddress = "0x6e54ef83eD01B718c92DDEb2629E9849eDe5b94F";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);
  const padToken = await hre.ethers.getContractAt("PADToken", padTokenAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Проверяем баланс PAD токенов
  const balance = await padToken.balanceOf(deployer.address);
  console.log("\n💰 PAD Token balance:", hre.ethers.formatEther(balance), "PAD");

  if (balance < hre.ethers.parseEther("1000")) {
    console.log("❌ Недостаточно токенов для тестирования! Нужно минимум 1000 PAD");
    return;
  }

  // Даем разрешение на стейкинг
  console.log("\n🔐 Approving tokens for staking...");
  const approveTx = await padToken.approve(multiStakeManagerAddress, hre.ethers.parseEther("1000"));
  await approveTx.wait();
  console.log("✅ Tokens approved");

  // Создаем позицию стейкинга (должен автоматически минтить NFT)
  console.log("\n🔒 Creating staking position...");
  const stakeAmount = hre.ethers.parseEther("1000");
  const stakeMonths = 3;
  
  const stakeTx = await multiStakeManager.createPosition(stakeAmount, stakeMonths);
  const stakeReceipt = await stakeTx.wait();
  console.log("✅ Staking position created");

  // Ищем событие PositionCreated
  const positionCreatedEvent = stakeReceipt.logs.find(log => {
    try {
      const parsed = multiStakeManager.interface.parseLog(log);
      return parsed.name === "PositionCreated";
    } catch {
      return false;
    }
  });

  if (positionCreatedEvent) {
    const parsed = multiStakeManager.interface.parseLog(positionCreatedEvent);
    const positionId = parsed.args.positionId;
    console.log("📊 Position ID:", positionId.toString());
  }

  // Проверяем NFT баланс
  console.log("\n🎨 Checking NFT balance...");
  const nftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("NFT balance:", nftBalance.toString());

  if (nftBalance > 0) {
    console.log("\n🎉 НАЙДЕНЫ NFT!");
    // Для ERC-721A используем другой подход
    const totalSupply = await nftFactory.totalSupply();
    console.log("Total supply:", totalSupply.toString());
    
    // Проверяем все токены от 0 до totalSupply
    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        const owner = await nftFactory.ownerOf(tokenId);
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
          console.log(`\n🎨 NFT #${tokenId.toString()}:`);
          console.log("  - Owner:", owner);
          
          const metadata = await nftFactory.nftMetadata(tokenId);
          console.log("  - Position ID:", metadata.positionId.toString());
          console.log("  - Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
          console.log("  - Lock Duration (hours):", metadata.lockDurationHours.toString());
          console.log("  - Tier Level:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
          console.log("  - Hour Index:", metadata.hourIndex.toString());
          console.log("  - Next Mint On:", new Date(Number(metadata.nextMintOn) * 1000).toISOString());
          console.log("  - Is Initial Staking NFT:", metadata.isInitialStakingNFT ? "✅ Yes" : "❌ No");
          
          console.log("\n🔗 NFT Contract Address:", nftFactoryAddress);
          console.log("🆔 Token ID:", tokenId.toString());
        }
      } catch (e) {
        // Пропускаем несуществующие токены
        continue;
      }
    }
  } else {
    console.log("❌ NFT не найдены");
  }

  // Проверяем позиции пользователя
  console.log("\n📊 Checking user positions...");
  const userPositions = await multiStakeManager.getUserPositions(deployer.address);
  console.log("Number of positions:", userPositions.length);

  for (let i = 0; i < userPositions.length; i++) {
    const positionId = userPositions[i];
    const position = await multiStakeManager.positions(positionId);
    console.log(`\nPosition #${positionId}:`);
    console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
    console.log("  - Duration:", position.duration.toString(), "seconds");
    console.log("  - Start Time:", new Date(Number(position.startTime) * 1000).toISOString());
    console.log("  - Is Active:", position.isActive);
    console.log("  - Tier:", position.tier);
    console.log("  - Month Index:", position.monthIndex);
    console.log("  - Next Mint At:", new Date(Number(position.nextMintAt) * 1000).toISOString());
  }

  console.log("\n🎯 Test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 