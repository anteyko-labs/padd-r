# Gas Snapshots Documentation

This document describes how to generate and compare gas snapshots for the PADD-R smart contracts.

## Overview

Gas snapshots help track gas usage changes across different versions of the smart contracts. This is crucial for:
- Monitoring gas optimization efforts
- Identifying gas regressions
- Planning deployment costs
- Comparing different implementations

## Available Commands

### Generate Gas Snapshot

Generate a comprehensive gas snapshot for all contracts:

```bash
npm run gas:snapshot
```

This will:
- Deploy all contracts
- Test main functions
- Measure gas usage for deployment and key operations
- Save results to `gas-snapshots.json`

### Generate Gas Report

Generate a detailed gas report during testing:

```bash
npm run gas:report
```

This runs all tests with gas reporting enabled and generates a detailed report.

### Compare Gas Snapshots

Compare two gas snapshots to see changes:

```bash
npm run gas:compare <baseline-snapshot> <current-snapshot>
```

Example:
```bash
npm run gas:compare gas-snapshots-v1.0.0.json gas-snapshots-v1.1.0.json
```

## Gas Snapshot Structure

The generated `gas-snapshots.json` file contains:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "contracts": {
    "PADToken": {
      "deployment": {
        "gasUsed": "1234567",
        "gasPrice": "20000000000",
        "totalCost": "24691340000000000"
      },
      "functions": {
        "mint": {
          "gasUsed": "45678",
          "gasPrice": "20000000000",
          "totalCost": "913560000000000"
        },
        "transfer": {
          "gasUsed": "34567",
          "gasPrice": "20000000000",
          "totalCost": "691340000000000"
        }
      }
    }
  }
}
```

## Measured Operations

### PADToken
- **Deployment**: Contract deployment
- **mint**: Minting new tokens
- **transfer**: Transferring tokens

### PADNFTFactory
- **Deployment**: Contract deployment
- **createNFT**: Creating new NFT collection

### MultiStakeManager
- **Deployment**: Contract deployment
- **stake**: Staking tokens
- **unstake**: Unstaking tokens

### TierCalculator
- **Deployment**: Contract deployment
- **calculateTier**: Calculating user tier

### TierMonitor (if available)
- **Deployment**: Contract deployment
- **performUpkeep**: Chainlink Keeper operation

## Gas Optimization Guidelines

### Target Gas Limits

| Operation | Target Gas | Warning Threshold |
|-----------|------------|-------------------|
| Contract Deployment | < 2,000,000 | > 2,500,000 |
| Token Transfer | < 50,000 | > 75,000 |
| Staking | < 100,000 | > 150,000 |
| Tier Calculation | < 30,000 | > 50,000 |

### Optimization Tips

1. **Use efficient data structures**
   - Prefer mappings over arrays for lookups
   - Use packed structs where possible

2. **Minimize storage operations**
   - Batch operations when possible
   - Use events instead of storage for historical data

3. **Optimize loops**
   - Limit loop iterations
   - Use pagination for large datasets

4. **Use appropriate visibility**
   - Make functions `external` when possible
   - Use `view` and `pure` functions

## Version Control

### Naming Convention

Gas snapshots should be named with version numbers:

```
gas-snapshots-v1.0.0.json
gas-snapshots-v1.1.0.json
gas-snapshots-v2.0.0.json
```

### Git Integration

1. Commit gas snapshots with each release
2. Include gas comparison in release notes
3. Tag snapshots with git tags

### CI/CD Integration

Add gas snapshot generation to your CI pipeline:

```yaml
- name: Generate Gas Snapshot
  run: npm run gas:snapshot
- name: Upload Gas Snapshot
  uses: actions/upload-artifact@v2
  with:
    name: gas-snapshot-${{ github.sha }}
    path: gas-snapshots.json
```

## Troubleshooting

### Common Issues

1. **Out of Gas Errors**
   - Check if contracts are too large
   - Verify gas limits in deployment scripts
   - Consider splitting large contracts

2. **Inconsistent Measurements**
   - Ensure same Solidity version
   - Use same optimizer settings
   - Run on same network (Hardhat)

3. **Missing Contracts**
   - Check if all contracts compile successfully
   - Verify contract factory names
   - Ensure dependencies are available

### Debugging

Enable verbose logging:

```bash
DEBUG=hardhat:gas-reporter npm run gas:snapshot
```

## Best Practices

1. **Regular Monitoring**
   - Generate snapshots for each PR
   - Compare against main branch
   - Set up automated alerts for regressions

2. **Documentation**
   - Document gas optimization changes
   - Include gas impact in PR descriptions
   - Maintain gas usage history

3. **Team Awareness**
   - Share gas reports in team meetings
   - Include gas considerations in code reviews
   - Train team on gas optimization techniques

## Future Enhancements

- [ ] Integration with gas price APIs
- [ ] Historical gas usage tracking
- [ ] Automated gas regression detection
- [ ] Gas usage visualization dashboard
- [ ] Integration with deployment scripts 