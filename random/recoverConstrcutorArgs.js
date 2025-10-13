// npm i ethers
import { ethers } from "@armchain-ethersv6/ethers";

// Constructor arguments
const name = "ArmToken";
const symbol = "ARM_T";
const totalSupply = 1800000; // 18 million tokens

// Constructor types
const constructorTypes = ["string", "string", "uint256"];

// Encode the constructor arguments
const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(constructorTypes, [name, symbol, totalSupply]);

console.log("Constructor arguments:");
console.log("Name:", name);
console.log("Symbol:", symbol);
console.log("Total Supply:", totalSupply);
console.log("\nABI Encoded constructor arguments:");
console.log(encodedArgs);
