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
    uint256 public constant MIN_STAKE_DURATION = 180 days; // 6 months
    uint256 public constant MAX_STAKE_DURATION = 3650 days; // 10 years
    uint256 public constant MAX_POSITIONS_PER_WALLET = 10;
    uint256 public constant REWARD_INTERVAL = 30 days;      // 30 days

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

    function createPosition(uint256 amount, uint256 duration) external nonReentrant {
        require(amount > 0, "Zero amount");
        require(duration >= MIN_STAKE_DURATION, "Duration too short");
        require(duration <= MAX_STAKE_DURATION, "Duration too long");
        require(userPositions[msg.sender].length < MAX_POSITIONS_PER_WALLET, "Too many positions");
        require(amount <= type(uint128).max, "Amount too large");

        uint256 positionId = _nextPositionId++;
        uint256 startTime = block.timestamp;

        // Calculate tier based on duration
        uint256 tier;
        if (duration >= 912 days) { // 30 months
            tier = 3; // Platinum
        } else if (duration >= 547 days) { // 18 months
            tier = 2; // Gold
        } else if (duration >= 365 days) { // 12 months
            tier = 1; // Silver
        } else {
            tier = 0; // Bronze
        }

        uint256 numMints = getNumMints(duration);
        uint256 interval = getMintInterval(duration);
        positions[positionId] = Position({
            amount: uint128(amount),
            startTime: uint64(startTime),
            duration: uint32(duration),
            nextMintAt: uint32(startTime + interval),
            tier: uint8(tier),
            monthIndex: 0,
            isActive: true,
            owner: msg.sender
        });

        userPositions[msg.sender].push(positionId);
        positionIndexInUserArray[positionId] = userPositions[msg.sender].length - 1;

        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        emit PositionCreated(positionId, msg.sender, amount, duration);

        // Mint NFT if factory is set
        if (nftFactory != address(0)) {
            IPADNFTFactory(nftFactory).mintNFT(
                msg.sender,
                positionId,
                amount,
                numMints,
                startTime,
                0,
                startTime + interval
            );
        }
    }

    function closePosition(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(position.owner == msg.sender, "Not position owner");
        require(block.timestamp >= position.startTime + position.duration, "Position not mature");

        uint256 amount = position.amount;
        uint256 reward = calculateRewards(positionId);
        position.isActive = false;

        removePositionFromUser(positionId);

        require(stakingToken.transfer(msg.sender, amount + reward), "Transfer failed");

        emit PositionClosed(positionId, msg.sender, amount, reward);
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

    function calculateRewards(uint256 positionId) public view returns (uint256) {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        
        // Calculate rewards based on tier and monthIndex
        uint256 baseReward = position.amount * position.tier / 100; // 1% per tier
        return baseReward * position.monthIndex;
    }

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
     * @dev Mint next NFT for a position (called by TierMonitor)
     * @param positionId ID of the position
     */
    function mintNextNFT(uint256 positionId) external {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(block.timestamp >= position.nextMintAt, "Too early");
        require(msg.sender == nftFactory || msg.sender == address(this), "Not authorized");
        uint256 numMints = getNumMints(position.duration);
        uint256 interval = getMintInterval(position.duration);
        uint256 nextMintAt = position.startTime + interval * (position.monthIndex + 1);
        require(nextMintAt <= position.startTime + position.duration, "Position expired");
        position.monthIndex++;
        position.nextMintAt = uint32(position.startTime + interval * (position.monthIndex + 1));
        if (nftFactory != address(0)) {
            IPADNFTFactory(nftFactory).mintNFT(
                position.owner,
                positionId,
                position.amount,
                numMints,
                position.startTime,
                position.monthIndex,
                position.nextMintAt
            );
        }
    }

    // Новый: вычисление количества минтов и интервала
    function getNumMints(uint256 duration) public pure returns (uint256) {
        return (duration * 12) / 365 days;
    }
    function getMintInterval(uint256 duration) public pure returns (uint256) {
        uint256 numMints = getNumMints(duration);
        require(numMints > 0, "Duration too short");
        return duration / numMints;
    }
} 