import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import deployments from "../deployment/deployments.json";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
dotenv.config();

const deployment: any = deployments;

task("deploy:Counter").setAction(async function (_taskArguments: TaskArguments, hre) {
  const network = await hre.getChainId();
  const bridge = deployment[network].Bridge;
  const feeManager = deployment[network].FeeManager;

  if (!bridge || !feeManager) {
    throw new Error("Bridge/FeeManager address not set in deployment folder");
  }

  console.log("Counter deployment started");
  const Counter = await hre.ethers.getContractFactory("Counter");
  const counter = await Counter.deploy(bridge, feeManager);
  await counter.deployed();
  console.log("Counter deployed to ", counter.address);
  console.log("Counter deployment ended");

  if (!deployment[network]) {
    deployment[network] = {};
  }

  deployment[network].Counter = counter.address;
  writeFileSync("./deployment/deployments.json", JSON.stringify(deployment));
});
