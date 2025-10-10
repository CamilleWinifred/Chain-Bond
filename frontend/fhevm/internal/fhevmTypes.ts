import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import type { FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/web";

export type FhevmRelayerSDKType = {
  __initialized__?: boolean;
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: FhevmInstanceConfig;
};

export type FhevmWindowType = Window & { relayerSDK: FhevmRelayerSDKType };

export type FhevmInitSDKOptions = {
  sharedMemAllocBytes?: number;
  simd?: boolean;
};

export type FhevmLoadSDKType = () => Promise<void>;
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;

// note: FhevmInstanceConfig comes from @zama-fhe/relayer-sdk/web


