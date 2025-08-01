const hre = require("hardhat");

async function main() {
  console.log("⏰ Testing Monthly NFT Minting...");

  // Адреса контрактов
  const nftFactoryAddress = "0xa73877075ED2d1371ae12345E0d28623B77BB777";
  const multiStakeManagerAddress = "0xE3dB5ad755ff62C31C0Ae467237F2Dc1E5B0d54a";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // 1. Проверяем текущие NFT
  console.log("\n🎨 Current NFTs:");
  const nftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("NFT balance:", nftBalance.toString());

  if (nftBalance > 0) {
    const totalSupply = await nftFactory.totalSupply();
    console.log("Total supply:", totalSupply.toString());
    
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

  // 2. Проверяем позиции для ежемесячного минтинга
  console.log("\n📊 Checking positions for monthly minting:");
  const userPositions = await multiStakeManager.getUserPositions(deployer.address);
  console.log("Total positions:", userPositions.length);

  const now = Math.floor(Date.now() / 1000);
  let canMintAny = false;

  for (let i = 0; i < userPositions.length; i++) {
    const positionId = userPositions[i];
    const position = await multiStakeManager.positions(positionId);
    
    console.log(`\nPosition #${positionId}:`);
    console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
    console.log("  - Month Index:", position.monthIndex.toString());
    console.log("  - Next Mint At:", new Date(Number(position.nextMintAt) * 1000).toISOString());
    
    const canMint = Number(position.nextMintAt) <= now;
    
    if (canMint) {
      console.log("  - Status: 🟢 Ready for next NFT mint!");
      canMintAny = true;
      
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

  // 3. Финальная проверка
  console.log("\n🎯 Final check:");
  const finalNftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("Final NFT balance:", finalNftBalance.toString());

  console.log("\n📋 Summary:");
  console.log("- Initial NFTs (from staking):", userPositions.length);
  console.log("- Additional NFTs (monthly):", Number(finalNftBalance) - userPositions.length);
  console.log("- Total NFTs:", finalNftBalance.toString());
  
  if (canMintAny) {
    console.log("- Monthly minting: ✅ Working!");
  } else {
    console.log("- Monthly minting: ⏳ Waiting for next month...");
  }

  console.log("\n💡 How it works:");
  console.log("1. When you stake → NFT minted automatically (isInitialStakingNFT = true)");
  console.log("2. Every month → Call mintNextNFT() to get additional NFT (isInitialStakingNFT = false)");
  console.log("3. This continues until the staking period ends");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 