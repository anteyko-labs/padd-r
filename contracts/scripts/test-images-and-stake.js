const hre = require("hardhat");
const fetch = require("node-fetch");

async function main() {
  console.log("🖼️ Testing NFT Images and New Staking...");

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
  console.log("Account:", deployer.address);

  // 1. Тестируем изображения
  console.log("\n🖼️ Testing NFT Images:");
  const NFT_IMAGES = {
    'Bronze': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Silver': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Gold': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
    'Platinum': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80'
  };

  for (const [tier, url] of Object.entries(NFT_IMAGES)) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${tier}: Image accessible`);
      } else {
        console.log(`❌ ${tier}: Image not accessible (${response.status})`);
      }
    } catch (e) {
      console.log(`❌ ${tier}: Error accessing image - ${e.message}`);
    }
  }

  // 2. Проверяем текущие NFT
  console.log("\n🎨 Current NFTs:");
  const currentBalance = await nftFactory.balanceOf(deployer.address);
  console.log("Current NFT balance:", currentBalance.toString());

  // 3. Проверяем баланс PAD токенов
  const balance = await padToken.balanceOf(deployer.address);
  console.log("\n💰 PAD Token balance:", hre.ethers.formatEther(balance), "PAD");

  if (balance < hre.ethers.parseEther("1000")) {
    console.log("❌ Недостаточно токенов для стейкинга! Нужно минимум 1000 PAD");
    return;
  }

  // 4. Проверяем текущие позиции
  const userPositions = await multiStakeManager.getUserPositions(deployer.address);
  console.log("\n📊 Current positions:", userPositions.length);

  // 5. Создаем новую позицию стейкинга (если есть место)
  if (userPositions.length < 10) {
    console.log("\n🔒 Creating new staking position...");
    
    try {
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
    } catch (e) {
      console.log("❌ Error creating position:", e.message);
    }
  } else {
    console.log("⚠️ Maximum positions reached (10)");
  }

  // 6. Проверяем NFT после стейкинга
  console.log("\n🎨 Checking NFTs after staking:");
  const newBalance = await nftFactory.balanceOf(deployer.address);
  console.log("New NFT balance:", newBalance.toString());

  if (newBalance > currentBalance) {
    const totalSupply = await nftFactory.totalSupply();
    console.log("Total supply:", totalSupply.toString());
    
    // Показываем новые NFT
    for (let tokenId = Number(currentBalance); tokenId < totalSupply; tokenId++) {
      try {
        const owner = await nftFactory.ownerOf(tokenId);
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
          const metadata = await nftFactory.nftMetadata(tokenId);
          const tierName = ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel];
          const imageUrl = NFT_IMAGES[tierName];
          
          console.log(`\n🎨 NEW NFT #${tokenId}:`);
          console.log("  - Tier:", tierName);
          console.log("  - Is Initial Staking NFT:", metadata.isInitialStakingNFT ? "✅ Yes" : "❌ No");
          console.log("  - Position ID:", metadata.positionId.toString());
          console.log("  - Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
          console.log("  - Image URL:", imageUrl);
          
          // Тестируем изображение для этого NFT
          try {
            const response = await fetch(imageUrl);
            if (response.ok) {
              console.log("  - Image Status: ✅ Accessible");
            } else {
              console.log("  - Image Status: ❌ Not accessible");
            }
          } catch (e) {
            console.log("  - Image Status: ❌ Error accessing");
          }
        }
      } catch (e) {
        console.log(`Error reading NFT #${tokenId}:`, e.message);
      }
    }
  }

  console.log("\n🎉 Test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 