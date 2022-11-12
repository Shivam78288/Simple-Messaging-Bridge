/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai";
import { ethers } from "hardhat";

const ADDRESS_ZERO = ethers.constants.AddressZero;

describe("Integration Test Cases", async () => {
  let accounts: any;
  let owner: any;
  let relayer: any;
  let bridge: any;
  let feeManager: any;
  let counter: any;
  let bridgeOnOtherChain: any;
  let feeManagerOnOtherChain: any;
  let counterOnOtherChain: any;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    relayer = accounts[1];

    const Counter = await ethers.getContractFactory("Counter");
    const Bridge = await ethers.getContractFactory("Bridge");
    const FeeManager = await ethers.getContractFactory("FeeManager");

    feeManager = await FeeManager.deploy(relayer.address);
    await feeManager.deployed();

    bridge = await Bridge.deploy(relayer.address);
    await bridge.deployed();

    counter = await Counter.deploy(bridge.address, feeManager.address);
    await counter.deployed();

    feeManagerOnOtherChain = await FeeManager.deploy(relayer.address);
    await feeManagerOnOtherChain.deployed();

    bridgeOnOtherChain = await Bridge.deploy(relayer.address);
    await bridgeOnOtherChain.deployed();

    counterOnOtherChain = await Counter.deploy(bridgeOnOtherChain.address, feeManagerOnOtherChain.address);
    await counterOnOtherChain.deployed();
  });

  it("calling send function correctly - should work", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));

    const oldBalanceOfFeeManagerOnSrcChain = await ethers.provider.getBalance(feeManager.address);
    const oldNonceForReceivingCounter = await bridge.nonceForReceivingCounter(
      counter.address,
      counterOnOtherChain.address,
    );
    await counter.connect(owner).send({ value: ethers.utils.parseEther("0.001") });
    const newBalanceOfFeeManagerOnSrcChain = await ethers.provider.getBalance(feeManager.address);
    const newNonceForReceivingCounter = await bridge.nonceForReceivingCounter(
      counter.address,
      counterOnOtherChain.address,
    );

    const logs = await bridge.queryFilter("RequestToRelay");
    const data = logs[0].args.data;
    const nonce = logs[0].args.nonce;
    const receivingCounter = logs[0].args.receivingCounter;
    const sendingCounter = logs[0].args.sendingCounter;
    const oldCounterOnDestChain = await counterOnOtherChain.counter();
    const oldIsExecuted = await bridgeOnOtherChain.executed(sendingCounter, nonce);
    await bridgeOnOtherChain.connect(relayer).receiveFromRelayer(nonce, receivingCounter, data);
    const newCounterOnDestChain = await counterOnOtherChain.counter();
    const newIsExecuted = await bridgeOnOtherChain.executed(sendingCounter, nonce);

    expect(oldBalanceOfFeeManagerOnSrcChain).to.eq("0");
    expect(newBalanceOfFeeManagerOnSrcChain).to.eq(ethers.utils.parseEther("0.001"));

    expect(oldIsExecuted).to.eq(false);
    expect(newIsExecuted).to.eq(true);

    expect(oldNonceForReceivingCounter).to.eq("0");
    expect(newNonceForReceivingCounter.toString()).to.eq("1");

    expect(oldCounterOnDestChain).to.eq("0");
    expect(newCounterOnDestChain.toString()).to.eq("1");
  });

  it("calling send without passing fees/passing insufficient fees - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));

    await expect(counter.send()).to.be.revertedWith("passed value is lesser than required");
    await expect(counter.send({ value: ethers.utils.parseEther("0.00001") })).to.be.revertedWith(
      "passed value is lesser than required",
    );
  });

  it("calling send without setting fee per tx - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await expect(counter.send({ value: ethers.utils.parseEther("0.00001") })).to.be.revertedWith(
      "fee per tx is not set",
    );
  });

  it("calling send without setting counterpart on other chain - should fail", async () => {
    await expect(counter.send({ value: ethers.utils.parseEther("0.00001") })).to.be.revertedWith(
      "counterpart address on other chain not set",
    );
  });

  it("calling receive on bridge by non-relayer wallet - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counter.connect(owner).send({ value: ethers.utils.parseEther("0.001") });

    const logs = await bridge.queryFilter("RequestToRelay");
    const data = logs[0].args.data;
    const nonce = logs[0].args.nonce;
    const receivingCounter = logs[0].args.receivingCounter;

    await expect(
      bridgeOnOtherChain.connect(accounts[0]).receiveFromRelayer(nonce, receivingCounter, data),
    ).to.be.revertedWith("only relayer");
  });

  it("bridge receive the same nonce twice - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));

    const oldBalanceOfFeeManagerOnSrcChain = await ethers.provider.getBalance(feeManager.address);
    await counter.connect(owner).send({ value: ethers.utils.parseEther("0.001") });
    const newBalanceOfFeeManagerOnSrcChain = await ethers.provider.getBalance(feeManager.address);

    const logs = await bridge.queryFilter("RequestToRelay");
    const data = logs[0].args.data;
    const nonce = logs[0].args.nonce;
    const receivingCounter = logs[0].args.receivingCounter;
    const oldCounterOnDestChain = await counterOnOtherChain.counter();
    await bridgeOnOtherChain.connect(relayer).receiveFromRelayer(nonce, receivingCounter, data);
    const newCounterOnDestChain = await counterOnOtherChain.counter();

    expect(oldBalanceOfFeeManagerOnSrcChain).to.eq("0");
    expect(newBalanceOfFeeManagerOnSrcChain).to.eq(ethers.utils.parseEther("0.001"));

    expect(oldCounterOnDestChain).to.eq("0");
    expect(newCounterOnDestChain.toString()).to.eq("1");

    await expect(
      bridgeOnOtherChain.connect(relayer).receiveFromRelayer(nonce, receivingCounter, data),
    ).to.be.revertedWith("nonce already executed");
  });

  it("calling receive on bridge with invalid data - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counter.connect(owner).send({ value: ethers.utils.parseEther("0.001") });

    const logs = await bridge.queryFilter("RequestToRelay");
    // const data = logs[0].args.data;
    const nonce = logs[0].args.nonce;
    const receivingCounter = logs[0].args.receivingCounter;

    await expect(
      // using address(0) in place of data
      bridgeOnOtherChain.connect(relayer).receiveFromRelayer(nonce, receivingCounter, ADDRESS_ZERO),
    ).to.be.reverted;
  });

  it("calling receive on bridge with receiving counter as address(0) - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counter.connect(owner).send({ value: ethers.utils.parseEther("0.001") });

    const logs = await bridge.queryFilter("RequestToRelay");
    const data = logs[0].args.data;
    const nonce = logs[0].args.nonce;
    // const receivingCounter = logs[0].args.receivingCounter;

    await expect(
      // using accounts[1].address in place of receiving counter
      bridgeOnOtherChain.connect(relayer).receiveFromRelayer(nonce, ADDRESS_ZERO, data),
    ).to.be.revertedWith("sending and receiving counter can't be address(0)");
  });

  it("calling receive on bridge with sending counter as address(0) - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counter.connect(owner).send({ value: ethers.utils.parseEther("0.001") });

    const logs = await bridge.queryFilter("RequestToRelay");
    // sending counter is address(0) here
    const data = "0x45f43dd80000000000000000000000000000000000000000000000000000000000000000";
    const nonce = logs[0].args.nonce;
    const receivingCounter = logs[0].args.receivingCounter;

    await expect(
      bridgeOnOtherChain.connect(relayer).receiveFromRelayer(nonce, receivingCounter, data),
    ).to.be.revertedWith("sending and receiving counter can't be address(0)");
  });

  it("calling receive on bridge with invalid sending counter - should fail", async () => {
    await counter.setCounterpartOnOtherChain(counterOnOtherChain.address);
    await counterOnOtherChain.setCounterpartOnOtherChain(counter.address);

    await counter.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counterOnOtherChain.setFeePerTx(ethers.utils.parseEther("0.001"));
    await counter.connect(owner).send({ value: ethers.utils.parseEther("0.001") });

    const logs = await bridge.queryFilter("RequestToRelay");
    // sending counter is invalid here
    const data = "0x45f43dd80000000000000000000000000000000000000000000011111111111111111111";
    const nonce = logs[0].args.nonce;
    const receivingCounter = logs[0].args.receivingCounter;

    await expect(bridgeOnOtherChain.connect(relayer).receiveFromRelayer(nonce, receivingCounter, data)).to.be.reverted;
  });
});
