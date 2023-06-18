import { AccessListish, BigNumberish, BytesLike } from "ethers";
import { Interface, InterfaceAbi } from "ethers";

/**
 * @constant LitChainIds
 * @description Represents the chain IDs for various blockchain networks.
 */
export const LitChainIds: { [key: string]: number } = {
  ethereum: 1,
  polygon: 137,
  fantom: 250,
  xdai: 100,
  bsc: 56,
  arbitrum: 42161,
  avalanche: 43114,
  fuji: 43113,
  harmony: 1666600000,
  kovan: 42,
  mumbai: 80001,
  goerli: 5,
  ropsten: 3,
  rinkeby: 4,
  cronos: 25,
  optimism: 10,
  celo: 42220,
  aurora: 1313161554,
  eluvio: 955305,
  alfajores: 44787,
  xdc: 50,
  evmos: 9001,
  evmosTestnet: 9000,
  hardhat: 31337,
};

/**
 * @enum CHAIN_NAME
 * @description Represents the names of various blockchain networks.
 */
export enum CHAIN_NAME {
  "ethereum",
  "polygon",
  "fantom",
  "xdai",
  "bsc",
  "arbitrum",
  "avalanche",
  "fuji",
  "harmony",
  "kovan",
  "mumbai",
  "goerli",
  "ropsten",
  "rinkeby",
  "cronos",
  "optimism",
  "celo",
  "aurora",
  "eluvio",
  "alfajores",
  "xdc",
  "evmos",
  "evmosTestnet",
  "hardhat",
}

/**
 * @enum RunStatus
 * @description Represents the status of the strategy run.
 */
export enum RunStatus {
  EXIT_RUN,
  ACTION_RUN,
  CONTINUE_RUN,
}

/**
 * @interface LitActionsSDK
 * @description Represents the SDK for Lit Actions.
 */
export interface LitActionsSDK {
  /**
   * Signs the provided data using ECDSA.
   * @param toSign - The data to sign.
   * @param publicKey - The public key to use for signing.
   * @param sigName - The signature name.
   */
  signEcdsa: ({
    toSign,
    publicKey,
    sigName,
  }: {
    toSign: Uint8Array;
    publicKey: string;
    sigName: string;
  }) => Promise<void>;

  /**
   * Retrieves the latest nonce for the specified chain.
   * @param chain - The chain for which to retrieve the latest nonce.
   * @returns The latest nonce as a number.
   */
  getLatestNonce: (chain: string) => Promise<number>;

  /**
   * Sets the response for the Lit Actions SDK.
   * @param response - The response to set.
   */
  setResponse: ({ response }: { response: string }) => void;
}

/**
 * @interface UnsignedTransaction
 * @description Represents an unsigned transaction.
 */
export type UnsignedTransaction = {
  to?: string;
  nonce?: number;

  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;

  data?: BytesLike;
  value?: BigNumberish;
  chainId?: number;

  // Typed-Transaction features
  type?: number | null;

  // EIP-2930; Type 1 & EIP-1559; Type 2
  accessList?: AccessListish;

  // EIP-1559; Type 2
  maxPriorityFeePerGas?: BigNumberish;
  maxFeePerGas?: BigNumberish;
};

/**
 * @interface LitUnsignedTransaction
 * @description Represents a Lit-specific unsigned transaction.
 */
export type LitUnsignedTransaction = UnsignedTransaction & { from: string };

/**
 * @interface CustomAction
 * @description Represents an action that's custom-defined by the user.
 * @property type - The type of the action, always "custom" for this interface.
 * @property priority - A numerical value representing the priority of the action. The lower the value, the higher the priority.
 * @property code - A function representing the custom action to be performed. This function is defined by the user.
 */
export interface CustomAction {
  type: "custom";
  priority: number;
  code: () => Promise<void>;
  args?: Object;
}

