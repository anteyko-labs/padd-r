// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DateUtils.sol";

using DateUtils for uint64;

interface IPADNFTFactory {
    function mintNFT(
        address to,
        uint256 positionId,
        uint256 amountStaked,
        uint256 lockDurationMonths,
        uint256 startTimestamp,
        uint256 monthIndex,
        uint256 nextMintOn
    ) external returns (uint256);
}

/**
 * @title MultiStakeManager
 * @dev Manages multiple staking positions per wallet
 */
contract MultiStakeManager is AccessControl, ReentrancyGuard {
    using DateUtils for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    IERC20 public immutable stakingToken;
    // Минимальные суммы для каждого тира
    uint256 public constant MIN_BRONZE = 1000;
    uint256 public constant MIN_SILVER = 3000;
    uint256 public constant MIN_GOLD = 5000;
    uint256 public constant MIN_PLATINUM = 10000;
    uint256 public constant MIN_STAKE_MONTHS = 3;
    uint256 public constant MAX_STAKE_MONTHS = 12;
    uint256 public constant MAX_POSITIONS_PER_WALLET = 10;
    uint256 public constant REWARD_INTERVAL = 30 minutes; // 30 минут

    uint256 private _nextPositionId = 1; // Start from 1

    // Gas-optimized struct packing
    struct Position {
        uint128 amount;      // Amount of tokens staked (max ~3.4e38)
        uint64 startTime;    // When the position was created
        uint32 duration;     // Duration of stake in seconds (max ~136 years)
        uint32 nextMintAt;   // When the next reward will be minted
        uint8 tier;          // Tier level (0: Bronze, 1: Silver, 2: Gold, 3: Platinum)
        uint8 monthIndex;    // Current month index for rewards
        bool isActive;       // Whether the position is active
        address owner;       // Owner of the position
    }

    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositions;
    mapping(uint256 => uint256) public positionIndexInUserArray;

    event PositionCreated(uint256 indexed positionId, address indexed owner, uint256 amount, uint256 duration);
    event PositionClosed(uint256 indexed positionId, address indexed owner, uint256 amount, uint256 reward);
    event EmergencyWithdrawn(uint256 indexed positionId, address indexed owner, uint256 amount);
    event NFTFactorySet(address indexed newNFTFactory);

    address public nftFactory;

    constructor(address _stakingToken) {
        require(_stakingToken != address(0), "Zero address");
        stakingToken = IERC20(_stakingToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createPosition(uint256 amount, uint256 months) external nonReentrant {
        require(amount > 0, "Zero amount");
        require(months >= MIN_STAKE_MONTHS, "Stake too short");
        require(months <= MAX_STAKE_MONTHS, "Stake too long");
        require(userPositions[msg.sender].length < MAX_POSITIONS_PER_WALLET, "Too many positions");
        require(amount <= type(uint128).max, "Amount too large");

        // Определяем тир по сроку и сумме
        uint8 tier;
        if (months >= 12 && amount >= MIN_PLATINUM) {
            tier = 3; // Platinum
        } else if (months >= 9 && amount >= MIN_GOLD) {
            tier = 2; // Gold
        } else if (months >= 6 && amount >= MIN_SILVER) {
            tier = 1; // Silver
        } else if (months >= 3 && amount >= MIN_BRONZE) {
            tier = 0; // Bronze
        } else {
            revert("Not enough amount or months for any tier");
        }

        uint256 positionId = _nextPositionId++;
        uint256 startTime = block.timestamp;
        uint256 duration = months * 30 days;
        positions[positionId] = Position({
            amount: uint128(amount),
            startTime: uint64(startTime),
            duration: uint32(duration),
            nextMintAt: uint32(startTime + duration),
            tier: uint8(tier),
            monthIndex: 0,
            isActive: true,
            owner: msg.sender
        });
        userPositions[msg.sender].push(positionId);
        positionIndexInUserArray[positionId] = userPositions[msg.sender].length - 1;
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit PositionCreated(positionId, msg.sender, amount, duration);
        if (nftFactory != address(0)) {
            IPADNFTFactory(nftFactory).mintNFT(
                msg.sender,
                positionId,
                amount,
                months,
                startTime,
                0,
                startTime + duration
            );
        }
    }

    function closePosition(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(position.owner == msg.sender, "Not position owner");
        require(block.timestamp >= position.startTime + position.duration, "Position not mature");

        uint256 amount = position.amount;
        // Удаляю функцию calculateRewards и все упоминания о наградах/процентах
        position.isActive = false;

        removePositionFromUser(positionId);

        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");

        emit PositionClosed(positionId, msg.sender, amount, 0); // Removed reward from event
    }

    function emergencyWithdraw(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(position.owner == msg.sender, "Not position owner");
        require(msg.sender == tx.origin, "Only EOA");

        uint256 amount = position.amount;
        position.isActive = false;

        removePositionFromUser(positionId);

        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");

        emit EmergencyWithdrawn(positionId, msg.sender, amount);
    }

    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    // Удаляю функцию calculateRewards и все упоминания о наградах/процентах

    function removePositionFromUser(uint256 positionId) internal {
        Position storage position = positions[positionId];
        uint256[] storage userPositionsArray = userPositions[position.owner];
        uint256 index = positionIndexInUserArray[positionId];
        
        // If not the last position, swap with last
        if (index != userPositionsArray.length - 1) {
            uint256 lastPositionId = userPositionsArray[userPositionsArray.length - 1];
            userPositionsArray[index] = lastPositionId;
            positionIndexInUserArray[lastPositionId] = index;
        }
        
        userPositionsArray.pop();
        delete positionIndexInUserArray[positionId];
    }

    function setNFTFactory(address _nftFactory) external onlyRole(ADMIN_ROLE) {
        require(_nftFactory != address(0), "Zero address");
        nftFactory = _nftFactory;
        emit NFTFactorySet(_nftFactory);
    }

    /**
     * @dev Mint next NFT for a position (called by TierMonitor or user)
     * @param positionId ID of the position
     */
    function mintNextNFT(uint256 positionId) external {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(block.timestamp >= position.nextMintAt, "Too early for next NFT");
        require(position.monthIndex < (position.duration / REWARD_INTERVAL), "All NFTs minted");
        // Mint NFT
        if (nftFactory != address(0)) {
            IPADNFTFactory(nftFactory).mintNFT(
                position.owner,
                positionId,
                position.amount,
                position.duration / 1 hours, // lockDurationHours
                position.startTime,
                position.monthIndex + 1,
                position.nextMintAt + REWARD_INTERVAL
            );
        }
        position.monthIndex += 1;
        position.nextMintAt += uint32(REWARD_INTERVAL);
    }
} 