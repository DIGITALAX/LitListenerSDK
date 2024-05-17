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

describe("ThrowsAllErrorsOfTheCircuit", () => {
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
      const newCircuit = new Circuit(undefined, undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      await newCircuit.setActions(customActions);
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.govvv",
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
      const newCircuit = new Circuit(undefined, undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      await newCircuit.setActions(customActions);
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/zones/forecast/MIZ018/forecast",
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

      const ListenerToken = new ethers.ContractFactory(
        ListenerERC20ABI,
        "0x608060405234801561001057600080fd5b50604080518082018252600d81526c04c697374656e6572455243323609c1b602080830191825283518085019094526004845263131254d560e21b90840152815191929161006091600391610159565b508051610074906004906020840190610159565b5050506100913369010f0cf064dd5920000061009660201b60201c565b610253565b6001600160a01b0382166100f05760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825461010291906101f2565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b82805461016590610218565b90600052602060002090601f01602090048101928261018757600085556101cd565b82601f106101a057805160ff19168380011785556101cd565b828001600101855582156101cd579182015b828111156101cd5782518255916020019190600101906101b2565b506101d99291506101dd565b5090565b5b808211156101d957600081556001016101de565b6000821982111561021357634e487b7160e01b600052601160045260246000fd5b500190565b600181811c9082168061022c57607f821691505b6020821081141561024d57634e487b7160e01b600052602260045260246000fd5b50919050565b61085d806102626000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b411461015f578063a457c2d714610167578063a9059cbb1461017a578063dd62ed3e1461018d57600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101a0565b6040516100c3919061069a565b60405180910390f35b6100df6100da36600461070b565b610232565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610735565b61024a565b604051601281526020016100c3565b6100df61013136600461070b565b61026e565b6100f3610144366004610771565b6001600160a01b031660009081526020819052604090205490565b6100b6610290565b6100df61017536600461070b565b61029f565b6100df61018836600461070b565b61031f565b6100f361019b366004610793565b61032d565b6060600380546101af906107c6565b80601f01602080910402602001604051908101604052809291908181526020018280546101db906107c6565b80156102285780601f106101fd57610100808354040283529160200191610228565b820191906000526020600020905b81548152906001019060200180831161020b57829003601f168201915b5050505050905090565b600033610240818585610358565b5060019392505050565b60003361025885828561047c565b6102638585856104f6565b506001949350505050565b600033610240818585610281838361032d565b61028b9190610801565b610358565b6060600480546101af906107c6565b600033816102ad828661032d565b9050838110156103125760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b6102638286868403610358565b6000336102408185856104f6565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103ba5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610309565b6001600160a01b03821661041b5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610309565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6000610488848461032d565b905060001981146104f057818110156104e35760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e63650000006044820152606401610309565b6104f08484848403610358565b50505050565b6001600160a01b03831661055a5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610309565b6001600160a01b0382166105bc5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610309565b6001600160a01b038316600090815260208190526040902054818110156106345760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610309565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a36104f0565b600060208083528351808285015260005b818110156106c7578581018301518582016040015282016106ab565b818111156106d9576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b038116811461070657600080fd5b919050565b6000806040838503121561071e57600080fd5b610727836106ef565b946020939093013593505050565b60008060006060848603121561074a57600080fd5b610753846106ef565b9250610761602085016106ef565b9150604084013590509250925092565b60006020828403121561078357600080fd5b61078c826106ef565b9392505050565b600080604083850312156107a657600080fd5b6107af836106ef565b91506107bd602084016106ef565b90509250929050565b600181811c908216806107da57607f821691505b602082108114156107fb57634e487b7160e01b600052602260045260246000fd5b50919050565b6000821982111561082257634e487b7160e01b600052601160045260246000fd5b50019056fea2646970667358221220141fefbdec7fc3f92535f0b10f40d8a4ce87f2b1a7f029959160fca73bcfa0db64736f6c63430008090033",
        owner,
      );

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();
    });

    it("Throw Error While Processing Contract Event", async () => {
      const newCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
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
      const newCircuit = new Circuit(undefined, undefined, undefined, true);
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
      const noSignCircuit = new Circuit(undefined, undefined, undefined, true);
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
          endpoint: "/zones/forecast/MIZ018/forecast",
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
          endpoint: "/zones/forecast/MIZ018/forecast",
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
      const newCircuit = new Circuit(undefined, undefined, undefined, true);
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
      const newCircuit = new Circuit(undefined, undefined, undefined, true);
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
      const newCircuit = new Circuit(undefined, undefined, undefined, true);
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.govvv",
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
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      let error;
      try {
        await newCircuit.start({
          publicKey: pkpTokenData.publicKey,
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

      let error;
      try {
        await newCircuit.start({
          publicKey: "0x04",
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
