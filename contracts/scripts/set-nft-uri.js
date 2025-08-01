const hre = require("hardhat");

async function main() {
  console.log("🔗 Setting NFT Base URI...");

  // Адрес NFT контракта
  const nftFactoryAddress = "0x486001b88DFa338C62ADA3174661B3640DB94e59";

  // Получаем контракт
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);

  // Получаем адрес кошелька
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting URI with account:", deployer.address);

  // Устанавливаем baseURI для NFT
  // Это позволит кошелькам правильно отображать NFT
  const baseURI = "http://localhost:3000/api/nft/"; // Локальный API для разработки
  console.log("Setting base URI to:", baseURI);

  try {
    const tx = await nftFactory.setBaseURI(baseURI);
    await tx.wait();
    console.log("✅ Base URI set successfully!");
  } catch (e) {
    console.log("❌ Error setting base URI:", e.message);
  }

  // Проверяем текущий baseURI
  try {
    const currentURI = await nftFactory._baseURI();
    console.log("Current base URI:", currentURI);
  } catch (e) {
    console.log("Error reading base URI:", e.message);
  }

  console.log("\n📋 For wallet display:");
  console.log("1. NFT contract:", nftFactoryAddress);
  console.log("2. Base URI:", baseURI);
  console.log("3. Token URI format:", baseURI + "{tokenId}.json");
  console.log("4. You need to create metadata JSON files at your API endpoint");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 