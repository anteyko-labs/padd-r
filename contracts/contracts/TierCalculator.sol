// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TierCalculator
 * @dev Pure library for calculating staking tiers based on duration
 */
library TierCalculator {
    enum Tier {
        Bronze,  // ≥ 6 months
        Silver,  // ≥ 12 months
        Gold,    // ≥ 18 months
        Platinum // ≥ 30 months
    }

    // Duration constants in seconds
    uint256 private constant SIX_MONTHS = 180 days;
    uint256 private constant TWELVE_MONTHS = 365 days;
    uint256 private constant EIGHTEEN_MONTHS = 547 days;
    uint256 private constant THIRTY_MONTHS = 912 days;

    /**
     * @dev Calculate tier based on staking duration
     * @param duration Duration in seconds
     * @return Tier enum value
     */
    function calculateTier(uint256 duration) internal pure returns (Tier) {
        if (duration >= THIRTY_MONTHS) {
            return Tier.Platinum;
        } else if (duration >= EIGHTEEN_MONTHS) {
            return Tier.Gold;
        } else if (duration >= TWELVE_MONTHS) {
            return Tier.Silver;
        } else if (duration >= SIX_MONTHS) {
            return Tier.Bronze;
        } else {
            revert("Duration too short");
        }
    }
} 