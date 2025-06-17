// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/PADToken.sol";
import "../contracts/MultiStakeManager.sol";
import "../contracts/TierCalculator.sol";
import "../contracts/PADNFTFactory.sol";

contract MultiStakeManagerTest is Test {
    PADToken public padToken;
    MultiStakeManager public stakeManager;
    TierCalculator public tierCalculator;
    PADNFTFactory public nftFactory;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant MIN_STAKE_DURATION = 180 days; // 6 months
    uint256 public constant MAX_STAKE_DURATION = 3650 days; // 10 years
    uint256 public constant MAX_POSITIONS_PER_WALLET = 10;
    uint256 public constant REWARD_INTERVAL = 30 days;

    event PositionCreated(uint256 indexed positionId, address indexed owner, uint256 amount, uint256 duration);
    event PositionClosed(uint256 indexed positionId, address indexed owner, uint256 amount, uint256 reward);
    event EmergencyWithdrawn(uint256 indexed positionId, address indexed owner, uint256 amount);
    event NFTFactorySet(address indexed newNFTFactory);

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        vm.startPrank(owner);
        
        // Deploy contracts
        padToken = new PADToken();
        tierCalculator = new TierCalculator();
        nftFactory = new PADNFTFactory(address(0), address(tierCalculator));
        stakeManager = new MultiStakeManager(address(padToken));
        
        // Setup roles
        bytes32 minterRole = nftFactory.MINTER_ROLE();
        nftFactory.grantRole(minterRole, address(stakeManager));
        stakeManager.setNFTFactory(address(nftFactory));
        
        vm.stopPrank();
        
        // Mint tokens to users
        vm.prank(owner);
        padToken.transfer(user1, 1000000 * 10**18);
        vm.prank(owner);
        padToken.transfer(user2, 1000000 * 10**18);
        
        // Approve tokens
        vm.prank(user1);
        padToken.approve(address(stakeManager), type(uint256).max);
        vm.prank(user2);
        padToken.approve(address(stakeManager), type(uint256).max);
    }

    // ============ Deployment Tests ============

    function test_Deployment() public {
        assertEq(address(stakeManager.stakingToken()), address(padToken));
        assertEq(stakeManager.MIN_STAKE_DURATION(), MIN_STAKE_DURATION);
        assertEq(stakeManager.MAX_STAKE_DURATION(), MAX_STAKE_DURATION);
        assertEq(stakeManager.MAX_POSITIONS_PER_WALLET(), MAX_POSITIONS_PER_WALLET);
        assertEq(stakeManager.REWARD_INTERVAL(), REWARD_INTERVAL);
    }

    // ============ Position Creation Tests ============

    function test_CreatePosition() public {
        uint256 amount = 1000 * 10**18;
        uint256 duration = 180 days;
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit PositionCreated(1, user1, amount, duration);
        stakeManager.createPosition(amount, duration);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.amount, amount);
        assertEq(position.duration, duration);
        assertEq(position.owner, user1);
        assertTrue(position.isActive);
        assertEq(position.tier, 0); // Bronze
        assertEq(position.monthIndex, 0);
    }

    function test_CreatePosition_ZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Zero amount");
        stakeManager.createPosition(0, 180 days);
    }

    function test_CreatePosition_DurationTooShort() public {
        vm.prank(user1);
        vm.expectRevert("Duration too short");
        stakeManager.createPosition(1000 * 10**18, 179 days);
    }

    function test_CreatePosition_DurationTooLong() public {
        vm.prank(user1);
        vm.expectRevert("Duration too long");
        stakeManager.createPosition(1000 * 10**18, 3651 days);
    }

    function test_CreatePosition_TooManyPositions() public {
        uint256 amount = 1000 * 10**18;
        uint256 duration = 180 days;
        
        // Create 10 positions
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(user1);
            stakeManager.createPosition(amount, duration);
        }
        
        // Try to create 11th position
        vm.prank(user1);
        vm.expectRevert("Too many positions");
        stakeManager.createPosition(amount, duration);
    }

    function test_CreatePosition_AmountTooLarge() public {
        uint256 largeAmount = type(uint128).max + 1;
        vm.prank(user1);
        vm.expectRevert("Amount too large");
        stakeManager.createPosition(largeAmount, 180 days);
    }

    function test_CreatePosition_TierCalculation() public {
        // Test Bronze tier (6 months)
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.tier, 0); // Bronze
        
        // Test Silver tier (12 months)
        vm.prank(user2);
        stakeManager.createPosition(1000 * 10**18, 365 days);
        position = stakeManager.positions(2);
        assertEq(position.tier, 1); // Silver
        
        // Test Gold tier (18 months)
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 547 days);
        position = stakeManager.positions(3);
        assertEq(position.tier, 2); // Gold
        
        // Test Platinum tier (30 months)
        vm.prank(user2);
        stakeManager.createPosition(1000 * 10**18, 912 days);
        position = stakeManager.positions(4);
        assertEq(position.tier, 3); // Platinum
    }

    function test_CreatePosition_NextMintAtCalculation() public {
        uint256 startTime = block.timestamp;
        uint256 amount = 1000 * 10**18;
        uint256 duration = 180 days;
        
        vm.prank(user1);
        stakeManager.createPosition(amount, duration);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        uint256 expectedNextMintAt = startTime + 30 days;
        
        // Allow 1 second difference due to block timestamp
        assertApproxEqAbs(position.nextMintAt, expectedNextMintAt, 1);
    }

    // ============ Position Closing Tests ============

    function test_ClosePosition_BeforeMaturity() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        vm.expectRevert("Position not mature");
        stakeManager.closePosition(1);
    }

    function test_ClosePosition_AfterMaturity() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward time
        skip(180 days + 1);
        
        uint256 balanceBefore = padToken.balanceOf(user1);
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit PositionClosed(1, user1, 1000 * 10**18, 0);
        stakeManager.closePosition(1);
        
        uint256 balanceAfter = padToken.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, 1000 * 10**18);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertFalse(position.isActive);
    }

    function test_ClosePosition_NotOwner() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        vm.expectRevert("Not position owner");
        stakeManager.closePosition(1);
    }

    function test_ClosePosition_NotActive() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        skip(180 days + 1);
        
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        vm.prank(user1);
        vm.expectRevert("Position not active");
        stakeManager.closePosition(1);
    }

    function test_ClosePosition_NonExistent() public {
        vm.prank(user1);
        vm.expectRevert("Position not found");
        stakeManager.closePosition(999);
    }

    function test_ClosePosition_AlreadyClosed() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward time
        skip(180 days + 1);
        
        // Close position
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        // Try to close again
        vm.prank(user1);
        vm.expectRevert("Position not active");
        stakeManager.closePosition(1);
    }

    // ============ Emergency Withdraw Tests ============

    function test_EmergencyWithdraw() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        uint256 balanceBefore = padToken.balanceOf(user1);
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit EmergencyWithdrawn(1, user1, 1000 * 10**18);
        stakeManager.emergencyWithdraw(1);
        
        uint256 balanceAfter = padToken.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, 1000 * 10**18);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertFalse(position.isActive);
    }

    function test_EmergencyWithdraw_NotOwner() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        vm.expectRevert("Not position owner");
        stakeManager.emergencyWithdraw(1);
    }

    function test_EmergencyWithdraw_NotActive() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.emergencyWithdraw(1);
        
        vm.prank(user1);
        vm.expectRevert("Position not active");
        stakeManager.emergencyWithdraw(1);
    }

    function test_EmergencyWithdraw_NonExistent() public {
        vm.prank(user1);
        vm.expectRevert("Position not found");
        stakeManager.emergencyWithdraw(999);
    }

    function test_EmergencyWithdraw_AlreadyClosed() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward time
        skip(180 days + 1);
        
        // Close position
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        // Try emergency withdraw
        vm.prank(user1);
        vm.expectRevert("Position not active");
        stakeManager.emergencyWithdraw(1);
    }

    function test_EmergencyWithdraw_Contract() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Create a contract address
        address contractAddr = address(0x123);
        vm.etch(contractAddr, bytes(""));
        
        // Try to emergency withdraw as contract
        vm.prank(contractAddr);
        vm.expectRevert("EOA only");
        stakeManager.emergencyWithdraw(1);
    }

    // ============ Position Management Tests ============

    function test_GetUserPositions() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 2);
        assertEq(positions[0], 1);
        assertEq(positions[1], 2);
    }

    function test_GetUserPositions_Empty() public {
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 0);
    }

    function test_GetUserPositions_WithPositions() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 2);
        assertEq(positions[0], 1);
        assertEq(positions[1], 2);
    }

    function test_GetUserPositions_AfterClosing() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Close first position
        skip(180 days + 1);
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 1);
        assertEq(positions[0], 2);
    }

    function test_RemovePositionFromUser() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Close first position
        skip(180 days + 1);
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 1);
        assertEq(positions[0], 2);
    }

    // ============ NFT Integration Tests ============

    function test_MintNextNFT() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward to next mint time
        skip(30 days + 1);
        
        vm.prank(address(nftFactory));
        stakeManager.mintNextNFT(1);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.monthIndex, 1);
    }

    function test_MintNextNFT_TooEarly() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(address(nftFactory));
        vm.expectRevert("Too early");
        stakeManager.mintNextNFT(1);
    }

    function test_MintNextNFT_NotAuthorized() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        vm.expectRevert("Not authorized");
        stakeManager.mintNextNFT(1);
    }

    // ============ Admin Functions Tests ============

    function test_SetNFTFactory() public {
        address newFactory = makeAddr("newFactory");
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit NFTFactorySet(newFactory);
        stakeManager.setNFTFactory(newFactory);
        
        assertEq(stakeManager.nftFactory(), newFactory);
    }

    function test_SetNFTFactory_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        stakeManager.setNFTFactory(address(0x123));
    }

    function test_SetNFTFactory_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Zero address");
        stakeManager.setNFTFactory(address(0));
    }

    function test_SetNFTFactory_Success() public {
        address newFactory = address(0x456);
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit NFTFactorySet(newFactory);
        stakeManager.setNFTFactory(newFactory);
        
        assertEq(stakeManager.nftFactory(), newFactory);
    }

    function test_GetPosition_NonExistent() public {
        MultiStakeManager.Position memory position = stakeManager.getPosition(999);
        assertEq(position.owner, address(0));
        assertEq(position.amount, 0);
        assertEq(position.duration, 0);
        assertFalse(position.isActive);
    }

    function test_GetPosition_Exists() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        MultiStakeManager.Position memory position = stakeManager.getPosition(1);
        assertEq(position.owner, user1);
        assertEq(position.amount, 1000 * 10**18);
        assertEq(position.duration, 180 days);
        assertTrue(position.isActive);
    }

    function test_GetTotalStaked_Empty() public {
        assertEq(stakeManager.getTotalStaked(), 0);
    }

    function test_GetTotalStaked_WithPositions() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        assertEq(stakeManager.getTotalStaked(), 3000 * 10**18);
    }

    function test_GetTotalStaked_AfterClosing() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Close first position
        skip(180 days + 1);
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        assertEq(stakeManager.getTotalStaked(), 2000 * 10**18);
    }

    function test_GetTotalStaked_AfterEmergencyWithdraw() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Emergency withdraw first position
        vm.prank(user1);
        stakeManager.emergencyWithdraw(1);
        
        assertEq(stakeManager.getTotalStaked(), 2000 * 10**18);
    }

    // ============ Edge Cases Tests ============

    function test_CreatePosition_MaxAmount() public {
        uint256 maxAmount = type(uint128).max;
        vm.prank(user1);
        stakeManager.createPosition(maxAmount, 180 days);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.amount, maxAmount);
    }

    function test_CreatePosition_MaxDuration() public {
        uint256 maxDuration = 3650 days;
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, maxDuration);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.duration, maxDuration);
    }

    function test_CreatePosition_MinDuration() public {
        uint256 minDuration = 180 days;
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, minDuration);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.duration, minDuration);
    }

    function test_CreatePosition_ExactMaxPositions() public {
        uint256 amount = 1000 * 10**18;
        uint256 duration = 180 days;
        
        // Create exactly 10 positions
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(user1);
            stakeManager.createPosition(amount, duration);
        }
        
        // Verify we have 10 positions
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 10);
    }

    // ============ Integration Tests ============

    function test_Integration_MultipleUsers() public {
        // User1 creates positions
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // User2 creates positions
        vm.prank(user2);
        stakeManager.createPosition(1500 * 10**18, 547 days);
        
        // Verify total staked
        assertEq(stakeManager.getTotalStaked(), 4500 * 10**18);
        
        // Verify user positions
        uint256[] memory user1Positions = stakeManager.getUserPositions(user1);
        uint256[] memory user2Positions = stakeManager.getUserPositions(user2);
        
        assertEq(user1Positions.length, 2);
        assertEq(user2Positions.length, 1);
    }

    function test_Integration_CloseAndRecreate() public {
        // Create position
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Close position
        skip(180 days + 1);
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        // Create new position
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Verify
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 1);
        assertEq(positions[0], 2);
        
        assertEq(stakeManager.getTotalStaked(), 2000 * 10**18);
    }

    // ============ Fuzz Tests ============

    function testFuzz_CreatePosition(uint256 amount, uint256 duration) public {
        vm.assume(amount > 0 && amount <= type(uint128).max);
        vm.assume(duration >= MIN_STAKE_DURATION && duration <= MAX_STAKE_DURATION);
        
        vm.prank(user1);
        stakeManager.createPosition(amount, duration);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.amount, amount);
        assertEq(position.duration, duration);
        assertTrue(position.isActive);
    }

    function testFuzz_TierCalculation(uint256 duration) public {
        vm.assume(duration >= MIN_STAKE_DURATION && duration <= MAX_STAKE_DURATION);
        
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, duration);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        
        if (duration >= 912 days) {
            assertEq(position.tier, 3); // Platinum
        } else if (duration >= 547 days) {
            assertEq(position.tier, 2); // Gold
        } else if (duration >= 365 days) {
            assertEq(position.tier, 1); // Silver
        } else {
            assertEq(position.tier, 0); // Bronze
        }
    }

    // ============ Calendar Logic Tests ============

    function test_CalendarLogic_LeapYear() public {
        // Test February 29th to March 1st in leap year
        vm.warp(1709251200); // February 29, 2024
        
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward 30 days
        skip(30 days);
        
        vm.prank(address(nftFactory));
        stakeManager.mintNextNFT(1);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.monthIndex, 1);
    }

    function test_CalendarLogic_EndOfMonth() public {
        // Test January 31st to February 28th
        vm.warp(1706745600); // January 31, 2024
        
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward 30 days
        skip(30 days);
        
        vm.prank(address(nftFactory));
        stakeManager.mintNextNFT(1);
        
        MultiStakeManager.Position memory position = stakeManager.positions(1);
        assertEq(position.monthIndex, 1);
    }

    // ============ Invariant Tests ============

    function invariant_TotalStaked() public {
        // This invariant ensures that the total staked amount equals the sum of all active positions
        uint256 totalStaked = 0;
        uint256 nextPositionId = stakeManager._nextPositionId();
        
        for (uint256 i = 1; i < nextPositionId; i++) {
            MultiStakeManager.Position memory position = stakeManager.positions(i);
            if (position.isActive) {
                totalStaked += position.amount;
            }
        }
        
        assertEq(padToken.balanceOf(address(stakeManager)), totalStaked);
    }

    function invariant_PositionOwnership() public {
        // This invariant ensures that each position has a valid owner
        uint256 nextPositionId = stakeManager._nextPositionId();
        
        for (uint256 i = 1; i < nextPositionId; i++) {
            MultiStakeManager.Position memory position = stakeManager.positions(i);
            if (position.isActive) {
                assertTrue(position.owner != address(0));
            }
        }
    }

    // Дополнительные тесты для улучшения branch coverage
    function test_ClosePosition_NotOwner() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        vm.expectRevert("Not position owner");
        stakeManager.closePosition(1);
    }

    function test_ClosePosition_NonExistent() public {
        vm.prank(user1);
        vm.expectRevert("Position not found");
        stakeManager.closePosition(999);
    }

    function test_ClosePosition_AlreadyClosed() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward time
        skip(180 days + 1);
        
        // Close position
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        // Try to close again
        vm.prank(user1);
        vm.expectRevert("Position not active");
        stakeManager.closePosition(1);
    }

    function test_EmergencyWithdraw_NotOwner() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        vm.expectRevert("Not position owner");
        stakeManager.emergencyWithdraw(1);
    }

    function test_EmergencyWithdraw_NonExistent() public {
        vm.prank(user1);
        vm.expectRevert("Position not found");
        stakeManager.emergencyWithdraw(999);
    }

    function test_EmergencyWithdraw_AlreadyClosed() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Fast forward time
        skip(180 days + 1);
        
        // Close position
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        // Try emergency withdraw
        vm.prank(user1);
        vm.expectRevert("Position not active");
        stakeManager.emergencyWithdraw(1);
    }

    function test_EmergencyWithdraw_Contract() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Create a contract address
        address contractAddr = address(0x123);
        vm.etch(contractAddr, bytes(""));
        
        // Try to emergency withdraw as contract
        vm.prank(contractAddr);
        vm.expectRevert("EOA only");
        stakeManager.emergencyWithdraw(1);
    }

    function test_GetUserPositions_Empty() public {
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 0);
    }

    function test_GetUserPositions_WithPositions() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 2);
        assertEq(positions[0], 1);
        assertEq(positions[1], 2);
    }

    function test_GetUserPositions_AfterClosing() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user1);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Close first position
        skip(180 days + 1);
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        uint256[] memory positions = stakeManager.getUserPositions(user1);
        assertEq(positions.length, 1);
        assertEq(positions[0], 2);
    }

    function test_SetNFTFactory_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        stakeManager.setNFTFactory(address(0x123));
    }

    function test_SetNFTFactory_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Zero address");
        stakeManager.setNFTFactory(address(0));
    }

    function test_SetNFTFactory_Success() public {
        address newFactory = address(0x456);
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit NFTFactorySet(newFactory);
        stakeManager.setNFTFactory(newFactory);
        
        assertEq(stakeManager.nftFactory(), newFactory);
    }

    function test_GetPosition_NonExistent() public {
        MultiStakeManager.Position memory position = stakeManager.getPosition(999);
        assertEq(position.owner, address(0));
        assertEq(position.amount, 0);
        assertEq(position.duration, 0);
        assertFalse(position.isActive);
    }

    function test_GetPosition_Exists() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        MultiStakeManager.Position memory position = stakeManager.getPosition(1);
        assertEq(position.owner, user1);
        assertEq(position.amount, 1000 * 10**18);
        assertEq(position.duration, 180 days);
        assertTrue(position.isActive);
    }

    function test_GetTotalStaked_Empty() public {
        assertEq(stakeManager.getTotalStaked(), 0);
    }

    function test_GetTotalStaked_WithPositions() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        assertEq(stakeManager.getTotalStaked(), 3000 * 10**18);
    }

    function test_GetTotalStaked_AfterClosing() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Close first position
        skip(180 days + 1);
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        assertEq(stakeManager.getTotalStaked(), 2000 * 10**18);
    }

    function test_GetTotalStaked_AfterEmergencyWithdraw() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        stakeManager.createPosition(2000 * 10**18, 365 days);
        
        // Emergency withdraw first position
        vm.prank(user1);
        stakeManager.emergencyWithdraw(1);
        
        assertEq(stakeManager.getTotalStaked(), 2000 * 10**18);
    }

    // Дополнительные тесты для покрытия mintNextNFT функции
    function test_MintNextNFT_NotMature() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Try to mint before maturity
        vm.prank(user1);
        vm.expectRevert("Position not mature for next mint");
        stakeManager.mintNextNFT(1);
    }

    function test_MintNextNFT_NotOwner() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        vm.prank(user2);
        vm.expectRevert("Not position owner");
        stakeManager.mintNextNFT(1);
    }

    function test_MintNextNFT_NonExistent() public {
        vm.prank(user1);
        vm.expectRevert("Position not found");
        stakeManager.mintNextNFT(999);
    }

    function test_MintNextNFT_NotActive() public {
        vm.prank(user1);
        stakeManager.createPosition(1000 * 10**18, 180 days);
        
        // Close position
        skip(180 days + 1);
        vm.prank(user1);
        stakeManager.closePosition(1);
        
        // Try to mint
        vm.prank(user1);
        vm.expectRevert("Position not active");
        stakeManager.mintNextNFT(1);
    }
} 