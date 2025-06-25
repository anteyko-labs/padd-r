const hre = require("hardhat");

async function main() {
  // Актуальные адреса контрактов (как на фронте)
  const padTokenAddress = "0x5e36c2e6a50712d09Ea714a356923514B4C2338e";
  const multiStakeManagerAddress = "0xC54E3B95EC87F4a1E85860E81b4864ac059E1dDf";
  const nftFactoryAddress = "0xDBE1483fE39b26a92FE4B7cc3923c0cc9Ad50237";

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

  // Стейкаем 10 PAD на 4 часа (Silver tier)
  const stakeAmount = hre.ethers.parseEther("10"); // 10 PAD
  const stakeDuration = 4 * 60 * 60; // 4 часа в секундах

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
    console.log("Position created with ID:", positionId.toString());

    // Проверяем баланс токенов ПОСЛЕ
    const balanceAfter = await padToken.balanceOf(deployer.address);
    console.log("Token balance AFTER:", hre.ethers.formatEther(balanceAfter), "PAD");

    // Получаем инфу о позиции
    const position = await multiStakeManager.positions(positionId);
    console.log("\nPosition info:", position);

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
            console.log("Lock Duration (hours):", metadata.lockDurationMonths.toString());
            console.log("Tier Level:", ["Bronze", "Silver", "Gold", "Platinum"][metadata.tierLevel]);
            console.log("Hour Index:", metadata.monthIndex.toString());
            console.log("Next Mint On:", new Date(Number(metadata.nextMintOn) * 1000).toISOString());
          }
        } catch (e) {
          // tokenId не существует
        }
      }
    } else {
      console.log("NFT not found after staking");
    }
  } else {
    console.log("Position creation event not found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 