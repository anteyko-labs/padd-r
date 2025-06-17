// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/PADToken.sol";
import "../contracts/MaliciousContract.sol";

contract PADTokenTest is Test {
    PADToken public padToken;
    MaliciousContract public maliciousContract;
    
    address public owner;
    address public user1;
    address public user2;
    address public gnosisSafe;
    
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18;
    uint256 public constant COOLDOWN_PERIOD = 1 hours;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Paused(address account);
    event Unpaused(address account);
    event GnosisSafeSet(address indexed newGnosisSafe);
    event CooldownSet(address indexed account, bool status);
    event CooldownPeriodSet(uint256 newPeriod);

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        gnosisSafe = makeAddr("gnosisSafe");
        
        vm.startPrank(owner);
        padToken = new PADToken();
        maliciousContract = new MaliciousContract();
        vm.stopPrank();
    }

    // ============ Deployment Tests ============

    function test_Deployment() public {
        assertEq(padToken.name(), "PAD Token");
        assertEq(padToken.symbol(), "PAD");
        assertEq(padToken.decimals(), 18);
        assertEq(padToken.totalSupply(), TOTAL_SUPPLY);
        assertEq(padToken.balanceOf(owner), TOTAL_SUPPLY);
        assertEq(padToken.cooldownPeriod(), COOLDOWN_PERIOD);
    }

    function test_InitialRoles() public {
        assertTrue(padToken.hasRole(padToken.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(padToken.hasRole(padToken.PAUSER_ROLE(), owner));
        assertTrue(padToken.hasRole(padToken.ADMIN_ROLE(), owner));
    }

    // ============ Transfer Tests ============

    function test_Transfer() public {
        uint256 amount = 1000 * 10**18;
        
        vm.prank(owner);
        padToken.transfer(user1, amount);
        
        assertEq(padToken.balanceOf(user1), amount);
        assertEq(padToken.balanceOf(owner), TOTAL_SUPPLY - amount);
    }

    function test_Transfer_InsufficientBalance() public {
        uint256 amount = 1000 * 10**18;
        
        vm.prank(user1);
        vm.expectRevert();
        padToken.transfer(user2, amount);
    }

    function test_Transfer_ZeroAmount() public {
        vm.prank(owner);
        padToken.transfer(user1, 0);
        
        assertEq(padToken.balanceOf(user1), 0);
        assertEq(padToken.balanceOf(owner), TOTAL_SUPPLY);
    }

    // ============ Batch Transfer Tests ============

    function test_BatchTransfer() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        
        vm.prank(owner);
        padToken.batchTransfer(recipients, amounts);
        
        assertEq(padToken.balanceOf(user1), amounts[0]);
        assertEq(padToken.balanceOf(user2), amounts[1]);
        assertEq(padToken.balanceOf(owner), TOTAL_SUPPLY - amounts[0] - amounts[1]);
    }

    function test_BatchTransfer_ArrayLengthMismatch() public {
        address[] memory recipients = new address[](1);
        recipients[0] = user1;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        
        vm.prank(owner);
        vm.expectRevert("Arrays length mismatch");
        padToken.batchTransfer(recipients, amounts);
    }

    function test_BatchTransfer_InsufficientBalance() public {
        address[] memory recipients = new address[](1);
        recipients[0] = user1;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = TOTAL_SUPPLY + 1;
        
        vm.prank(owner);
        vm.expectRevert();
        padToken.batchTransfer(recipients, amounts);
    }

    // ============ Pausable Tests ============

    function test_Pause() public {
        vm.prank(owner);
        padToken.pause();
        
        assertTrue(padToken.paused());
    }

    function test_Pause_NonPauser() public {
        vm.prank(user1);
        vm.expectRevert();
        padToken.pause();
    }

    function test_Unpause() public {
        vm.prank(owner);
        padToken.pause();
        
        vm.prank(owner);
        padToken.unpause();
        
        assertFalse(padToken.paused());
    }

    function test_Transfer_WhenPaused() public {
        vm.prank(owner);
        padToken.pause();
        
        vm.prank(owner);
        vm.expectRevert();
        padToken.transfer(user1, 1000 * 10**18);
    }

    function test_BatchTransfer_WhenPaused() public {
        vm.prank(owner);
        padToken.pause();
        
        address[] memory recipients = new address[](1);
        recipients[0] = user1;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 * 10**18;
        
        vm.prank(owner);
        vm.expectRevert();
        padToken.batchTransfer(recipients, amounts);
    }

    // ============ Permit Tests ============

    function test_Permit() public {
        uint256 privateKey = 0xA11CE;
        address signer = vm.addr(privateKey);
        
        // Mint tokens to signer
        vm.prank(owner);
        padToken.transfer(signer, 1000 * 10**18);
        
        address spender = user1;
        uint256 value = 500 * 10**18;
        uint256 nonce = padToken.nonces(signer);
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 domainSeparator = padToken.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(abi.encode(
            keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
            signer,
            spender,
            value,
            nonce,
            deadline
        ));
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        
        padToken.permit(signer, spender, value, deadline, v, r, s);
        
        assertEq(padToken.allowance(signer, spender), value);
    }

    function test_Permit_ExpiredDeadline() public {
        uint256 privateKey = 0xA11CE;
        address signer = vm.addr(privateKey);
        
        address spender = user1;
        uint256 value = 500 * 10**18;
        uint256 nonce = padToken.nonces(signer);
        uint256 deadline = block.timestamp - 1; // Expired
        
        bytes32 domainSeparator = padToken.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(abi.encode(
            keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
            signer,
            spender,
            value,
            nonce,
            deadline
        ));
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        
        vm.expectRevert("ERC20Permit: expired deadline");
        padToken.permit(signer, spender, value, deadline, v, r, s);
    }

    // ============ Cooldown Tests ============

    function test_SetCooldownPeriod() public {
        uint256 newPeriod = 2 hours;
        
        vm.prank(owner);
        padToken.setCooldownPeriod(newPeriod);
        
        assertEq(padToken.cooldownPeriod(), newPeriod);
    }

    function test_SetCooldownPeriod_NonAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        padToken.setCooldownPeriod(2 hours);
    }

    function test_SetCooldownPeriod_ZeroPeriod() public {
        vm.prank(owner);
        vm.expectRevert("Invalid cooldown period");
        padToken.setCooldownPeriod(0);
    }

    function test_SetCooldown() public {
        vm.prank(owner);
        padToken.setCooldown(user1, true);
        
        assertTrue(padToken.hasCooldown(user1));
    }

    function test_SetCooldown_NonAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        padToken.setCooldown(user2, true);
    }

    function test_Transfer_WithCooldown() public {
        // Setup cooldown for user1
        vm.prank(owner);
        padToken.setCooldown(user1, true);
        
        // Transfer tokens to user1
        vm.prank(owner);
        padToken.transfer(user1, 1000 * 10**18);
        
        // First transfer should work
        vm.prank(user1);
        padToken.transfer(user2, 100 * 10**18);
        
        // Second transfer within cooldown should fail
        vm.prank(user1);
        vm.expectRevert("Cooldown period not elapsed");
        padToken.transfer(user2, 100 * 10**18);
        
        // Wait for cooldown period
        skip(COOLDOWN_PERIOD);
        
        // Transfer after cooldown should work
        vm.prank(user1);
        padToken.transfer(user2, 100 * 10**18);
    }

    function test_BatchTransfer_WithCooldown() public {
        // Setup cooldown for user1
        vm.prank(owner);
        padToken.setCooldown(user1, true);
        
        // Transfer tokens to user1
        vm.prank(owner);
        padToken.transfer(user1, 1000 * 10**18);
        
        // First batch transfer should work
        address[] memory recipients = new address[](1);
        recipients[0] = user2;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100 * 10**18;
        
        vm.prank(user1);
        padToken.batchTransfer(recipients, amounts);
        
        // Second batch transfer within cooldown should fail
        vm.prank(user1);
        vm.expectRevert("Cooldown period not elapsed");
        padToken.batchTransfer(recipients, amounts);
    }

    // ============ Admin Functions Tests ============

    function test_SetGnosisSafe() public {
        vm.prank(owner);
        padToken.setGnosisSafe(gnosisSafe);
        
        assertEq(padToken.gnosisSafe(), gnosisSafe);
    }

    function test_SetGnosisSafe_NonAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        padToken.setGnosisSafe(gnosisSafe);
    }

    function test_SetGnosisSafe_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid address");
        padToken.setGnosisSafe(address(0));
    }

    // ============ Fuzz Tests ============

    function testFuzz_Transfer(uint256 amount) public {
        vm.assume(amount > 0 && amount <= TOTAL_SUPPLY);
        
        vm.prank(owner);
        padToken.transfer(user1, amount);
        
        assertEq(padToken.balanceOf(user1), amount);
        assertEq(padToken.balanceOf(owner), TOTAL_SUPPLY - amount);
    }

    function testFuzz_BatchTransfer(uint256 amount1, uint256 amount2) public {
        vm.assume(amount1 > 0 && amount2 > 0);
        vm.assume(amount1 + amount2 <= TOTAL_SUPPLY);
        
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = amount1;
        amounts[1] = amount2;
        
        vm.prank(owner);
        padToken.batchTransfer(recipients, amounts);
        
        assertEq(padToken.balanceOf(user1), amount1);
        assertEq(padToken.balanceOf(user2), amount2);
    }

    function testFuzz_CooldownPeriod(uint256 cooldownPeriod) public {
        vm.assume(cooldownPeriod > 0 && cooldownPeriod <= 24 hours);
        
        vm.prank(owner);
        padToken.setCooldownPeriod(cooldownPeriod);
        
        assertEq(padToken.cooldownPeriod(), cooldownPeriod);
    }

    // ============ Invariant Tests ============

    function invariant_TotalSupply() public {
        assertEq(padToken.totalSupply(), TOTAL_SUPPLY);
    }

    function invariant_BalancesSum() public {
        // This is a simplified invariant - in a real scenario you'd track all balances
        assertLe(padToken.balanceOf(owner), TOTAL_SUPPLY);
    }
} 