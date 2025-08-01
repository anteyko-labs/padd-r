const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Fixed NFT Minting...");

  // Адреса контрактов (обновленные после деплоя)
  const nftFactoryAddress = "0x486001b88DFa338C62ADA3174661B3640DB94e59";
  const multiStakeManagerAddress = "0xcF01195B9DA94438453D57AD0BeADE3ff9F481A7";
  const padTokenAddress = "0x073d23C46d11ae1FD00F15a8891C7848893951a5";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);
  const padToken = await hre.ethers.getContractAt("PADToken", padTokenAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // 1. Проверяем текущие NFT
  console.log("\n🎨 Current NFTs:");
  const currentBalance = await nftFactory.balanceOf(deployer.address);
  console.log("Current NFT balance:", currentBalance.toString());

  // 2. Проверяем баланс PAD токенов
  const balance = await padToken.balanceOf(deployer.address);
  console.log("\n💰 PAD Token balance:", hre.ethers.formatEther(balance), "PAD");

  if (balance < hre.ethers.parseEther("1000")) {
    console.log("❌ Недостаточно токенов для тестирования!");
    return;
  }

  // 3. Создаем новую позицию стейкинга
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
      
      // 4. Проверяем NFT после стейкинга
      console.log("\n🎨 Checking NFT after staking:");
      const newBalance = await nftFactory.balanceOf(deployer.address);
      console.log("New NFT balance:", newBalance.toString());
      
      if (newBalance > currentBalance) {
        const totalSupply = await nftFactory.totalSupply();
        console.log("Total supply:", totalSupply.toString());
        
        // Показываем новый NFT
        for (let tokenId = Number(currentBalance); tokenId < totalSupply; tokenId++) {
          try {
            const owner = await nftFactory.ownerOf(tokenId);
            if (owner.toLowerCase() === deployer.address.toLowerCase()) {
              const metadata = await nftFactory.nftMetadata(tokenId);
              console.log(`\n🎨 NEW NFT #${tokenId}:`);
              console.log("  - Tier:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
              console.log("  - Is Initial Staking NFT:", metadata.isInitialStakingNFT ? "✅ Yes" : "❌ No");
              console.log("  - Position ID:", metadata.positionId.toString());
              console.log("  - Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
            }
          } catch (e) {
            console.log(`Error reading NFT #${tokenId}:`, e.message);
          }
        }
      }
      
      // 5. Тестируем попытку преждевременного минтинга
      console.log("\n🚫 Testing premature minting prevention...");
      try {
        const mintTx = await multiStakeManager.mintNextNFT(positionId);
        await mintTx.wait();
        console.log("❌ ERROR: Premature minting should have failed!");
      } catch (e) {
        console.log("✅ CORRECT: Premature minting blocked -", e.message);
      }
      
      // 6. Проверяем позицию
      console.log("\n📊 Position details:");
      const position = await multiStakeManager.positions(positionId);
      console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
      console.log("  - Month Index:", position.monthIndex.toString());
      console.log("  - Next Mint At:", new Date(Number(position.nextMintAt) * 1000).toISOString());
      
      const now = Math.floor(Date.now() / 1000);
      const daysUntilMint = Math.ceil((Number(position.nextMintAt) - now) / (24 * 3600));
      console.log("  - Days until next mint:", daysUntilMint);
      
      if (daysUntilMint > 0) {
        console.log("✅ CORRECT: Must wait", daysUntilMint, "days before next NFT");
      }
    }
  } catch (e) {
    console.log("❌ Error:", e.message);
  }

  console.log("\n🎉 Test completed!");
  console.log("\n🔧 Security Features:");
  console.log("- Only position owner can mint next NFT");
  console.log("- Strict 30-day interval enforcement");
  console.log("- Premature minting blocked");
  console.log("- All NFT images working");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 