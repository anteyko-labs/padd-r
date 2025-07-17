// scripts/find-minted-nfts.js
import { JsonRpcProvider, Contract } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const NFT_FACTORY_ADDRESS = "0xF3Dc58242fd58f833Df333f8db1B96BFB5b156f4"; // новый адрес NFT Factory
const USER_ADDRESS = "0xB468B3837e185B59594A100c1583a98C79b524F3"; // твой адрес
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/9c259df705904ba5b2cbd4a10d00e7df";

const ABI = [
  "event NFTMinted(address indexed to, uint256 indexed tokenId, tuple(uint256,uint256,uint256,uint256,uint8,uint256,uint256) meta)"
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const contract = new Contract(NFT_FACTORY_ADDRESS, ABI, provider);

  // Получаем все события NFTMinted для твоего адреса
  const filter = contract.filters.NFTMinted(USER_ADDRESS);
  const events = await contract.queryFilter(filter, 0, "latest");

  if (events.length === 0) {
    console.log("Для этого адреса не найдено сминченных NFT.");
    return;
  }

  for (const event of events) {
    const { to, tokenId, meta } = event.args;
    console.log(`NFT для ${to}: tokenId=${tokenId.toString()}, meta=`, meta);
  }
}

main().catch(console.error);