// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITierCalculator {
    enum Tier {
        Bronze,  // ≥ 6 months
        Silver,  // ≥ 12 months
        Gold,    // ≥ 18 months
        Platinum // ≥ 30 months
    }

    // getTier: months, amount -> uint8 tier
    function getTier(uint256 months, uint256 amount) external view returns (uint8);
} 