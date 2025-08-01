const hre = require("hardhat");

async function main() {
  console.log("🧪 Checking NFT balance with updated contracts...");

  // Новые адреса контрактов
  const nftFactoryAddress = "0xa73877075ED2d1371ae12345E0d28623B77BB777";
  const multiStakeManagerAddress = "0xE3dB5ad755ff62C31C0Ae467237F2Dc1E5B0d54a";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Checking NFTs for account:", deployer.address);

  // Проверяем NFT баланс
  const nftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("\n🎨 NFT balance:", nftBalance.toString());

  if (nftBalance > 0) {
    console.log("\n🎉 НАЙДЕНЫ NFT!");
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

  console.log("\n🎯 Check completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 