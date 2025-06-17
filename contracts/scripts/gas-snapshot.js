const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Generating Gas Snapshots for PADD Contracts...\n");

  const gasSnapshots = {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    contracts: {}
  };

  // Deploy all contracts and measure gas
  try {
    // 1. PADToken
    console.log("📊 Measuring PADToken gas usage...");
    const PADToken = await ethers.getContractFactory("PADToken");
    const padToken = await PADToken.deploy();
    await padToken.waitForDeployment();
    
    const padTokenAddress = await padToken.getAddress();
    const padTokenDeployTx = padToken.deploymentTransaction();
    
    gasSnapshots.contracts.PADToken = {
      deployment: {
        gasUsed: padTokenDeployTx.gasLimit.toString(),
        gasPrice: padTokenDeployTx.gasPrice.toString(),
        totalCost: (padTokenDeployTx.gasLimit * padTokenDeployTx.gasPrice).toString()
      },
      functions: {}
    };

    // Test batchTransfer function
    const [owner, addr1, addr2] = await ethers.getSigners();
    const recipients = [addr1.address, addr2.address];
    const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];
    const batchTransferTx = await padToken.batchTransfer(recipients, amounts);
    const batchTransferReceipt = await batchTransferTx.wait();
    gasSnapshots.contracts.PADToken.functions.batchTransfer = {
      gasUsed: batchTransferReceipt.gasUsed.toString(),
      gasPrice: batchTransferReceipt.gasPrice.toString(),
      totalCost: (batchTransferReceipt.gasUsed * batchTransferReceipt.gasPrice).toString()
    };

    // Test transfer function
    const transferTx = await padToken.transfer(addr1.address, ethers.parseEther("100"));
    const transferReceipt = await transferTx.wait();
    gasSnapshots.contracts.PADToken.functions.transfer = {
      gasUsed: transferReceipt.gasUsed.toString(),
      gasPrice: transferReceipt.gasPrice.toString(),
      totalCost: (transferReceipt.gasUsed * transferReceipt.gasPrice).toString()
    };

    // Test pause function
    const pauseTx = await padToken.pause();
    const pauseReceipt = await pauseTx.wait();
    gasSnapshots.contracts.PADToken.functions.pause = {
      gasUsed: pauseReceipt.gasUsed.toString(),
      gasPrice: pauseReceipt.gasPrice.toString(),
      totalCost: (pauseReceipt.gasUsed * pauseReceipt.gasPrice).toString()
    };

    // Test unpause function
    const unpauseTx = await padToken.unpause();
    const unpauseReceipt = await unpauseTx.wait();
    gasSnapshots.contracts.PADToken.functions.unpause = {
      gasUsed: unpauseReceipt.gasUsed.toString(),
      gasPrice: unpauseReceipt.gasPrice.toString(),
      totalCost: (unpauseReceipt.gasUsed * unpauseReceipt.gasPrice).toString()
    };

    // 2. MultiStakeManager
    console.log("📊 Measuring MultiStakeManager gas usage...");
    const MultiStakeManager = await ethers.getContractFactory("MultiStakeManager");
    const multiStakeManager = await MultiStakeManager.deploy(padTokenAddress);
    await multiStakeManager.waitForDeployment();
    
    const multiStakeManagerAddress = await multiStakeManager.getAddress();
    const multiStakeManagerDeployTx = multiStakeManager.deploymentTransaction();
    
    gasSnapshots.contracts.MultiStakeManager = {
      deployment: {
        gasUsed: multiStakeManagerDeployTx.gasLimit.toString(),
        gasPrice: multiStakeManagerDeployTx.gasPrice.toString(),
        totalCost: (multiStakeManagerDeployTx.gasLimit * multiStakeManagerDeployTx.gasPrice).toString()
      },
      functions: {}
    };

    // Test createPosition function
    await padToken.approve(multiStakeManagerAddress, ethers.parseEther("1000"));
    const createPositionTx = await multiStakeManager.createPosition(ethers.parseEther("100"), 365 * 24 * 60 * 60); // 1 year
    const createPositionReceipt = await createPositionTx.wait();
    gasSnapshots.contracts.MultiStakeManager.functions.createPosition = {
      gasUsed: createPositionReceipt.gasUsed.toString(),
      gasPrice: createPositionReceipt.gasPrice.toString(),
      totalCost: (createPositionReceipt.gasUsed * createPositionReceipt.gasPrice).toString()
    };

    // 3. TierCalculator
    console.log("📊 Measuring TierCalculator gas usage...");
    const TierCalculator = await ethers.getContractFactory("TierCalculator");
    const tierCalculator = await TierCalculator.deploy();
    await tierCalculator.waitForDeployment();
    
    const tierCalculatorAddress = await tierCalculator.getAddress();
    const tierCalculatorDeployTx = tierCalculator.deploymentTransaction();
    
    gasSnapshots.contracts.TierCalculator = {
      deployment: {
        gasUsed: tierCalculatorDeployTx.gasLimit.toString(),
        gasPrice: tierCalculatorDeployTx.gasPrice.toString(),
        totalCost: (tierCalculatorDeployTx.gasLimit * tierCalculatorDeployTx.gasPrice).toString()
      },
      functions: {}
    };

    // 4. PADNFTFactory (now with correct parameters)
    console.log("📊 Measuring PADNFTFactory gas usage...");
    const PADNFTFactory = await ethers.getContractFactory("PADNFTFactory");
    const padNFTFactory = await PADNFTFactory.deploy(multiStakeManagerAddress, tierCalculatorAddress);
    await padNFTFactory.waitForDeployment();
    
    const padNFTFactoryAddress = await padNFTFactory.getAddress();
    const padNFTFactoryDeployTx = padNFTFactory.deploymentTransaction();
    
    gasSnapshots.contracts.PADNFTFactory = {
      deployment: {
        gasUsed: padNFTFactoryDeployTx.gasLimit.toString(),
        gasPrice: padNFTFactoryDeployTx.gasPrice.toString(),
        totalCost: (padNFTFactoryDeployTx.gasLimit * padNFTFactoryDeployTx.gasPrice).toString()
      },
      functions: {}
    };

    // Test mintNFT function (requires MINTER_ROLE)
    await padNFTFactory.grantRole(await padNFTFactory.MINTER_ROLE(), owner.address);
    const mintNFTTx = await padNFTFactory.mintNFT(
      owner.address,
      1,
      ethers.parseEther("1000"),
      12,
      Math.floor(Date.now() / 1000),
      1,
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    );
    const mintNFTReceipt = await mintNFTTx.wait();
    gasSnapshots.contracts.PADNFTFactory.functions.mintNFT = {
      gasUsed: mintNFTReceipt.gasUsed.toString(),
      gasPrice: mintNFTReceipt.gasPrice.toString(),
      totalCost: (mintNFTReceipt.gasUsed * mintNFTReceipt.gasPrice).toString()
    };

    // 5. TierMonitor (if available)
    console.log("📊 Measuring TierMonitor gas usage...");
    try {
      const TierMonitor = await ethers.getContractFactory("TierMonitor");
      const tierMonitor = await TierMonitor.deploy(multiStakeManagerAddress, tierCalculatorAddress);
      await tierMonitor.waitForDeployment();
      
      const tierMonitorAddress = await tierMonitor.getAddress();
      const tierMonitorDeployTx = tierMonitor.deploymentTransaction();
      
      gasSnapshots.contracts.TierMonitor = {
        deployment: {
          gasUsed: tierMonitorDeployTx.gasLimit.toString(),
          gasPrice: tierMonitorDeployTx.gasPrice.toString(),
          totalCost: (tierMonitorDeployTx.gasLimit * tierMonitorDeployTx.gasPrice).toString()
        },
        functions: {}
      };

      // Test performUpkeep function
      const performUpkeepTx = await tierMonitor.performUpkeep("0x");
      const performUpkeepReceipt = await performUpkeepTx.wait();
      gasSnapshots.contracts.TierMonitor.functions.performUpkeep = {
        gasUsed: performUpkeepReceipt.gasUsed.toString(),
        gasPrice: performUpkeepReceipt.gasPrice.toString(),
        totalCost: (performUpkeepReceipt.gasUsed * performUpkeepReceipt.gasPrice).toString()
      };
    } catch (error) {
      console.log("⚠️  TierMonitor not available for gas measurement");
    }

    // Save gas snapshots to file
    const snapshotPath = path.join(__dirname, "../gas-snapshots.json");
    fs.writeFileSync(snapshotPath, JSON.stringify(gasSnapshots, null, 2));
    
    console.log("\n✅ Gas snapshots generated successfully!");
    console.log(`📁 Saved to: ${snapshotPath}`);
    
    // Print summary
    console.log("\n📊 Gas Usage Summary:");
    console.log("=====================");
    
    let totalDeploymentGas = 0;
    let totalFunctionGas = 0;
    
    Object.entries(gasSnapshots.contracts).forEach(([contractName, data]) => {
      console.log(`\n${contractName}:`);
      console.log(`  Deployment: ${data.deployment.gasUsed} gas`);
      totalDeploymentGas += parseInt(data.deployment.gasUsed);
      
      Object.entries(data.functions).forEach(([funcName, funcData]) => {
        console.log(`  ${funcName}: ${funcData.gasUsed} gas`);
        totalFunctionGas += parseInt(funcData.gasUsed);
      });
    });
    
    console.log(`\n📈 Total Deployment Gas: ${totalDeploymentGas.toLocaleString()}`);
    console.log(`📈 Total Function Gas: ${totalFunctionGas.toLocaleString()}`);
    console.log(`📈 Total Gas: ${(totalDeploymentGas + totalFunctionGas).toLocaleString()}`);

  } catch (error) {
    console.error("❌ Error generating gas snapshots:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 