# Simple Messaging Bridge

## Overview

Bridges as used to transact across blockchains and promise a chain-agnostic future for web3. It solves the issue of interoperability across chains by allowing cross-chain transactions. These transactions utilise a bridge contract on all blockchains it supports and relays a message from a chain to another using a decentralized or centralized service in between to relay those transactions.

In this project, I have tried to create a system where we can increment counter across chains. One can create a cross-chain request on a chain A. The request is received by a relayer from chain A and is relayed to the chain B and executed which increments the counter on chain B by 1. A fee is taked from the user each time he/she creates a cross-chain request, which is sent to the Fee Manager contract. The fees can be withdrawn only by the relayer.

## Working

There are 3 smart contracts in total. The **Bridge** contract, the **Counter** contract and the **Fee Manager** contract. The user can call the **send** function on the Counter contract which will generate a cross-chain communication request on the Bridge contract by emitting an event named **RequestToRelay** along with the data to be relayed. This event is listened to by our relayer service and is relayed to the Bridge contract on the other chain by calling the **receiveFromRelayer** function with the required data. After some checks, this data is passed to the Counter contract on the second chain which then increments the counter by 1.

The Bridge contract also contains a **nonce structure** so that no nonce is executed twice. The nonce is incremented by 1 each time a request to relay is received from the Counter contract.

A **fee module** is also created to compensate the relayer for the funds. The fee can be set in the counter contract by the owner of the contract. For this project, I have restricted the fees to be set to be between 0 to 0.01 Native Token(Matic for Polygon, Ether for Ethereum). The fees can be set only by the owner and is paid everytime one creates a cross-chain request to increment the counter on another chain. This fee is sent to the FeeManager contract and can be withdrawn only by the relayer.

## Tech Stack

- Relayer - NodeJs, Typescript
- Blockchain - Solidity, Hardhat, EthersJs

## Steps to install and run the project

### Clone to local

```bash
$ git clone https://github.com/Shivam78288/Simple-Messaging-Bridge.git
$ cd Simple-Messaging-Bridge
$ yarn
```

### To run hardhat tests

```bash
$  npx hardhat test
```

### Fill up the .env file

- Create a file named .env in the root directory of the project.
- Add all the variables as suggested in .env.example.

  - PRIVATE_KEY = Using it to deploy contracts as well as relayer
  - RELAYER = Address of the relayer
  - MUMBAI_RPC= RPC of polygon mumbai testnet can be found in their doc or other providers like Quicknode and Alchemy
  - GOERLI_RPC = RPC of goerli testnet can be found on Infura or other providers
  - POLYGONSCAN_API_KEY = API key for polygonscan can be found on their website.
  - ETHERSCAN_API_KEY = API key for etherscan can be found on their website.

### Add Mumbai and Goerli network to metamask:

If you don't have Mumbai or Goerli testnet network added to Metamask,

- Go to https://chainlist.org/
- Toggle the testnets button on top
- Search for mumbai/goerli
- Click "connect wallet"
- Click "Add to Metamask"

Now the Metamask can connect to these networks.

### Deploy the smart contract to Mumbai and Goerli networks

```bash
$  npx hardhat compile
$  npx hardhat deploy:All --network goerli
$  npx hardhat verify:All --network goerli
$  npx hardhat deploy:All --network mumbai
$  npx hardhat verify:All --network mumbai
$  npx hardhat configure:Counter --network mumbai --destchainid 5
$  npx hardhat configure:Counter --network goerli --destchainid 80001
```

Now the FeeManager, Bridge and Counter smart contracts have been deployed to Goerli and Mumbai testnets.
The addresses to these contracts can be found in deployment/deployments.json.

### Run the Relayer

Open another terminal window to run the server(relayer)

```bash
$  ts-node relayer.js
```

Now, you can open the addresses on the respective explorers and try out the bridge.
