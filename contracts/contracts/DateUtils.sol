// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DateUtils
 * @dev Utility functions for date calculations
 */
library DateUtils {
    uint256 private constant SECONDS_PER_DAY = 24 * 60 * 60;
    uint256 private constant SECONDS_PER_MONTH = 30 * SECONDS_PER_DAY;

    /**
     * @dev Add months to a timestamp
     * @param timestamp Base timestamp
     * @param months Number of months to add
     * @return New timestamp
     */
    function addMonths(uint256 timestamp, uint256 months) internal pure returns (uint256) {
        return timestamp + (months * SECONDS_PER_MONTH);
    }

    /**
     * @dev Get number of months between two timestamps
     * @param start Start timestamp
     * @param end End timestamp
     * @return Number of months
     */
    function monthsBetween(uint256 start, uint256 end) internal pure returns (uint256) {
        require(end >= start, "End before start");
        return (end - start) / SECONDS_PER_MONTH;
    }
} 