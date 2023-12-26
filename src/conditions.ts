import axios from "axios";
import { ethers } from "ethers";
import { EventEmitter } from "events";
import {
  Condition,
  ContractCondition,
  LitChainIds,
  WebhookCondition,
} from "./@types/lit-listener-sdk";

/**
 * @class ConditionMonitor
 * @description Class that monitors and handles conditions.
 */
export class ConditionMonitor extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * @method createCondition
   * @description Accepts a condition and starts monitoring it.
   * @param condition - The condition to monitor.
   */
  createCondition = async (
    condition: WebhookCondition | ContractCondition,
    errorHandlingModeStrict: boolean,
  ) => {
    if (condition instanceof WebhookCondition) {
      await this.retry(
        () => this.startMonitoringWebHook(condition),
        3,
        errorHandlingModeStrict,
        condition,
      );
    } else if (condition instanceof ContractCondition) {
      await this.retry(
        () => this.startMonitoringContract(condition),
        3,
        errorHandlingModeStrict,
        condition,
      );
    }
  };

  /**
   * @method startMonitoringWebHook
   * @description Starts monitoring a webhook condition.
   * @private
   * @param condition - The webhook condition to monitor.
   * @throws {Error} If an error occurs while retrieving webhook information.
   */
  private startMonitoringWebHook = async (condition: WebhookCondition) => {
    // Monitor function, encapsulates the logic of querying the webhook and checking the response against the expected value.
    const webhookListener = async () => {
      try {
        const headers = condition.apiKey
          ? { Authorization: `Bearer ${condition.apiKey}` }
          : undefined;
        const response = await axios.get(
          `${condition.baseUrl}${condition.endpoint}`,
          { headers },
        );
        let value = response.data;
        let pathParts = condition.responsePath.split(".");
        pathParts = pathParts.flatMap((part) =>
          part.split(/\[(.*?)\]/).filter(Boolean),
        );

        for (const part of pathParts) {
          if (!isNaN(parseInt(part))) {
            value = value[parseInt(part)];
          } else {
            value = value[part];
          }
          if (value === undefined) {
            throw new Error(`Invalid response path: ${condition.responsePath}`);
          }
        }

        await this.checkAgainstExpected(condition, value);
      } catch (error) {
        condition.onError(error);
        this.emit("conditionError", error, condition);
        throw new Error(`Error in Webhook Action: ${error.message}`);
      }
    };

    return webhookListener();
  };

  /**
   * @method startMonitoringContract
   * @description Starts monitoring a contract condition.
   * @private
   * @param condition - The contract condition to monitor.
   * @throws {Error} If an error occurs while processing contract event.
   */
  private startMonitoringContract = async (condition: ContractCondition) => {
    try {
      const { contractAddress, abi, eventName, providerURL } = condition;

      const checkProviderValid = await this.checkProvider(providerURL);

      if (!providerURL || !checkProviderValid) {
        this.emit("conditionError", "Error: Invalid Provider URL.", condition);
        throw new Error(`Error: Invalid Provider URL.`);
      }

      const contract = new ethers.Contract(
        contractAddress,
        abi,
        new ethers.providers.JsonRpcProvider(
          providerURL,
          LitChainIds[condition.chainId],
        ),
      );

      const processEvent = async (...args) => {
        const eventData = args.pop();

        if (!eventData.args) {
          this.emit(
            "conditionError",
            "Error in Retrieving contract args.",
            condition,
          );
          throw new Error(`Error in Retrieving contract args.`);
        }

        try {
          const emittedValues = condition.eventArgName.map((argName) => {
            const value = eventData.args[argName];
            if (value === undefined) {
              throw new Error(
                `Argument '${argName}' not found in event arguments.`,
              );
            }
            return value;
          });
          await this.checkAgainstExpected(condition, emittedValues);
        } catch (error) {
          condition.onError(error);
          this.emit("conditionError", error, condition);
        }
      };

      const subscribeToEvent = () => {
        contract.on(eventName, processEvent);
      };

      return subscribeToEvent();
    } catch (error: any) {
      condition.onError(error);
      this.emit("conditionError", error, condition);
      throw new Error(`Error in Contract Action: ${error.message}`);
    }
  };

  /**
   * @method checkAgainstExpected
   * @description Checks the emitted value against the expected value and triggers the appropriate callbacks.
   * @private
   * @param condition - The condition being checked.
   * @param emittedValue - The value emitted by the webhook or contract event.
   * @throws {Error} If an error occurs while running match or unmatch.
   */
  private checkAgainstExpected = async (
    condition: WebhookCondition | ContractCondition,
    emittedValue: any,
  ) => {
    let match = false;

    if (
      typeof condition.expectedValue === "number" ||
      typeof condition.expectedValue === "string" ||
      typeof condition.expectedValue === "bigint"
    ) {
      match = this.compareValues(
        condition.expectedValue,
        emittedValue,
        condition.matchOperator,
      );
    } else if (
      Array.isArray(condition.expectedValue) &&
      Array.isArray(emittedValue)
    ) {
      if (condition.expectedValue.length !== emittedValue.length) {
        match = false;
      } else {
        match = condition.expectedValue.every((expected, index) => {
          const emitted = emittedValue[index];
          return this.compareValues(expected, emitted, condition.matchOperator);
        });
      }
    } else if (
      typeof condition.expectedValue === "object" &&
      typeof emittedValue === "object"
    ) {
      const expectedKeys = Object.keys(condition.expectedValue);
      const emittedKeys = Object.keys(emittedValue);

      if (expectedKeys.length !== emittedKeys.length) {
        match = false;
      } else {
        match = expectedKeys.every((key) => {
          return this.compareValues(
            condition.expectedValue[key],
            emittedValue[key],
            condition.matchOperator,
          );
        });
      }
    }

    try {
      if (match) {
        await condition.onMatched(emittedValue);
        await condition.sdkOnMatched();
        this.emit("conditionMatched", emittedValue);
      } else {
        await condition.onUnMatched(emittedValue);
        await condition.sdkOnUnMatched();
        this.emit("conditionNotMatched", emittedValue);
      }
    } catch (error: any) {
      throw new Error(
        `Error in Checking Against Expected Values: ${error.message}`,
      );
    }
  };

  /**
   * Compares the emittedValue with the expectedValue based on the operator provided.
   * The operator could be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
   * An error is thrown for any unsupported operator.
   *
   * @param {any} expectedValue - The expected value.
   * @param {any} emittedValue - The value that is being compared against the expected value.
   * @param {string} operator - The operator used for the comparison. It must be one of the following: "<", ">", "==", "===", "!==", "!=", ">=", "<=".
   * @return {boolean} - True if the condition holds based on the operator, otherwise false.
   * @throws {Error} - If the operator is unsupported.
   */ private compareValues = (
    expectedValue: any,
    emittedValue: any,
    operator: string,
  ) => {
    if (
      ethers.BigNumber.isBigNumber(expectedValue) &&
      ethers.BigNumber.isBigNumber(emittedValue)
    ) {
      switch (operator) {
        case "<":
          return emittedValue.lt(expectedValue);
        case ">":
          return emittedValue.gt(expectedValue);
        case "==":
        case "===":
          return emittedValue.eq(expectedValue);
        case "!==":
        case "!=":
          return !emittedValue.eq(expectedValue);
        case ">=":
          return emittedValue.gte(expectedValue);
        case "<=":
          return emittedValue.lte(expectedValue);
      }
    } else if (
      typeof expectedValue === "object" &&
      typeof emittedValue === "object"
    ) {
      switch (operator) {
        case "==":
        case "===":
          return this.deepEqualObjects(emittedValue, expectedValue);
        case "!=":
        case "!==":
          return !this.deepEqualObjects(emittedValue, expectedValue);
        default:
          throw new Error(
            `Operator '${operator}' not supported for object comparison.`,
          );
      }
    } else {
      switch (operator) {
        case "<":
          return emittedValue < expectedValue;
        case ">":
          return emittedValue > expectedValue;
        case "==":
          return emittedValue == expectedValue;
        case "===":
          return emittedValue === expectedValue;
        case "!==":
          return emittedValue !== expectedValue;
        case "!=":
          return emittedValue != expectedValue;
        case ">=":
          return emittedValue >= expectedValue;
        case "<=":
          return emittedValue <= expectedValue;
      }
    }
  };

  /**
   * Checks if two objects are deeply equal by comparing their stringified versions.
   *
   * @param obj1 - The first object to compare.
   * @param obj2 - The second object to compare.
   * @returns - Boolean indicating whether the two objects are deeply equal.
   */
  private deepEqualObjects = (obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  };

  /**
   * Checks the validity of a provider URL by attempting to establish a connection
   * with the provider within a specified timeout.
   *
   * @param providerURL - The URL of the provider to check.
   * @returns - Promise resolving to a boolean indicating whether the provider is valid.
   */
  private checkProvider = async (providerURL: string): Promise<boolean> => {
    let timerId: NodeJS.Timeout;
    const timeout = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error("Timeout"));
      }, 10000);
    });

    const provider = new ethers.providers.JsonRpcProvider(providerURL);

    try {
      await Promise.race([provider.ready, timeout]);
      clearTimeout(timerId);
      return true;
    } catch (error) {
      clearTimeout(timerId);
      return false;
    }
  };

  /**
   * Retry a Promise-based function a specified number of times, handling errors according to the
   * specified error handling mode. If errorHandlingModeStrict is true, throws an error and exits
   * the loop upon encountering an error. Otherwise, emits an error message and continues retrying
   * until the retry limit is reached.
   *
   * @param fn - The Promise-based function to retry.
   * @param retryCount - The number of times to retry the function (default: 3).
   * @param errorHandlingModeStrict - The error handling mode (default: false).
   * @returns - Promise resolving when the function has succeeded or the retry limit is reached.
   */
  private retry = async (
    fn: () => Promise<void>,
    retryCount: number = 3,
    errorHandlingModeStrict: boolean,
    condition: Condition,
  ): Promise<void> => {
    for (let i = 0; i < retryCount; i++) {
      try {
        await fn();
        break;
      } catch (err: any) {
        if (errorHandlingModeStrict) {
          this.emit("conditionError", err, condition);
          throw new Error(`Error in checking conditions: ${err.message}`);
        } else {
          if (i === retryCount - 1) {
            this.emit("conditionNotMatched", err.message);
          }
        }
      }
    }
  };
}
