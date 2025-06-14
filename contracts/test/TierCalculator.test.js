const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TierCalculator", function () {
    let tierCalculator;
    let multiStakeManager;
    let padToken;
    let owner;
    let user1;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy PADToken
        const PADToken = await ethers.getContractFactory("PADToken");
        padToken = await PADToken.deploy();

        // Deploy MultiStakeManager
        const MultiStakeManager = await ethers.getContractFactory("MultiStakeManager");
        multiStakeManager = await MultiStakeManager.deploy(await padToken.getAddress());

        // Deploy TierCalculator
        const TierCalculator = await ethers.getContractFactory("TierCalculator");
        tierCalculator = await TierCalculator.deploy();

        // Mint tokens for user
        await padToken.transfer(user1.address, ethers.parseEther("1000000"));
        await padToken.connect(user1).approve(await multiStakeManager.getAddress(), ethers.parseEther("1000000"));
    });

    describe("Tier Calculation", function () {
        it("Should revert for duration less than 6 months", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 179 * 24 * 60 * 60; // 179 days

            await expect(multiStakeManager.connect(user1).createPosition(amount, duration))
                .to.be.revertedWith("Duration too short");
        });

        it("Should set Bronze tier for 6 months", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            await multiStakeManager.connect(user1).createPosition(amount, duration);
            const position = await multiStakeManager.positions(1);
            expect(position.tier).to.equal(0); // Bronze tier
        });

        it("Should set Silver tier for 12 months", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 365 * 24 * 60 * 60; // 365 days

            await multiStakeManager.connect(user1).createPosition(amount, duration);
            const position = await multiStakeManager.positions(1);
            expect(position.tier).to.equal(1); // Silver tier
        });

        it("Should set Gold tier for 18 months", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 547 * 24 * 60 * 60; // 547 days

            await multiStakeManager.connect(user1).createPosition(amount, duration);
            const position = await multiStakeManager.positions(1);
            expect(position.tier).to.equal(2); // Gold tier
        });

        it("Should set Platinum tier for 30 months", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 912 * 24 * 60 * 60; // 912 days

            await multiStakeManager.connect(user1).createPosition(amount, duration);
            const position = await multiStakeManager.positions(1);
            expect(position.tier).to.equal(3); // Platinum tier
        });

        it("Should set Platinum tier for more than 30 months", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 1000 * 24 * 60 * 60; // 1000 days

            await multiStakeManager.connect(user1).createPosition(amount, duration);
            const position = await multiStakeManager.positions(1);
            expect(position.tier).to.equal(3); // Platinum tier
        });
    });
}); 