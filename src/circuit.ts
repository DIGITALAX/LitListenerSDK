import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { serialize } from "@ethersproject/transactions";
import { EventEmitter } from "events";
import { BigNumber, Contract, ethers } from "ethers";
import Hash from "ipfs-only-hash";
import {
  bundleCodeManual,
  generateSessionSig,
  generateSecureRandomKey,
  getBytesFromMultihash,
  hashHex,
} from "./utils/litProtocol";
import { AuthSig, LIT_NETWORKS_KEYS, SessionSigsMap } from "@lit-protocol/types";
import { joinSignature } from "@ethersproject/bytes";
import {
  PKP_CONTRACT_ADDRESS,
  PKP_HELPER_CONTRACT_ADDRESS,
  PKP_PERMISSIONS_CONTRACT_ADDRESS,
} from "./constants";
import pkpNftAbi from "./abis/PKPNFT.json";
import pkpHelperAbi from "./abis/PKPHelper.json";
import pkpPermissionsAbi from "./abis/PKPPermissions.json";
import { PKPNFT } from "../typechain-types/contracts/PKPNFT";
import {
  Action,
  Condition,
  ContractAction,
  CustomAction,
  IConditionalLogic,
  IExecutionConstraints,
  ILogEntry,
  LitChainIds,
  LitUnsignedTransaction,
  LogCategory,
  RunStatus,
  UnsignedTransactionData,
} from "./@types/lit-listener-sdk";
import { ConditionMonitor } from "./conditions";
import { Fragment } from "ethers/lib/utils";
import { LitResourceAbilityRequest } from "@lit-protocol/auth-helpers";

export class Circuit extends EventEmitter {
  /**
   * Boolean for locking start into one concurrent run.
   * @private
   */
  private isRunning: boolean = false;
  /**
   * Boolean for setting a secure key for the Lit Action.
   * @private
   */
  private useSecureKey: boolean = false;
  /**
   * The array of conditions.
   * @private
   */
  private conditions: Condition[] = [];
  /**
   * Stores pending promise broadcasts for clean up.
   * @private
   */
  private pendingBroadcasts: Promise<PromiseSettledResult<void>[]>[] = [];
  /**
   * The condition monitor instance.
   * @private
   */
  private monitor: ConditionMonitor;
  /**
   * The conditional logic for executing actions.
   * @private
   */
  private conditionalLogic?: IConditionalLogic;
  /**
   * Set of condition IDs that have been satisfied.
   * @private
   */
  private satisfiedConditions: Set<string> = new Set();
  /**
   * The array of actions to be executed.
   * @private
   */
  private actions: Action[] = [];
  /**
   * The count of executed actions.
   * @private
   */
  private conditionExecutedCount: number = 0;
  /**
   * The count of successfully completed actions.
   * @private
   */
  private litActionCompletionCount: number = 0;
  /**
   * The maximum number of executions allowed.
   * @private
   */
  private conditionMonitorExecutions?: number;
  /**
   * The start date for executing actions.
   * @private
   */
  private startDate?: Date;
  /**
   * The end date for executing actions.
   * @private
   */
  private endDate?: Date;
  /**
   * The maximum number of successful completions allowed.
   * @private
   */
  private maxLitActionCompletions?: number;
  /**
   * The size of the log array.
   * @private
   */
  private logSize = 1000;
  /**
   * The array of log messages.
   * @private
   */
  private logs: ILogEntry[] = new Array(this.logSize);
  /**
   * The current index of the log array.
   * @private
   */
  private logIndex = 0;
  /**
   * The signer instance for Ethereum transactions.
   * @private
   */
  private signer: ethers.Signer;
  /**
   * The LitNodeClient instance for interacting with Lit Protocol.
   * @private
   */
  private litClient: LitJsSdk.LitNodeClient;
  /**
   * The PKPNFT contract instance.
   * @private
   */
  private pkpContract: PKPNFT;

  /**
   * The PKPHelper contract instance.
   * @private
   */
  private pkpHelperContract: any;

  /**
   * The code for the Lit Action.
   * @private
   */
  private code: string = "";
  /**
   * The secure key inputted by the developer.
   * @private
   */
  private secureKey: string;
  /**
   * The IPFS CID of the Lit Action code.
   * @private
   */
  private ipfsCID: string;
  /**
   * The public key of the PKP contract.
   * @private
   */
  private publicKey: `0x04${string}` | string;
  /**
   * The ethereum Address of the public key.
   * @private
   */
  private pkpAddress: `0x${string}` | string;
  /**
   * The authentication signature for executing Lit Actions.
   * @private
   */
  private authSig: AuthSig;
  /**
   * Flag indicating if the action helper function has been set.
   * @private
   */
  private hasSetActionHelperFunction = false;
  /**
   * Flag indicating whether to continue running the circuit.
   * @private
   */
  private continueRun: boolean = true;
  /**
   * Flag indicating whether to continue running the circuit.
   * @private
   */
  private actionFunctions: Set<string>;
  /**
   * The EventEmitter instance for handling events.
   * @private
   */
  private emitter = new EventEmitter();
  /**
   * The additional parameters for the Lit Action code.
   * @private
   */
  private jsParameters: Object = {};
  /**
   * Flag indicating whether to strict error throwing is enabled.
   * @private
   */
  private errorHandlingModeStrict: boolean = false;
  /**
   * Map of last successful nonces.
   * @private
   */
  private lastSuccessfulNonce: Map<number, number> = new Map();

