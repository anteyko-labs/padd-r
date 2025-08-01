const hre = require("hardhat");

async function main() {
  // Актуальные адреса контрактов (из config.ts)
  const padTokenAddress = "0xAFD38DDaA3e7829693B7a80a029a00a61FFbeC08";
  const multiStakeManagerAddress = "0x330356f6ad6fe0977d85B42A2e538294A211a234";
  const nftFactoryAddress = "0x3453a74D3EDE70cA317e6A29Bd04e82952B37050";

  // Получаем контракты
  const padToken = await hre.ethers.getContractAt("PADToken", padTokenAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);

  // Получаем адрес кошелька, с которого деплоили (он должен иметь токены)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Проверяем баланс токенов ДО
  const balanceBefore = await padToken.balanceOf(deployer.address);
  console.log("Token balance BEFORE:", hre.ethers.formatEther(balanceBefore), "PAD");

  if (balanceBefore < hre.ethers.parseEther("1000")) {
    console.log("❌ Недостаточно токенов для стейкинга! Нужно минимум 1000 PAD");
    return;
  }

  // Стейкаем 1000 PAD на 3 месяца (Bronze tier) - минимум по контракту
  const stakeAmount = hre.ethers.parseEther("1000"); // 1000 PAD
  const stakeMonths = 3; // 3 месяца (минимальный срок)

  console.log("\n🔐 Approving tokens for staking...");
  const approveTx = await padToken.approve(multiStakeManagerAddress, stakeAmount);
  await approveTx.wait();
  console.log("✅ Approval successful");

  console.log("\n💰 Creating staking position...");
  const stakeTx = await multiStakeManager.createPosition(stakeAmount, stakeMonths);
  const receipt = await stakeTx.wait();

  // Ищем событие PositionCreated
  const positionCreatedEvent = receipt.logs.find(
    log => log.fragment && log.fragment.name === "PositionCreated"
  );

  if (positionCreatedEvent) {
    const positionId = positionCreatedEvent.args[0];
    console.log("✅ Position created with ID:", positionId.toString());

    // Проверяем баланс токенов ПОСЛЕ
    const balanceAfter = await padToken.balanceOf(deployer.address);
    console.log("💰 Token balance AFTER:", hre.ethers.formatEther(balanceAfter), "PAD");

    // Получаем инфу о позиции
    const position = await multiStakeManager.positions(positionId);
    console.log("\n📊 Position info:");
    console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
    console.log("  - Duration:", position.duration.toString(), "seconds");
    console.log("  - Start Time:", new Date(Number(position.startTime) * 1000).toISOString());
    console.log("  - Is Active:", position.isActive);

    // Проверяем, появился ли NFT
    const nftBalance = await nftFactory.balanceOf(deployer.address);
    console.log("\n🎨 NFT balance:", nftBalance.toString());

    if (nftBalance > 0) {
      console.log("\n🎉 НАЙДЕНЫ NFT!");
      for (let i = 0; i < Number(nftBalance); i++) {
        try {
          const tokenId = await nftFactory.tokenOfOwnerByIndex(deployer.address, i);
          const owner = await nftFactory.ownerOf(tokenId);
          if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log(`\n🎨 NFT #${tokenId.toString()}:`);
            const metadata = await nftFactory.nftMetadata(tokenId);
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
          console.log("❌ Error getting NFT info:", e.message);
        }
      }
    } else {
      console.log("❌ NFT not found after staking");
    }
  } else {
    console.log("❌ Position creation event not found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 