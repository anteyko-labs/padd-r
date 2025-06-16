const hre = require("hardhat");
const fs = require('fs');

async function main() {
  // Загружаем адреса из файла
  const addresses = JSON.parse(fs.readFileSync('deployed-addresses.sepolia.json', 'utf8'));
  
  // Получаем контракт TierMonitorFinal
  const tierMonitor = await hre.ethers.getContractAt("TierMonitorFinal", addresses.tierMonitor);
  const stakeManager = await hre.ethers.getContractAt("MultiStakeManager", addresses.stakeManager);

  console.log("Monitoring TierMonitorFinal at:", addresses.tierMonitor);
  console.log("Connected to StakeManager at:", addresses.stakeManager);

  // Получаем активные позиции
  const activePositions = await stakeManager.getActivePositions();
  console.log("\nActive positions:", activePositions.length);

  // Проверяем статус каждой позиции
  for (const positionId of activePositions) {
    const status = await tierMonitor.getPositionStatus(positionId);
    const position = await stakeManager.positions(positionId);
    
    console.log(`\nPosition #${positionId}:`);
    console.log("- Owner:", position.owner);
    console.log("- Amount:", hre.ethers.formatEther(position.amount), "PAD");
    console.log("- Duration:", position.duration / (30 * 24 * 60 * 60), "months");
    console.log("- Tier:", position.tier);
    console.log("- Next mint at:", new Date(position.nextMintAt * 1000).toLocaleString());
    console.log("- Last upkeep:", new Date(status.lastUpkeep * 1000).toLocaleString());
    console.log("- Needs upkeep:", status.needsUpkeep);
  }

  // Проверяем, нужен ли upkeep
  const [needsUpkeep, performData] = await tierMonitor.checkUpkeep("0x");
  console.log("\nUpkeep check:");
  console.log("- Needs upkeep:", needsUpkeep);
  
  if (needsUpkeep) {
    console.log("- Perform data:", performData);
    console.log("\nTo perform upkeep manually, run:");
    console.log("npx hardhat run scripts/perform.upkeep.js --network sepolia");
  }

  // Проверяем параметры контракта
  const batchSize = await tierMonitor.batchSize();
  const gasLimit = await tierMonitor.gasLimit();
  const minWaitTime = await tierMonitor.minWaitTime();

  console.log("\nContract parameters:");
  console.log("- Batch size:", batchSize);
  console.log("- Gas limit:", gasLimit);
  console.log("- Min wait time:", minWaitTime / 3600, "hours");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 