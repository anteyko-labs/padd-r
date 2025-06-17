const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DateUtils", function () {
    let dateUtilsHelper;

    beforeEach(async function () {
        const DateUtilsHelper = await ethers.getContractFactory("DateUtilsHelper");
        dateUtilsHelper = await DateUtilsHelper.deploy();
    });

    describe("addMonths", function () {
        it("Should add 1 month correctly", async function () {
            const timestamp = 1640995200; // 1 Jan 2022
            const result = await dateUtilsHelper.addMonths(timestamp, 1);
            expect(result).to.equal(timestamp + 30 * 24 * 60 * 60);
        });

        it("Should add 0 months correctly", async function () {
            const timestamp = 1640995200; // 1 Jan 2022
            const result = await dateUtilsHelper.addMonths(timestamp, 0);
            expect(result).to.equal(timestamp);
        });

        it("Should add multiple months correctly", async function () {
            const timestamp = 1640995200; // 1 Jan 2022
            const result = await dateUtilsHelper.addMonths(timestamp, 12);
            expect(result).to.equal(timestamp + 12 * 30 * 24 * 60 * 60);
        });

        it("Should add many months correctly", async function () {
            const timestamp = 1640995200; // 1 Jan 2022
            const result = await dateUtilsHelper.addMonths(timestamp, 100);
            expect(result).to.equal(timestamp + 100 * 30 * 24 * 60 * 60);
        });

        it("Should handle large values", async function () {
            const timestamp = 1000000000;
            const result = await dateUtilsHelper.addMonths(timestamp, 1000);
            expect(result).to.equal(timestamp + 1000 * 30 * 24 * 60 * 60);
        });

        it("Should handle zero timestamp", async function () {
            const result = await dateUtilsHelper.addMonths(0, 1);
            expect(result).to.equal(30 * 24 * 60 * 60);
        });
    });

    describe("monthsBetween", function () {
        it("Should calculate months between correctly", async function () {
            const start = 1640995200; // 1 Jan 2022
            const end = start + 6 * 30 * 24 * 60 * 60; // 6 months later
            const months = await dateUtilsHelper.monthsBetween(start, end);
            expect(months).to.equal(6);
        });

        it("Should calculate exact months correctly", async function () {
            const start = 1640995200; // 1 Jan 2022
            const end = start + 12 * 30 * 24 * 60 * 60; // 12 months later
            const months = await dateUtilsHelper.monthsBetween(start, end);
            expect(months).to.equal(12);
        });

        it("Should truncate partial months", async function () {
            const start = 1640995200; // 1 Jan 2022
            const end = start + 3 * 30 * 24 * 60 * 60 + 15 * 24 * 60 * 60; // 3.5 months later
            const months = await dateUtilsHelper.monthsBetween(start, end);
            expect(months).to.equal(3); // Should truncate to 3 months
        });

        it("Should return 0 for same timestamp", async function () {
            const start = 1640995200; // 1 Jan 2022
            const end = start; // Same timestamp
            const months = await dateUtilsHelper.monthsBetween(start, end);
            expect(months).to.equal(0);
        });

        it("Should return 0 for less than a month", async function () {
            const start = 1640995200; // 1 Jan 2022
            const end = start + 15 * 24 * 60 * 60; // Less than a month
            const months = await dateUtilsHelper.monthsBetween(start, end);
            expect(months).to.equal(0);
        });

        it("Should revert when end is before start", async function () {
            const start = 1640995200; // 1 Jan 2022
            const end = start - 30 * 24 * 60 * 60; // Before start
            await expect(dateUtilsHelper.monthsBetween(start, end))
                .to.be.revertedWith("End before start");
        });

        it("Should handle large values", async function () {
            const start = 1000000000;
            const end = start + 1000 * 30 * 24 * 60 * 60;
            const months = await dateUtilsHelper.monthsBetween(start, end);
            expect(months).to.equal(1000);
        });
    });

    describe("Edge cases", function () {
        it("Should handle maximum uint256 for addMonths", async function () {
            const maxUint = ethers.MaxUint256;
            await expect(dateUtilsHelper.addMonths(maxUint, 1))
                .to.be.revertedWithPanic(0x11); // Arithmetic overflow
        });

        it("Should handle maximum uint256 for monthsBetween", async function () {
            const maxUint = ethers.MaxUint256;
            const start = 0;
            const months = await dateUtilsHelper.monthsBetween(start, maxUint);
            // Should calculate correctly even with large values
            expect(months).to.be.gt(0);
        });
    });
}); 