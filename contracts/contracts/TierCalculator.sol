// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Оставляем только контракт TierCalculator

contract TierCalculator {
    enum Tier {
        Bronze,  // ≥ 1 час
        Silver,  // ≥ 4 часа
        Gold,    // ≥ 7 часов
        Platinum // ≥ 9 часов
    }

    uint256 private constant ONE_HOUR = 1 hours;
    uint256 private constant FOUR_HOURS = 4 hours;
    uint256 private constant SEVEN_HOURS = 7 hours;
    uint256 private constant NINE_HOURS = 9 hours;

    function getTier(uint256 duration) external pure returns (uint8) {
        if (duration >= NINE_HOURS) {
            return uint8(Tier.Platinum);
        } else if (duration >= SEVEN_HOURS) {
            return uint8(Tier.Gold);
        } else if (duration >= FOUR_HOURS) {
            return uint8(Tier.Silver);
        } else if (duration >= ONE_HOUR) {
            return uint8(Tier.Bronze);
        } else {
            revert("Duration too short");
        }
    }
} 