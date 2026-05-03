import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const CONTRACT_PATH = resolve(ROOT, "contracts/Foundry7857.sol");
const RPC_URL = process.env.OG_EVM_RPC || "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.OG_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("ERROR: OG_PRIVATE_KEY env var is required");
  process.exit(1);
}

console.log("Reading contract from", CONTRACT_PATH);
const source = readFileSync(CONTRACT_PATH, "utf8");

console.log("Compiling with solc", solc.version());
const input = {
  language: "Solidity",
  sources: { "Foundry7857.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const fatal = output.errors.filter((e) => e.severity === "error");
  if (fatal.length) {
    console.error("Compilation errors:");
    for (const e of fatal) console.error(e.formattedMessage);
    process.exit(1);
  }
  for (const e of output.errors) console.warn(e.formattedMessage);
}

const contractName = Object.keys(output.contracts["Foundry7857.sol"])[0];
const compiled = output.contracts["Foundry7857.sol"][contractName];
const abi = compiled.abi;
const bytecode = "0x" + compiled.evm.bytecode.object;
console.log("Compiled", contractName, "bytecode length:", bytecode.length);

writeFileSync(
  resolve(ROOT, "contracts/Foundry7857.abi.json"),
  JSON.stringify(abi, null, 2),
);
console.log("ABI written to contracts/Foundry7857.abi.json");

console.log("Connecting to", RPC_URL);
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const network = await provider.getNetwork();
const balance = await provider.getBalance(wallet.address);
console.log("Wallet:", wallet.address);
console.log("Network chainId:", network.chainId.toString());
console.log("Balance:", ethers.formatEther(balance), "OG");

if (balance === 0n) {
  console.error("ERROR: wallet has 0 balance. Fund it via https://faucet.0g.ai");
  process.exit(1);
}

const factory = new ethers.ContractFactory(abi, bytecode, wallet);
console.log("Deploying...");
const contract = await factory.deploy();
const txHash = contract.deploymentTransaction()?.hash;
console.log("Tx:", txHash);
console.log("Waiting for confirmation...");
await contract.waitForDeployment();
const address = await contract.getAddress();

console.log("\n========================================");
console.log("DEPLOYED:", address);
console.log("Explorer: https://chainscan-galileo.0g.ai/address/" + address);
console.log("Tx:       https://chainscan-galileo.0g.ai/tx/" + txHash);
console.log("========================================");
console.log("\nNext: add this to Replit Secrets as FOUNDRY_CONTRACT_ADDRESS");
