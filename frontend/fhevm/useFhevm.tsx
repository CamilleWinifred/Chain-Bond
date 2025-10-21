import { ethers } from "ethers";
import { useFhevm } from "./internal/fhevmHook";
export type { FhevmGoState } from "./internal/fhevmHook";
export type { FhevmInstance } from "./fhevmTypes";

export function useChainFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}) {
  return useFhevm(parameters);
}


