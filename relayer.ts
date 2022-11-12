import { ethers } from "ethers";
import Bridge from "./artifacts/contracts/Bridge.sol/Bridge.json";
import deployment from "./deployment/deployments.json";
import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error("Private key not set in .env file");
}

const goerliRpc = process.env.GOERLI_RPC || "https://rpc.ankr.com/eth_goerli";
const mumbaiRpc = process.env.MUMBAI_RPC || "https://heimdall.api.matic.today";

if (!goerliRpc || !mumbaiRpc) {
  throw new Error("Provider rpc not set in .env file");
}

const providerGoerli = new ethers.providers.JsonRpcProvider(goerliRpc);
const providerMumbai = new ethers.providers.JsonRpcProvider(mumbaiRpc);

const relayerGoerli = new ethers.Wallet(privateKey, providerGoerli);
const relayerMumbai = new ethers.Wallet(privateKey, providerMumbai);

const goerliChainId = "5";
const mumbaiChainId = "80001";

if (!deployment[goerliChainId] || !deployment[mumbaiChainId]) {
  throw new Error("ChainIds are wrong or something is wrong with the deployments file. Please check.");
}

const bridgeAddrGoerli = deployment[goerliChainId].Bridge;
const counterAddrGoerli = deployment[goerliChainId].Counter;
const bridgeAddrMumbai = deployment[mumbaiChainId].Bridge;
const counterAddrMumbai = deployment[mumbaiChainId].Counter;

if (!bridgeAddrGoerli || !bridgeAddrMumbai || !counterAddrGoerli || !counterAddrMumbai) {
  throw new Error("Bridge and counter addresses not set on the respective chains in deployments file");
}

// Instantiating bridge contracts for Goerli and Mumbai chain
const bridgeGoerli = new ethers.Contract(bridgeAddrGoerli, Bridge.abi, relayerGoerli);
const bridgeMumbai = new ethers.Contract(bridgeAddrMumbai, Bridge.abi, relayerMumbai);

console.log("Relayer started");

// adding event listener
// When a request is emitted from goerli bridge to be relayed to mumbai bridge
bridgeGoerli.on("RequestToRelay", async (data, nonce, sendingCounter, recievingCounter, event) => {
  console.log("\nRequest from Goerli to Mumbai received\n");
  console.log(`data => `, data);
  console.log(`nonce => `, nonce);
  console.log(`sendingCounter => `, sendingCounter);
  console.log(`recievingCounter => `, recievingCounter);

  // sending request to bridge on Mumbai chain
  const tx = await bridgeMumbai.receiveFromRelayer(nonce, recievingCounter, data);
  const transactionReceipt = await tx.wait();
  console.log(transactionReceipt);
});

// adding event listener
// When a request is emitted from mumbai bridge to be relayed to goerli bridge
bridgeMumbai.on("RequestToRelay", async (data, nonce, sendingCounter, recievingCounter, event) => {
  console.log("\nRequest from Mumbai to Goerli received\n");
  console.log(`data => `, data);
  console.log(`nonce => `, nonce);
  console.log(`sendingCounter => `, sendingCounter);
  console.log(`recievingCounter => `, recievingCounter);

  // sending request to bridge on Goerli chain
  const tx = await bridgeGoerli.receiveFromRelayer(nonce, recievingCounter, data);
  const transactionReceipt = await tx.wait();
  console.log(transactionReceipt);
});
