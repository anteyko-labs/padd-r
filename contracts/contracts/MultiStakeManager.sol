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
    uint256 public constant MIN_STAKE_MONTHS = 3;
    uint256 public constant MAX_STAKE_MONTHS = 12;
    uint256 public constant MAX_POSITIONS_PER_WALLET = 10;
    uint256 public constant REWARD_INTERVAL = 30 days; // 1 месяц

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
    event DebugLog(string message, uint256 value);

    address public nftFactory;
    address public tierCalculator;

    constructor(address _stakingToken, address _tierCalculator) {
        require(_stakingToken != address(0), "Zero address");
        require(_tierCalculator != address(0), "Zero tierCalculator");
        stakingToken = IERC20(_stakingToken);
        tierCalculator = _tierCalculator;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createPosition(uint256 amount, uint256 months) external nonReentrant {
        emit DebugLog("START createPosition", amount);
        require(amount >= 1000 * 1e18, "Min 1000 tokens");
        require(months == 3 || months == 6 || months == 9 || months == 12, "Invalid months");
        require(userPositions[msg.sender].length < MAX_POSITIONS_PER_WALLET, "Too many positions");
        require(amount <= type(uint128).max, "Amount too large");
        require(stakingToken.balanceOf(msg.sender) >= amount, "Not enough balance");
        require(stakingToken.allowance(msg.sender, address(this)) >= amount, "Not enough allowance");
        if (address(stakingToken).code.length > 0) {
            (bool ok, bytes memory data) = address(stakingToken).staticcall(abi.encodeWithSignature("paused()"));
            if (ok && data.length == 32) {
                require(!abi.decode(data, (bool)), "Token is paused");
            }
        }
        emit DebugLog("Passed all require checks", amount);

        uint256 positionId = _nextPositionId++;
        uint256 startTime = block.timestamp;
        uint256 duration = months * 30 days;

        // Получаем tier через TierCalculator
        (bool ok, bytes memory data) = address(tierCalculator).staticcall(abi.encodeWithSignature("getTier(uint256,uint256)", months, amount));
        require(ok, "TierCalculator call failed");
        uint8 tier = abi.decode(data, (uint8));

        uint256 interval = REWARD_INTERVAL;
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
                months,
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
                position.duration / 30 days, // lockDurationMonths
                position.startTime,
                position.monthIndex + 1,
                position.nextMintAt + REWARD_INTERVAL
            );
        }
        position.monthIndex += 1;
        position.nextMintAt += uint32(REWARD_INTERVAL);
    }
} 