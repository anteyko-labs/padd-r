const hre = require("hardhat");

async function main() {
  console.log("🧪 Comprehensive NFT and Staking Test...");

  // Адреса контрактов
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

  // 1. Проверяем баланс PAD токенов
  const balance = await padToken.balanceOf(deployer.address);
  console.log("\n💰 PAD Token balance:", hre.ethers.formatEther(balance), "PAD");

  if (balance < hre.ethers.parseEther("1000")) {
    console.log("❌ Недостаточно токенов для тестирования! Нужно минимум 1000 PAD");
    return;
  }

  // 2. Проверяем текущие NFT
  console.log("\n🎨 Checking current NFTs...");
  const nftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("Current NFT balance:", nftBalance.toString());

  // 3. Проверяем текущие позиции
  console.log("\n📊 Checking current positions...");
  const userPositions = await multiStakeManager.getUserPositions(deployer.address);
  console.log("Current positions:", userPositions.length);

  // 4. Создаем новую позицию стейкинга (если есть место)
  if (userPositions.length < 10) { // максимум 10 позиций
    console.log("\n🔒 Creating new staking position...");
    
    // Даем разрешение
    const approveTx = await padToken.approve(multiStakeManagerAddress, hre.ethers.parseEther("1000"));
    await approveTx.wait();
    console.log("✅ Tokens approved");

    // Создаем позицию
    const stakeAmount = hre.ethers.parseEther("1000");
    const stakeMonths = 3;
    
    const stakeTx = await multiStakeManager.createPosition(stakeAmount, stakeMonths);
    const stakeReceipt = await stakeTx.wait();
    console.log("✅ New staking position created");

    // Ищем PositionCreated событие
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
      console.log("📊 New Position ID:", positionId.toString());
    }
  } else {
    console.log("⚠️ Maximum positions reached (10)");
  }

  // 5. Проверяем NFT после стейкинга
  console.log("\n🎨 Checking NFTs after staking...");
  const newNftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("New NFT balance:", newNftBalance.toString());

  if (newNftBalance > 0) {
    const totalSupply = await nftFactory.totalSupply();
    console.log("Total supply:", totalSupply.toString());
    
    // Показываем все NFT
    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        const owner = await nftFactory.ownerOf(tokenId);
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
          const metadata = await nftFactory.nftMetadata(tokenId);
          console.log(`\n🎨 NFT #${tokenId}:`);
          console.log("  - Tier:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
          console.log("  - Is Initial Staking NFT:", metadata.isInitialStakingNFT ? "✅ Yes" : "❌ No");
          console.log("  - Position ID:", metadata.positionId.toString());
          console.log("  - Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
        }
      } catch (e) {
        continue;
      }
    }
  }

  // 6. Проверяем позиции для минтинга дополнительных NFT
  console.log("\n⏰ Checking positions for additional NFT minting...");
  const updatedPositions = await multiStakeManager.getUserPositions(deployer.address);
  
  for (let i = 0; i < updatedPositions.length; i++) {
    const positionId = updatedPositions[i];
    const position = await multiStakeManager.positions(positionId);
    
    console.log(`\nPosition #${positionId}:`);
    console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
    console.log("  - Month Index:", position.monthIndex.toString());
    console.log("  - Next Mint At:", new Date(Number(position.nextMintAt) * 1000).toISOString());
    
    const now = Math.floor(Date.now() / 1000);
    const canMint = Number(position.nextMintAt) <= now;
    
    if (canMint) {
      console.log("  - Status: 🟢 Ready for next NFT mint!");
      
      // Пробуем минтить следующий NFT
      try {
        console.log("  - Attempting to mint next NFT...");
        const mintTx = await multiStakeManager.mintNextNFT(positionId);
        await mintTx.wait();
        console.log("  - ✅ Additional NFT minted successfully!");
      } catch (e) {
        console.log("  - ❌ Error minting:", e.message);
      }
    } else {
      const daysUntilMint = Math.ceil((Number(position.nextMintAt) - now) / (24 * 3600));
      console.log(`  - Status: 🟡 Next NFT in ${daysUntilMint} days`);
    }
  }

  // 7. Финальная проверка
  console.log("\n🎯 Final NFT check...");
  const finalNftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("Final NFT balance:", finalNftBalance.toString());

  console.log("\n🎉 Comprehensive test completed!");
  console.log("\n📋 Summary:");
  console.log("- Staking positions:", updatedPositions.length);
  console.log("- Total NFTs:", finalNftBalance.toString());
  console.log("- Monthly NFT minting: ✅ Automatic (call mintNextNFT when ready)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 