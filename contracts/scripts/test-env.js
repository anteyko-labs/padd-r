require("dotenv").config();

console.log("SEPOLIA_RPC_URL:", process.env.SEPOLIA_RPC_URL ? "Set" : "Not set");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "Set" : "Not set");
console.log("ETHERSCAN_API_KEY:", process.env.ETHERSCAN_API_KEY ? "Set" : "Not set"); 