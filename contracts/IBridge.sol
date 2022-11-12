// SPDX-License-Identifier: None
pragma solidity ^0.8.10;

interface IBridge {
    function send(address recievingCounter, bytes calldata data) external;
}
