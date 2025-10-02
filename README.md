# ChainBond

A privacy-preserving relationship scoring DApp using Zama FHEVM. It mirrors the official template patterns:
- Encrypted inputs with `FHE.fromExternal` and homomorphic ops on-chain
- Frontend decryption via Relayer SDK `userDecrypt` with an EIP-712 signature cache
- Optional Hardhat mock support via `@fhevm/mock-utils`

## Project layout

- `backend/`: Hardhat + Solidity (`ChainBond.sol`) with FHEVM patterns
- `frontend/`: Next.js app with FHEVM utilities and demo UI

## Prerequisites

- Node.js 18+
- pnpm or npm
- A Web3 wallet (MetaMask) for frontend

## Backend setup

1) Install deps
```bash
cd backend
npm install
```

2) Compile
```bash
npm run build
```

3) Run local node (optional, enables FHEVM mock when on `31337`)
```bash
npm run node
```

4) Deploy
- Localhost:
```bash
npm run deploy:localhost
```
- Sepolia:
```bash
# set env (optional)
set MNEMONIC="test test test test test test test test test test test junk"
set INFURA_API_KEY=your_infura_key
set SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/%INFURA_API_KEY%

npm run deploy:sepolia
```

5) Export ABI + addresses for frontend
```bash
npm run export-abi
```
This generates `frontend/abi/ChainBondABI.ts` and `frontend/abi/ChainBondAddresses.ts`.

## Frontend setup

1) Install deps
```bash
cd ../frontend
npm install
```

2) Generate ABI mapping (if not already exported)
```bash
npm run genabi
```

3) Run dev server
- If using local Hardhat:
```bash
npm run dev
```
- If using Sepolia, ensure you have a deployment and wallet connected to Sepolia.

4) Open the app at `http://localhost:3000`.

## Using the app

- Connect your wallet in the browser (MetaMask injects `window.ethereum`).
- Enter a friend `0x...` address and a score (0..100).
- Click "Rate" (or "Rate + CID") to submit an encrypted rating. The contract updates encrypted sum and count, and grants decrypt permission to both parties.
- Fetch encrypted stats and decrypt to see clear values. The Relayer SDK flow uses an EIP-712 signature cached in storage, identical to the official template.

## Notes on FHEVM usage

- On-chain: `ChainBond.sol` applies `FHE.fromExternal` for `externalEuint32` inputs, then uses `FHE.add` and grants decrypt rights via `FHE.allowThis` and `FHE.allow` to participants.
- Frontend: loads Relayer SDK from CDN, caches ACL public key + params in IndexedDB, builds an EIP-712 decryption signature, and calls `instance.userDecrypt` with `[ { handle, contractAddress } ]...` exactly as in the official template.

## Troubleshooting

- If using localhost, ensure your Hardhat node runs and exposes FHEVM relayer metadata; otherwise, the frontend will try the SDK path.
- If ABI files are missing, re-run backend `export-abi` or frontend `genabi`.
- Clear browser storage if signature schema changes.


