import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import deployments from "../deployment/deployments.json";
import dotenv from "dotenv";
dotenv.config();

const deployment: any = deployments;

task("verify:All").setAction(async function (_taskArguments: TaskArguments, hre) {
  await hre.run("verify:FeeManager");
  await hre.run("verify:Bridge");
  await hre.run("verify:Counter");
});

task("verify:Bridge").setAction(async function (_taskArguments: TaskArguments, hre) {
  const network = await hre.getChainId();
  console.log("Bridge verification started");
  const relayer = process.env.RELAYER;

  if (!relayer) {
    throw new Error("Relayer address not set in .env file");
  }

  const bridge = deployment[network].Bridge;
  if (!bridge) {
    throw new Error("Bridge address not set in deployment file");
  }

  await hre.run("verify:verify", {
    address: bridge,
    constructorArguments: [relayer],
  });
  console.log("Bridge verification ended");
});

task("verify:Counter").setAction(async function (_taskArguments: TaskArguments, hre) {
  const network = await hre.getChainId();
  console.log("Counter verification started");

  const bridge = deployment[network].Bridge;
  const feeManager = deployment[network].FeeManager;
  const counter = deployment[network].Counter;
  if (!bridge || !counter || !feeManager) {
    throw new Error("Bridge/Counter/FeeManager address not set in deployments file");
  }

  await hre.run("verify:verify", {
    address: counter,
    constructorArguments: [bridge, feeManager],
  });
  console.log("Counter verification ended");
});

task("verify:FeeManager").setAction(async function (_taskArguments: TaskArguments, hre) {
  const network = await hre.getChainId();
  console.log("Fee manager verification started");

  const feeManager = deployment[network].FeeManager;
  if (!feeManager) {
    throw new Error("Fee Manager address not set in deployments file");
  }

  const relayer = process.env.RELAYER;
  if (!relayer) {
    throw new Error("Relayer address not set in .env file");
  }

  await hre.run("verify:verify", {
    address: feeManager,
    constructorArguments: [relayer],
  });

  console.log("Fee manager verification ended");
});
