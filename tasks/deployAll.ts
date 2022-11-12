import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("deploy:All", "deploy the contracts").setAction(async function (_taskArguments: TaskArguments, hre) {
  console.log("Deploying fee manager started");
  await hre.run("deploy:FeeManager");
  console.log("Deploying fee manager ended");

  console.log("Deploying bridge started");
  await hre.run("deploy:Bridge");
  console.log("Deploying bridge ended");

  console.log("Deploying counter started");
  await hre.run("deploy:Counter");
  console.log("Deploying counter ended");
});
