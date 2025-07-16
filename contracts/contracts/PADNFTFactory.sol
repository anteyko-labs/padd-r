// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface ITierCalculator {
    function getTier(uint256 duration) external pure returns (uint8);
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
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;

    // Храним image URI для каждого тира
    mapping(uint8 => string) public tierImageURIs;

    event BaseURISet(string newBaseURI);
    event NFTMinted(address indexed to, uint256 indexed tokenId, NFTMetadata meta); // Фронт может слушать это событие для отображения новых NFT
    event TierImageURISet(uint8 indexed tier, string uri);

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
        uint256 lockDurationHours,
        uint256 startTimestamp,
        uint256 hourIndex,
        uint256 nextMintOn
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint8 tier = ITierCalculator(tierCalculator).getTier(lockDurationHours * 1 hours);
        uint256 tokenId = _nextTokenId();
        _safeMint(to, 1);
        nftMetadata[tokenId] = NFTMetadata({
            positionId: positionId,
            amountStaked: amountStaked,
            lockDurationHours: lockDurationHours,
            startTimestamp: startTimestamp,
            tierLevel: tier,
            hourIndex: hourIndex,
            nextMintOn: nextMintOn
        });
        emit NFTMinted(to, tokenId, nftMetadata[tokenId]);
        return tokenId;
    }

    function setTierImage(uint8 tier, string calldata uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tier < 4, "Invalid tier");
        tierImageURIs[tier] = uri;
        emit TierImageURISet(tier, uri);
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
        NFTMetadata memory meta = nftMetadata[tokenId];
        string memory imagePath = tierImageURIs[meta.tierLevel];
        if (bytes(imagePath).length == 0) {
            imagePath = "unknown.png";
        }
        string memory json = string(abi.encodePacked(
            '{',
                '"name":"PAD NFT Tier ', Strings.toString(meta.tierLevel), '",',
                '"description":"PAD NFT with tier utility.",',
                '"image":"', imagePath, '"',
            '}'
        ));
        string memory encoded = _base64(bytes(json));
        return string(abi.encodePacked("data:application/json;base64,", encoded));
    }

    // Вспомогательная функция для base64
    function _base64(bytes memory data) internal pure returns (string memory) {
        string memory TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";
        // base64 size
        uint256 encodedLen = 4 * ((len + 2) / 3);
        string memory result = new string(encodedLen + 32);
        assembly {
            mstore(result, encodedLen)
            let tablePtr := add(TABLE, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, len)
            let resultPtr := add(result, 32)
            for {} lt(dataPtr, endPtr) {}
            {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            switch mod(len, 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
        }
        return result;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721A, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
