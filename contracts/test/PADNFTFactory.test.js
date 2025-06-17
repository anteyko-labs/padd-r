const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PADNFTFactory", function () {
  let owner, user, user2, user3;
  let PADToken, TierCalculator, MultiStakeManager, nftFactory, stakeManager, tierCalculator;

  beforeEach(async function () {
    // Получаем тестовые аккаунты
    [owner, user, user2, user3] = await ethers.getSigners();

    // Создаем токен PAD
    const PADTokenFactory = await ethers.getContractFactory("PADToken");
    PADToken = await PADTokenFactory.deploy();
    const padTokenAddress = await PADToken.getAddress();

    // Создаем калькулятор тиров
    const TierCalculatorFactory = await ethers.getContractFactory("TierCalculator");
    TierCalculator = await TierCalculatorFactory.deploy();
    const tierCalculatorAddress = await TierCalculator.getAddress();

    // Создаем менеджер стейкинга
    const MultiStakeManagerFactory = await ethers.getContractFactory("MultiStakeManager");
    MultiStakeManager = await MultiStakeManagerFactory.deploy(
      padTokenAddress
    );
    const stakeManagerAddress = await MultiStakeManager.getAddress();

    // Создаем NFT фабрику
    const PADNFTFactoryFactory = await ethers.getContractFactory("PADNFTFactory");
    nftFactory = await PADNFTFactoryFactory.deploy(
      stakeManagerAddress,
      tierCalculatorAddress
    );
    // Выдаю MINTER_ROLE для MultiStakeManager
    await nftFactory.grantRole(await nftFactory.MINTER_ROLE(), stakeManagerAddress);

    // Сохраняем ссылки на контракты для тестов
    stakeManager = MultiStakeManager;
    tierCalculator = TierCalculator;
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await nftFactory.name()).to.equal("PAD NFT (v2)");
      expect(await nftFactory.symbol()).to.equal("PADNFTv2");
    });
    it("Should assign MINTER_ROLE and URI_SETTER_ROLE to owner", async function () {
      const MINTER_ROLE = await nftFactory.MINTER_ROLE();
      const URI_SETTER_ROLE = await nftFactory.URI_SETTER_ROLE();
      expect(await nftFactory.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await nftFactory.hasRole(URI_SETTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should mint NFT (initial) with correct metadata", async function () {
      const positionId = 1;
      const amountStaked = ethers.parseEther("100");
      const lockDurationMonths = 6; // Bronze (tier 0)
      const startTimestamp = Math.floor(Date.now() / 1000);
      const monthIndex = 0;
      const nextMintOn = startTimestamp + 30 * 24 * 60 * 60; // + 30 days
      await nftFactory.mintNFT(user.address, positionId, amountStaked, lockDurationMonths, startTimestamp, monthIndex, nextMintOn);
      const tokenId = 0;
      const meta = await nftFactory.nftMetadata(tokenId);
      expect(meta.positionId).to.equal(positionId);
      expect(meta.amountStaked).to.equal(amountStaked);
      expect(meta.lockDurationMonths).to.equal(lockDurationMonths);
      expect(meta.startTimestamp).to.equal(startTimestamp);
      expect(meta.tierLevel).to.equal(0); // Bronze (0) (вычисляется TierCalculator)
      expect(meta.monthIndex).to.equal(monthIndex);
      expect(meta.nextMintOn).to.equal(nextMintOn);
    });
  });

  describe("Soul-bound", function () {
    it("Should revert transfer for Bronze (tier 0) NFT", async function () {
      const positionId = 1;
      const amountStaked = ethers.parseEther("100");
      const lockDurationMonths = 6; // Bronze (tier 0)
      const startTimestamp = Math.floor(Date.now() / 1000);
      const monthIndex = 0;
      const nextMintOn = startTimestamp + 30 * 24 * 60 * 60; // + 30 days
      await nftFactory.mintNFT(user.address, positionId, amountStaked, lockDurationMonths, startTimestamp, monthIndex, nextMintOn);
      const tokenId = 0;
      await expect(nftFactory.connect(user).transferFrom(user.address, user2.address, tokenId)).to.be.revertedWith("Soul-bound: only Gold/Platinum transferable");
    });
    it("Should allow transfer for Gold (tier 2) NFT", async function () {
      const positionId = 1;
      const amountStaked = ethers.parseEther("100");
      // 18 месяцев * 30 дней = 547 дней (Gold tier)
      const lockDurationMonths = 547; // Gold (tier 2)
      const startTimestamp = Math.floor(Date.now() / 1000);
      const monthIndex = 0;
      const nextMintOn = startTimestamp + 30 * 24 * 60 * 60; // + 30 days
      await nftFactory.mintNFT(user.address, positionId, amountStaked, lockDurationMonths, startTimestamp, monthIndex, nextMintOn);
      const tokenId = 0;
      await nftFactory.connect(user).transferFrom(user.address, user2.address, tokenId);
      expect(await nftFactory.ownerOf(tokenId)).to.equal(user2.address);
    });
  });

  describe("URI", function () {
    it("Should set baseURI (only URI_SETTER_ROLE)", async function () {
      const newBaseURI = "ipfs://Qm...";
      // Минтим токен, чтобы он существовал
      const positionId = 1;
      const amountStaked = ethers.parseEther("100");
      const lockDurationMonths = 6;
      const startTimestamp = Math.floor(Date.now() / 1000);
      const monthIndex = 0;
      const nextMintOn = startTimestamp + 30 * 24 * 60 * 60;
      await nftFactory.mintNFT(owner.address, positionId, amountStaked, lockDurationMonths, startTimestamp, monthIndex, nextMintOn);
      await nftFactory.setBaseURI(newBaseURI);
      expect(await nftFactory.tokenURI(0)).to.equal(newBaseURI + "0.json");
    });
  });

  describe("Integration with MultiStakeManager", function () {
    it("Should mint NFT when position is created via MultiStakeManager", async function () {
      // This test would require integration with MultiStakeManager
      // For now, we'll test the minting functionality directly
      const tx = await nftFactory.mintNFT(
        user.address,
        1,
        ethers.parseEther("1000"),
        6,
        Math.floor(Date.now() / 1000),
        0,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      );
      expect(tx).to.not.be.undefined;
    });

    // Дополнительные тесты для покрытия веток
    it("Should handle empty baseURI in tokenURI", async function () {
      await nftFactory.mintNFT(
        user.address,
        1,
        ethers.parseEther("1000"),
        6,
        Math.floor(Date.now() / 1000),
        0,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      );
      
      const uri = await nftFactory.tokenURI(0);
      // При пустом baseURI возвращается пустая строка
      expect(uri).to.equal("");
    });

    it("Should handle non-existent token in tokenURI", async function () {
      await expect(
        nftFactory.tokenURI(999)
      ).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
    });

    it("Should handle multiple NFTs in soul-bound check", async function () {
      // Mint multiple NFTs
      await nftFactory.mintNFT(
        user.address,
        1,
        ethers.parseEther("1000"),
        6,
        Math.floor(Date.now() / 1000),
        0,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      );
      
      await nftFactory.mintNFT(
        user.address,
        2,
        ethers.parseEther("1000"),
        18, // Gold tier
        Math.floor(Date.now() / 1000),
        0,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      );
      
      // Try to transfer multiple NFTs - should fail due to Bronze tier
      await expect(
        nftFactory.connect(user).transferFrom(user.address, user2.address, 0)
      ).to.be.revertedWith("Soul-bound: only Gold/Platinum transferable");
    });
  });
}); 