// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Оставляем только контракт TierCalculator

contract TierCalculator {
    enum Tier {
        Bronze,  // ≥ 3 месяца
        Silver,  // ≥ 6 месяцев
        Gold,    // ≥ 9 месяцев
        Platinum // ≥ 12 месяцев
    }

    uint256 private constant THREE_MONTHS = 3 * 30 days;
    uint256 private constant SIX_MONTHS = 6 * 30 days;
    uint256 private constant NINE_MONTHS = 9 * 30 days;
    uint256 private constant TWELVE_MONTHS = 12 * 30 days;

    function getTier(uint256 duration) external pure returns (uint8) {
        if (duration >= TWELVE_MONTHS) {
            return uint8(Tier.Platinum);
        } else if (duration >= NINE_MONTHS) {
            return uint8(Tier.Gold);
        } else if (duration >= SIX_MONTHS) {
            return uint8(Tier.Silver);
        } else if (duration >= THREE_MONTHS) {
            return uint8(Tier.Bronze);
        } else {
            revert("Duration too short");
        }
    }
} 