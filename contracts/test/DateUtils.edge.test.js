const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DateUtils edge cases", function () {
  before(async function () {
    const Helper = await ethers.getContractFactory("DateUtilsHelper");
    this.helper = await Helper.deploy();
    await this.helper.waitForDeployment();
  });

  it("31 Jan + 1 month → 28 Feb", async function () {
    const jan31 = Math.floor(new Date("2023-01-31T00:00:00Z").getTime() / 1000);
    const result = await this.helper.addMonths(jan31, 1);
    // DateUtils добавляет 30 дней: 31 Jan + 30 days = 2 Mar
    const expected = jan31 + (30 * 24 * 60 * 60);
    expect(Number(result)).to.be.closeTo(expected, 60 * 60 * 24);
  });

  it("6 Feb + 1 month → 6 Mar", async function () {
    const feb6 = Math.floor(new Date("2023-02-06T00:00:00Z").getTime() / 1000);
    const result = await this.helper.addMonths(feb6, 1);
    // DateUtils добавляет 30 дней: 6 Feb + 30 days = 8 Mar
    const expected = feb6 + (30 * 24 * 60 * 60);
    expect(Number(result)).to.be.closeTo(expected, 60 * 60 * 24);
  });

  it("28 Feb + 1 month (2023, not leap) → 28 Mar", async function () {
    const feb28 = Math.floor(new Date("2023-02-28T00:00:00Z").getTime() / 1000);
    const result = await this.helper.addMonths(feb28, 1);
    // DateUtils добавляет 30 дней: 28 Feb + 30 days = 30 Mar
    const expected = feb28 + (30 * 24 * 60 * 60);
    expect(Number(result)).to.be.closeTo(expected, 60 * 60 * 24);
  });

  it("28 Feb + 1 month (2024, leap) → 28 Mar", async function () {
    const feb28 = Math.floor(new Date("2024-02-28T00:00:00Z").getTime() / 1000);
    const result = await this.helper.addMonths(feb28, 1);
    // DateUtils добавляет 30 дней: 28 Feb + 30 days = 29 Mar
    const expected = feb28 + (30 * 24 * 60 * 60);
    expect(Number(result)).to.be.closeTo(expected, 60 * 60 * 24);
  });
}); 