// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Оставляем только контракт TierCalculator

contract TierCalculator {
    enum Tier {
        Bronze,  // ≥ 6 months
        Silver,  // ≥ 12 months
        Gold,    // ≥ 18 months
        Platinum // ≥ 30 months
    }

    uint256 private constant SIX_MONTHS = 180 days;
    uint256 private constant TWELVE_MONTHS = 365 days;
    uint256 private constant EIGHTEEN_MONTHS = 547 days;
    uint256 private constant THIRTY_MONTHS = 912 days;

    function getTier(uint256 duration) external pure returns (uint8) {
        if (duration >= THIRTY_MONTHS) {
            return uint8(Tier.Platinum);
        } else if (duration >= EIGHTEEN_MONTHS) {
            return uint8(Tier.Gold);
        } else if (duration >= TWELVE_MONTHS) {
            return uint8(Tier.Silver);
        } else if (duration >= SIX_MONTHS) {
            return uint8(Tier.Bronze);
        } else {
            revert("Duration too short");
        }
    }
} 