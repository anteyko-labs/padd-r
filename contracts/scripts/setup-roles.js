const hre = require("hardhat");

async function main() {
  // Получаем адреса контрактов из последнего деплоя
  const multiStakeManagerAddress = "0xC54E3B95EC87F4a1E85860E81b4864ac059E1dDf";
  const nftFactoryAddress = "0xDBE1483fE39b26a92FE4B7cc3923c0cc9Ad50237";

  // Получаем контракты
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);

  // Получаем роль MINTER_ROLE
  const MINTER_ROLE = await nftFactory.MINTER_ROLE();
  console.log("MINTER_ROLE:", MINTER_ROLE);

  // Выдаем MINTER_ROLE для MultiStakeManager
  console.log("\nGranting MINTER_ROLE to MultiStakeManager...");
  const tx = await nftFactory.grantRole(MINTER_ROLE, multiStakeManagerAddress);
  await tx.wait();
  console.log("MINTER_ROLE granted successfully");

  // Проверяем, что роль выдана
  const hasRole = await nftFactory.hasRole(MINTER_ROLE, multiStakeManagerAddress);
  console.log("\nMultiStakeManager has MINTER_ROLE:", hasRole);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 