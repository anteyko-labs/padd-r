// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TierCalculator {
    function getTier(uint256 months, uint256 amount) external pure returns (uint8) {
        require(months == 3 || months == 6 || months == 9 || months == 12, "Invalid months");
        require(amount >= 1000 * 1e18, "Min 1000 tokens");
        // Нормализация
        uint256 monthsNorm = (months * 1e18) / 12; // 3/12, 6/12, 9/12, 12/12
        uint256 amountNorm = (amount - 1000 * 1e18) / 1e18; // 1 = 1000 сверху минимума
        // Весовые коэффициенты (60% срок, 40% сумма)
        uint256 tierScore = (monthsNorm * 60 + amountNorm * 40) / 100;
        // tierScore может быть больше 1e18, если сумма большая
        if (tierScore <= 2e17) return 0; // Bronze (до 0.2)
        if (tierScore <= 45e16) return 1; // Silver (до 0.45)
        if (tierScore <= 75e16) return 2; // Gold (до 0.75 включительно)
        return 3; // Platinum (всё, что выше)
    }
} 