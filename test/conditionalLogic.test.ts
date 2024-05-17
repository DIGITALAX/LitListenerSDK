import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Circuit,
  CustomAction,
  LogCategory,
  RunStatus,
  WebhookCondition,
} from "./../src";
import { CHRONICLE_PROVIDER } from "./../src/constants";

describe("Verify the Conditional Logic", () => {
  let newCircuit: Circuit, publicKey: string;
  const customActions: CustomAction[] = [
    {
      type: "custom",
      priority: 0,
      code: " async () => {  }",
    },
    {
      type: "custom",
      priority: 1,
      code: "async () => { }",
    },
  ];
  const chronicleProvider = new ethers.providers.JsonRpcProvider(
    CHRONICLE_PROVIDER,
    175177,
  );

  beforeEach(async () => {
    newCircuit = new Circuit(
      new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
    );

    const LitActionCode = await newCircuit.setActions(customActions);
    const ipfsCID = await newCircuit.getIPFSHash(LitActionCode.litActionCode);
    const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
    publicKey = pkpTokenData.publicKey;
  });

  describe("EVERY Type", () => {
    it("Runs on EVERY for No Conditional Logic for Match", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          1,
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
      await newCircuit.start({ publicKey });

      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
    });

    it("Runs on EVERY for No Conditional Logic for No Match", async () => {
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          10,
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
      await newCircuit.start({ publicKey });

      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 1].category).to.equal(2);
      expect(responseLog[responseLog.length - 1].message).to.equal(
        `Execution Condition Not Met to Continue Circuit.`,
      );
      expect(responseLog[responseLog.length - 1].responseObject).to.equal(
        `Run Status ${RunStatus.EXIT_RUN}`,
      );
    });

    it("Runs on EVERY for EVERY Conditional Logic", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          1,
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
      await newCircuit.start({ publicKey });

      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
    });
  });

  describe("THRESHOLD Type", () => {
    it("Runs on THRESHOLD for THRESHOLD Conditional Logic", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          1,
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
      newCircuit.setConditionalLogic({
        type: "THRESHOLD",
        value: 2,
        interval: 10000,
      });
      await newCircuit.start({ publicKey });

      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
      expect(newCircuit["litActionCompletionCount"]).to.equal(1);
    });

    it("Rejects when THRESHOLD not Reached", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          100,
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
      newCircuit.setConditionalLogic({
        type: "THRESHOLD",
        value: 2,
        interval: 10000,
      });
      await newCircuit.start({ publicKey });

      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
      expect(newCircuit["litActionCompletionCount"]).to.equal(0);
      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 1].category).to.equal(2);
      expect(responseLog[responseLog.length - 1].message).to.equal(
        `Execution Condition Not Met to Continue Circuit.`,
      );
      expect(responseLog[responseLog.length - 1].responseObject).to.equal(
        `Run Status ${RunStatus.EXIT_RUN}`,
      );
    });
  });

  describe("TARGET Type", () => {
    it("Runs on TARGET for TARGET Conditional Logic", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          1,
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
      newCircuit.setConditionalLogic({
        type: "TARGET",
        targetCondition: "2",
        interval: 10000,
      });
      await newCircuit.start({ publicKey });

      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
      expect(newCircuit["litActionCompletionCount"]).to.equal(1);
    });

    it("Rejects when Target Condition not Met", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          100,
          "===",
          undefined,
          async () => {
            console.log("matched");
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
      newCircuit.setConditionalLogic({
        type: "TARGET",
        targetCondition: "2",
        interval: 10000,
      });
      await newCircuit.start({ publicKey });

      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
      expect(newCircuit["litActionCompletionCount"]).to.equal(0);
      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 1].category).to.equal(2);
      expect(responseLog[responseLog.length - 1].message).to.equal(
        `Execution Condition Not Met to Continue Circuit.`,
      );
      expect(responseLog[responseLog.length - 1].responseObject).to.equal(
        `Run Status ${RunStatus.EXIT_RUN}`,
      );
    });
  });

  describe("Runs to Interval Specified", () => {
    it("Runs on the Interval Specified", async () => {
      let logOutputs: Date[] = [];

      // Temporarily replace console.log with a function that captures the output
      const originalConsoleLog = console.log;
      console.log = (...args: any[]) => {
        if (args[0] instanceof Date) {
          logOutputs.push(args[0]);
        }
        originalConsoleLog.apply(console, args);
      };

      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
          "properties.periods[0].number",
          1,
          "===",
          undefined,
          async () => {
            console.log(new Date());
          },
          async () => {
            console.log("unmatched");
          },
          (err) => console.error(err.message),
        ),
      ]);
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 2,
      });
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 60000,
      });
      await newCircuit.start({ publicKey });

      console.log = originalConsoleLog;

      // Check that the logged dates are at least 60 seconds apart
      for (let i = 1; i < logOutputs.length; i++) {
        let difference = logOutputs[i].getTime() - logOutputs[i - 1].getTime();
        expect(difference).to.be.at.least(60000);
      }
    });
  });
});
