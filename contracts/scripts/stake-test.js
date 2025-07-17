require('dotenv').config({ path: '.env2', override: true });
const hre = require("hardhat");

console.log('SEPOLIA_RPC_URL:', process.env.SEPOLIA_RPC_URL);
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? '[SET]' : '[NOT SET]');
console.log('STAKE_MANAGER_ADDRESS:', process.env.STAKE_MANAGER_ADDRESS);
console.log('PAD_TOKEN_ADDRESS:', process.env.PAD_TOKEN_ADDRESS);

if (!process.env.SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY || !process.env.STAKE_MANAGER_ADDRESS || !process.env.PAD_TOKEN_ADDRESS) {
  console.error('One or more required env variables are missing!');
  process.exit(1);
}

async function testTier(amount, months) {
  const [signer] = await hre.ethers.getSigners();
  const stakeManager = await hre.ethers.getContractAt("MultiStakeManager", process.env.STAKE_MANAGER_ADDRESS, signer);
  const padToken = await hre.ethers.getContractAt("PADToken", process.env.PAD_TOKEN_ADDRESS, signer);

  console.log(`\n=== TEST: ${amount} PAD, ${months} мес ===`);
  const amountWei = hre.ethers.parseUnits(amount.toString(), 18);
  const balance = await padToken.balanceOf(signer.address);
  const allowance = await padToken.allowance(signer.address, stakeManager.target);
  console.log("Balance:", hre.ethers.formatUnits(balance, 18));
  console.log("Allowance:", hre.ethers.formatUnits(allowance, 18));

  if (allowance < amountWei) {
    const tx = await padToken.approve(stakeManager.target, amountWei);
    await tx.wait();
    console.log("Approved!");
    await new Promise(r => setTimeout(r, 5000));
    const newAllowance = await padToken.allowance(signer.address, stakeManager.target);
    console.log("New Allowance:", hre.ethers.formatUnits(newAllowance, 18));
  }

  try {
    const tx = await stakeManager.createPosition(amountWei, months);
    const receipt = await tx.wait();
    console.log("Tx success! Hash:", tx.hash);
    for (const log of receipt.logs) {
      try {
        const parsed = stakeManager.interface.parseLog(log);
        if (parsed.name === "DebugLog") {
          console.log("DebugLog:", parsed.args.message, parsed.args.value.toString());
        }
      } catch {}
    }
  } catch (e) {
    if (e.error && e.error.data && e.error.data.message) {
      console.error("Revert reason:", e.error.data.message);
    } else if (e.message) {
      console.error("Error:", e.message);
    } else {
      console.error(e);
    }
  }
}

async function main() {
  await testTier(2000, 3); // Bronze
  await testTier(4000, 6); // Silver
  await testTier(7000, 9); // Gold
  await testTier(12000, 12); // Platinum
}

main().catch(console.error); 