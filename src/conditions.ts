import axios from "axios";
import { ethers } from "ethers";
import { EventEmitter } from "events";
import {
  ContractCondition,
  LitChainIds,
  WebhookCondition,
} from "./@types/lit-listener-sdk";
import lodash from "lodash";

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
  createCondition = async (condition: WebhookCondition | ContractCondition) => {
    if (condition instanceof WebhookCondition) {
      await this.startMonitoringWebHook(condition);
    } else if (condition instanceof ContractCondition) {
      await this.startMonitoringContract(condition);
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

      if (!providerURL) {
        this.emit("conditionError", "Error: No Provider URL.", condition);
        throw new Error(`Error: No Provider URL.`);
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
          this.emit("conditionError", "Error in Retrieving contract args.");
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
        contract.on("Transfer", processEvent);
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
      match = emittedValue === condition.expectedValue;
    } else if (
      Array.isArray(condition.expectedValue) &&
      Array.isArray(emittedValue)
    ) {
      if (condition.expectedValue.length !== emittedValue.length) {
        match = false;
      } else {
        match = condition.expectedValue.every((expected, index) => {
          const emitted = emittedValue[index];
          return this.isEqualWithMixedTypes(expected, emitted);
        });
      }
    } else if (
      typeof condition.expectedValue === "object" &&
      typeof emittedValue === "object"
    ) {
      match = lodash.isEqual(emittedValue, condition.expectedValue);
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

  private isEqualWithMixedTypes = (
    expected: (string | number | bigint | object)[],
    emitted: (string | number | bigint | object)[],
  ) => {
    if (typeof expected !== typeof emitted) {
      return false;
    }

    if (typeof expected === "object" && expected !== null) {
      return lodash.isEqual(expected, emitted);
    }

    return expected === emitted;
  };
}
