// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/TierCalculator.sol";

contract TierCalculatorTest is Test {
    TierCalculator public calculator;

    function setUp() public {
        calculator = new TierCalculator();
    }

    function test_BronzeBoundary() public {
        // 6 месяцев = 180 дней
        uint256 duration = 180 days;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 0); // Bronze
    }

    function test_SilverBoundary() public {
        uint256 duration = 365 days;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 1); // Silver
    }

    function test_GoldBoundary() public {
        uint256 duration = 547 days;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 2); // Gold
    }

    function test_PlatinumBoundary() public {
        uint256 duration = 912 days;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 3); // Platinum
    }

    function test_OffByOneBelowBronze() public {
        uint256 duration = 179 days;
        vm.expectRevert("Duration too short");
        calculator.getTier(duration);
    }

    function test_OffByOneBelowSilver() public {
        uint256 duration = 364 days;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 0); // Bronze
    }

    function test_OffByOneBelowGold() public {
        uint256 duration = 546 days;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 1); // Silver
    }

    function test_OffByOneBelowPlatinum() public {
        uint256 duration = 911 days;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 2); // Gold
    }

    // Дополнительные тесты для улучшения покрытия
    function test_ZeroDuration() public {
        uint256 duration = 0;
        vm.expectRevert("Duration too short");
        calculator.getTier(duration);
    }

    function test_OneDayDuration() public {
        uint256 duration = 1 days;
        vm.expectRevert("Duration too short");
        calculator.getTier(duration);
    }

    function test_OneMonthDuration() public {
        uint256 duration = 30 days;
        vm.expectRevert("Duration too short");
        calculator.getTier(duration);
    }

    function test_BronzeMiddleRange() public {
        uint256 duration = 270 days; // 9 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 0); // Bronze
    }

    function test_SilverMiddleRange() public {
        uint256 duration = 456 days; // ~15 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 1); // Silver
    }

    function test_GoldMiddleRange() public {
        uint256 duration = 730 days; // ~24 месяца
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 2); // Gold
    }

    function test_PlatinumMiddleRange() public {
        uint256 duration = 1000 days; // ~33 месяца
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 3); // Platinum
    }

    function test_PlatinumAboveMaximum() public {
        uint256 duration = 10000 days; // ~27 лет
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 3); // Platinum
    }

    function test_MaxUint256() public {
        uint256 duration = type(uint256).max;
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 3); // Platinum
    }

    function test_BronzeUpperBound() public {
        uint256 duration = 364 days; // чуть меньше 12 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 0); // Bronze
    }

    function test_SilverUpperBound() public {
        uint256 duration = 546 days; // чуть меньше 18 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 1); // Silver
    }

    function test_GoldUpperBound() public {
        uint256 duration = 911 days; // чуть меньше 30 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 2); // Gold
    }

    // Дополнительные тесты для покрытия веток Gold и Silver
    function test_GoldExactBoundary() public {
        uint256 duration = 547 days; // точно 18 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 2); // Gold
    }

    function test_SilverExactBoundary() public {
        uint256 duration = 365 days; // точно 12 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 1); // Silver
    }

    function test_PlatinumExactBoundary() public {
        uint256 duration = 912 days; // точно 30 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 3); // Platinum
    }

    function test_PlatinumAboveBoundary() public {
        uint256 duration = 1000 days; // больше 30 месяцев
        uint8 tier = calculator.getTier(duration);
        assertEq(tier, 3); // Platinum
    }
} 