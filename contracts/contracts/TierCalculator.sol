// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TierCalculator {
    function getTier(uint256 months, uint256 amount) external pure returns (uint8) {
        require(months == 3 || months == 6 || months == 9 || months == 12, "Invalid months");
        require(amount >= 1000 * 1e18, "Min 1000 tokens");
        
        // Новая формула: k_score = (duration/max_duration(12))*0.6 + (amount/53333)*0.4
        // Конвертируем в wei для точности
        uint256 timeScore = (months * 1e18 * 60) / (12 * 100); // (months/12)*0.6 в wei
        uint256 amountScore = (amount * 40) / (53333 * 1e18 * 100); // (amount/53333)*0.4 в wei
        
        uint256 tierScore = timeScore + amountScore;
        
        // Пороги (в wei)
        if (tierScore <= 25e16) return 0; // Bronze (до 0.25)
        if (tierScore <= 50e16) return 1; // Silver (до 0.5)
        if (tierScore <= 75e16) return 2; // Gold (до 0.75)
        return 3; // Platinum (всё, что выше)
    }
} 