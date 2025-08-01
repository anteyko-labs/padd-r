const hre = require("hardhat");

async function main() {
  // Актуальные адреса контрактов
  const multiStakeManagerAddress = "0x330356f6ad6fe0977d85B42A2e538294A211a234";
  const nftFactoryAddress = "0x3453a74D3EDE70cA317e6A29Bd04e82952B37050";

  // Получаем контракты
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Minting NFT for account:", deployer.address);

  // Получаем позиции пользователя
  const userPositions = await multiStakeManager.getUserPositions(deployer.address);
  console.log("Number of positions:", userPositions.length);

  for (let i = 0; i < userPositions.length; i++) {
    const positionId = userPositions[i];
    const position = await multiStakeManager.positions(positionId);
    
    console.log(`\n📊 Position #${positionId}:`);
    console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
    console.log("  - Duration:", position.duration.toString(), "seconds");
    console.log("  - Start Time:", new Date(Number(position.startTime) * 1000).toISOString());
    console.log("  - Is Active:", position.isActive);
    console.log("  - Tier:", position.tier);
    console.log("  - Month Index:", position.monthIndex);
    console.log("  - Next Mint At:", new Date(Number(position.nextMintAt) * 1000).toISOString());
    
    // Проверяем, можно ли создать NFT
    const currentTime = Math.floor(Date.now() / 1000);
    const canMint = position.isActive && currentTime >= Number(position.nextMintAt);
    const maxNFTs = Number(position.duration) / (30 * 24 * 60 * 60); // 30 дней в секундах
    const hasMoreNFTs = Number(position.monthIndex) < maxNFTs;
    
    console.log("  - Current Time:", new Date(currentTime * 1000).toISOString());
    console.log("  - Can Mint:", canMint);
    console.log("  - Has More NFTs:", hasMoreNFTs);
    console.log("  - Max NFTs for this position:", maxNFTs);
    
    if (canMint && hasMoreNFTs) {
      console.log(`\n🎉 Попытка создать NFT для позиции #${positionId}...`);
      try {
        const mintTx = await multiStakeManager.mintNextNFT(positionId);
        const receipt = await mintTx.wait();
        console.log("✅ NFT создан успешно!");
        console.log("Transaction hash:", receipt.hash);
        
        // Проверяем, появился ли NFT
        const nftBalance = await nftFactory.balanceOf(deployer.address);
        console.log("🎨 Новый NFT balance:", nftBalance.toString());
        
        if (nftBalance > 0) {
          const tokenId = await nftFactory.tokenOfOwnerByIndex(deployer.address, Number(nftBalance) - 1);
          const metadata = await nftFactory.nftMetadata(tokenId);
          console.log(`\n🎨 Создан NFT #${tokenId.toString()}:`);
          console.log("  - Position ID:", metadata.positionId.toString());
          console.log("  - Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
          console.log("  - Lock Duration (hours):", metadata.lockDurationHours.toString());
          console.log("  - Tier Level:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
          console.log("  - Hour Index:", metadata.hourIndex.toString());
          console.log("  - Next Mint On:", new Date(Number(metadata.nextMintOn) * 1000).toISOString());
          
          console.log("\n🔗 NFT Contract Address:", nftFactoryAddress);
          console.log("🆔 Token ID:", tokenId.toString());
          console.log("👤 Owner:", deployer.address);
        }
      } catch (e) {
        console.log("❌ Ошибка при создании NFT:", e.message);
      }
    } else {
      console.log(`❌ Нельзя создать NFT для позиции #${positionId}`);
      if (!canMint) {
        console.log("  - Причина: слишком рано для следующего NFT");
      }
      if (!hasMoreNFTs) {
        console.log("  - Причина: все NFT для этой позиции уже созданы");
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 