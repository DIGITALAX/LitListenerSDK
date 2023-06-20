import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import {
  CHAIN_NAME,
  Circuit,
  ContractCondition,
  CustomAction,
  FetchAction,
  LitChainIds,
  WebhookCondition,
} from "./../src";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";
import { CHRONICLE_PROVIDER } from "./../src/constants";

xdescribe("Correctly throws all errors", () => {
  const customActions: CustomAction[] = [
    {
      type: "custom",
      priority: 0,
      code: ' async () => { Lit.Actions.setResponse({ response: "Custom Action 1" }); }',
    },
    {
      type: "custom",
      priority: 1,
      code: 'async () => { Lit.Actions.setResponse({ response: "Custom Action 2" }); }',
    },
  ];

  describe("Starts monitoring webhook", () => {
    it("Should throw an error if an error occurs while retrieving webhook information", async () => {
      const newCircuit = new Circuit();

      newCircuit.setActions(customActions);
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.govvv",
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

      let error;
      try {
        await newCircuit.start({ pkpPublicKey: "0x04" });
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw(
        "Error in Webhook Action: getaddrinfo ENOTFOUND api.weather.govvv",
      );
    });

    it("Should throw an error if invalid response path", async () => {
      const newCircuit = new Circuit();

      newCircuit.setActions(customActions);
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/gridpoints/LWX/97,71/forecast",
          "another.path.invalid",
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

      let error;
      try {
        await newCircuit.start({ pkpPublicKey: "0x04" });
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw(
        "Error in Webhook Action: Invalid response path: another.path.invalid",
      );
    });
  });

  describe("Starts monitoring contract", () => {
    let deployedListenerToken: Contract, owner: SignerWithAddress;
    before(async () => {
      [owner] = await ethers.getSigners();

      const ListenerToken = await ethers.getContractFactory("ListenerERC20");

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();
    });

    it("Should throw an error if an error occurs while processing contract event", async () => {
      const newCircuit = new Circuit(process.env.MUMBAI_PROVIDER_URL);
      newCircuit.setActions(customActions);

      const contractCondition = new ContractCondition(
        "0xab111",
        ListenerERC20ABI,
        CHAIN_NAME.MUMBAI,
        "Transfer",
        ["from", "value"],
        [owner.address, 5000],
        async () => {},
        async () => {},
        (err) => console.error(err.message),
      );
      newCircuit.setConditions([contractCondition]);

      let error;
      try {
        await newCircuit.start({ pkpPublicKey: "0x04" });
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw(
        "Error running circuit: Error in Contract Action: Cannot read properties of undefined (reading 'Contract')",
      );
    });

    it("Should throw an error if no provider is provided for contract monitor", async () => {
      const newCircuit = new Circuit();
      newCircuit.setActions(customActions);

      const contractCondition = new ContractCondition(
        deployedListenerToken.address as `0x${string}`,
        ListenerERC20ABI,
        CHAIN_NAME.MUMBAI,
        "Transfer",
        ["from", "value"],
        [owner.address, 5000],
        async () => {},
        async () => {},
        (err) => console.error(err.message),
      );
      newCircuit.setConditions([contractCondition]);

      let error;
      try {
        await newCircuit.start({ pkpPublicKey: "0x04" });
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw("Error: No Provider URL.");
    });
  });

  describe("Should throw an error adding actions", () => {
    it("Throws an error on non unique action priority", () => {
      const noSignCircuit = new Circuit();
      const buffer = Buffer.from("polygon");
      const fetchActions: FetchAction[] = [
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/gridpoints/LWX/97,71/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Hello" }],
          toSign: new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
          ),
        },
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/gridpoints/LWX/97,71/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Hello" }],
          toSign: new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
          ),
        },
      ];

      let error;
      try {
        noSignCircuit.setActions(fetchActions);
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw("Action with priority 0 already exists.");
    });
  });

  describe("Should throw an error for invalid chain on auth sig", () => {
    it("Throws an error for invalid chain", () => {
      const newCircuit = new Circuit();
      let error;
      try {
        newCircuit.generateUnsignedTransactionData({
          contractAddress: "0x",
          chainId: "wrong chain" as any,
          gasLimit: undefined,
          gasPrice: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          from: "0x",
          functionName: "transferFrom",
          args: [],
          abi: ListenerERC20ABI,
        });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(
        `Invalid chain name. Valid chains: ${Object.keys(LitChainIds)}`,
      );
    });
  });

  describe("Should throw an error when running the circuit", () => {
    const chronicleProvider = new ethers.providers.JsonRpcProvider(
      CHRONICLE_PROVIDER,
      175177,
    );

    it("Throws an error for no conditions set", async () => {
      const newCircuit = new Circuit();

      newCircuit.setActions(customActions);

      let error;
      try {
        await newCircuit.start({ pkpPublicKey: "0x04" });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(`Conditions have not been set. Run setConditions() first.`);
    });

    it("Throws an error for no actions set", async () => {
      const newCircuit = new Circuit();
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.govvv",
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

      let error;
      try {
        await newCircuit.start({ pkpPublicKey: "0x04" });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(`Actions have not been set. Run setActions() first.`);
    });

    let newCircuit: Circuit;
    before(() => {
      newCircuit = new Circuit(
        undefined,
        new ethers.Wallet(process.env.MUMBAI_PRIVATE_KEY, chronicleProvider),
      );
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
    });

    it("Throws an error for invalid pkp", async () => {
      let error;
      newCircuit.setActions(customActions);
      try {
        await newCircuit.start({ pkpPublicKey: "mypkp" });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(`Invalid PKP Public Key.`);
    });

    it("Throws an error for invalid js params to Lit Action", async () => {
      const LitActionCode = newCircuit.setActions([
        {
          type: "custom",
          priority: 2,
          code: `async () => { await Lit.Actions.signEcdsa({
            toSign,
            publicKey,
            sigName: "sig1",
          }) }`,
        },
      ]);
      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const authSig = await newCircuit.generateAuthSignature();
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      let error;
      try {
        await newCircuit.start({
          pkpPublicKey: pkpTokenData.publicKey,
          authSig,
        });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(`Error running circuit: Error in Webhook Action: Error in Checking Against Expected Values: Error running Lit Action: There was an error getting the signing shares from the nodes`);
    });

    it("Throws an error for invalid pkp passed to Lit Action", async () => {
      const buffer = Buffer.from("Polygon");
      newCircuit.setActions([
        {
          type: "custom",
          priority: 3,
          code: `async () => { await Lit.Actions.signEcdsa({
                toSign,
                publicKey,
                sigName: "sig1",
              }) }`,
          args: {
            toSign: new Uint8Array(
              buffer.buffer,
              buffer.byteOffset,
              buffer.byteLength,
            ),
          },
        },
      ]);
      const authSig = await newCircuit.generateAuthSignature();
      let error;
      try {
        await newCircuit.start({
          pkpPublicKey: "0x04",
          authSig,
        });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(
        `Error running circuit: Error in Webhook Action: Error in Checking Against Expected Values: Error running Lit Action: invalid public or private key (argument="key", value="[REDACTED]", code=INVALID_ARGUMENT, version=signing-key/5.7.0)`,
      );
    });
  });
});
