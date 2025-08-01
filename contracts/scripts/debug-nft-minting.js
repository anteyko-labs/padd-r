const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging NFT Minting...");

  // Адреса контрактов
  const nftFactoryAddress = "0xa73877075ED2d1371ae12345E0d28623B77BB777";
  const multiStakeManagerAddress = "0xE3dB5ad755ff62C31C0Ae467237F2Dc1E5B0d54a";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);

  // 1. Проверяем все NFT
  console.log("\n🎨 All NFTs:");
  const totalSupply = await nftFactory.totalSupply();
  console.log("Total supply:", totalSupply.toString());

  for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
    try {
      const owner = await nftFactory.ownerOf(tokenId);
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        const metadata = await nftFactory.nftMetadata(tokenId);
        console.log(`\n🎨 NFT #${tokenId}:`);
        console.log("  - Position ID:", metadata.positionId.toString());
        console.log("  - Is Initial Staking NFT:", metadata.isInitialStakingNFT ? "✅ Yes" : "❌ No");
        console.log("  - Month Index:", metadata.hourIndex.toString());
        console.log("  - Tier:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
        console.log("  - Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
        console.log("  - Start Timestamp:", new Date(Number(metadata.startTimestamp) * 1000).toISOString());
        console.log("  - Next Mint On:", new Date(Number(metadata.nextMintOn) * 1000).toISOString());
      }
    } catch (e) {
      console.log(`Error reading NFT #${tokenId}:`, e.message);
    }
  }

  // 2. Проверяем позиции
  console.log("\n📊 Staking Positions:");
  const userPositions = await multiStakeManager.getUserPositions(deployer.address);
  console.log("Total positions:", userPositions.length);

  for (let i = 0; i < userPositions.length; i++) {
    const positionId = userPositions[i];
    const position = await multiStakeManager.positions(positionId);
    
    console.log(`\nPosition #${positionId}:`);
    console.log("  - Amount:", hre.ethers.formatEther(position.amount), "PAD");
    console.log("  - Month Index:", position.monthIndex.toString());
    console.log("  - Next Mint At:", new Date(Number(position.nextMintAt) * 1000).toISOString());
    console.log("  - Start Time:", new Date(Number(position.startTime) * 1000).toISOString());
    console.log("  - Duration:", Number(position.duration) / (24 * 3600), "days");
  }

  // 3. Анализ
  console.log("\n🔍 Analysis:");
  
  // Считаем NFT по типам
  let initialNFTs = 0;
  let monthlyNFTs = 0;
  
  for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
    try {
      const owner = await nftFactory.ownerOf(tokenId);
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        const metadata = await nftFactory.nftMetadata(tokenId);
        if (metadata.isInitialStakingNFT) {
          initialNFTs++;
        } else {
          monthlyNFTs++;
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  console.log(`- Initial NFTs (from staking): ${initialNFTs}`);
  console.log(`- Monthly NFTs (additional): ${monthlyNFTs}`);
  console.log(`- Total NFTs: ${totalSupply}`);
  
  // Проверяем логику
  console.log("\n💡 Logic Check:");
  console.log(`- You have ${userPositions.length} staking positions`);
  console.log(`- You should have ${userPositions.length} initial NFTs`);
  console.log(`- You have ${initialNFTs} initial NFTs`);
  
  if (initialNFTs > userPositions.length) {
    console.log("⚠️  MORE initial NFTs than positions! This suggests:");
    console.log("   - Multiple staking transactions");
    console.log("   - Or some positions were closed and new ones created");
  }
  
  if (monthlyNFTs > 0) {
    console.log(`- You have ${monthlyNFTs} monthly NFTs`);
    console.log("  This means mintNextNFT() was called manually or automatically");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 