// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MultiStakeManager.sol";

contract MaliciousContract {
    MultiStakeManager public immutable stakeManager;

    constructor(address _stakeManager) {
        stakeManager = MultiStakeManager(_stakeManager);
    }

    function callEmergencyWithdraw(uint256 positionId) external {
        stakeManager.emergencyWithdraw(positionId);
    }
} 