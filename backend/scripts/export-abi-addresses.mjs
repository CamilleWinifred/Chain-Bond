import fs from "fs";
import path from "path";

const CONTRACT_NAME = "ChainBond";
const rel = "..";
const outdir = path.resolve(path.join(rel, "../frontend/abi"));
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

const deploymentsDir = path.join(path.resolve("."), "deployments");

function readDeployment(chainName, chainId, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(`Missing deployments for ${chainName}`);
      process.exit(1);
    }
    return undefined;
  }
  const jsonString = fs.readFileSync(path.join(chainDeploymentDir, `${CONTRACT_NAME}.json`), "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  return obj;
}

const deployLocalhost = readDeployment("localhost", 31337, true);
const deploySepolia = readDeployment("sepolia", 11155111, true);

if (!deployLocalhost && !deploySepolia) {
  console.error("Missing deployments for both localhost and sepolia");
  process.exit(1);
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const abiSource = (deployLocalhost?.abi ?? deploySepolia?.abi);
const localhostAddress = deployLocalhost?.address ?? ZERO_ADDRESS;
const sepoliaAddress = deploySepolia?.address ?? ZERO_ADDRESS;

const tsCode = `
/* Auto-generated */
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: abiSource }, null, 2)} as const;
`;
const tsAddresses = `
/* Auto-generated */
export const ${CONTRACT_NAME}Addresses = {
  "11155111": { address: "${sepoliaAddress}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${localhostAddress}", chainId: 31337, chainName: "hardhat" }
};
`;

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);


