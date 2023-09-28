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

xdescribe("Throws all Errors of the Circuit", () => {
  const chronicleProvider = new ethers.providers.JsonRpcProvider(
    CHRONICLE_PROVIDER,
    175177,
  );
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

  describe("Starts Monitoring Webhook", () => {
    it("Throw Error While Retrieving Webhook Information", async () => {
      const newCircuit = new Circuit(undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      await newCircuit.setActions(customActions);
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.govvv",
          "/gridpoints/LWX/97,71/forecast",
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
      ]);

      let error;
      try {
        await newCircuit.start({
          publicKey:
            "0x045008a4be7b862e5c74b354025d8b63581260cecf2db375f2a9a12d7cad7a863ad5d281a16427663b5c3f24abc1602f25d9ac700d93fd7ff6e5033a7fa798f2f0",
        });
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw(
        "Error in Webhook Action: getaddrinfo ENOTFOUND api.weather.govvv",
      );
    });

    it("Throw Error on Invalid Response Path", async () => {
      const newCircuit = new Circuit(undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      await newCircuit.setActions(customActions);
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/gridpoints/LWX/97,71/forecast",
          "another.path.invalid",
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
      ]);

      let error;
      try {
        await newCircuit.start({
          publicKey:
            "0x045008a4be7b862e5c74b354025d8b63581260cecf2db375f2a9a12d7cad7a863ad5d281a16427663b5c3f24abc1602f25d9ac700d93fd7ff6e5033a7fa798f2f0",
        });
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

  describe("Starts Monitoring Contract", () => {
    let deployedListenerToken: Contract, owner: SignerWithAddress;
    before(async () => {
      [owner] = await ethers.getSigners();

      const ListenerToken = await ethers.getContractFactory("ListenerERC20");

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();
    });

    it("Throw Error While Processing Contract Event", async () => {
      const newCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        true,
      );
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      await newCircuit.setActions(customActions);

      const contractCondition = new ContractCondition(
        "0x0",
        "",
        CHAIN_NAME.HARDHAT,
        "http://127.0.0.1:8545",
        "Transfer",
        ["from", "value"],
        [owner.address, 5000],
        "===",
        async () => {},
        async () => {},
        (err) => console.error(err.message),
      );
      newCircuit.setConditions([contractCondition]);

      let error;
      try {
        await newCircuit.start({
          publicKey:
            "0x045008a4be7b862e5c74b354025d8b63581260cecf2db375f2a9a12d7cad7a863ad5d281a16427663b5c3f24abc1602f25d9ac700d93fd7ff6e5033a7fa798f2f0",
        });
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw(
        "Error running circuit: Error in checking conditions: Error in Contract Action: Unexpected end of JSON input",
      );
    });

    it("Throw Error for Invalid Provider URL", async () => {
      const newCircuit = new Circuit(undefined, undefined, true);
      await newCircuit.setActions(customActions);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      const contractCondition = new ContractCondition(
        deployedListenerToken.address as `0x${string}`,
        ListenerERC20ABI,
        CHAIN_NAME.HARDHAT,
        "http://127.0.0.1:8545",
        "Transfer",
        ["from", "value"],
        [owner.address, 5000],
        "===",
        async () => {},
        async () => {},
        (err) => console.error(err.message),
      );
      newCircuit.setConditions([contractCondition]);

      let error;
      try {
        await newCircuit.start({
          publicKey:
            "0x045008a4be7b862e5c74b354025d8b63581260cecf2db375f2a9a12d7cad7a863ad5d281a16427663b5c3f24abc1602f25d9ac700d93fd7ff6e5033a7fa798f2f0",
        });
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw("Error: Invalid Provider URL.");
    });
  });

  describe("Throw Error Adding Actions", () => {
    it("Throw Error on Non Unique Action Priority", async () => {
      const noSignCircuit = new Circuit(undefined, undefined, true);
      noSignCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
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
        await noSignCircuit.setActions(fetchActions);
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw("Action with priority 0 already exists.");
    });
  });

  describe("Throw Error for Invalid Chain on Auth Sig", () => {
    it("Throw error for Invalid Chain", async () => {
      const newCircuit = new Circuit(undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      let error;
      try {
        await newCircuit.generateUnsignedTransactionData(
          {
            contractAddress: "0x",
            chainId: "wrong chain" as any,
            gasLimit: undefined,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            from: "0x",
            functionName: "transferFrom",
            args: [],
            abi: ListenerERC20ABI,
          },
          "http://127.0.0.1:8545",
        );
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

  describe("Throw Error when Running Circuit", () => {
    const chronicleProvider = new ethers.providers.JsonRpcProvider(
      CHRONICLE_PROVIDER,
      175177,
    );

    it("Throw Error for No Conditions Set", async () => {
      const newCircuit = new Circuit(undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      await newCircuit.setActions(customActions);

      let error;
      try {
        await newCircuit.start({
          publicKey:
            "0x045008a4be7b862e5c74b354025d8b63581260cecf2db375f2a9a12d7cad7a863ad5d281a16427663b5c3f24abc1602f25d9ac700d93fd7ff6e5033a7fa798f2f0",
        });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(`Conditions have not been set. Run setConditions() first.`);
    });

    it("Throw Error for No Actions Set", async () => {
      const newCircuit = new Circuit(undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.govvv",
          "/gridpoints/LWX/97,71/forecast",
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
      ]);

      let error;
      try {
        await newCircuit.start({
          publicKey:
            "0x045008a4be7b862e5c74b354025d8b63581260cecf2db375f2a9a12d7cad7a863ad5d281a16427663b5c3f24abc1602f25d9ac700d93fd7ff6e5033a7fa798f2f0",
        });
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
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        true,
      );
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/gridpoints/LWX/97,71/forecast",
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
      ]);
    });

    it("Throw Error for Invalid PKP", async () => {
      let error;
      await newCircuit.setActions(customActions);
      try {
        await newCircuit.start({ publicKey: "mypkp" });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(`Invalid PKP Public Key.`);
    });

    it("Throw Error for Invalid JS Params to Lit Action", async () => {
      const LitActionCode = await newCircuit.setActions([
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
      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode.litActionCode);
      const authSig = await newCircuit.generateAuthSignature();
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      let error;
      try {
        await newCircuit.start({
          publicKey: pkpTokenData.publicKey,
          authSig,
        });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw;
    });

    it("Throw Error for Invalid PKP Passed to Lit Action", async () => {
      const buffer = Buffer.from("Polygon");
      await newCircuit.setActions([
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
          publicKey: "0x04",
          authSig,
        });
      } catch (err) {
        error = err;
      }
      expect(() => {
        throw error;
      }).to.throw(
        `Error running circuit: invalid public or private key (argument="key", value="[REDACTED]", code=INVALID_ARGUMENT, version=signing-key/5.7.0)`,
      );
    });
  });
});
