// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface ITierCalculator {
    function getTier(uint256 months, uint256 amount) external view returns (uint8);
}

contract PADNFTFactory is ERC721A, AccessControl {
    using Strings for uint256;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string private _baseTokenURI;
    address public stakeManager;
    address public tierCalculator;

    struct NFTMetadata {
        uint256 positionId;
        uint256 amountStaked;
        uint256 lockDurationHours;
        uint256 startTimestamp;
        uint8 tierLevel;
        uint256 hourIndex;
        uint256 nextMintOn;
        bool isInitialStakingNFT; // Новое поле: true если NFT за начало стейкинга
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;

    event BaseURISet(string newBaseURI);
    event NFTMinted(address indexed to, uint256 indexed tokenId, NFTMetadata meta); // Фронт может слушать это событие для отображения новых NFT

    constructor(address _stakeManager, address _tierCalculator) ERC721A("PAD NFT (v2)", "PADNFTv2") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        stakeManager = _stakeManager;
        tierCalculator = _tierCalculator;
    }

    function setBaseURI(string memory newBaseURI) external onlyRole(URI_SETTER_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURISet(newBaseURI);
    }

    function mintNFT(
        address to,
        uint256 positionId,
        uint256 amountStaked,
        uint256 lockDurationMonths,
        uint256 startTimestamp,
        uint256 monthIndex,
        uint256 nextMintOn,
        bool isInitialStakingNFT
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint8 tier = ITierCalculator(tierCalculator).getTier(lockDurationMonths, amountStaked);
        uint256 tokenId = _nextTokenId();
        _safeMint(to, 1);
        nftMetadata[tokenId] = NFTMetadata({
            positionId: positionId,
            amountStaked: amountStaked,
            lockDurationHours: lockDurationMonths, // Переименовать в lockDurationMonths если нужно
            startTimestamp: startTimestamp,
            tierLevel: tier,
            hourIndex: monthIndex, // Переименовать в monthIndex если нужно
            nextMintOn: nextMintOn,
            isInitialStakingNFT: isInitialStakingNFT
        });
        emit NFTMinted(to, tokenId, nftMetadata[tokenId]);
        return tokenId;
    }

    // Soul-bound: Bronze/Silver (tier 0/1) нельзя переводить, Gold/Platinum (tier 2/3) можно
    function _beforeTokenTransfers(address from, address to, uint256 startTokenId, uint256 quantity) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < quantity; i++) {
                uint8 tier = nftMetadata[startTokenId + i].tierLevel;
                require(tier >= 2, "Soul-bound: only Gold/Platinum transferable");
            }
        }
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory base = _baseURI();
        return bytes(base).length > 0 ? string(abi.encodePacked(base, tokenId.toString(), ".json")) : "";
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721A, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
