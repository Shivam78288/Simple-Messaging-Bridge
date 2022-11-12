/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai";
import { ethers } from "hardhat";

const ADDRESS_ZERO = ethers.constants.AddressZero;

describe("Counter Test Cases", async () => {
  let accounts: any;
  let owner: any;
  let bridge: any;
  let feeManager: any;
  let counter: any;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0].address;
    bridge = accounts[1].address;
    feeManager = accounts[2].address;
    const Counter = await ethers.getContractFactory("Counter");

    counter = await Counter.deploy(bridge, feeManager);
    await counter.deployed();
  });

  it("bridge, feeManager and owner are set correctly", async () => {
    const ownerAddr = await counter.owner();
    const feeManagerAddr = await counter.feeManager();
    const bridgeAddr = await counter.bridge();

    expect(ownerAddr).to.eq(owner);
    expect(feeManagerAddr).to.eq(feeManager);
    expect(bridgeAddr).to.eq(bridge);
  });

  it("set owner address using owner wallet - should work", async () => {
    const currentOwnerAddr = await counter.owner();
    expect(currentOwnerAddr).to.eq(owner);

    await counter.connect(accounts[0]).setOwner(accounts[1].address);
    const newOwnerAddr = await counter.owner();
    expect(newOwnerAddr).to.eq(accounts[1].address);
  });

  it("set owner address to address(0) using owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[0]).setOwner(ADDRESS_ZERO)).to.be.revertedWith("owner can't be address(0)");
  });

  it("set owner address using non-owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[1]).setOwner(accounts[1].address)).to.be.revertedWith("only owner");
  });

  it("set counterpart address using owner wallet - should work", async () => {
    const currentCounterpartAddr = await counter.counterpartOnOtherChain();
    expect(currentCounterpartAddr).to.eq(ADDRESS_ZERO);

    await counter.connect(accounts[0]).setCounterpartOnOtherChain(accounts[1].address);
    const newCounterpartAddr = await counter.counterpartOnOtherChain();
    expect(newCounterpartAddr).to.eq(accounts[1].address);
  });

  it("set counterpart address to address(0) using owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[0]).setCounterpartOnOtherChain(ADDRESS_ZERO)).to.be.revertedWith(
      "counterpart address can't be address(0)",
    );
  });

  it("set counterpart address using non-owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[1]).setCounterpartOnOtherChain(accounts[1].address)).to.be.revertedWith(
      "only owner",
    );
  });

  it("set feeManager address using owner wallet - should work", async () => {
    const currentFeeManager = await counter.feeManager();
    expect(currentFeeManager).to.eq(feeManager);

    await counter.connect(accounts[0]).setFeeManager(accounts[1].address);
    const newFeeManager = await counter.feeManager();
    expect(newFeeManager).to.eq(accounts[1].address);
  });

  it("set feeManager address to address(0) using owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[0]).setFeeManager(ADDRESS_ZERO)).to.be.revertedWith(
      "fee manager address can't be address(0)",
    );
  });

  it("set feeManager address using non-owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[1]).setFeeManager(accounts[1].address)).to.be.revertedWith("only owner");
  });

  it("set fee per tx to a valid value using owner wallet - should work", async () => {
    const currentFeePerTx = await counter.feePerTx();
    expect(currentFeePerTx).to.eq("0");

    await counter.connect(accounts[0]).setFeePerTx(ethers.utils.parseEther("0.0001"));
    const newFeePerTx = await counter.feePerTx();
    expect(newFeePerTx).to.eq(ethers.utils.parseEther("0.0001"));
  });

  it("set fee per tx to an invalid value using owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[0]).setFeePerTx(ethers.utils.parseEther("0.1"))).to.be.revertedWith(
      "fee should be between 0 and 0.01 Ether",
    );
    await expect(counter.connect(accounts[0]).setFeePerTx("0")).to.be.revertedWith(
      "fee should be between 0 and 0.01 Ether",
    );
  });

  it("set fee per tx to a valid value using non-owner wallet - should fail", async () => {
    await expect(counter.connect(accounts[1]).setFeePerTx(ethers.utils.parseEther("0.0001"))).to.be.revertedWith(
      "only owner",
    );
  });

  it("increment called by bridge - should work", async () => {
    await counter.connect(accounts[0]).setCounterpartOnOtherChain(accounts[1].address);
    const oldCounter = await counter.counter();
    await counter.connect(accounts[1]).increment(accounts[1].address);
    const newCounter = await counter.counter();

    expect(oldCounter).to.eq("0");
    expect(newCounter.toString()).to.eq("1");
  });

  it("increment called but not by bridge - should fail", async () => {
    await expect(counter.connect(accounts[0]).increment(accounts[1].address)).to.be.revertedWith("only bridge");
  });

  it("increment called but counterpart address not set / invalid - should fail", async () => {
    await expect(counter.connect(accounts[1]).increment(accounts[1].address)).to.be.revertedWith(
      "sending counter invalid",
    );

    await counter.connect(accounts[0]).setCounterpartOnOtherChain(accounts[1].address);

    await expect(counter.connect(accounts[1]).increment(accounts[0].address)).to.be.revertedWith(
      "sending counter invalid",
    );
  });
});
