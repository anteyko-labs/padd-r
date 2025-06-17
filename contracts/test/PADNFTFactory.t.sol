// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/PADNFTFactory.sol";
import "../contracts/TierCalculator.sol";

contract PADNFTFactoryTest is Test {
    PADNFTFactory public factory;
    TierCalculator public calculator;
    address public stakeManager = address(0xBEEF);
    address public user = address(0xCAFE);

    function setUp() public {
        calculator = new TierCalculator();
        factory = new PADNFTFactory(stakeManager, address(calculator));
    }

    function test_SetBaseURI() public {
        string memory uri = "ipfs://base/";
        factory.setBaseURI(uri);
        // Проверяем через публичный метод (если есть)
        // Если нет - проверяем через tokenURI после mint
    }

    function test_MintNFT_BronzeSoulbound() public {
        uint256 tokenId = factory.mintNFT(user, 1, 1000, 6, block.timestamp, 0, block.timestamp + 30 days);
        assertEq(factory.ownerOf(tokenId), user);
        assertEq(factory.nftMetadata(tokenId).tierLevel, 0); // Bronze
        // Soulbound: нельзя перевести
        vm.expectRevert("Soul-bound: only Gold/Platinum transferable");
        factory.transferFrom(user, address(0x1234), tokenId);
    }

    function test_MintNFT_GoldTransferable() public {
        uint256 tokenId = factory.mintNFT(user, 2, 1000, 18, block.timestamp, 0, block.timestamp + 30 days);
        assertEq(factory.ownerOf(tokenId), user);
        assertEq(factory.nftMetadata(tokenId).tierLevel, 2); // Gold
        // Можно перевести
        vm.prank(user);
        factory.transferFrom(user, address(0x1234), tokenId);
        assertEq(factory.ownerOf(tokenId), address(0x1234));
    }

    function test_TokenURI() public {
        factory.setBaseURI("ipfs://base/");
        uint256 tokenId = factory.mintNFT(user, 3, 1000, 18, block.timestamp, 0, block.timestamp + 30 days);
        string memory uri = factory.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }
} 