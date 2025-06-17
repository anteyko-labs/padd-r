# PADD-R: Blockchain Loyalty Platform

A comprehensive blockchain-based loyalty platform with NFT rewards, staking mechanisms, and tier-based benefits.

## 🏗️ Architecture

The platform consists of several smart contracts:

- **PADToken**: ERC20 token with batch transfer and cooldown features
- **MultiStakeManager**: Staking contract with position management and tier calculation
- **PADNFTFactory**: NFT factory for minting soul-bound loyalty NFTs
- **TierCalculator**: Logic for calculating user tiers based on staking duration
- **DateUtils**: Utility library for date calculations

## 📊 Test Coverage

![Coverage](https://img.shields.io/badge/coverage-80.33%25-yellow)

### Coverage Breakdown

| Metric | Coverage |
|--------|----------|
| **Statements** | 80.33% |
| **Branch** | 58.87% |
| **Functions** | 84.38% |
| **Lines** | 83.69% |

### Contract Coverage

| Contract | Statements | Branch | Functions | Lines |
|----------|------------|--------|-----------|-------|
| PADToken | 95.65% | 73.33% | 88.89% | 96.67% |
| MultiStakeManager | 85.96% | 59.38% | 88.89% | 85.71% |
| PADNFTFactory | 94.74% | 66.67% | 85.71% | 95.65% |
| TierCalculator | 66.67% | 62.5% | 100% | 50% |

## 🧪 Testing

### Hardhat Tests
```bash
cd contracts
npm test
```

### Coverage Report
```bash
cd contracts
npx hardhat coverage
```

### Foundry Tests (if Foundry is installed)
```bash
cd contracts
forge test
```

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- Hardhat

### Setup
```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Deploy
```bash
cd contracts
npx hardhat run scripts/deploy.js --network <network>
```

## 📋 Project Tasks Status

- ✅ **PADD-001**: PADToken Implementation
- ✅ **PADD-002**: MultiStakeManager Implementation  
- ✅ **PADD-003**: PADNFTFactory Implementation
- ✅ **PADD-004**: TierCalculator Implementation
- ✅ **PADD-005**: Tier Monitor with Chainlink Keepers
- ⚠️ **PADD-006**: Solidity Tests and Coverage (Partially Complete)

### PADD-006 Status:
- ✅ Hardhat tests implemented and passing
- ✅ Coverage measurement configured
- ⚠️ Foundry tests created but not run (Foundry installation issues on Windows)
- ⚠️ Branch coverage below 90% target
- ✅ CI/CD workflow configured

## 🔧 Configuration

### Environment Variables
```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc
MAINNET_RPC_URL=your_mainnet_rpc
ETHERSCAN_API_KEY=your_etherscan_key
REPORT_GAS=true
```

## 📝 License

MIT License 