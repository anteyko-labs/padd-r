// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library TierCalculatorLib {
    enum Tier {
        Bronze,  // ≥ 6 months
        Silver,  // ≥ 12 months
        Gold,    // ≥ 18 months
        Platinum // ≥ 30 months
    }

    uint256 internal constant SIX_MONTHS = 180 days;
    uint256 internal constant TWELVE_MONTHS = 365 days;
    uint256 internal constant EIGHTEEN_MONTHS = 547 days;
    uint256 internal constant THIRTY_MONTHS = 912 days;

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