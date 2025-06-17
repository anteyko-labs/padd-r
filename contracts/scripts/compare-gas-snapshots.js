const fs = require("fs");
const path = require("path");

function compareGasSnapshots(snapshot1Path, snapshot2Path) {
  console.log("🔍 Comparing Gas Snapshots...\n");

  try {
    const snapshot1 = JSON.parse(fs.readFileSync(snapshot1Path, "utf8"));
    const snapshot2 = JSON.parse(fs.readFileSync(snapshot2Path, "utf8"));

    console.log(`📊 Comparing ${snapshot1.version} vs ${snapshot2.version}\n`);

    const comparison = {
      timestamp: new Date().toISOString(),
      baseline: snapshot1.version,
      current: snapshot2.version,
      changes: {}
    };

    // Compare each contract
    Object.keys(snapshot2.contracts).forEach(contractName => {
      if (snapshot1.contracts[contractName]) {
        const oldContract = snapshot1.contracts[contractName];
        const newContract = snapshot2.contracts[contractName];

        comparison.changes[contractName] = {
          deployment: compareGasUsage(oldContract.deployment, newContract.deployment),
          functions: {}
        };

        // Compare functions
        Object.keys(newContract.functions).forEach(funcName => {
          if (oldContract.functions[funcName]) {
            comparison.changes[contractName].functions[funcName] = compareGasUsage(
              oldContract.functions[funcName],
              newContract.functions[funcName]
            );
          } else {
            comparison.changes[contractName].functions[funcName] = {
              change: "NEW",
              oldGas: "N/A",
              newGas: newContract.functions[funcName].gasUsed,
              difference: "N/A",
              percentage: "N/A"
            };
          }
        });
      } else {
        comparison.changes[contractName] = {
          deployment: {
            change: "NEW",
            oldGas: "N/A",
            newGas: snapshot2.contracts[contractName].deployment.gasUsed,
            difference: "N/A",
            percentage: "N/A"
          },
          functions: {}
        };
      }
    });

    // Save comparison
    const comparisonPath = path.join(__dirname, "../gas-comparison.json");
    fs.writeFileSync(comparisonPath, JSON.stringify(comparison, null, 2));

    // Print summary
    printComparisonSummary(comparison);

    return comparison;

  } catch (error) {
    console.error("❌ Error comparing gas snapshots:", error);
    process.exit(1);
  }
}

function compareGasUsage(oldUsage, newUsage) {
  const oldGas = parseInt(oldUsage.gasUsed);
  const newGas = parseInt(newUsage.gasUsed);
  const difference = newGas - oldGas;
  const percentage = ((difference / oldGas) * 100).toFixed(2);

  let change = "SAME";
  if (difference > 0) change = "INCREASE";
  else if (difference < 0) change = "DECREASE";

  return {
    change,
    oldGas: oldGas.toString(),
    newGas: newGas.toString(),
    difference: difference.toString(),
    percentage: `${percentage}%`
  };
}

function printComparisonSummary(comparison) {
  console.log("📊 Gas Usage Comparison Summary:");
  console.log("================================\n");

  let totalDeploymentChange = 0;
  let totalFunctionChange = 0;
  let improvements = 0;
  let regressions = 0;

  Object.entries(comparison.changes).forEach(([contractName, changes]) => {
    console.log(`\n${contractName}:`);
    
    // Deployment changes
    if (changes.deployment.change !== "NEW") {
      const deploymentDiff = parseInt(changes.deployment.difference);
      totalDeploymentChange += deploymentDiff;
      
      const deploymentIcon = changes.deployment.change === "DECREASE" ? "🟢" : 
                           changes.deployment.change === "INCREASE" ? "🔴" : "⚪";
      
      console.log(`  ${deploymentIcon} Deployment: ${changes.deployment.oldGas} → ${changes.deployment.newGas} (${changes.deployment.difference}, ${changes.deployment.percentage})`);
      
      if (changes.deployment.change === "DECREASE") improvements++;
      else if (changes.deployment.change === "INCREASE") regressions++;
    } else {
      console.log(`  🆕 Deployment: NEW (${changes.deployment.newGas} gas)`);
    }

    // Function changes
    Object.entries(changes.functions).forEach(([funcName, funcChanges]) => {
      if (funcChanges.change !== "NEW") {
        const funcDiff = parseInt(funcChanges.difference);
        totalFunctionChange += funcDiff;
        
        const funcIcon = funcChanges.change === "DECREASE" ? "🟢" : 
                        funcChanges.change === "INCREASE" ? "🔴" : "⚪";
        
        console.log(`    ${funcIcon} ${funcName}: ${funcChanges.oldGas} → ${funcChanges.newGas} (${funcChanges.difference}, ${funcChanges.percentage})`);
        
        if (funcChanges.change === "DECREASE") improvements++;
        else if (funcChanges.change === "INCREASE") regressions++;
      } else {
        console.log(`    🆕 ${funcName}: NEW (${funcChanges.newGas} gas)`);
      }
    });
  });

  console.log("\n📈 Overall Changes:");
  console.log(`  Deployment: ${totalDeploymentChange >= 0 ? "+" : ""}${totalDeploymentChange.toLocaleString()} gas`);
  console.log(`  Functions: ${totalFunctionChange >= 0 ? "+" : ""}${totalFunctionChange.toLocaleString()} gas`);
  console.log(`  Total: ${(totalDeploymentChange + totalFunctionChange) >= 0 ? "+" : ""}${(totalDeploymentChange + totalFunctionChange).toLocaleString()} gas`);
  
  console.log(`\n🎯 Summary:`);
  console.log(`  🟢 Improvements: ${improvements}`);
  console.log(`  🔴 Regressions: ${regressions}`);
  console.log(`  ⚪ No Change: ${Object.keys(comparison.changes).length - improvements - regressions}`);

  if (totalDeploymentChange + totalFunctionChange < 0) {
    console.log("\n🎉 Overall gas usage improved! 🎉");
  } else if (totalDeploymentChange + totalFunctionChange > 0) {
    console.log("\n⚠️  Overall gas usage increased. Consider optimization.");
  } else {
    console.log("\n✅ Gas usage remained stable.");
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log("Usage: node compare-gas-snapshots.js <baseline-snapshot> <current-snapshot>");
    console.log("Example: node compare-gas-snapshots.js gas-snapshots-v1.0.0.json gas-snapshots-v1.1.0.json");
    process.exit(1);
  }

  const [baselinePath, currentPath] = args;
  compareGasSnapshots(baselinePath, currentPath);
}

module.exports = { compareGasSnapshots }; 