  private sessionSig: SessionSigsMap;

  /**
   * Creates an instance of Circuit.
   * @param signer The Ethereum signer for transactions.
   * @param pkpContractAddress The address of the PKPNFT contract.
   * @param errorHandlingModeStrict Strict error handling enabled or not.
   */
  constructor(
    signer?: ethers.Signer,
    litNetwork?: LIT_NETWORKS_KEYS,
    pkpContractAddress = PKP_CONTRACT_ADDRESS,
    pkpHelperContractAddress = PKP_HELPER_CONTRACT_ADDRESS,
    errorHandlingModeStrict: boolean = false,
  ) {
    super();
    this.errorHandlingModeStrict = errorHandlingModeStrict;
    this.signer = signer ? signer : ethers.Wallet.createRandom();
    this.litClient = new LitJsSdk.LitNodeClient({
      litNetwork: litNetwork ?? 'cayenne',
      debug: false,
    });
    this.monitor = new ConditionMonitor();
    this.conditionalLogic = { type: "EVERY", interval: 1800000 };
    this.monitor.on(
      "conditionMatched",
      (
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
      ) => {
        this.log(
          LogCategory.CONDITION,
          `Condition Matched with Emitted Value: `,
          JSON.stringify(emittedValue),
          new Date().toISOString(),
        );
      },
    );
    this.monitor.on(
      "conditionNotMatched",
      (
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
      ) => {
        this.log(
          LogCategory.CONDITION,
          `Condition Not Matched with Emitted Value: `,
          JSON.stringify(emittedValue),
          new Date().toISOString(),
        );
      },
    );
    this.monitor.on("conditionError", (error, condition: Condition) => {
      this.log(
        LogCategory.ERROR,
        `Error in condition monitoring with condition ${condition.id}`,
        typeof error === "object" ? JSON.stringify(error) : error,
        new Date().toISOString(),
      );
    });
    this.actionFunctions = new Set<string>();
    this.pkpContract = new ethers.Contract(
      pkpContractAddress,
      pkpNftAbi,
      this.signer,
    ) as any;

    this.pkpHelperContract = new ethers.Contract(
      pkpHelperContractAddress,
      pkpHelperAbi,
      this.signer,
    );

    this.emitter.on("stop", () => {
      this.continueRun = false;
    });
  }

  /**
   * Sets the specified conditions to the circuit.
   * @param conditions The array of webhook and/or contract conditions.
   */
  setConditions = (conditions: Condition[]): void => {
    conditions.forEach((condition) => {
      condition.id = (this.conditions.length + 1).toString();
      this.conditions.push(condition);
    });
  };

  /**
   * Sets the conditional logic for executing actions.
   * @param logic The conditional logic object.
   */
  setConditionalLogic = (logic: IConditionalLogic): void => {
    this.conditionalLogic = logic;
  };

  /**
   * Sets the execution constraints for running the circuit.
   * @param options The options object for execution constraints.
   */
  executionConstraints = (options: IExecutionConstraints): void => {
    this.conditionMonitorExecutions = options.conditionMonitorExecutions;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.maxLitActionCompletions = options.maxLitActionCompletions;
  };

