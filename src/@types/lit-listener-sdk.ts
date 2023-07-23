import { BigNumberish, BytesLike, ethers } from "ethers";
import { AccessListish } from "ethers/lib/utils";

/**
 * @constant LitChainIds
 * @description Represents the chain IDs for various blockchain networks.
 */
export const LitChainIds: { [key: string]: number } = {
  ethereum: 1,
  polygon: 137,
  fantom: 250,
  bsc: 56,
  arbitrum: 42161,
  avalanche: 43114,
  fuji: 43113,
  harmony: 1666600000,
  mumbai: 80001,
  goerli: 5,
  cronos: 25,
  optimism: 10,
  celo: 42220,
  aurora: 1313161554,
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
  ETHEREUM = "ethereum",
  POLYGON = "polygon",
  FANTOM = "fantom",
  BSC = "bsc",
  ARBITRUM = "arbitrum",
  AVALANCHE = "avalanche",
  FUJI = "fuji",
  HARMONY = "harmony",
  MUMBAI = "mumbai",
  GOERLI = "goerli",
  CRONOS = "cronos",
  OPTIMISM = "optimism",
  CELO = "celo",
  AURORA = "aurora",
  ALFAJORES = "alfajores",
  XDC = "xdc",
  EVMOS = "evmos",
  EVMOSTESTNET = "evmosTestnet",
  HARDHAT = "hardhat",
}

/**
 * @enum RunStatus
 * @description Represents the status of the circuit run.
 */