/**
 * @interface ContractAction
 * @description Represents an action that interacts with an Ethereum smart contract.
 * @property type - The type of the action, always "contract" for this interface.
 * @property priority - A numerical value representing the priority of the action. The lower the value, the higher the priority.
 * @property contractAddress - The Ethereum address of the smart contract with which to interact.
 * @property abi - The ABI (Application Binary Interface) of the smart contract, which describes its functions and events.
 * @property functionName - The name of the smart contract function to call.
 * @property args - An array of arguments to pass to the function call.
 */
export interface ContractAction {
  type: "contract";
  priority: number;
  contractAddress: `0x${string}`;
  abi: InterfaceAbi;
  functionName: string;
  chainId: string;
  nonce?: number;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  value?: BigNumberish;
  from?: string;
  maxPriorityFeePerGas?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  args?: any[];
}

export interface FetchAction {
  /**
   * The type of the action, always "fetch" for this interface.
   */
  type: "fetch";
  /**
   * A numerical value representing the priority of the action. The lower the value, the higher the priority.
   */
  priority: number;
  /**
   * The base URL of the API endpoint.
   */
  baseUrl: string;
  /**
   * The specific endpoint to fetch.
   */
  endpoint: string;
  /**
   * The path to access the expected value in the response body.
   */
  responsePath: string;
  /**
   * Optional API key for authorization.
   */
  apiKey?: string;
  /**
   * The data to sign.
   */
  toSign: string;
  /**
   * The signature name.
   */
  sigName: string;
  /**
   * The condition under which to sign the data.
   */
  signCondition?: {
    type: "&&" | "||";
    operator: "<" | ">" | "==" | "===" | "!==" | "!=" | ">=" | "<=";
    value:
      | number
      | string
      | bigint
      | string[]
      | number[]
      | bigint[]
      | undefined;
  }[];
}

/**
 * @type Action
 * @description Represents an action that can either be a custom-defined action, fetch action or a smart contract interaction.
 */
export type Action = CustomAction | ContractAction | FetchAction;

/**
 * @interface IConditionalLogic
 * @description Represents the logic for a conditional operation.
 * @property type - The type of the conditional logic. It can be "THRESHOLD", "TARGET", or "EVERY".
 * @property value - Used when the type is "THRESHOLD". It's the threshold value for the condition.
 * @property targetCondition - Used when the type is "TARGET". It's the specific condition that must be met.
 * @property interval - Optional. It's the frequency of condition checks. If omitted, the condition is checked continuously.
 */

export interface IConditionalLogic {
  type: "THRESHOLD" | "TARGET" | "EVERY";
  value?: number;
  targetCondition?: string;
  interval?: number;
}

/**
 * @interface IContractCondition
 * @description Defines the shape of a contract condition object.
 * @property contractAddress - The address of the contract to monitor.
 * @property abi - The ABI (Application Binary Interface) of the contract.
 * @property eventName - The name of the contract event to monitor.
 * @property expectedValue - The value that will be matched against the emitted value.
 * @property onMatched - A callback function that will be invoked when the emitted value matches the expected value.
 * @property onUnMatched - A callback function that will be invoked when the emitted value does not match the expected value.
 * @property onError - A callback function that will be invoked when an error occurs during monitoring.
 */
export interface IContractCondition {
  contractAddress: `0x${string}`;
  abi: Interface | InterfaceAbi;
  chainId: string;
  eventName: string;
  expectedValue: number | string | number[] | string[] | bigint | bigint[];
  onMatched: () => Promise<void>;
  onUnMatched: () => Promise<void>;
  onError: (error: Error) => void;
}

/**
 * @class ContractCondition
 * @description Implements the IContractCondition interface to provide typing for contract conditions.
 */
export class ContractCondition implements IContractCondition {
  id?: string;
  providerURL?: string;
  sdkOnMatched?: () => Promise<void>;
  sdkOnUnMatched?: () => Promise<void>;

