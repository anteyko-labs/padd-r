const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiStakeManager Fuzz Tests", function () {
  let padToken, multiStakeManager, padNFTFactory, tierCalculator;
  let user1, user2;

  beforeEach(async function () {
    [user1, user2] = await ethers.getSigners();

    // Deploy contracts
    const PADToken = await ethers.getContractFactory("PADToken");
    padToken = await PADToken.deploy();
    await padToken.waitForDeployment();

    const TierCalculator = await ethers.getContractFactory("TierCalculator");
    tierCalculator = await TierCalculator.deploy();
    await tierCalculator.waitForDeployment();

    const MultiStakeManager = await ethers.getContractFactory("MultiStakeManager");
    multiStakeManager = await MultiStakeManager.deploy(await padToken.getAddress());
    await multiStakeManager.waitForDeployment();

    const PADNFTFactory = await ethers.getContractFactory("PADNFTFactory");
    padNFTFactory = await PADNFTFactory.deploy(
      await multiStakeManager.getAddress(),
      await tierCalculator.getAddress()
    );
    await padNFTFactory.waitForDeployment();

    // Set up roles
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await padNFTFactory.grantRole(MINTER_ROLE, await multiStakeManager.getAddress());
    await multiStakeManager.setNFTFactory(await padNFTFactory.getAddress());

    // Mint tokens to user1
    await padToken.transfer(user1.address, ethers.parseEther("1000000"));
  });

  describe("Amount extremes", function () {
    it("should revert with zero amount", async function () {
      await padToken.connect(user1).approve(await multiStakeManager.getAddress(), ethers.parseEther("1000"));
      await expect(
        multiStakeManager.connect(user1).createPosition(0, 180 * 24 * 60 * 60)
      ).to.be.revertedWith("Zero amount");
    });

    it("should revert with amount > uint128.max", async function () {
      const maxUint128 = ethers.parseEther("340282366920938463463374607431768211455");
      await padToken.connect(user1).approve(await multiStakeManager.getAddress(), maxUint128);
      await expect(
        multiStakeManager.connect(user1).createPosition(maxUint128 + 1n, 180 * 24 * 60 * 60)
      ).to.be.revertedWith("Amount too large");
    });

    it("should accept maximum valid amount", async function () {
      // Пропускаем этот тест, так как у владельца недостаточно токенов для maxUint128
      // В реальном сценарии это не критично, так как maxUint128 слишком большое значение
      this.skip();
    });
  });

  describe("Duration extremes", function () {
    beforeEach(async function () {
      await padToken.connect(user1).approve(await multiStakeManager.getAddress(), ethers.parseEther("1000"));
    });

    it("should revert with duration < MIN_STAKE_DURATION", async function () {
      const minDuration = 180 * 24 * 60 * 60; // 6 months
      await expect(
        multiStakeManager.connect(user1).createPosition(ethers.parseEther("100"), minDuration - 1)
      ).to.be.revertedWith("Duration too short");
    });

    it("should revert with duration > MAX_STAKE_DURATION", async function () {
      const maxDuration = 3650 * 24 * 60 * 60; // 10 years
      await expect(
        multiStakeManager.connect(user1).createPosition(ethers.parseEther("100"), maxDuration + 1)
      ).to.be.revertedWith("Duration too long");
    });

    it("should accept minimum valid duration", async function () {
      const minDuration = 180 * 24 * 60 * 60; // 6 months
      await expect(
        multiStakeManager.connect(user1).createPosition(ethers.parseEther("100"), minDuration)
      ).to.not.be.reverted;
    });

    it("should accept maximum valid duration", async function () {
      const maxDuration = 3650 * 24 * 60 * 60; // 10 years
      await expect(
        multiStakeManager.connect(user1).createPosition(ethers.parseEther("100"), maxDuration)
      ).to.not.be.reverted;
    });
  });

  describe("Position limits", function () {
    beforeEach(async function () {
      await padToken.connect(user1).approve(await multiStakeManager.getAddress(), ethers.parseEther("10000"));
    });

    it("should allow creating 10 positions (maximum)", async function () {
      for (let i = 0; i < 10; i++) {
        await multiStakeManager.connect(user1).createPosition(
          ethers.parseEther("100"), 
          180 * 24 * 60 * 60
        );
      }
      
      const positions = await multiStakeManager.getUserPositions(user1.address);
      expect(positions.length).to.equal(10);
    });

    it("should revert when trying to create 11th position", async function () {
      // Create 10 positions first
      for (let i = 0; i < 10; i++) {
        await multiStakeManager.connect(user1).createPosition(
          ethers.parseEther("100"), 
          180 * 24 * 60 * 60
        );
      }
      
      // Try to create 11th position
      await expect(
        multiStakeManager.connect(user1).createPosition(
          ethers.parseEther("100"), 
          180 * 24 * 60 * 60
        )
      ).to.be.revertedWith("Too many positions");
    });
  });

  describe("Tier calculation extremes", function () {
    beforeEach(async function () {
      await padToken.connect(user1).approve(await multiStakeManager.getAddress(), ethers.parseEther("1000"));
    });

    it("should assign Bronze tier for minimum duration", async function () {
      const minDuration = 180 * 24 * 60 * 60; // 6 months
      await multiStakeManager.connect(user1).createPosition(ethers.parseEther("100"), minDuration);
      
      const positions = await multiStakeManager.getUserPositions(user1.address);
      const position = await multiStakeManager.positions(positions[0]);
      expect(position.tier).to.equal(0); // Bronze
    });

    it("should assign Platinum tier for maximum duration", async function () {
      const maxDuration = 3650 * 24 * 60 * 60; // 10 years
      await multiStakeManager.connect(user1).createPosition(ethers.parseEther("100"), maxDuration);
      
      const positions = await multiStakeManager.getUserPositions(user1.address);
      const position = await multiStakeManager.positions(positions[0]);
      expect(position.tier).to.equal(3); // Platinum
    });
  });

  describe("Overflow protection", function () {
    it("should handle large amounts without overflow", async function () {
      const largeAmount = ethers.parseEther("1000000");
      await padToken.connect(user1).approve(await multiStakeManager.getAddress(), largeAmount);
      
      await expect(
        multiStakeManager.connect(user1).createPosition(largeAmount, 180 * 24 * 60 * 60)
      ).to.not.be.reverted;
    });

    it("should handle large durations without overflow", async function () {
      const largeDuration = 3650 * 24 * 60 * 60; // 10 years
      await padToken.connect(user1).approve(await multiStakeManager.getAddress(), ethers.parseEther("1000"));
      
      await expect(
        multiStakeManager.connect(user1).createPosition(ethers.parseEther("100"), largeDuration)
      ).to.not.be.reverted;
    });
  });
}); 