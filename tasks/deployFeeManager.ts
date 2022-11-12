import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import deployments from "../deployment/deployments.json";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
dotenv.config();

const deployment: any = deployments;

task("deploy:FeeManager").setAction(async function (_taskArguments: TaskArguments, hre) {
  const network = await hre.getChainId();
  console.log("Fee Manager deployment started");
  const relayer = process.env.RELAYER;
  if (!relayer) {
    throw new Error("Relayer address not set in .env file");
  }

  const FeeManager = await hre.ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy(relayer);
  await feeManager.deployed();

  console.log("Fee Manager deployed to ", feeManager.address);
  console.log("FeeManager deployment ended");

  if (!deployment[network]) {
    deployment[network] = {};
  }

  deployment[network].FeeManager = feeManager.address;
  writeFileSync("./deployment/deployments.json", JSON.stringify(deployment));
});
