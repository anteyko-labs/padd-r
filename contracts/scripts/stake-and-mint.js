const hre = require("hardhat");

async function main() {
  // Получаем адреса контрактов из последнего деплоя
  const padTokenAddress = "0x1E0D747B54279c3EB33085A24339D80ba66E8A8A";
  const multiStakeManagerAddress = "0x67636c77EA2756569b84365bDE3263C54bB4Cf26";
  const nftFactoryAddress = "0x6B6f1DD345d39dD109BdEDe0e355e6431b5e4110";

  // Получаем контракты
  const padToken = await hre.ethers.getContractAt("PADToken", padTokenAddress);
  const multiStakeManager = await hre.ethers.getContractAt("MultiStakeManager", multiStakeManagerAddress);
  const nftFactory = await hre.ethers.getContractAt("PADNFTFactory", nftFactoryAddress);

  // Получаем адрес кошелька, с которого деплоили (он должен иметь токены)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Проверяем баланс токенов
  const balance = await padToken.balanceOf(deployer.address);
  console.log("Token balance:", hre.ethers.formatEther(balance), "PAD");

  // Стейкаем 1000 PAD на 12 месяцев (Silver tier)
  const stakeAmount = hre.ethers.parseEther("1000"); // 1000 PAD
  const stakeDuration = 365 * 24 * 60 * 60; // 12 месяцев в секундах

  console.log("\nApproving tokens for staking...");
  const approveTx = await padToken.approve(multiStakeManagerAddress, stakeAmount);
  await approveTx.wait();
  console.log("Approval successful");

  console.log("\nCreating staking position...");
  const stakeTx = await multiStakeManager.createPosition(stakeAmount, stakeDuration);
  const receipt = await stakeTx.wait();

  // Ищем событие PositionCreated
  const positionCreatedEvent = receipt.logs.find(
    log => log.fragment && log.fragment.name === "PositionCreated"
  );

  if (positionCreatedEvent) {
    const positionId = positionCreatedEvent.args[0];
    console.log("Position created with ID:", positionId);

    // Проверяем, появился ли NFT
    const nftBalance = await nftFactory.balanceOf(deployer.address);
    console.log("\nNFT balance:", nftBalance.toString());

    if (nftBalance > 0) {
      for (let i = 0; i < Number(nftBalance); i++) {
        try {
          const owner = await nftFactory.ownerOf(i);
          if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log(`\nNFT tokenId: ${i}`);
            const metadata = await nftFactory.nftMetadata(i);
            console.log("Position ID:", metadata.positionId.toString());
            console.log("Amount Staked:", hre.ethers.formatEther(metadata.amountStaked), "PAD");
            console.log("Lock Duration:", metadata.lockDurationMonths.toString(), "months");
            console.log("Tier Level:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
            console.log("Month Index:", metadata.monthIndex.toString());
            console.log("Next Mint On:", new Date(Number(metadata.nextMintOn) * 1000).toISOString());
          }
        } catch (e) {
          // tokenId не существует
        }
      }
    } else {
      console.log("Position creation event not found");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 