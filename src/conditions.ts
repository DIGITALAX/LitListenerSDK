import axios from "axios";
import ethers, { Event } from "ethers";
import { EventEmitter } from "events";
import {
  ContractCondition,
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
        const pathParts = condition.responsePath.split(".");

        for (const part of pathParts) {
          value = value[part];
          if (value === undefined) {
            throw new Error(`Invalid response path: ${condition.responsePath}`);
          }
        }

        await this.checkAgainstExpected(condition, value);
      } catch (error) {
        condition.onError(error);
        this.emit("conditionError", error, condition);
        throw new Error(`Error in Webhook Action: ${error}`);
      }
    };

    webhookListener();
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
      
      const contract = new ethers.Contract(
        contractAddress,
        abi,
        new ethers.providers.JsonRpcProvider(providerURL, condition.chainId),
      );

      const processEvent = async (eventData: Event) => {
        const { args } = eventData;

        if (!args) {
          this.emit("conditionError");
          throw new Error(`Error in Retrieving contract args.`);
        }

        const emittedValues = condition.eventArgName.map(
          (argName) => args[argName],
        );

        await this.checkAgainstExpected(condition, emittedValues);
      };

      const subscribeToEvent = () => {
        contract.on(eventName, processEvent);
      };

      subscribeToEvent();
    } catch (error: any) {
      condition.onError(error);
      this.emit("conditionError", error, condition);
      throw new Error(`Error in Contract Action: ${error}`);
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
    if (Array.isArray(emittedValue) && Array.isArray(condition.expectedValue)) {
      match = (condition.expectedValue as Array<any>).every((val) =>
        (emittedValue as Array<any>).includes(val),
      );
    } else {
      match = emittedValue === condition.expectedValue;
    }

    try {
      if (match) {
        await condition.onMatched();
        await condition.sdkOnMatched();
        this.emit("conditionMatched", condition);
      } else {
        await condition.onUnMatched();
        await condition.sdkOnUnMatched();
        this.emit("conditionNotMatched", condition);
      }
    } catch (error: any) {
      throw new Error(`Error in Checking Against Expected Values: ${error}`);
    }
  };
}
