const hre = require("hardhat");
const fs = require('fs');

async function main() {
  // Загружаем адреса из файла
  const addresses = JSON.parse(fs.readFileSync('deployed-addresses.sepolia.json', 'utf8'));
  
  // Получаем контракт TierMonitorFinal
  const tierMonitor = await hre.ethers.getContractAt("TierMonitorFinal", addresses.tierMonitor);

  console.log("Performing upkeep on TierMonitorFinal at:", addresses.tierMonitor);

  // Проверяем, нужен ли upkeep
  const [needsUpkeep, performData] = await tierMonitor.checkUpkeep("0x");
  
  if (!needsUpkeep) {
    console.log("No upkeep needed at this time.");
    return;
  }

  console.log("Upkeep needed. Performing...");
  
  // Выполняем upkeep
  const tx = await tierMonitor.performUpkeep(performData);
  console.log("Upkeep transaction sent:", tx.hash);
  
  // Ждем подтверждения
  const receipt = await tx.wait();
  console.log("Upkeep completed in block:", receipt.blockNumber);
  
  // Проверяем события
  const event = receipt.logs.find(log => {
    try {
      return tierMonitor.interface.parseLog(log).name === "UpkeepPerformed";
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsedEvent = tierMonitor.interface.parseLog(event);
    const positionIds = parsedEvent.args.positionIds;
    console.log("\nUpkeep performed for positions:", positionIds);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 