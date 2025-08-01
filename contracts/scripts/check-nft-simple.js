const hre = require("hardhat");

async function main() {
  console.log("🔍 Simple NFT Check...");

  // Адреса контрактов
  const nftFactoryAddress = "0x486001b88DFa338C62ADA3174661B3640DB94e59";
  const deployerAddress = "0x513756b7eD711c472537cb497833c5d5Eb02A3Df";

  // Получаем контракт
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);

  // Проверяем баланс
  const balance = await nftFactory.balanceOf(deployerAddress);
  console.log("NFT Balance:", balance.toString());

  // Проверяем total supply
  const totalSupply = await nftFactory.totalSupply();
  console.log("Total Supply:", totalSupply.toString());

  if (totalSupply > 0) {
    console.log("\n🎨 Checking NFTs:");
    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        const owner = await nftFactory.ownerOf(tokenId);
        console.log(`NFT #${tokenId} owner:`, owner);
        
        if (owner.toLowerCase() === deployerAddress.toLowerCase()) {
          const metadata = await nftFactory.nftMetadata(tokenId);
          console.log(`  - Position ID:`, metadata.positionId.toString());
          console.log(`  - Amount Staked:`, hre.ethers.formatEther(metadata.amountStaked), "PAD");
          console.log(`  - Tier Level:`, metadata.tierLevel.toString());
          console.log(`  - Is Initial Staking NFT:`, metadata.isInitialStakingNFT);
          console.log(`  - Start Timestamp:`, new Date(Number(metadata.startTimestamp) * 1000).toISOString());
        }
      } catch (e) {
        console.log(`Error reading NFT #${tokenId}:`, e.message);
      }
    }
  }

  // Проверяем события
  console.log("\n📋 Checking NFTMinted events:");
  const filter = nftFactory.filters.NFTMinted(deployerAddress);
  const events = await nftFactory.queryFilter(filter);
  console.log("NFTMinted events found:", events.length);
  
  events.forEach((event, index) => {
    console.log(`Event ${index + 1}:`);
    console.log(`  - Token ID:`, event.args.tokenId.toString());
    console.log(`  - To:`, event.args.to);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 