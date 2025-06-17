const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function generateGasSnapshots() {
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
    
    return gasSnapshots;

  } catch (error) {
    console.error("❌ Error generating gas snapshots:", error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.log("Usage: node create-version-snapshot.js <version>");
    console.log("Example: node create-version-snapshot.js v1.0.0");
    process.exit(1);
  }

  const version = args[0];
  console.log(`🚀 Creating Gas Snapshot for version ${version}...\n`);

  // First generate the gas snapshot
  try {
    const gasSnapshots = await generateGasSnapshots();
    
    // Update version
    gasSnapshots.version = version;
    gasSnapshots.timestamp = new Date().toISOString();
    
    // Create versioned filename
    const versionedPath = path.join(__dirname, `../gas-snapshots-${version}.json`);
    
    // Save versioned snapshot
    fs.writeFileSync(versionedPath, JSON.stringify(gasSnapshots, null, 2));
    
    console.log(`✅ Versioned gas snapshot created: gas-snapshots-${version}.json`);
    
    // Also update the current snapshot
    const snapshotPath = path.join(__dirname, "../gas-snapshots.json");
    fs.writeFileSync(snapshotPath, JSON.stringify(gasSnapshots, null, 2));
    
    // Create a summary markdown file
    const summaryPath = path.join(__dirname, `../gas-summary-${version}.md`);
    const summary = generateSummary(gasSnapshots, version);
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`📊 Gas summary created: gas-summary-${version}.md`);
    
    // Print summary to console
    console.log("\n" + summary);
    
  } catch (error) {
    console.error("❌ Error creating versioned gas snapshot:", error);
    process.exit(1);
  }
}

function generateSummary(gasSnapshots, version) {
  let totalDeploymentGas = 0;
  let totalFunctionGas = 0;
  let contractCount = 0;
  let functionCount = 0;
  
  Object.entries(gasSnapshots.contracts).forEach(([contractName, data]) => {
    totalDeploymentGas += parseInt(data.deployment.gasUsed);
    contractCount++;
    
    Object.entries(data.functions).forEach(([funcName, funcData]) => {
      totalFunctionGas += parseInt(funcData.gasUsed);
      functionCount++;
    });
  });
  
  const totalGas = totalDeploymentGas + totalFunctionGas;
  
  return `# Gas Usage Summary - ${version}

**Generated:** ${gasSnapshots.timestamp}  
**Version:** ${version}

## 📊 Overview

- **Total Contracts:** ${contractCount}
- **Total Functions Tested:** ${functionCount}
- **Total Deployment Gas:** ${totalDeploymentGas.toLocaleString()}
- **Total Function Gas:** ${totalFunctionGas.toLocaleString()}
- **Total Gas:** ${totalGas.toLocaleString()}

## 🏗️ Contract Deployments

| Contract | Gas Used | Percentage |
|----------|----------|------------|
${Object.entries(gasSnapshots.contracts)
  .map(([name, data]) => {
    const gas = parseInt(data.deployment.gasUsed);
    const percentage = ((gas / totalDeploymentGas) * 100).toFixed(1);
    return `| ${name} | ${gas.toLocaleString()} | ${percentage}% |`;
  })
  .join('\n')}

## ⚡ Function Calls

| Contract | Function | Gas Used | Percentage |
|----------|----------|----------|------------|
${Object.entries(gasSnapshots.contracts)
  .flatMap(([contractName, data]) => 
    Object.entries(data.functions).map(([funcName, funcData]) => {
      const gas = parseInt(funcData.gasUsed);
      const percentage = ((gas / totalFunctionGas) * 100).toFixed(1);
      return `| ${contractName} | ${funcName} | ${gas.toLocaleString()} | ${percentage}% |`;
    })
  )
  .join('\n')}

## 🎯 Gas Optimization Insights

### Most Expensive Operations
${Object.entries(gasSnapshots.contracts)
  .flatMap(([contractName, data]) => 
    Object.entries(data.functions).map(([funcName, funcData]) => ({
      contract: contractName,
      function: funcName,
      gas: parseInt(funcData.gasUsed)
    }))
  )
  .sort((a, b) => b.gas - a.gas)
  .slice(0, 5)
  .map((item, index) => `${index + 1}. **${item.contract}.${item.function}** - ${item.gas.toLocaleString()} gas`)
  .join('\n')}

### Deployment Costs
${Object.entries(gasSnapshots.contracts)
  .map(([name, data]) => ({ name, gas: parseInt(data.deployment.gasUsed) }))
  .sort((a, b) => b.gas - a.gas)
  .map((item, index) => `${index + 1}. **${item.name}** - ${item.gas.toLocaleString()} gas`)
  .join('\n')}

## 📈 Recommendations

1. **Monitor High Gas Functions:** Pay attention to functions using >100k gas
2. **Optimize Deployments:** Consider splitting large contracts if deployment costs exceed 2M gas
3. **Batch Operations:** Use batch functions where possible to reduce per-operation costs
4. **Storage Optimization:** Review storage patterns for gas optimization opportunities

## 🔗 Related Files

- [Gas Snapshots JSON](./gas-snapshots-${version}.json)
- [Gas Comparison Tool](./scripts/compare-gas-snapshots.js)
- [Gas Snapshot Generator](./scripts/gas-snapshot.js)

---
*Generated automatically by PADD-R Gas Snapshot Tool*
`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 