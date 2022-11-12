import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import deployments from "../deployment/deployments.json";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
dotenv.config();

const deployment: any = deployments;

task("deploy:Bridge").setAction(async function (_taskArguments: TaskArguments, hre) {
  const network = await hre.getChainId();
  console.log("Bridge deployment started");
  const relayer = process.env.RELAYER;
  if (!relayer) {
    throw new Error("Relayer address not set in .env file");
  }

  const Bridge = await hre.ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy(relayer);
  await bridge.deployed();

  console.log("Bridge deployed to ", bridge.address);
  console.log("Bridge deployment ended");

  if (!deployment[network]) {
    deployment[network] = {};
  }

  deployment[network].Bridge = bridge.address;
  writeFileSync("./deployment/deployments.json", JSON.stringify(deployment));
});
