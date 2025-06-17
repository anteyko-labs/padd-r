// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/DateUtils.sol";

contract DateUtilsTest is Test {
    using DateUtils for uint256;

    function test_AddMonths() public {
        uint256 timestamp = 1640995200; // 1 Jan 2022
        uint256 result = DateUtils.addMonths(timestamp, 1);
        assertEq(result, timestamp + 30 days);
    }

    function test_AddZeroMonths() public {
        uint256 timestamp = 1640995200; // 1 Jan 2022
        uint256 result = DateUtils.addMonths(timestamp, 0);
        assertEq(result, timestamp);
    }

    function test_AddMultipleMonths() public {
        uint256 timestamp = 1640995200; // 1 Jan 2022
        uint256 result = DateUtils.addMonths(timestamp, 12);
        assertEq(result, timestamp + (12 * 30 days));
    }

    function test_AddManyMonths() public {
        uint256 timestamp = 1640995200; // 1 Jan 2022
        uint256 result = DateUtils.addMonths(timestamp, 100);
        assertEq(result, timestamp + (100 * 30 days));
    }

    function test_MonthsBetween() public {
        uint256 start = 1640995200; // 1 Jan 2022
        uint256 end = start + (6 * 30 days); // 6 months later
        uint256 months = DateUtils.monthsBetween(start, end);
        assertEq(months, 6);
    }

    function test_MonthsBetweenExact() public {
        uint256 start = 1640995200; // 1 Jan 2022
        uint256 end = start + (12 * 30 days); // 12 months later
        uint256 months = DateUtils.monthsBetween(start, end);
        assertEq(months, 12);
    }

    function test_MonthsBetweenPartial() public {
        uint256 start = 1640995200; // 1 Jan 2022
        uint256 end = start + (3 * 30 days) + 15 days; // 3.5 months later
        uint256 months = DateUtils.monthsBetween(start, end);
        assertEq(months, 3); // Should truncate to 3 months
    }

    function test_MonthsBetweenZero() public {
        uint256 start = 1640995200; // 1 Jan 2022
        uint256 end = start; // Same timestamp
        uint256 months = DateUtils.monthsBetween(start, end);
        assertEq(months, 0);
    }

    function test_MonthsBetweenLessThanMonth() public {
        uint256 start = 1640995200; // 1 Jan 2022
        uint256 end = start + 15 days; // Less than a month
        uint256 months = DateUtils.monthsBetween(start, end);
        assertEq(months, 0);
    }

    function test_MonthsBetweenEndBeforeStart() public {
        uint256 start = 1640995200; // 1 Jan 2022
        uint256 end = start - 30 days; // Before start
        vm.expectRevert("End before start");
        DateUtils.monthsBetween(start, end);
    }

    function test_AddMonthsWithMaxUint() public {
        uint256 timestamp = type(uint256).max - 30 days;
        uint256 result = DateUtils.addMonths(timestamp, 1);
        assertEq(result, type(uint256).max);
    }

    function test_MonthsBetweenLargeValues() public {
        uint256 start = 1000000000;
        uint256 end = start + (1000 * 30 days);
        uint256 months = DateUtils.monthsBetween(start, end);
        assertEq(months, 1000);
    }
} 