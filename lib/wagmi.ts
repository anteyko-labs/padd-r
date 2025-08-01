import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PADD-R Platform',
  projectId: 'YOUR_PROJECT_ID', // Можно оставить пустым для локальной разработки
  chains: [sepolia, mainnet],
  ssr: true,
});

// Конфигурация для Sepolia сети
export const sepoliaConfig = {
  chainId: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.infura.io/v3/9c259df705904ba5b2cbd4a10d00e7df'],
    },
    public: {
      http: ['https://sepolia.infura.io/v3/9c259df705904ba5b2cbd4a10d00e7df'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Sepolia Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
}; 