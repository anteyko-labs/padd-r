const hre = require("hardhat");

async function main() {
  // Получаем адреса контрактов из последнего деплоя
  const multiStakeManagerAddress = "0x67636c77EA2756569b84365bDE3263C54bB4Cf26";
  const nftFactoryAddress = "0x6B6f1DD345d39dD109BdEDe0e355e6431b5e4110";

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