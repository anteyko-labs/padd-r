const hre = require("hardhat");

async function main() {
  console.log("🎨 Minting non-staking NFT...");

  // Адреса контрактов
  const nftFactoryAddress = "0xa73877075ED2d1371ae12345E0d28623B77BB777";
  const multiStakeManagerAddress = "0xE3dB5ad755ff62C31C0Ae467237F2Dc1E5B0d54a";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Minting with account:", deployer.address);

  // Проверяем, есть ли у нас позиции стейкинга
  const userPositions = await multiStakeManager.getUserPositions(deployer.address);
  console.log("Number of staking positions:", userPositions.length);

  if (userPositions.length === 0) {
    console.log("❌ Нет позиций стейкинга для создания NFT");
    return;
  }

  // Берем первую позицию для создания NFT
  const positionId = userPositions[0];
  const position = await multiStakeManager.positions(positionId);
  
  console.log(`\n📊 Using position #${positionId}:`);
  console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
  console.log("  - Duration:", position.duration.toString(), "seconds");
  console.log("  - Tier:", position.tier);

  // Минтим NFT с isInitialStakingNFT = false
  console.log("\n🎨 Minting non-staking NFT...");
  const mintTx = await nftFactory.mintNFT(
    deployer.address,
    positionId,
    position.amount,
    Number(position.duration) / (30 * 24 * 3600), // конвертируем секунды в месяцы
    position.startTime,
    999, // специальный индекс для не-стейкинговых NFT
    position.nextMintAt,
    false // isInitialStakingNFT = false
  );
  
  const mintReceipt = await mintTx.wait();
  console.log("✅ Non-staking NFT minted successfully!");

  // Проверяем новый NFT
  console.log("\n🔍 Checking the new NFT...");
  const nftBalance = await nftFactory.balanceOf(deployer.address);
  console.log("Total NFT balance:", nftBalance.toString());

  const totalSupply = await nftFactory.totalSupply();
  console.log("Total supply:", totalSupply.toString());

  // Находим последний минтированный NFT
  const lastTokenId = totalSupply - 1;
  const owner = await nftFactory.ownerOf(lastTokenId);
  console.log(`\n🎨 Latest NFT #${lastTokenId.toString()}:`);
  console.log("  - Owner:", owner);
  
  const metadata = await nftFactory.nftMetadata(lastTokenId);
  console.log("  - Position ID:", metadata.positionId.toString());
  console.log("  - Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
  console.log("  - Lock Duration (hours):", metadata.lockDurationHours.toString());
  console.log("  - Tier Level:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
  console.log("  - Hour Index:", metadata.hourIndex.toString());
  console.log("  - Next Mint On:", new Date(Number(metadata.nextMintOn) * 1000).toISOString());
  console.log("  - Is Initial Staking NFT:", metadata.isInitialStakingNFT ? "✅ Yes" : "❌ No");
  
  console.log("\n🔗 NFT Contract Address:", nftFactoryAddress);
  console.log("🆔 Token ID:", lastTokenId.toString());

  console.log("\n🎯 Non-staking NFT minted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 