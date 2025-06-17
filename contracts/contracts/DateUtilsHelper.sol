// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./DateUtils.sol";

contract DateUtilsHelper {
    function addMonths(uint256 timestamp, uint256 months) external pure returns (uint256) {
        return DateUtils.addMonths(timestamp, months);
    }
    
    function monthsBetween(uint256 start, uint256 end) external pure returns (uint256) {
        return DateUtils.monthsBetween(start, end);
    }
} 