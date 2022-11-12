/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai";
import { ethers } from "hardhat";

const ADDRESS_ZERO = ethers.constants.AddressZero;

describe("Fee Manager Test Cases", async () => {
  let accounts: any;
  let relayer: any;
  let feeManager: any;
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    relayer = accounts[0].address;
    const FeeManager = await ethers.getContractFactory("FeeManager");
    feeManager = await FeeManager.deploy(relayer);
    await feeManager.deployed();
  });

  it("getBalance", async () => {
    const balance = await ethers.provider.getBalance(feeManager.address);
    expect(balance).to.eq("0");
  });

  it("set admin using admin wallet - should work", async () => {
    const currentAdmin = await feeManager.admin();
    expect(currentAdmin).to.eq(relayer);
    const newAdmin = accounts[1].address;
    await feeManager.connect(accounts[0]).setAdmin(newAdmin);
    const admin = await feeManager.admin();
    expect(admin).to.eq(newAdmin);
  });

  it("set admin using non-admin wallet - should fail", async () => {
    const newAdmin = accounts[1].address;
    await expect(feeManager.connect(accounts[1]).setAdmin(newAdmin)).to.be.revertedWith("only admin");
  });

  it("setting address(0) as admin - should fail", async () => {
    await expect(feeManager.connect(accounts[0]).setAdmin(ADDRESS_ZERO)).to.be.revertedWith(
      "admin cannot be address(0)",
    );
  });

  it("withdrawing all fees using admin wallet - should work", async () => {
    await accounts[0].sendTransaction({
      to: feeManager.address,
      value: ethers.utils.parseEther("1.0"),
    });

    const balanceOfFeeManagerBefore = await ethers.provider.getBalance(feeManager.address);
    const balanceOfRelayerBefore = await ethers.provider.getBalance(relayer);

    await feeManager.connect(accounts[0]).withdrawFees(0);

    const balanceOfFeeManagerAfter = await ethers.provider.getBalance(feeManager.address);
    const balanceOfRelayerAfter = await ethers.provider.getBalance(relayer);

    expect(balanceOfFeeManagerBefore).to.eq(ethers.utils.parseEther("1.0"));
    expect(balanceOfFeeManagerAfter).to.eq("0");
    // Not exactly 1 ether because of gas fees
    console.log(
      `Balance change in relayer ${ethers.utils
        .formatEther(balanceOfRelayerAfter.sub(balanceOfRelayerBefore))
        .toString()} ether`,
    );
  });

  it("withdrawing some fees using admin wallet - should work", async () => {
    await accounts[0].sendTransaction({
      to: feeManager.address,
      value: ethers.utils.parseEther("1.0"),
    });

    const balanceOfFeeManagerBefore = await ethers.provider.getBalance(feeManager.address);

    const balanceOfRelayerBefore = await ethers.provider.getBalance(relayer);

    await feeManager.connect(accounts[0]).withdrawFees(ethers.utils.parseEther("0.5"));

    const balanceOfFeeManagerAfter = await ethers.provider.getBalance(feeManager.address);
    const balanceOfRelayerAfter = await ethers.provider.getBalance(relayer);

    expect(balanceOfFeeManagerBefore).to.eq(ethers.utils.parseEther("1.0"));
    expect(balanceOfFeeManagerAfter).to.eq(ethers.utils.parseEther("0.5"));
    // Not exactly 0.5 ether because of gas fees
    console.log(
      `Balance change in relayer ${ethers.utils
        .formatEther(balanceOfRelayerAfter.sub(balanceOfRelayerBefore))
        .toString()} ether`,
    );
  });

  it("withdrawing fees more than the amount in contract using admin wallet - should fail", async () => {
    await expect(feeManager.connect(accounts[0]).withdrawFees(ethers.utils.parseEther("0.5"))).to.be.revertedWith(
      "amount exceeds balance",
    );
  });

  it("withdrawing fees using non-admin wallet - should fail", async () => {
    await accounts[0].sendTransaction({
      to: feeManager.address,
      value: ethers.utils.parseEther("1.0"),
    });

    await expect(feeManager.connect(accounts[1]).withdrawFees(0)).to.be.revertedWith("only admin");
  });
});
