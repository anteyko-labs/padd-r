const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { Wallet } = require("ethers");

describe("PADToken", function () {
  let padToken;
  let owner;
  let user1;
  let user2;
  let gnosisSafe;

  beforeEach(async function () {
    [owner, user1, user2, gnosisSafe] = await ethers.getSigners();

    const PADToken = await ethers.getContractFactory("PADToken");
    padToken = await PADToken.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      expect(await padToken.hasRole(await padToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await padToken.hasRole(await padToken.PAUSER_ROLE(), owner.address)).to.be.true;
      expect(await padToken.hasRole(await padToken.ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const totalSupply = await padToken.totalSupply();
      expect(await padToken.balanceOf(owner.address)).to.equal(totalSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await padToken.transfer(user1.address, ethers.parseEther("1000"));
      expect(await padToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      await expect(
        padToken.connect(user1).transfer(user2.address, ethers.parseEther("1000"))
      ).to.be.reverted;
    });
  });

  describe("Batch Transfer", function () {
    it("Should transfer tokens to multiple recipients", async function () {
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("1000"), ethers.parseEther("2000")];

      await padToken.batchTransfer(recipients, amounts);

      expect(await padToken.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await padToken.balanceOf(user2.address)).to.equal(amounts[1]);
    });

    it("Should fail if arrays length mismatch", async function () {
      const recipients = [user1.address];
      const amounts = [ethers.parseEther("1000"), ethers.parseEther("2000")];

      await expect(
        padToken.batchTransfer(recipients, amounts)
      ).to.be.revertedWith("Arrays length mismatch");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause the contract by pauser", async function () {
      await padToken.pause();
      expect(await padToken.paused()).to.be.true;

      await padToken.unpause();
      expect(await padToken.paused()).to.be.false;
    });

    it("Should fail if non-pauser tries to pause", async function () {
      await expect(
        padToken.connect(user1).pause()
      ).to.be.reverted;
    });
  });

  describe("Permit", function () {
    it("Should allow permit for token approval", async function () {
      const spender = user2.address;
      const value = ethers.parseEther("1000");
      const currentTime = await time.latest();
      const deadline = currentTime + 3600; // 1 hour from now
      const nonce = await padToken.nonces(owner.address);
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const verifyingContract = await padToken.getAddress();

      // Создаем приватный ключ для тестового кошелька
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat test private key
      const wallet = new ethers.Wallet(privateKey, ethers.provider);

      const domain = {
        name: await padToken.name(),
        version: "1",
        chainId,
        verifyingContract
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const values = {
        owner: wallet.address,
        spender,
        value,
        nonce,
        deadline
      };

      const signature = await wallet.signTypedData(domain, types, values);
      const { r, s, v } = ethers.Signature.from(signature);

      await padToken.permit(wallet.address, spender, value, deadline, v, r, s);
      expect(await padToken.allowance(wallet.address, spender)).to.equal(value);
    });
  });

  describe("Roles & Admin", function () {
    it("Should allow admin to set Gnosis Safe", async function () {
      await padToken.setGnosisSafe(gnosisSafe.address);
      expect(await padToken.gnosisSafe()).to.equal(gnosisSafe.address);
    });

    it("Should fail if non-admin tries to set Gnosis Safe", async function () {
      await expect(
        padToken.connect(user1).setGnosisSafe(gnosisSafe.address)
      ).to.be.reverted;
    });
  });

  describe("Cooldown", function () {
    it("Should set cooldown period", async function () {
      const newPeriod = 2 * 3600; // 2 hours
      await padToken.setCooldownPeriod(newPeriod);
      expect(await padToken.cooldownPeriod()).to.equal(newPeriod);
    });

    it("Should set cooldown status for account", async function () {
      await padToken.setCooldown(user1.address, true);
      expect(await padToken.hasCooldown(user1.address)).to.be.true;
    });

    it("Should enforce cooldown period", async function () {
      await padToken.setCooldown(owner.address, true);
      await padToken.transfer(user1.address, ethers.parseEther("1000"));
      await padToken.setCooldown(user1.address, true);
      await padToken.connect(user1).transfer(owner.address, 1);
      await expect(
        padToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
      await time.increase(await padToken.cooldownPeriod());
      await padToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      expect(await padToken.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should enforce cooldown on batch transfer", async function () {
      await padToken.setCooldown(owner.address, true);
      await padToken.transfer(user1.address, ethers.parseEther("1000"));
      await padToken.setCooldown(user1.address, true);
      await padToken.connect(user1).transfer(owner.address, 1);
      const recipients = [user2.address];
      const amounts = [ethers.parseEther("100")];
      await expect(
        padToken.connect(user1).batchTransfer(recipients, amounts)
      ).to.be.reverted;
      await time.increase(await padToken.cooldownPeriod());
      await padToken.connect(user1).batchTransfer(recipients, amounts);
      expect(await padToken.balanceOf(user2.address)).to.equal(amounts[0]);
    });

    // Дополнительные тесты для покрытия веток
    it("Should handle zero cooldown period", async function () {
      await expect(
        padToken.setCooldownPeriod(0)
      ).to.be.revertedWith("Invalid cooldown period");
    });

    it("Should handle zero address for Gnosis Safe", async function () {
      await expect(
        padToken.setGnosisSafe(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should allow non-cooldown accounts to transfer multiple times", async function () {
      // user2 doesn't have cooldown
      await padToken.transfer(user2.address, ethers.parseEther("1000"));
      
      // user2 should be able to transfer multiple times
      await padToken.connect(user2).transfer(user1.address, ethers.parseEther("500"));
      await padToken.connect(user2).transfer(user1.address, ethers.parseEther("500"));
    });

    it("Should not enforce cooldown for accounts without cooldown", async function () {
      // Remove cooldown from user1
      await padToken.setCooldown(user1.address, false);
      
      // Multiple transfers should work
      await padToken.transfer(user1.address, ethers.parseEther("1000"));
      await padToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      await padToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
    });

    it("Should not enforce cooldown for batch transfer without cooldown", async function () {
      // Remove cooldown from user1
      await padToken.setCooldown(user1.address, false);
      
      // Multiple batch transfers should work
      await padToken.transfer(user1.address, ethers.parseEther("1000"));
      await padToken.connect(user1).batchTransfer([user2.address], [ethers.parseEther("100")]);
      await padToken.connect(user1).batchTransfer([user2.address], [ethers.parseEther("100")]);
    });

    it("Should handle insufficient balance in batch transfer", async function () {
      await expect(
        padToken.batchTransfer([user1.address], [ethers.parseEther("200000000")]) // More than total supply
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should handle empty arrays in batch transfer", async function () {
      await padToken.batchTransfer([], []);
      // Should not revert
    });

    it("Should handle single recipient in batch transfer", async function () {
      await padToken.batchTransfer([user1.address], [ethers.parseEther("1000")]);
      expect(await padToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });
  });
}); 