const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🖼️ Testing NFT image links...");

  // Адреса контрактов
  const nftFactoryAddress = "0xa73877075ED2d1371ae12345E0d28623B77BB777";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);

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
          
          // Проверяем изображения для этого тира
          const tierName = ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel];
          console.log(`\n🖼️ Checking images for ${tierName} tier...`);
          
          const tierFolder = `assets/tier${metadata.tierLevel + 1}`;
          const fullPath = path.join(__dirname, '..', '..', tierFolder);
          
          if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
            console.log(`  - Found ${files.length} images in ${tierFolder}`);
            
            if (files.length > 0) {
              console.log("  - Sample images:");
              files.slice(0, 3).forEach((file, index) => {
                const filePath = path.join(fullPath, file);
                const stats = fs.statSync(filePath);
                console.log(`    ${index + 1}. ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
              });
              
              // Проверяем, можно ли прочитать файл
              const sampleFile = path.join(fullPath, files[0]);
              try {
                const buffer = fs.readFileSync(sampleFile);
                console.log(`  ✅ Successfully read ${files[0]} (${buffer.length} bytes)`);
              } catch (e) {
                console.log(`  ❌ Error reading ${files[0]}:`, e.message);
              }
            } else {
              console.log("  ❌ No image files found");
            }
          } else {
            console.log(`  ❌ Folder ${tierFolder} does not exist at ${fullPath}`);
          }
          
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

  // Проверяем все папки с изображениями
  console.log("\n📁 Checking all image folders...");
  const tiers = ['tier1', 'tier2', 'tier3', 'tier4'];
  
  for (const tier of tiers) {
    const tierPath = path.join(__dirname, '..', '..', 'assets', tier);
    console.log(`\n📂 ${tier}:`);
    
    if (fs.existsSync(tierPath)) {
      const files = fs.readdirSync(tierPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
      console.log(`  - Found ${files.length} images`);
      
      if (files.length > 0) {
        const totalSize = files.reduce((sum, file) => {
          const filePath = path.join(tierPath, file);
          const stats = fs.statSync(filePath);
          return sum + stats.size;
        }, 0);
        
        console.log(`  - Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log("  - Sample files:");
        files.slice(0, 5).forEach((file, index) => {
          const filePath = path.join(tierPath, file);
          const stats = fs.statSync(filePath);
          console.log(`    ${index + 1}. ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
        });
      }
    } else {
      console.log(`  ❌ Folder does not exist at ${tierPath}`);
    }
  }

  console.log("\n🎯 Image link test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 