export enum RunStatus {
  EXIT_RUN = 0,
  ACTION_RUN = 1,
  CONTINUE_RUN = 2,
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
    publicKey: `0x04${string}` | string;
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
export type UnsignedTransactionData = {
  contractAddress?: `0x${string}`;
  nonce?: number;

  gasLimit?: BigNumberish;

  value?: BigNumberish;
  chainId?: CHAIN_NAME;

  // EIP-1559; Type 2
  maxPriorityFeePerGas?: BigNumberish;
  maxFeePerGas?: BigNumberish;

  from: `0x${string}`;
  functionName: string;
  args: any[];
  abi: ethers.ContractInterface;
};

/**
 * @interface UnsignedTransaction
 * @description Represents an unsigned transaction.
 */
export type UnsignedTransaction = {
  to?: `0x${string}`;
  nonce?: number;

  gasLimit?: BigNumberish;

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
export type LitUnsignedTransaction = UnsignedTransaction & {
  from: `0x${string}` | "{{publicKey}}";
};

/**
 * @interface CustomAction
 * @description Represents an action that's custom-defined by the user.
 * @property type - The type of the action, always "custom" for this interface.
 * @property priority - A numerical value representing the priority of the action. The lower the value, the higher the priority.
 * @property code - A function string representing the custom action to be performed. This function is defined by the user.
 * @property args - Any args used within the contract to be passed to the Lit Action.
 */
export interface CustomAction {
  type: "custom";
  priority: number;
  code: string;
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
 * @property chainId - The compatible blockchain network chainId.
 * @property providerURL - The provider URL compatible with the network specified.
 * @property nonce - The transaction nonce.
 * @property gasLimit - The transaction gas limit.
 * @property value - Any value to be passed with the transaction.
 * @property from - The address from which the transaction as called. This will usually be the PKP address.
 * @property maxPriorityFeePerGas - The max priority fee per gas for the transaction.
 * @property maxFeePerGas - The max fee per gas for the transaction.
 * @property args - An array of arguments to pass to the function call.
 */
export interface ContractAction {
  type: "contract";
  priority: number;
  contractAddress: `0x${string}`;
  abi: ethers.ContractInterface;
  functionName: string;
  chainId: CHAIN_NAME;
  providerURL: string;
  nonce?: number;
  gasLimit?: BigNumberish;
  value?: BigNumberish;
  from?: `0x${string}`;
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
   * Optional data to sign. If left blank the returned response will be signed.
   */
  toSign?: Uint8Array;
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
      | undefined
      | (string | number | bigint)[];
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
 * @property value - Used when the type is "THRESHOLD". It's the threshold number of conditions that must have passed in order for the Lit Action to run.
 * @property targetCondition - Used when the type is "TARGET". It's the specific Condition Id (In order of Conditions Added to Array) that must be met in order for the Lit Action to run.
 * @property interval - Optional. It's the frequency of condition checks. If omitted, the condition is checked every 30 minutes (1,800,000 ms). Resolves in milliseconds.
 */
export interface IThresholdConditionalLogic {
  type: "THRESHOLD";
  value: number;
  interval?: number;
}

export interface ITargetConditionalLogic {
  type: "TARGET";
  targetCondition: string;
  interval?: number;
}

export interface IEveryConditionalLogic {
  type: "EVERY";
  interval?: number;
}

export type IConditionalLogic =
  | IThresholdConditionalLogic
  | ITargetConditionalLogic
  | IEveryConditionalLogic;

/**
 * @interface IContractCondition
 * @description Defines the shape of a contract condition object.
 * @property contractAddress - The address of the contract to monitor.
 * @property abi - The ABI (Application Binary Interface) of the contract.
 * @property chainId - The Lit supported blockchain network chainId.
 * @property providerURL - The Provider URL compatible with the chosen network.
 * @property eventName - The name of the contract event to monitor.
 * @property eventArgName - The name of the event arg/s that the expectedValue will be matched against.
 * @property expectedValue - The value that will be matched against the emitted value.
 * @property matchOperator - The operator used for the comparison. It must be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
 * @property onMatched - A callback function that will be invoked when the emitted value matches the expected value.
 * @property onUnMatched - A callback function that will be invoked when the emitted value does not match the expected value.
 * @property onError - A callback function that will be invoked when an error occurs during monitoring.
 */
export interface IContractCondition {
  contractAddress: `0x${string}`;
  abi: ethers.ContractInterface;
  chainId: CHAIN_NAME;
  providerURL: string;
  eventName: string;
  eventArgName: string[];
  expectedValue:
    | number[]
    | string[]
    | bigint[]
    | object[]
    | (string | number | bigint | object)[];
  matchOperator: "<" | ">" | "==" | "===" | "!==" | "!=" | ">=" | "<=";
  onMatched: (
    emittedValue:
      | number[]
      | string[]
      | bigint[]
      | object[]
      | (string | number | bigint | object)[],
  ) => Promise<void>;
  onUnMatched: (
    emittedValue:
      | number[]
      | string[]
      | bigint[]
      | object[]
      | (string | number | bigint | object)[],
  ) => Promise<void>;
  onError: (error: Error) => void;
}

/**
 * @class ContractCondition
 * @description Implements the IContractCondition interface to provide typing for contract conditions.
 */
export class ContractCondition implements IContractCondition {
  /**
   * @param id - A unique identifier for this condition.
   * @param providerURL - The URL of the Ethereum provider.
   * @param sdkOnMatched - A callback function to execute when the emitted value matches the expected value in the SDK.
   * @param sdkOnUnMatched - A callback function to execute when the emitted value does not match the expected value in the SDK.
   * */
  id?: string;
  sdkOnMatched?: () => Promise<void>;
  sdkOnUnMatched?: () => Promise<void>;

  /**
   * @constructor
   * @description Constructs an instance of ContractCondition.
   * @param contractAddress - The address of the contract to monitor.
   * @param abi - The ABI of the contract.
   * @param chainId - The chainId.
   * @param providerURL - The provider URL compatible to the chainId.
   * @param eventName - The name of the event to monitor.
   * @param eventArgName -
   * @param expectedValue - The value that will be matched against the emitted value.
   * @param matchOperator - The operator used for the comparison. It must be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
   * @param onMatched - A callback function to execute when the emitted value matches the expected value.
   * @param onUnMatched - A callback function to execute when the emitted value does not match the expected value.
   * @param onError - A callback function to execute when an error occurs during monitoring.
   */
  constructor(
    public contractAddress: `0x${string}`,
    public abi: ethers.ContractInterface,
    public chainId: CHAIN_NAME,
    public providerURL: string,
    public eventName: string,
    public eventArgName: string[],
    public expectedValue:
      | number[]
      | string[]
      | bigint[]
      | object[]
      | (string | number | bigint | object)[],
    public matchOperator: "<" | ">" | "==" | "===" | "!==" | "!=" | ">=" | "<=",
    public onMatched: (
      emittedValue:
        | number[]
        | string[]
        | bigint[]
        | object[]
        | (string | number | bigint | object)[],
    ) => Promise<void> = async () => {},
    public onUnMatched: (
      emittedValue:
        | number[]
        | string[]
        | bigint[]
        | object[]
        | (string | number | bigint | object)[],
    ) => Promise<void> = async () => {},
    public onError: (error: Error) => void = () => {},
  ) {}
}

/**
 * @interface IWebhookCondition
 * @description Defines the shape of a webhook condition object.
 * @property baseUrl - The base URL of the webhook endpoint.
 * @property endpoint - The specific endpoint for the webhook.
 * @property responsePath - The path to access the expected value in the response body.
 * @property expectedValue - The value to match against the emitted value.
 * @property matchOperator - The operator used for the comparison. It must be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
 * @property apiKey - Optional API key for authorization.
 * @property onMatched - A callback function to execute when the emitted value matches the expected value.
 * @property onUnMatched - A callback function to execute when the emitted value does not match the expected value.
 * @property onError - A callback function to execute when an error occurs during monitoring.
 */
export interface IWebhookCondition {
  baseUrl: string;
  endpoint: string;
  responsePath: string;
  expectedValue:
    | number
    | string
    | number[]
    | string[]
    | bigint
    | bigint[]
    | object
    | object[]
    | (string | number | bigint | object)[];
  matchOperator: "<" | ">" | "==" | "===" | "!==" | "!=" | ">=" | "<=";
  apiKey?: string;
  onMatched: (
    emittedValue:
      | number
      | string
      | number[]
      | string[]
      | bigint
      | bigint[]
      | object
      | object[]
      | (string | number | bigint | object)[],
  ) => Promise<void>;
  onUnMatched: (
    emittedValue:
      | number
      | string
      | number[]
      | string[]
      | bigint
      | bigint[]
      | object
      | object[]
      | (string | number | bigint | object)[],
  ) => Promise<void>;
  onError: (error: Error) => void;
}

/**
 * @class WebhookCondition
 * @description Implements the IWebhookCondition interface to provide typing for webhook conditions.
 */
export class WebhookCondition implements IWebhookCondition {
  /**
   * @param id - A unique identifier for this condition.
   * @param sdkOnMatched - A callback function to execute when the emitted value matches the expected value in the SDK.
   * @param sdkOnUnMatched - A callback function to execute when the emitted value does not match the expected value in the SDK.
   * */
  id?: string;
  sdkOnMatched?: () => Promise<void>;
  sdkOnUnMatched?: () => Promise<void>;

  /**
   * @constructor
   * @description Constructs an instance of WebhookCondition.
   * @param baseUrl - The base URL of the webhook endpoint.
   * @param endpoint - The specific endpoint for the webhook.
   * @param responsePath - The path to access the expected value in the response body.
   * @param expectedValue - The value to match against the emitted value.
   * @param matchOperator - The operator used for the comparison. It must be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
   * @param apiKey - Optional API key for authorization.
   * @param onMatched - A callback function to execute when the emitted value matches the expected value.
   * @param onUnMatched - A callback function to execute when the emitted value does not match the expected value.
   * @param onError - A callback function to execute when an error occurs during monitoring.
   */
  constructor(
    public baseUrl: string,
    public endpoint: string,
    public responsePath: string,
    public expectedValue:
      | number
      | string
      | number[]
      | string[]
      | bigint
      | bigint[]
      | object
      | object[]
      | (string | number | bigint | object)[],
    public matchOperator: "<" | ">" | "==" | "===" | "!==" | "!=" | ">=" | "<=",
    public apiKey?: string,
    public onMatched: (
      emittedValue:
        | number
        | string
        | number[]
        | string[]
        | bigint
        | bigint[]
        | object
        | object[]
        | (string | number | bigint | object)[],
    ) => Promise<void> = async () => {},
    public onUnMatched: (
      emittedValue:
        | number
        | string
        | number[]
        | string[]
        | bigint
        | bigint[]
        | object
        | object[]
        | (string | number | bigint | object)[],
    ) => Promise<void> = async () => {},
    public onError: (error: Error) => void = () => {},
  ) {}
}

export type Condition = ContractCondition | WebhookCondition;

/**
 * @interface IExecutionConstraints
 * @description Represents the execution constraints for running the circuit.
 * @property conditionMonitorExecutions - Optional. The maximum amount of times that the circuit will run before 
    stopping, inclusive of conditions on matched, on unmatched and conditional logic failures.
 * @property startDate - Optional. The circuit will not run before this date.
 * @property endDate - Optional. The circuit will stop running once this date has passed.
 * @property maxLitActionCompletions - Optional. The maximum amount of times that the Lit Action code will be 
    executed before the circuit stops running. This is a full run of the circuit.
 */
export interface IExecutionConstraints {
  conditionMonitorExecutions?: number;
  startDate?: Date;
  endDate?: Date;
  maxLitActionCompletions?: number;
}

export enum LogCategory {
  ERROR = 0,
  RESPONSE = 1,
  CONDITION = 2,
  BROADCAST = 3,
  EXECUTION = 4,
}

export interface ILogEntry {
  category: LogCategory;
  message: string;
  responseObject: string;
  isoDate: string
}

export type LitAuthSig = {
  sig: string;
  derivedVia: string;
  signedMessage: string;
  address: string;
};