  /**
   * Sets the specified actions to the circuit.
   * @param actions The array of actions to be executed.
   * @param useSecureKey Set a secure key to enable only verified accounts to run the LitAction.
   * @returns The generated code for the actions, the unsigned transaction data object generated from contract actions and the secureKey to be provided when running the LitAction.
   */
  setActions = async (
    actions: Action[],
    useSecureKey: boolean = false,
  ): Promise<{
    unsignedTransactionDataObject: { [key: string]: LitUnsignedTransaction };
    litActionCode: string;
    secureKey: string;
  }> => {
    this.useSecureKey = useSecureKey;
    if (this.useSecureKey) {
      this.secureKey = generateSecureRandomKey();
    }
    this.actions = this.actions.concat(actions);
    let unsignedTransactionDataObject: {
      [key: string]: LitUnsignedTransaction;
    } = {};

    if (!this.hasSetActionHelperFunction) {
      this.code += `const CONDITIONAL_HASH = "${hashHex(this.secureKey)}";
  
      const hashHex = async (input) => {
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
        return new Uint8Array(hash);
      }; 

      const concatenatedResponse = {};

      const hashTransaction = (tx) => {
        return ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.arrayify(ethers.utils.serializeTransaction(tx)),
          ),
        );
      };

      const checkSignCondition = (responseValue, signCondition) => {
        if (!signCondition) return true;
  
        return signCondition.reduce((previousResult, currentCondition) => {
          const { type, operator, value: conditionValue } = currentCondition;
          let result;
  
          switch (operator) {
            case "<":
              result = responseValue < conditionValue;
              break;
            case ">":
              result = responseValue > conditionValue;
              break;
            case "==":
              result = responseValue == conditionValue;
              break;
            case "===":
              result = responseValue === conditionValue;
              break;
            case "!==":
              result = responseValue !== conditionValue;
              break;
            case "!=":
              result = responseValue != conditionValue;
              break;
            case ">=":
              result = responseValue >= conditionValue;
              break;
            case "<=":
              result = responseValue <= conditionValue;
              break;
            default:
              console.log('Error in checking sign condition: Invalid operator.');
          }
  
          return type === '&&' ? (previousResult && result) : (previousResult || result);
        }, signCondition[0].type === '&&');
      }\n\n
        `;
      this.hasSetActionHelperFunction = true;
    }

    const uniquePriorities = new Set();

    this.actions.forEach((action) => {
      if (uniquePriorities.has(action.priority)) {
        throw new Error(
          `Action with priority ${action.priority} already exists.`,
        );
      }
      uniquePriorities.add(action.priority);
    });

    this.actions.sort((a, b) => a.priority - b.priority);

    for (const action of this.actions) {
      let generatedUnsignedData: LitUnsignedTransaction;
      if (action.type === "custom") {
        Object.assign(this.jsParameters, action.args);
      } else if (action.type === "fetch") {
        Object.assign(this.jsParameters, {
          [`signConditionFetch${action.priority}`]: action.signCondition,
          [`toSignFetch${action.priority}`]: action?.toSign
            ? action?.toSign
            : action.signCondition[action.priority].value,
        });
      } else {
        generatedUnsignedData = await this.generateUnsignedTransactionData(
          {
            contractAddress: action.contractAddress,
            nonce: action.nonce,
            gasLimit: action.gasLimit,
            value: action.value,
            chainId: action.chainId,
            maxFeePerGas: action.maxFeePerGas,
            maxPriorityFeePerGas: action.maxPriorityFeePerGas,
            from: action.from,
            functionName: action.functionName,
            args: action.args,
            abi: action.abi,
          },
          action.providerURL,
        );
        Object.assign(this.jsParameters, {
          [`generatedUnsignedDataContract${action.priority}`]:
            generatedUnsignedData,
        });

        unsignedTransactionDataObject[
          `generatedUnsignedDataContract${action.priority}`
        ] = generatedUnsignedData;
      }
      switch (action.type) {
        case "custom":
          if (!this.actionFunctions.has(`custom${action.priority}`)) {
            let customCode = `const custom${action.priority} = ${action.code}\n`;
            customCode = customCode.replace(
              /Lit\.Actions\.setResponse\s*\(\s*{\s*response\s*:\s*(.*)\s*}\s*\)/g,
              (_, responseValue) => {
                return `concatenatedResponse.custom${action.priority} = ${responseValue}`;
              },
            );
            this.actionFunctions.add(`custom${action.priority}`);
            this.code += customCode;
          }
          break;
        case "fetch":
          if (!this.actionFunctions.has(`fetch${action.priority}`)) {
            this.actionFunctions.add(`fetch${action.priority}`);
            this.code += `const fetch${action.priority} = async () => {
                try {
                    const headers = ${action.apiKey || "undefined"}
                      ? { Authorization: 'Bearer ${action.apiKey}' }
                      : undefined;
                    const response = await fetch(
                      '${action.baseUrl}${action.endpoint}',
                      { headers }
                    );
      
                    const responseJSON = await response.json();
                    let value = responseJSON;
                    const pathParts = '${action.responsePath}'.split('.');
                    
                    for (const part of pathParts) {
                      value = value[part];
                      if (value === undefined) {
                        console.log('Invalid response path at priority ${
                          action.priority
                        }: ${action.responsePath}');
                        break;
                      }
                    }

                    if (checkSignCondition(value, signConditionFetch${
                      action.priority
                    })) {
                        const toSignHash = await hashHex(toSignFetch${
                          action.priority
                        });
                        await Lit.Actions.signEcdsa({
                            toSign: toSignHash,
                            publicKey,
                            sigName: "fetch${action.priority}",
                          });
                          concatenatedResponse.fetch${
                            action.priority
                          } = {value,signed:true};
                    }  else {
                        concatenatedResponse.fetch${
                          action.priority
                        } = {value,signed:false};
                    }
                  } catch (err) {
                    console.log('Error thrown on fetch at priority ${
                      action.priority
                    }: ', err);
                  }
                }\n`;
          }
          break;
        case "contract":
          if (!this.actionFunctions.has(`contract${action.priority}`)) {
            this.actionFunctions.add(`contract${action.priority}`);
            this.code += `const contract${action.priority} = async () => {
               try {
                  await Lit.Actions.signEcdsa({
                      toSign: hashTransaction(generatedUnsignedDataContract${action.priority}),
                      publicKey,
                      sigName: "contract${action.priority}",
                  });
                  concatenatedResponse.contract${action.priority} = generatedUnsignedDataContract${action.priority};
               } catch (err) {
                  console.log('Error thrown on contract at priority ${action.priority}: ', err)
               }
            }\n`;
          }

          break;
      }
    }

    let functionCallsCode: string[] = [];
    let actionFunctionsArray = Array.from(this.actionFunctions);
    actionFunctionsArray.forEach((funcName: string, index: number) => {
      if (!functionCallsCode[index]) functionCallsCode[index] = "";
      functionCallsCode[index] += `await ${funcName}();\n`;
    });

    // Remove the old 'go' function if it exists.
    this.code = this.code.replace(
      /const go = async \(\) => {[\s\S]*go\(\);/m,
      "",
    );

    functionCallsCode.forEach((code, index) => {
      this.code += `\nconst go${index} = async () => {
        \n\n
        let runCode = false;
        if (useSecureKey) {
          if (CryptoJS) {
            if (hashHex(secureKey) === CONDITIONAL_HASH) {
              runCode = true;
            }
          }
        } else {
          runCode = true;
        }

        if (!runCode) {
          console.log('Invalid secure key, code not running.');
          return;
        } else {
          console.log('Valid secure key, code running.');
        }
        \n\n
        ${code}
        Lit.Actions.setResponse({ response: JSON.stringify(concatenatedResponse) });
      }
      
      if (currentAction === ${index}) {
        go${index}();
      }
      
      \n`;
    });

    this.code = bundleCodeManual(this.code);

    return {
      unsignedTransactionDataObject,
      litActionCode: this.code,
      secureKey: this.secureKey,
    };
  };

  /**
   * Helper function that generates the data required to construct an unsigned transaction.
   *
   * @param {Object} data - The parameters for the unsigned transaction.
   * @param {string | number} data.chainId - The network ID to use for the transaction. Valid values are keys from `LitChainIds`.
   * @param {string | Array} data.abi - The ABI of the smart contract to interact with.
   * @param {string} data.contractAddress - The address of the smart contract to interact with.
   * @param {number} [data.nonce] - The nonce to use for the transaction.
   * @param {string} [data.gasLimit] - The gas limit to use for the transaction.
   * @param {string} [data.maxFeePerGas] - The maximum fee per gas to use for the transaction (EIP-1559).
   * @param {string} [data.maxPriorityFeePerGas] - The maximum priority fee per gas to use for the transaction (EIP-1559).
   * @param {string} [data.from] - The address from which the transaction is sent.
   * @param {string} data.functionName - The name of the function to call in the smart contract.
   * @param {Array} data.args - The arguments to pass to the function call.
   * @param {number} [data.value] - The value to send with the transaction, in wei.
   * @param {string} providerURL - The provider URL for the network the transaction will be broadcast to.
   *
   * @returns {LitUnsignedTransaction} - An object with the data required to construct an unsigned transaction.
   * @throws {Error} - Throws an error if the provided chain ID is not a valid value.
   */
  generateUnsignedTransactionData = async (
    data: UnsignedTransactionData,
    providerURL: string,
  ): Promise<LitUnsignedTransaction> => {
    const validChain = Object.keys(LitChainIds).includes(
      data?.chainId?.toString()!,
    );
    if (!validChain) {
      throw new Error(
        `Invalid chain name. Valid chains: ${Object.keys(LitChainIds)}`,
      );
    }
    const contractInterface = new ethers.utils.Interface(
      data.abi as string | readonly (string | Fragment)[],
    );

    const provider = new ethers.providers.JsonRpcProvider(
      providerURL,
      LitChainIds[data.chainId],
    );

    let maxFeePerGas: ethers.BigNumber;
    let maxPriorityFeePerGas: ethers.BigNumber;

    if (!data.maxFeePerGas || !data.maxPriorityFeePerGas) {
      const gasPrice = await provider.getGasPrice();
      maxFeePerGas = gasPrice.mul(2);
      maxPriorityFeePerGas = gasPrice.div(2);
    }
    return {
      to: data.contractAddress,
      nonce: data.nonce || 0,
      chainId: LitChainIds[data?.chainId!],
      gasLimit: data.gasLimit
        ? typeof data.gasLimit === "string" || typeof data.gasLimit === "number"
          ? ethers.BigNumber.from(data.gasLimit)
          : data.gasLimit
        : ethers.BigNumber.from("5000000"),
      maxFeePerGas: data.maxFeePerGas
        ? typeof data.maxFeePerGas === "string" ||
          typeof data.maxFeePerGas === "number"
          ? ethers.BigNumber.from(data.maxFeePerGas)
          : data.maxFeePerGas
        : maxFeePerGas,
      maxPriorityFeePerGas: data.maxPriorityFeePerGas
        ? typeof data.maxPriorityFeePerGas === "string" ||
          typeof data.maxPriorityFeePerGas === "number"
          ? ethers.BigNumber.from(data.maxPriorityFeePerGas)
          : data.maxPriorityFeePerGas
        : maxPriorityFeePerGas,
      from: data.from ? data.from : "{{publicKey}}",
      data: contractInterface.encodeFunctionData(
        data.functionName,
        data.args ? data.args : [],
      ),
      value: data.value
        ? typeof data.value === "string" || typeof data.value === "number"
          ? ethers.BigNumber.from(data.value)
          : data.value
        : ethers.BigNumber.from(0),
      type: 2,
    };
  };

  /**
   * Calculates the IPFS hash of the specified code.
   * @param code The code to retrieve the hash of.
   * @returns The IPFS hash of the code.
   * @throws {Error} If an error occurs while retrieving code IPFS hash.
   */
  getIPFSHash = async (code: string): Promise<string> => {
    try {
      return await Hash.of(code);
    } catch (err) {
      throw new Error(`Error hashing Lit Action code: ${err.message}`);
    }
  };

  /**
   * Mints, grants, and burns a PKP token for the specified IPFS CID of the Lit Action Code.
   * @param cidIPFS The IPFS CID of the Lit Action code.
   * @returns An object containing the token ID, public key, and address.
   * @throws {Error} If an error occurs while minting the PKP.
   */
  mintGrantBurnPKP = async (
    cidIPFS: string,
  ): Promise<{
    tokenId: string;
    publicKey: `0x04${string}` | string;
    address: string;
  }> => {
    try {
      const mintGrantBurnLogs = await this.mintNextPKP(cidIPFS);
      const pkpTokenId = BigInt(mintGrantBurnLogs[0].topics[1]).toString();
      const publicKey = await this.getPubKeyByPKPTokenId(pkpTokenId);
      this.publicKey = publicKey;
      this.pkpAddress = ethers.utils.computeAddress(publicKey);

      const permissionContract = new Contract(
        PKP_PERMISSIONS_CONTRACT_ADDRESS,
        pkpPermissionsAbi,
        this.signer,
      );

      let address = await this.signer.getAddress();
      address = ethers.utils.getAddress(address);
      let tx = await permissionContract.addPermittedAddress(
        pkpTokenId,
        address,
        [1],
      );
      tx = await tx.wait();

      for (const action of this.actions) {
        let code = (action as CustomAction).code;
        if (!code) {
          continue;
        }
        let cid = await this.getIPFSHash(code);
        tx = await permissionContract.addPermittedAction(
          pkpTokenId,
          getBytesFromMultihash(cid),
          [1],
        );
        await tx.wait();
      }

      return {
        tokenId: pkpTokenId,
        publicKey: publicKey,
        address: ethers.utils.computeAddress(publicKey),
      };
    } catch (err) {
      throw new Error(`Error in mintGrantBurn: ${err.message}`);
    }
  };

  /**
   * Starts the circuit with the specified parameters.
   * @param publicKey The public key of the PKP contract.
   * @param ipfsCID The IPFS CID of the Lit Action code.
   * @param sessionSig Optional. The authentication signature for executing Lit Actions.
   * @param secureKey Optional. The secureKey required to run the LitAction if set during setActions.
   * @param broadcast Optional. Boolean to broadcast signed contract actions on-chain.
   * @throws {Error} If an error occurs while running the circuit.
   */
  start = async ({
    publicKey,
    ipfsCID,
    sessionSig,
    secureKey,
    broadcast,
  }: {
    publicKey: `0x04${string}` | string;
    ipfsCID?: string;
    sessionSig?: SessionSigsMap;
    secureKey?: string;
    broadcast?: boolean;
  }): Promise<void> => {
    if (this.isRunning) {
      throw new Error("Circuit is already running");
    }

    this.isRunning = true;
    try {
      if (this.actions.length > 0) {
        if (!publicKey || !publicKey.toLowerCase().startsWith("0x04")) {
          this.log(
            LogCategory.ERROR,
            `Invalid PKP Public Key.`,
            publicKey,
            new Date().toISOString(),
          );
          throw new Error(`Invalid PKP Public Key.`);
        }

        this.publicKey = publicKey;
        this.pkpAddress = ethers.utils.computeAddress(publicKey);
        if (ipfsCID) {
          this.ipfsCID = ipfsCID;
        }
        if (sessionSig) {
          this.sessionSig = sessionSig;
        }
        if (secureKey) {
          this.secureKey = secureKey;
          this.useSecureKey = true;
        }

        // connect lit client
        await this.connectLit();

        while (this.continueRun) {
          const monitors: NodeJS.Timeout[] = [];
          const conditionPromises: Promise<void>[] = [];
          if (this.conditions.length > 0) {
            for (const condition of this.conditions) {
              condition.sdkOnMatched = async () => {
                this.satisfiedConditions.add(condition.id!);
              };

              condition.sdkOnUnMatched = async () => {
                this.satisfiedConditions.delete(condition.id!);
              };

              const conditionPromise = this.monitor.createCondition(
                condition,
                this.errorHandlingModeStrict,
              );

              if (this.conditionalLogic?.interval) {
                const timeoutPromise = new Promise<void>((resolve) =>
                  setTimeout(resolve, this.conditionalLogic.interval),
                );
                conditionPromises.push(
                  Promise.race([conditionPromise, timeoutPromise]).then(() => {
                    return Promise.resolve();
                  }),
                );
                const monitor = setTimeout(async () => {
                  await conditionPromise;
                }, this.conditionalLogic.interval);
                monitors.push(monitor);
              } else {
                conditionPromises.push(conditionPromise);
              }
            }

            if (!this.continueRun) break;

            await Promise.all(conditionPromises);
          } else {
            this.log(
              LogCategory.CONDITION,
              "No conditions set, skipping condition checks.",
              "",
              new Date().toISOString(),
            );
          }

          const conditionResBefore = this.checkConditionalLogicAndRun();
          const executionResBefore = this.checkExecutionLimitations();

          this.conditionExecutedCount++;
          this.log(
            LogCategory.EXECUTION,
            "Condition Monitor Count Increased",
            String(this.conditionExecutedCount),
            new Date().toISOString(),
          );
          if (
            conditionResBefore === RunStatus.ACTION_RUN &&
            executionResBefore === RunStatus.ACTION_RUN
          ) {
            await this.runLitAction(broadcast);
            const executionResAfter = this.checkExecutionLimitations();
            if (executionResAfter === RunStatus.EXIT_RUN) {
              this.log(
                LogCategory.CONDITION,
                `Execution Condition Not Met to Continue Circuit.`,
                `Run Status ${RunStatus.EXIT_RUN}`,
                new Date().toISOString(),
              );
              this.emitter.emit("stop");
              break;
            }
          } else if (
            conditionResBefore === RunStatus.EXIT_RUN ||
            executionResBefore === RunStatus.EXIT_RUN
          ) {
            this.log(
              LogCategory.CONDITION,
              `Execution Condition Not Met to Continue Circuit.`,
              `Run Status ${RunStatus.EXIT_RUN}`,
              new Date().toISOString(),
            );
            this.emitter.emit("stop");
            break;
          }

          if (!this.continueRun) break;

          if (this.conditionalLogic?.interval) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.conditionalLogic?.interval),
            );
          }

          monitors.forEach((monitor) => clearTimeout(monitor));

          // check again in case of CONTINUE_RUN status
          const conditionResEnd = this.checkConditionalLogicAndRun();
          const executionResEnd = this.checkExecutionLimitations();
          if (
            conditionResEnd === RunStatus.EXIT_RUN ||
            executionResEnd === RunStatus.EXIT_RUN
          ) {
            this.log(
              LogCategory.CONDITION,
              `Execution Condition Not Met to Continue Circuit.`,
              `Run Status ${RunStatus.EXIT_RUN}`,
              new Date().toISOString(),
            );
            this.emitter.emit("stop");
            break;
          }
        }
      } else if (this.actions.length < 1) {
        throw new Error(`Actions have not been set. Run setActions() first.`);
      }
    } catch (err: any) {
      throw new Error(`Error running circuit: ${err.message}`);
    } finally {
      await Promise.all(this.pendingBroadcasts.map((p) => p));
      this.isRunning = false;
    }
  };

  /**
   * Returns the logs of the circuit. 1000 logs are recorded on a rolling basis.
   * @param category - Optional. Returns logs of a specific type i.e. error, response, condition. If no category is passed then all logs are returned.
   * @returns The logs of the circuit.
   */
  getLogs = (category?: LogCategory): ILogEntry[] => {
    const logsInOrder = [
      ...this.logs.slice(this.logIndex),
      ...this.logs.slice(0, this.logIndex),
    ].filter((log) => log !== undefined);

    if (!category) {
      return logsInOrder;
    }

    return logsInOrder.filter((log) => log.category === category);
  };

  /**
   * Generates an authentication signature for the Lit Action.
   * @param chainId - The chain ID (default: 1).
   * @param uri - The URI (default: "https://localhost/login").
   * @param version - The version (default: "1").
   * @returns The authentication signature.
   * @throws {Error} If an error occurs while generating the authentication signature.
   */
  generateSessionSignature = async (
    pkpPublicKey: string,
    resources: LitResourceAbilityRequest[] = [],
    chainId = 1,
    uri = "https://localhost/login",
    version = "1",
  ): Promise<SessionSigsMap> => {
    try {
      return generateSessionSig(
        this.litClient,
        this.signer,
        pkpPublicKey,
        resources,
        chainId,
        uri,
        version,
      );
    } catch (err: any) {
      throw new Error(`Error generating Auth Signature: ${err.message}`);
    }
  };

  /**
   * Forcefully interrupts the circuit.
   */
  interrupt = () => {
    this.emitter.emit("stop");
    this.log(
      LogCategory.ERROR,
      "Circuit forcefully interrupted at ",
      `${Date.now()}`,
      new Date().toISOString(),
    );
  };

  // Private methods
  /**
   * Mints the next PKP token.
   * @param ipfsCID - The IPFS CID of the Lit Action code.
   * @returns The transaction logs.
   * @throws {Error} If an error occurs while calling the contract functions to mint the PKP.
   */
  private mintNextPKP = async (
    ipfsCID: string,
  ): Promise<ethers.providers.Log[]> => {
    if (!this.signer.provider) {
      throw new Error("No provider attached to ethers signer");
    }
    try {
      let address = await this.signer.getAddress();
      address = ethers.utils.getAddress(address);
      // const feeData = await this.signer.provider.getFeeData();
      const tx = await this.pkpContract.mintNext(
        2, // key type
        {
          value: "1",
        },
      );
      const receipt = await tx.wait();
      const logs = receipt.logs;
      return logs;
    } catch (err) {
      throw new Error(`Error in mintGrantBurnPKP: ${err.message}`);
    }
  };

  /**
   * Retrieves the public key associated with a PKP token ID.
   * @param tokenId - The PKP token ID.
   * @returns The public key associated with the PKP token ID.
   * @throws {Error} If an error occurs while retrieving the public key.
   */
  private async getPubKeyByPKPTokenId(
    tokenId: string,
  ): Promise<`0x04${string}` | string> {
    try {
      return await this.pkpContract.getPubkey(tokenId);
    } catch (err) {
      throw new Error(`Error getting pkp public key: ${err.message}`);
    }
  }

  /**
   * Runs the Lit Action.
   * @returns The response of the Lit Action.
   * @throws {Error} If an error occurs while running the LitAction.
   */
  private runLitAction = async (broadcast: boolean): Promise<void> => {
    try {
      // update nonce values
      const actionPromises: Promise<any>[] = [];
      let actions = Array.from(this.actionFunctions);

      for (const [i, _] of actions.entries()) {
        const action = this.actions[i];

        let promise: Promise<any>;

        if (action.type === "contract") {
          const providerURL = (action as ContractAction).providerURL;
          const chainId = LitChainIds[(action as ContractAction).chainId];
          const provider = new ethers.providers.JsonRpcProvider(
            providerURL,
            chainId,
          );

          const blockchainNonce = await provider.getTransactionCount(
            this.pkpAddress,
          );

          let currentNonce = Math.max(
            this.lastSuccessfulNonce.get(chainId) || 0,
            blockchainNonce,
          );

          this.jsParameters[
            `generatedUnsignedDataContract${action.priority}`
          ].nonce = currentNonce;
          currentNonce++;
          this.lastSuccessfulNonce.set(chainId, currentNonce);

          const pkpPublicKey = ethers.utils.computeAddress(this.publicKey);
          const session = await this.generateSessionSignature(this.publicKey);
          promise = this.litClient.executeJs({
            ipfsId: this.ipfsCID ? this.ipfsCID : undefined,
            code: this.ipfsCID ? undefined : this.code,
            sessionSigs: session,
            jsParams: {
              pkpAddress: pkpPublicKey,
              publicKey: this.publicKey,
              ...this.jsParameters,
              currentAction: i,
              secureKey: this.secureKey,
              useSecureKey: this.useSecureKey,
            },
          });

          promise.catch(() => {
            currentNonce--;
            this.lastSuccessfulNonce.set(chainId, currentNonce);
          });
        } else {
          const pkpPublicKey = ethers.utils.computeAddress(this.publicKey);
          const session = await this.generateSessionSignature(this.publicKey);

          promise = this.litClient.executeJs({
            ipfsId: this.ipfsCID ? this.ipfsCID : undefined,
            code: this.ipfsCID ? undefined : this.code,
            sessionSigs: session,
            jsParams: {
              pkpAddress: pkpPublicKey,
              publicKey: this.publicKey,
              ...this.jsParameters,
              currentAction: i,
              secureKey: this.secureKey,
              useSecureKey: this.useSecureKey,
            },
          });
        }
        actionPromises.push(promise);
      }

      const response = (await Promise.all(actionPromises)).flat();
      let combinedResponse = { signatures: {}, response: {}, logs: "" };
      let counter = 0;
      response.forEach((res) => {
        combinedResponse.signatures = {
          ...combinedResponse.signatures,
          ...res.signatures,
        };
        if (typeof res.response === "object") {
          combinedResponse.response = {
            ...combinedResponse.response,
            ...res.response,
          };
        } else {
          combinedResponse.response = {
            ...combinedResponse.response,
          };
          combinedResponse.response[counter] = res.response;
        }

        combinedResponse.logs += "\n" + res.logs;
        counter += 1;
      });

      // broadcast actions
      if (broadcast) {
        if ("signatures" in combinedResponse) {
          const priorities = Object.keys(combinedResponse.signatures)
            .map((key) => {
              const match = key.match(/^contract(\d+)$/);
              return match ? parseInt(match[1], 10) : null;
            })
            .filter((priority) => priority !== null)
            .sort((a, b) => a - b);

          await this.broadcastContractActions(priorities, combinedResponse);
        }
      }

      this.log(
        LogCategory.RESPONSE,
        "Circuit executed successfully. Lit Action Response.",
        typeof combinedResponse === "object"
          ? JSON.stringify(combinedResponse)
          : combinedResponse,
        new Date().toISOString(),
      );
      this.litActionCompletionCount++;
      this.log(
        LogCategory.EXECUTION,
        "Lit Action Completion Increased",
        String(this.litActionCompletionCount),
        new Date().toISOString(),
      );
    } catch (err: any) {
      this.log(
        LogCategory.ERROR,
        `Lit Action failed.`,
        err.message,
        new Date().toISOString(),
      );
      if (this.errorHandlingModeStrict) {
        throw new Error(`Error running Lit Action: ${err.message}`);
      }
    }
  };

  /**
   * Establishes a connection with the LitJsSDK.
   * @throws {Error} If an error occurs while connecting with LitJsSDK.
   */
  private connectLit = async (): Promise<void> => {
    try {
      await this.litClient.connect();
    } catch (err) {
      throw new Error(`Error connecting with LitJsSDK: ${err.message}`);
    }
  };

  /**
   * Checks the execution limitations and returns the run status.
   * @returns The run status.
   */
  private checkExecutionLimitations = (): RunStatus => {
    if (
      this.conditionMonitorExecutions === undefined &&
      this.startDate === undefined &&
      this.endDate === undefined &&
      this.maxLitActionCompletions === undefined
    ) {
      return RunStatus.ACTION_RUN;
    }

    const withinExecutionLimit = this.conditionMonitorExecutions
      ? this.conditionExecutedCount < this.conditionMonitorExecutions
      : true;
    const withinTimeRange =
      this.startDate && this.endDate
        ? new Date() >= this.startDate && new Date() <= this.endDate
        : this.startDate && !this.endDate
        ? new Date() >= this.startDate
        : this.endDate && !this.startDate
        ? new Date() <= this.endDate
        : true;
    const withinSuccessfulCompletions = this.maxLitActionCompletions
      ? this.litActionCompletionCount < this.maxLitActionCompletions
      : true;
    const executionConstraintsMet =
      withinExecutionLimit && withinTimeRange && withinSuccessfulCompletions;

    if (!executionConstraintsMet) {
      return RunStatus.EXIT_RUN;
    } else {
      return RunStatus.ACTION_RUN;
    }
  };

  /**
   * Broadcasts signed Contract Actions.
   */
  private broadcastContractActions = async (
    priorities: number[],
    combinedResponse: {
      signatures: {};
      response: {};
      logs: string;
    },
  ): Promise<void> => {
    for (const priority of priorities) {
      const action = this.actions.find(
        (action) => action.priority === priority,
      );

      if (action) {
        const signature = combinedResponse.signatures[`contract${priority}`];
        const sig: {
          r: string;
          s: string;
          recid: number;
          signature: string;
          publicKey: string;
          dataSigned: string;
        } = signature as {
          r: string;
          s: string;
          recid: number;
          signature: string;
          publicKey: string;
          dataSigned: string;
        };

        const encodedSignature = joinSignature({
          r: "0x" + sig.r,
          s: "0x" + sig.s,
          recoveryParam: sig.recid,
        });
        const provider = new ethers.providers.JsonRpcProvider(
          (action as ContractAction).providerURL,
          LitChainIds[(action as ContractAction).chainId],
        );

        const serialized = serialize(
          this.jsParameters[`generatedUnsignedDataContract${action.priority}`],
          encodedSignature,
        );
        const transactionHash = await provider.sendTransaction(serialized);
        try {
          await transactionHash.wait();
        } catch (err) {
          this.log(
            LogCategory.ERROR,
            `Broadcast Failed.`,
            err.message,
            new Date().toISOString(),
          );
          if (this.errorHandlingModeStrict) {
            throw new Error(
              `Error in broadcasting Contract Action: ${err.message}`,
            );
          }
        }
        this.log(
          LogCategory.BROADCAST,
          `Contract Action broadcast to chain ${
            (action as ContractAction).chainId
          } successfully. Lit Action Response.`,
          JSON.stringify(transactionHash),
          new Date().toISOString(),
        );
      }
    }
  };

  /**
   * Checks the conditional logic and runs the actions accordingly.
   * @returns The run status.
   */
  private checkConditionalLogicAndRun = (): RunStatus => {
    if (this.conditionalLogic) {
      switch (this.conditionalLogic.type) {
        case "THRESHOLD":
          if (
            this.conditionalLogic.value &&
            this.satisfiedConditions.size >= this.conditionalLogic.value
          ) {
            return RunStatus.ACTION_RUN;
          } else {
            return RunStatus.CONTINUE_RUN;
          }

        case "TARGET":
          if (
            this.conditionalLogic.targetCondition &&
            this.satisfiedConditions.has(this.conditionalLogic.targetCondition)
          ) {
            return RunStatus.ACTION_RUN;
          } else {
            return RunStatus.CONTINUE_RUN;
          }

        case "EVERY":
          if (this.satisfiedConditions.size === this.conditions.length) {
            return RunStatus.ACTION_RUN;
          } else {
            return RunStatus.CONTINUE_RUN;
          }
      }
    } else {
      return RunStatus.CONTINUE_RUN;
    }
  };

  /**
   * Logs a message.
   * @param category - The type of message to log.
   * @param message - The message to log.
   * @param message - The response object to log.
   * @param message - The iso date to log.
   */
  private log = (
    category: LogCategory,
    message: string,
    responseObject: string,
    isoDate: string,
  ) => {
    if (typeof responseObject === "object") {
      responseObject = JSON.stringify(responseObject);
    }

    this.logs[this.logIndex] = { category, message, responseObject, isoDate };
    this.logIndex = (this.logIndex + 1) % this.logSize;
    this.emit(
      "log",
      JSON.stringify({
        message,
        responseObject,
        isoDate,
      }),
    );
  };
}
