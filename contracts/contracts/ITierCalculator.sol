// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITierCalculator {
    enum Tier {
        Bronze,  // ≥ 6 months
        Silver,  // ≥ 12 months
        Gold,    // ≥ 18 months
        Platinum // ≥ 30 months
    }

    /**
     * @dev Get tier for a specific position
     * @param positionId Position ID
     * @return Tier enum value
     */
    function getTier(uint256 positionId) external view returns (Tier);
} 