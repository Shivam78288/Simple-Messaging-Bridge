/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai";
import { ethers } from "hardhat";

const ADDRESS_ZERO = ethers.constants.AddressZero;

describe("Bridge Test Cases", async () => {
  let accounts: any;
  let relayer: any;
  let owner: any;
  let bridge: any;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0].address;
    relayer = accounts[1].address;
    const Bridge = await ethers.getContractFactory("Bridge");
    bridge = await Bridge.deploy(relayer);
    await bridge.deployed();
  });

  it("owner and relayer are correctly set", async () => {
    const ownerAdd = await bridge.owner();
    const relayerAdd = await bridge.relayer();
    expect(ownerAdd).to.eq(owner);
    expect(relayerAdd).to.eq(relayer);
  });

  it("set relayer using owner wallet - should work", async () => {
    const relayerAdd = await bridge.relayer();
    expect(relayerAdd).to.eq(relayer);

    const newRelayerAdd = owner;
    await bridge.connect(accounts[0]).setRelayer(newRelayerAdd);
    const relayerAddNow = await bridge.relayer();

    expect(relayerAddNow).to.eq(newRelayerAdd);
  });

  it("set relayer as address(0) using owner wallet - should work", async () => {
    const newRelayerAdd = ADDRESS_ZERO;
    await expect(bridge.connect(accounts[0]).setRelayer(newRelayerAdd)).to.be.revertedWith(
      "Relayer can't be address(0)",
    );
  });

  it("set relayer using non-owner wallet - should work", async () => {
    const newRelayerAdd = owner;
    await expect(bridge.connect(accounts[1]).setRelayer(newRelayerAdd)).to.be.revertedWith("only owner");
  });

  it("set owner using owner wallet - should work", async () => {
    const ownerAdd = await bridge.owner();
    expect(ownerAdd).to.eq(owner);

    const newOwnerAdd = relayer;
    await bridge.connect(accounts[0]).setOwner(newOwnerAdd);
    const ownerAddNow = await bridge.owner();

    expect(ownerAddNow).to.eq(newOwnerAdd);
  });

  it("set relayer as address(0) using owner wallet - should work", async () => {
    const newOwnerAdd = ADDRESS_ZERO;
    await expect(bridge.connect(accounts[0]).setOwner(newOwnerAdd)).to.be.revertedWith("Owner can't be address(0)");
  });

  it("set relayer using non-owner wallet - should work", async () => {
    const newOwnerAdd = relayer;
    await expect(bridge.connect(accounts[1]).setOwner(newOwnerAdd)).to.be.revertedWith("only owner");
  });
});