  /**
   * @constructor
   * @description Constructs an instance of ContractCondition.
   * @param id - A unique identifier for this condition.
   * @param contractAddress - The address of the contract to monitor.
   * @param abi - The ABI of the contract.
   * @param eventName - The name of the event to monitor.
   * @param expectedValue - The value that will be matched against the emitted value.
   * @param onMatched - A callback function to execute when the emitted value matches the expected value.
   * @param onUnMatched - A callback function to execute when the emitted value does not match the expected value.
   * @param onError - A callback function to execute when an error occurs during monitoring.
   * @param providerURL - The URL of the Ethereum provider.
   * @param sdkOnMatched - A callback function to execute when the emitted value matches the expected value in the SDK.
   * @param sdkOnUnMatched - A callback function to execute when the emitted value does not match the expected value in the SDK.
   */
  constructor(
    id: string | undefined,
    public contractAddress: `0x${string}`,
    public abi: Interface | InterfaceAbi,
    public eventName: string,
    public chainId: string,
    public expectedValue:
      | number
      | string
      | number[]
      | string[]
      | bigint
      | bigint[],
    public onMatched: () => Promise<void> = async () => {},
    public onUnMatched: () => Promise<void> = async () => {},
    public onError: (error: Error) => void = () => {},
    providerURL: string | undefined,
    sdkOnMatched: () => Promise<void> = async () => {},
    sdkOnUnMatched: () => Promise<void> = async () => {},
  ) {
    this.id = id;
    this.providerURL = providerURL;
    this.sdkOnMatched = sdkOnMatched;
    this.sdkOnUnMatched = sdkOnUnMatched;
  }
}

/**
 * @interface IWebhookCondition
 * @description Defines the shape of a webhook condition object.
 * @property baseUrl - The base URL of the webhook endpoint.
 * @property endpoint - The specific endpoint for the webhook.
 * @property responsePath - The path to access the expected value in the response body.
 * @property expectedValue - The value to match against the emitted value.
 * @property apiKey - Optional API key for authorization.
 * @property onMatched - A callback function to execute when the emitted value matches the expected value.
 * @property onUnMatched - A callback function to execute when the emitted value does not match the expected value.
 * @property onError - A callback function to execute when an error occurs during monitoring.
 */
export interface IWebhookCondition {
  baseUrl: string;
  endpoint: string;
  responsePath: string;
  expectedValue: number | string | number[] | string[] | bigint | bigint[];
  apiKey?: string;
  onMatched: () => Promise<void>;
  onUnMatched: () => Promise<void>;
  onError: (error: Error) => void;
}

/**
 * @class WebhookCondition
 * @description Implements the IWebhookCondition interface to provide typing for webhook conditions.
 */
export class WebhookCondition implements IWebhookCondition {
  id?: string;
  sdkOnMatched?: () => Promise<void>;
  sdkOnUnMatched?: () => Promise<void>;

  /**
   * @constructor
   * @description Constructs an instance of WebhookCondition.
   * @param id - A unique identifier for this condition.
   * @param baseUrl - The base URL of the webhook endpoint.
   * @param endpoint - The specific endpoint for the webhook.
   * @param responsePath - The path to access the expected value in the response body.
   * @param expectedValue - The value to match against the emitted value.
   * @param apiKey - Optional API key for authorization.
   * @param onMatched - A callback function to execute when the emitted value matches the expected value.
   * @param onUnMatched - A callback function to execute when the emitted value does not match the expected value.
   * @param onError - A callback function to execute when an error occurs during monitoring.
   * @param sdkOnMatched - A callback function to execute when the emitted value matches the expected value in the SDK.
   * @param sdkOnUnMatched - A callback function to execute when the emitted value does not match the expected value in the SDK.
   */

  constructor(
    id: string | undefined,
    public baseUrl: string,
    public endpoint: string,
    public responsePath: string,
    public expectedValue:
      | number
      | string
      | number[]
      | string[]
      | bigint
      | bigint[],
    public apiKey?: string,
    public onMatched: () => Promise<void> = async () => {},
    public onUnMatched: () => Promise<void> = async () => {},
    public onError: (error: Error) => void = () => {},
    sdkOnMatched: () => Promise<void> = async () => {},
    sdkOnUnMatched: () => Promise<void> = async () => {},
  ) {
    this.id = id;
    this.sdkOnMatched = sdkOnMatched;
    this.sdkOnUnMatched = sdkOnUnMatched;
  }
}

export type Condition = ContractCondition | WebhookCondition;
