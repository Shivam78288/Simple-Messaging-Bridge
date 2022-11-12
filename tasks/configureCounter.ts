import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import deployments from "../deployment/deployments.json";
import dotenv from "dotenv";
dotenv.config();

const deployment: any = deployments;

task("configure:Counter")
  .addParam("destchainid", "ChainID for the recieving counter contract")
  .addOptionalParam("feepertx", "Amount of fee per transaction")
  .setAction(async function (_taskArguments: TaskArguments, hre) {
    const network = await hre.getChainId();
    const counterAddress = deployment[network].Counter;
    const destCounterAddress = deployment[_taskArguments.destchainid].Counter;

    if (!counterAddress || !destCounterAddress) {
      throw new Error("Counter address not set in deployment folder");
    }

    console.log("Counter configuration started");

    const Counter = await hre.ethers.getContractFactory("Counter");
    const counter = Counter.attach(counterAddress);

    let tx = await counter.setCounterpartOnOtherChain(destCounterAddress);
    await tx.wait(2);
    console.log(tx);

    tx = await counter.setFeePerTx(_taskArguments.feepertx || "1000000000000000");
    await tx.wait(2);
    console.log(tx);

    console.log("Counter configuration ended");
  });
