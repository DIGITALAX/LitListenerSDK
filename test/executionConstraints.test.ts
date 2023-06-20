import { expect } from "chai";
import { Circuit, CustomAction, WebhookCondition } from "./../src";
import { ethers } from "hardhat";
import { CHRONICLE_PROVIDER } from "./../src/constants";

xdescribe("Verify the Execution Constraints", () => {
  let newCircuit: Circuit, pkpPublicKey: string;
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
      undefined,
      new ethers.Wallet(process.env.MUMBAI_PRIVATE_KEY, chronicleProvider),
    );
    const LitActionCode = newCircuit.setActions(customActions);
    newCircuit.setConditions([
      new WebhookCondition(
        "https://api.weather.gov",
        "/gridpoints/LWX/97,71/forecast",
        "geometry.type",
        "Polygon",
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
    const ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
    const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
    pkpPublicKey = pkpTokenData.publicKey;
  });

  describe("Successful Execution Constraints", () => {
    it("Execute Only to the Max Condition Monitor", async () => {
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 3,
      });
      await newCircuit.start({ pkpPublicKey });
      expect(newCircuit["conditionExecutedCount"]).to.equal(3);
    });

    it("Execute Only After the Start Date", async () => {
      let actionSet = false;
      const LitActionCode = newCircuit.setActions([
        {
          type: "custom",
          priority: 2,
          code: `async () => { actionSet = true; }`,
          args: {
            actionSet,
          },
        },
      ]);
      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpPublicKey = pkpTokenData.publicKey;

      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + 20);

      newCircuit.executionConstraints({
        startDate: futureDate,
      });

      await newCircuit.start({ pkpPublicKey });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // there should be no longs
      expect(actionSet).to.false;
    });

    it("Execute Only Before the End Date", async () => {
      let actionSet = false;
      const LitActionCode = newCircuit.setActions([
        {
          type: "custom",
          priority: 2,
          code: `async () => { actionSet = true; }`,
          args: {
            actionSet,
          },
        },
      ]);
      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpPublicKey = pkpTokenData.publicKey;

      const endDate = new Date();
      endDate.setSeconds(endDate.getSeconds() - 20);

      newCircuit.executionConstraints({
        endDate: endDate,
      });

      await newCircuit.start({ pkpPublicKey });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // there should be no longs
      expect(actionSet).to.false;
    });

    it("Execute Only to the Lit Action Completions", async () => {
      newCircuit.executionConstraints({
        maxLitActionCompletions: 3,
      });
      await newCircuit.start({ pkpPublicKey });
      expect(newCircuit["litActionCompletionCount"]).to.equal(3);
    });

    it("Execute Only to the Max Lit Action Completions with Higher Max Executions", async () => {
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 4,
        maxLitActionCompletions: 1,
      });
      await newCircuit.start({ pkpPublicKey });
      expect(newCircuit["litActionCompletionCount"]).to.equal(1);
      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
    });

    it("Execute Only to the Max Condition Monitor with Higher Lit Action Completions", async () => {
      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
        maxLitActionCompletions: 2,
      });
      await newCircuit.start({ pkpPublicKey });
      expect(newCircuit["litActionCompletionCount"]).to.equal(1);
      expect(newCircuit["conditionExecutedCount"]).to.equal(1);
    });

    it("Continuously Execute for No Constraints Provided", async () => {
      const startPromise = newCircuit.start({ pkpPublicKey });

      setTimeout(() => {
        newCircuit.interrupt();
      }, 20000);

      await startPromise;

      expect(newCircuit["conditionExecutedCount"]).to.be.greaterThan(5);
    });
  });
});
