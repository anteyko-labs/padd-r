// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PADToken
 * @dev ERC20 + EIP-2612 Permit, batch transfer, pausable (Gnosis Safe + role)
 * Anti-flash-loan protection with cooldown periods
 */
contract PADToken is ERC20, ERC20Permit, Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    address public gnosisSafe;

    // Cooldown period in seconds
    uint256 public cooldownPeriod;
    // Mapping of address to last transfer timestamp
    mapping(address => uint256) public lastTransferTimestamp;
    // Mapping of address to cooldown status
    mapping(address => bool) public hasCooldown;

    event GnosisSafeSet(address indexed newGnosisSafe);
    event CooldownSet(address indexed account, bool status);
    event CooldownPeriodSet(uint256 newPeriod);

    constructor() ERC20("PAD Token", "PAD") ERC20Permit("PAD Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
        cooldownPeriod = 1 hours; // Default cooldown period
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setGnosisSafe(address _gnosisSafe) external onlyRole(ADMIN_ROLE) {
        require(_gnosisSafe != address(0), "Invalid address");
        gnosisSafe = _gnosisSafe;
        emit GnosisSafeSet(_gnosisSafe);
    }

    function setCooldownPeriod(uint256 _cooldownPeriod) external onlyRole(ADMIN_ROLE) {
        require(_cooldownPeriod > 0, "Invalid cooldown period");
        cooldownPeriod = _cooldownPeriod;
        emit CooldownPeriodSet(_cooldownPeriod);
    }

    function setCooldown(address account, bool status) external onlyRole(ADMIN_ROLE) {
        hasCooldown[account] = status;
        emit CooldownSet(account, status);
    }

    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external whenNotPaused {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        // Check cooldown for sender
        if (hasCooldown[msg.sender]) {
            require(block.timestamp >= lastTransferTimestamp[msg.sender] + cooldownPeriod, "Cooldown period not elapsed");
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }

        // Update last transfer timestamp
        lastTransferTimestamp[msg.sender] = block.timestamp;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20) whenNotPaused {
        // Check cooldown for sender
        if (hasCooldown[from]) {
            require(block.timestamp >= lastTransferTimestamp[from] + cooldownPeriod, "Cooldown period not elapsed");
            lastTransferTimestamp[from] = block.timestamp;
        }
        super._update(from, to, value);
    }

    // --- AccessControl override ---
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 