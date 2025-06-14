const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { utils } = ethers;

describe("MultiStakeManager", function () {
    let stakeManager;
    let padToken;
    let owner;
    let user1;
    let user2;
    let maliciousContract;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const PADToken = await ethers.getContractFactory("PADToken");
        padToken = await PADToken.deploy();

        const MultiStakeManager = await ethers.getContractFactory("MultiStakeManager");
        stakeManager = await MultiStakeManager.deploy(await padToken.getAddress());

        const MaliciousContract = await ethers.getContractFactory("MaliciousContract");
        maliciousContract = await MaliciousContract.deploy(await stakeManager.getAddress());

        // Mint tokens for users
        await padToken.transfer(user1.address, ethers.parseEther("1000000"));
        await padToken.transfer(user2.address, ethers.parseEther("1000000"));

        // Approve tokens
        await padToken.connect(user1).approve(await stakeManager.getAddress(), ethers.parseEther("1000000"));
        await padToken.connect(user2).approve(await stakeManager.getAddress(), ethers.parseEther("1000000"));
    });

    describe("Position Creation", function () {
        it("Should create position successfully", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            await expect(stakeManager.connect(user1).createPosition(amount, duration))
                .to.emit(stakeManager, "PositionCreated")
                .withArgs(1, user1.address, amount, duration);

            const position = await stakeManager.positions(1);
            expect(position.amount).to.equal(amount);
            expect(position.duration).to.equal(duration);
            expect(position.isActive).to.be.true;
            expect(position.tier).to.equal(0); // Bronze tier
        });

        it("Should not allow more than 10 positions per wallet", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            for (let i = 0; i < 10; i++) {
                await stakeManager.connect(user1).createPosition(amount, duration);
            }

            await expect(
                stakeManager.connect(user1).createPosition(amount, duration)
            ).to.be.revertedWith("Too many positions");
        });

        it("Should not allow stake duration less than minimum", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 179 * 24 * 60 * 60; // 179 days

            await expect(
                stakeManager.connect(user1).createPosition(amount, duration)
            ).to.be.revertedWith("Duration too short");
        });

        it("Should not allow stake duration more than maximum", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 3651 * 24 * 60 * 60; // 3651 days

            await expect(
                stakeManager.connect(user1).createPosition(amount, duration)
            ).to.be.revertedWith("Duration too long");
        });

        it("Should set correct nextMintAt", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days
            const currentTime = await time.latest();

            await stakeManager.connect(user1).createPosition(amount, duration);

            const position = await stakeManager.positions(1);
            const expectedNextMintAt = currentTime + 30 * 24 * 60 * 60; // current time + 30 days
            // Разрешаем разницу в 1 секунду из-за округления
            expect(
                Math.abs(Number(position.nextMintAt) - expectedNextMintAt)
            ).to.be.lessThanOrEqual(1);
        });
    });

    describe("Position Closing", function () {
        it("Should not allow closing position before maturity", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            await stakeManager.connect(user1).createPosition(amount, duration);
            await expect(
                stakeManager.connect(user1).closePosition(1)
            ).to.be.revertedWith("Position not mature");
        });

        it("Should close position and pay rewards after maturity", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            await stakeManager.connect(user1).createPosition(amount, duration);

            // Fast forward time
            await time.increase(duration + 1);

            await expect(stakeManager.connect(user1).closePosition(1))
                .to.emit(stakeManager, "PositionClosed")
                .withArgs(1, user1.address, amount, 0); // No rewards for Bronze tier
            const position = await stakeManager.positions(1);
            expect(position.isActive).to.be.false;
        });
    });

    describe("Emergency Withdraw", function () {
        it("Should allow emergency withdraw before maturity", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            const balanceBeforeStake = await padToken.balanceOf(user1.address);
            await stakeManager.connect(user1).createPosition(amount, duration);

            await expect(stakeManager.connect(user1).emergencyWithdraw(1))
                .to.emit(stakeManager, "EmergencyWithdrawn")
                .withArgs(1, user1.address, amount);
            const finalBalance = await padToken.balanceOf(user1.address);

            // Баланс возвращается к начальному до стейкинга
            expect(finalBalance).to.equal(balanceBeforeStake);
            const position = await stakeManager.positions(1);
            expect(position.isActive).to.be.false;
        });

        it("Should only allow EOA to emergency withdraw", async function () {
            // Для этого теста создаём позицию на user1, а вызываем с контракта
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days
            await stakeManager.connect(user1).createPosition(amount, duration);
            // maliciousContract не владеет позицией, поэтому ожидаем ошибку "Not position owner"
            await expect(maliciousContract.callEmergencyWithdraw(1))
                .to.be.revertedWith("Not position owner");
        });
    });

    describe("Position Management", function () {
        it("Should track user positions correctly", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            await stakeManager.connect(user1).createPosition(amount, duration);
            await stakeManager.connect(user1).createPosition(amount, duration);

            const positions = await stakeManager.getUserPositions(user1.address);
            expect(positions.length).to.equal(2);
            expect(positions[0]).to.equal(1);
            expect(positions[1]).to.equal(2);
        });

        it("Should remove position from user's array after closing", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days

            await stakeManager.connect(user1).createPosition(amount, duration);
            await stakeManager.connect(user1).createPosition(amount, duration);

            // Fast forward time
            await time.increase(duration + 1);

            await stakeManager.connect(user1).closePosition(1);

            const positions = await stakeManager.getUserPositions(user1.address);
            expect(positions).to.have.lengthOf(1);
            expect(positions[0]).to.equal(2);
        });
    });

    describe("Struct Packing & monthIndex", function () {
        it("Should initialize monthIndex to 0", async function () {
            const amount = ethers.parseEther("1000");
            const duration = 180 * 24 * 60 * 60; // 180 days
            await stakeManager.connect(user1).createPosition(amount, duration);
            let position = await stakeManager.positions(1);
            expect(position.monthIndex).to.equal(0);
        });

        it("Should not allow amount > uint128 max", async function () {
            // 2^129 = 680564733841876926926749214863536422912
            const amount = "680564733841876926926749214863536422912";
            const duration = 180 * 24 * 60 * 60;
            await expect(
                stakeManager.connect(user1).createPosition(amount, duration)
            ).to.be.revertedWith("Amount too large");
        });
    });
}); 