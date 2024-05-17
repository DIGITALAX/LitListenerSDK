import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Circuit } from "../src/circuit";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";
import pkpABI from "./../src/abis/PKPNFT.json";
import { create } from "ipfs-http-client";
import CryptoJS from "crypto-js";
import {
  Action,
  CHAIN_NAME,
  ContractAction,
  CustomAction,
  FetchAction,
  LitUnsignedTransaction,
  LogCategory,
  WebhookCondition,
} from "./../src/@types/lit-listener-sdk";
import {
  CHRONICLE_PROVIDER,
  DENO_BUNDLED,
  PKP_CONTRACT_ADDRESS,
} from "./../src/constants";

describe("Set the Actions of the Circuit", () => {
  let LitActionCode: string,
    newCircuit: Circuit,
    deployedListenerToken: Contract,
    from: SignerWithAddress,
    to: SignerWithAddress,
    publicKey: string,
    ipfsCID: string;

  const chronicleProvider = new ethers.providers.JsonRpcProvider(
    CHRONICLE_PROVIDER,
    175177,
  );

  describe("SetCustomActions", () => {
    before(async () => {
      // Create a test instance of the circuit
      newCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        undefined,
        true,
      );
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

      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
    });

    // Define the custom actions
    it("Define the Actions Correctly", async () => {
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

      // Set the actions on the circuit
      const res = await newCircuit.setActions(customActions);
      LitActionCode = res.litActionCode;

      // Assert that the generated code contains the expected custom actions
      expect(LitActionCode).to.include(
        'concatenatedResponse.custom0 = "Custom Action 1"',
      );
      expect(LitActionCode).to.include(
        'concatenatedResponse.custom1 = "Custom Action 2"',
      );
      expect(LitActionCode.indexOf("custom1")).to.be.greaterThan(
        LitActionCode.indexOf("custom0"),
      );
    });

    it("Return the Response Object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
      });

      const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].category).to.equal(1);
      expect(responseLog[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLog[0].responseObject);
      expect(parsed.response).to.deep.equal({
        0: '{"custom0":"Custom Action 1"}',
        1: '{"custom1":"Custom Action 2"}',
      });
    });
  });

  describe("Set Fetch Actions", () => {
    before(async () => {
      // Create a test instance of the circuit
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

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
    });

    it("DefineTheActionsCorrectly", async () => {
      // Define the fetch actions
      const buffer = Buffer.from("polygon");
      const fetchActions: FetchAction[] = [
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/zones/forecast/MIZ018/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Polygon" }],
          toSign: new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
          ),
        },
      ];

      // Set the actions on the circuit
      const res = await newCircuit.setActions(fetchActions);
      LitActionCode = res.litActionCode;
      // Assert that the generated code contains the expected fetch action
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `const fetch0 = async () => {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `const headers = undefined ? { Authorization: 'Bearer undefined' } : undefined;`.replace(
          /\s/g,
          "",
        ),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `const response = await fetch('https://api.weather.gov/zones/forecast/MIZ018/forecast', { headers });`.replace(
          /\s/g,
          "",
        ),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `const responseJSON = await response.json();`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `let value = responseJSON;`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `for (const part of pathParts) {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `value = value[part];`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `if (value === undefined) {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `if (checkSignCondition(value, signConditionFetch0)) {`.replace(
          /\s/g,
          "",
        ),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `await Lit.Actions.signEcdsa({
          toSign: toSignFetch0,
          publicKey,
          sigName: "fetch0",
      });`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.fetch0 = { value, signed: true };`.replace(
          /\s/g,
          "",
        ),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `} else {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.fetch0 = { value, signed: false };`.replace(
          /\s/g,
          "",
        ),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `} catch (err) {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `console.log('Error thrown on fetch at priority 0: ', err);`.replace(
          /\s/g,
          "",
        ),
      );
    });

    it("Won't Sign on Incorrect Condition Met", async () => {
      const noSignCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        undefined,
        true,
      );
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
      ];

      noSignCircuit.setConditions([
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

      noSignCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });

      // Set the actions on the circuit
      const LitActionCode = await noSignCircuit.setActions(fetchActions);

      const ipfsCID = await noSignCircuit.getIPFSHash(
        LitActionCode.litActionCode,
      );
      const pkpTokenData = await noSignCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      await noSignCircuit.start({
        publicKey: pkpTokenData.publicKey,
      });

      const responseLog = noSignCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].category).to.equal(1);
      expect(responseLog[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLog[0].responseObject);
      expect(parsed.response).to.deep.equal({
        fetch0: {
          value: "Polygon",
          signed: false,
        },
      });
    });

    it("Return the Response Object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);
      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
      });

      const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].category).to.equal(1);
      expect(responseLog[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLog[0].responseObject);
      expect(parsed.response).to.deep.equal({
        fetch0: {
          value: "Polygon",
          signed: true,
        },
      });
    });
  });

  describe("Fetch Action for No To Sign", () => {
    before(async () => {
      // Create a test instance of the circuit
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

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 10,
      });

      const fetchActions: FetchAction[] = [
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/zones/forecast/MIZ018/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Polygon" }],
        },
      ];

      // Set the actions on the circuit
      await newCircuit.setActions(fetchActions);
    });

    it("Check Returned Response is Signed", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
      });

      const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].category).to.equal(1);
      expect(responseLog[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLog[0].responseObject);
      expect(parsed.response).to.deep.equal({
        fetch0: {
          value: "Polygon",
          signed: true,
        },
      });
    });
  });

  let generateUnsignedTransactionData: LitUnsignedTransaction;
  describe("SetContractActions", () => {
    before(async () => {
      // Create a test instance of the circuit
      newCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        undefined,
        true,
      );

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

      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });

      [from, to] = await ethers.getSigners();

      const ListenerToken = await ethers.getContractFactory("ListenerERC20");

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      generateUnsignedTransactionData =
        await newCircuit.generateUnsignedTransactionData(
          {
            contractAddress: deployedListenerToken.address as `0x${string}`,
            chainId: CHAIN_NAME.HARDHAT,
            gasLimit: undefined,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            from: from.address as `0x${string}`,
            functionName: "transfer",
            args: [to.address, 5000],
            abi: ListenerERC20ABI,
          },
          "http://127.0.0.1:8545",
        );
    });

    it("Define the Actions Correctly", async () => {
      // Define the contract actions
      const contractActions: ContractAction[] = [
        {
          type: "contract",
          priority: 0,
          contractAddress: deployedListenerToken.address as `0x${string}`,
          abi: ListenerERC20ABI,
          functionName: "transfer",
          from: from.address as `0x${string}`,
          chainId: CHAIN_NAME.HARDHAT,
          providerURL: "http://127.0.0.1:8545",
          args: [to.address, 5000],
        },
      ];

      // Set the actions on the circuit
      const res = await newCircuit.setActions(contractActions);
      LitActionCode = res.litActionCode;
      // Assert that the generated code contains the expected contract action
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `const contract0 = async () => {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `try {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `await Lit.Actions.signEcdsa({`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `toSign: hashTransaction(generatedUnsignedDataContract0)`.replace(
          /\s/g,
          "",
        ),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.contract0 = generatedUnsignedDataContract0;`.replace(
          /\s/g,
          "",
        ),
      );
    });

    it("Return the Response Object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      await newCircuit.start({
        publicKey,
      });

      const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].category).to.equal(1);
      expect(responseLog[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLog[0].responseObject);
      expect({
        ...parsed.response,
        contract0: {
          ...parsed.response.contract0,
          gasLimit: BigNumber.from("100000"),
          maxFeePerGas: BigNumber.from("2003791642"),
          maxPriorityFeePerGas: BigNumber.from("500947910"),
        },
      }).to.deep.include({
        contract0: {
          ...generateUnsignedTransactionData,
          value: { hex: "0x00", type: "BigNumber" },
          gasLimit: BigNumber.from("100000"),
          maxFeePerGas: BigNumber.from("2003791642"),
          maxPriorityFeePerGas: BigNumber.from("500947910"),
        },
      });
    });
  });

  describe("SetsTheCombinedActions", () => {
    let generateUnsignedTransactionData: LitUnsignedTransaction,
      fromSigner: any,
      from: any,
      to: any,
      contract: any;

    before(async () => {
      const provider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545",
        31337,
      );
      const accounts = await provider.listAccounts();
      fromSigner = provider.getSigner(accounts[0]);
      from = await provider.getSigner(accounts[0]).getAddress();
      to = await provider.getSigner(accounts[1]).getAddress();

      // Create a test instance of the circuit
      newCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        undefined,
        true,
      );
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 1200000,
      });

      const ListenerToken = new ethers.ContractFactory(
        ListenerERC20ABI,
        "0x608060405234801561001057600080fd5b50604080518082018252600d81526c04c697374656e6572455243323609c1b602080830191825283518085019094526004845263131254d560e21b90840152815191929161006091600391610159565b508051610074906004906020840190610159565b5050506100913369043c33c193756480000061009660201b60201c565b610253565b6001600160a01b0382166100f05760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825461010291906101f2565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b82805461016590610218565b90600052602060002090601f01602090048101928261018757600085556101cd565b82601f106101a057805160ff19168380011785556101cd565b828001600101855582156101cd579182015b828111156101cd5782518255916020019190600101906101b2565b506101d99291506101dd565b5090565b5b808211156101d957600081556001016101de565b6000821982111561021357634e487b7160e01b600052601160045260246000fd5b500190565b600181811c9082168061022c57607f821691505b6020821081141561024d57634e487b7160e01b600052602260045260246000fd5b50919050565b61094a80620002636000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c806340c10f191161007157806340c10f191461014157806370a082311461015657806395d89b411461017f578063a457c2d714610187578063a9059cbb1461019a578063dd62ed3e146101ad57600080fd5b806306fdde03146100b9578063095ea7b3146100d757806318160ddd146100fa57806323b872dd1461010c578063313ce5671461011f578063395093511461012e575b600080fd5b6100c16101c0565b6040516100ce9190610787565b60405180910390f35b6100ea6100e53660046107f8565b610252565b60405190151581526020016100ce565b6002545b6040519081526020016100ce565b6100ea61011a366004610822565b61026a565b604051601281526020016100ce565b6100ea61013c3660046107f8565b61028e565b61015461014f3660046107f8565b6102b0565b005b6100fe61016436600461085e565b6001600160a01b031660009081526020819052604090205490565b6100c16102be565b6100ea6101953660046107f8565b6102cd565b6100ea6101a83660046107f8565b61034d565b6100fe6101bb366004610880565b61035b565b6060600380546101cf906108b3565b80601f01602080910402602001604051908101604052809291908181526020018280546101fb906108b3565b80156102485780601f1061021d57610100808354040283529160200191610248565b820191906000526020600020905b81548152906001019060200180831161022b57829003601f168201915b5050505050905090565b600033610260818585610386565b5060019392505050565b6000336102788582856104aa565b610283858585610524565b506001949350505050565b6000336102608185856102a1838361035b565b6102ab91906108ee565b610386565b6102ba82826106c8565b5050565b6060600480546101cf906108b3565b600033816102db828661035b565b9050838110156103405760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b6102838286868403610386565b600033610260818585610524565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103e85760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610337565b6001600160a01b0382166104495760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610337565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b60006104b6848461035b565b9050600019811461051e57818110156105115760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e63650000006044820152606401610337565b61051e8484848403610386565b50505050565b6001600160a01b0383166105885760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610337565b6001600160a01b0382166105ea5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610337565b6001600160a01b038316600090815260208190526040902054818110156106625760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610337565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a361051e565b6001600160a01b03821661071e5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f2061646472657373006044820152606401610337565b806002600082825461073091906108ee565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b600060208083528351808285015260005b818110156107b457858101830151858201604001528201610798565b818111156107c6576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b03811681146107f357600080fd5b919050565b6000806040838503121561080b57600080fd5b610814836107dc565b946020939093013593505050565b60008060006060848603121561083757600080fd5b610840846107dc565b925061084e602085016107dc565b9150604084013590509250925092565b60006020828403121561087057600080fd5b610879826107dc565b9392505050565b6000806040838503121561089357600080fd5b61089c836107dc565b91506108aa602084016107dc565b90509250929050565b600181811c908216806108c757607f821691505b602082108114156108e857634e487b7160e01b600052602260045260246000fd5b50919050565b6000821982111561090f57634e487b7160e01b600052601160045260246000fd5b50019056fea264697066735822122009c6b9cb359a27dfc36d43332caaec135b69990dd3d06d691637eea75c6d0fdd64736f6c63430008090033",
        fromSigner,
      );

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      contract = new ethers.Contract(
        deployedListenerToken.address,
        ["function transfer(address to, uint256 value) public returns(bool)"],
        fromSigner,
      );

      generateUnsignedTransactionData =
        await newCircuit.generateUnsignedTransactionData(
          {
            contractAddress: deployedListenerToken.address as `0x${string}`,
            chainId: CHAIN_NAME.HARDHAT,
            gasLimit: 21584,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            from: from as `0x${string}`,
            functionName: "transfer",
            args: [to, 5000],
            abi: ListenerERC20ABI,
          },
          "http://127.0.0.1:8545",
        );

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

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
    });

    it("Set Combined Actions Correctly", async () => {
      const buffer = Buffer.from("polygon");
      const combinedActions: Action[] = [
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
        {
          type: "fetch",
          priority: 3,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/zones/forecast/MIZ018/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Polygon" }],
          toSign: new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
          ),
        },
        {
          type: "contract",
          priority: 2,
          contractAddress: deployedListenerToken.address as `0x${string}`,
          abi: ListenerERC20ABI,
          functionName: "transfer",
          from: from as `0x${string}`,
          chainId: CHAIN_NAME.HARDHAT,
          providerURL: "http://127.0.0.1:8545",
          args: [to, 5000],
        },
      ];

      // Set the actions on the circuit
      const res = await newCircuit.setActions(combinedActions);
      LitActionCode = res.litActionCode;

      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.fetch3 = { value, signed: true };`.replace(
          /\s/g,
          "",
        ),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.custom0 = "Custom Action 1"`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.custom1 = "Custom Action 2"`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.contract2 = generatedUnsignedDataContract2;`.replace(
          /\s/g,
          "",
        ),
      );
    });

    it("Set Actions Order Correctly", () => {
      expect(LitActionCode.indexOf("custom1")).to.be.greaterThan(
        LitActionCode.indexOf("custom0"),
      );
      expect(LitActionCode.indexOf("contract2")).to.be.greaterThan(
        LitActionCode.indexOf("custom1"),
      );
      expect(LitActionCode.indexOf("fetch3")).to.be.greaterThan(
        LitActionCode.indexOf("contract2"),
      );
    });

    it("Revert on Actions of the Same Priority Number", async () => {
      const noSignCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        undefined,
        true,
      );
      noSignCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 10000,
      });
      const buffer = Buffer.from("polygon");
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
      );
      const fetchActions: FetchAction[] = [
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/zones/forecast/MIZ018/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Hello" }],
          toSign: new Uint8Array(hash),
        },
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/zones/forecast/MIZ018/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Hello" }],
          toSign: new Uint8Array(hash),
        },
      ];

      noSignCircuit.setConditions([
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

      noSignCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });

      let error: any;
      try {
        await noSignCircuit.setActions(fetchActions);
      } catch (err) {
        error = err;
      }

      expect(() => {
        throw error;
      }).to.throw("Action with priority 0 already exists.");
    });

    it("Return the Response Object & PKP Broadcast", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      await fromSigner.sendTransaction({
        to: pkpTokenData.address,
        value: ethers.utils.parseEther("20.0"),
      });

      const mintTx = await deployedListenerToken.mint(
        pkpTokenData.address,
        ethers.utils.parseUnits("20", 18),
      );
      await mintTx.wait();

      await deployedListenerToken.approve(
        pkpTokenData.address,
        ethers.utils.parseUnits("40", 18),
      );

      await newCircuit.start({
        publicKey,
        broadcast: true,
      });

      const responseLogResponse = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLogResponse[0].category).to.equal(1);
      expect(responseLogResponse[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsedResponse = JSON.parse(responseLogResponse[0].responseObject);
      expect({
        ...parsedResponse.response,
        contract2: {
          ...parsedResponse.response.contract2,
          gasLimit: BigNumber.from("100000"),
          maxFeePerGas: BigNumber.from("2000000014"),
          maxPriorityFeePerGas: BigNumber.from("500000003"),
        },
      }).to.deep.equal({
        0: '{"custom0":"Custom Action 1"}',
        1: '{"custom1":"Custom Action 2"}',
        contract2: {
          ...generateUnsignedTransactionData,
          value: { type: "BigNumber", hex: "0x00" },
          gasLimit: BigNumber.from("100000"),
          maxFeePerGas: BigNumber.from("2000000014"),
          maxPriorityFeePerGas: BigNumber.from("500000003"),
        },
        fetch3: {
          value: "Polygon",
          signed: true,
        },
      });

      const responseLogBroadcast = newCircuit.getLogs(LogCategory.BROADCAST);
      expect(responseLogBroadcast[0].category).to.equal(3);
      expect(responseLogBroadcast[0].message.trim()).to.equal(
        `Contract Action broadcast to chain hardhat successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLogBroadcast[0].responseObject);
      expect({
        ...parsed,
        maxPriorityFeePerGas: BigNumber.from("650328901"),
        maxFeePerGas: BigNumber.from("2601315606"),
        gasPrice: null,
        gasLimit: BigNumber.from("100000"),
      }).to.deep.include({
        type: 2,
        chainId: 31337,
        nonce: 0,
        maxPriorityFeePerGas: BigNumber.from("650328901"),
        maxFeePerGas: BigNumber.from("2601315606"),
        gasPrice: null,
        gasLimit: BigNumber.from("100000"),
        to: deployedListenerToken.address,
        value: { type: "BigNumber", hex: "0x00" },
        data: "0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000000001388",
        accessList: [],
        from: pkpTokenData.address,
        confirmations: 0,
      });
    });
  });

  describe("EvaluateContractActionNonceData", () => {
    let from: any, fromAddress: any, to: any, contract: any;
    beforeEach(async () => {
      const provider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545",
        31337,
      );
      const accounts = await provider.listAccounts();
      from = provider.getSigner(accounts[0]);
      fromAddress = await provider.getSigner(accounts[0]).getAddress();
      to = await provider.getSigner(accounts[1]).getAddress();

      const ListenerToken = new ethers.ContractFactory(
        ListenerERC20ABI,
        "0x608060405234801561001057600080fd5b50604080518082018252600d81526c04c697374656e6572455243323609c1b602080830191825283518085019094526004845263131254d560e21b90840152815191929161006091600391610159565b508051610074906004906020840190610159565b5050506100913369043c33c193756480000061009660201b60201c565b610253565b6001600160a01b0382166100f05760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825461010291906101f2565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b82805461016590610218565b90600052602060002090601f01602090048101928261018757600085556101cd565b82601f106101a057805160ff19168380011785556101cd565b828001600101855582156101cd579182015b828111156101cd5782518255916020019190600101906101b2565b506101d99291506101dd565b5090565b5b808211156101d957600081556001016101de565b6000821982111561021357634e487b7160e01b600052601160045260246000fd5b500190565b600181811c9082168061022c57607f821691505b6020821081141561024d57634e487b7160e01b600052602260045260246000fd5b50919050565b61094a80620002636000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c806340c10f191161007157806340c10f191461014157806370a082311461015657806395d89b411461017f578063a457c2d714610187578063a9059cbb1461019a578063dd62ed3e146101ad57600080fd5b806306fdde03146100b9578063095ea7b3146100d757806318160ddd146100fa57806323b872dd1461010c578063313ce5671461011f578063395093511461012e575b600080fd5b6100c16101c0565b6040516100ce9190610787565b60405180910390f35b6100ea6100e53660046107f8565b610252565b60405190151581526020016100ce565b6002545b6040519081526020016100ce565b6100ea61011a366004610822565b61026a565b604051601281526020016100ce565b6100ea61013c3660046107f8565b61028e565b61015461014f3660046107f8565b6102b0565b005b6100fe61016436600461085e565b6001600160a01b031660009081526020819052604090205490565b6100c16102be565b6100ea6101953660046107f8565b6102cd565b6100ea6101a83660046107f8565b61034d565b6100fe6101bb366004610880565b61035b565b6060600380546101cf906108b3565b80601f01602080910402602001604051908101604052809291908181526020018280546101fb906108b3565b80156102485780601f1061021d57610100808354040283529160200191610248565b820191906000526020600020905b81548152906001019060200180831161022b57829003601f168201915b5050505050905090565b600033610260818585610386565b5060019392505050565b6000336102788582856104aa565b610283858585610524565b506001949350505050565b6000336102608185856102a1838361035b565b6102ab91906108ee565b610386565b6102ba82826106c8565b5050565b6060600480546101cf906108b3565b600033816102db828661035b565b9050838110156103405760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b6102838286868403610386565b600033610260818585610524565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103e85760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610337565b6001600160a01b0382166104495760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610337565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b60006104b6848461035b565b9050600019811461051e57818110156105115760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e63650000006044820152606401610337565b61051e8484848403610386565b50505050565b6001600160a01b0383166105885760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610337565b6001600160a01b0382166105ea5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610337565b6001600160a01b038316600090815260208190526040902054818110156106625760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610337565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a361051e565b6001600160a01b03821661071e5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f2061646472657373006044820152606401610337565b806002600082825461073091906108ee565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b600060208083528351808285015260005b818110156107b457858101830151858201604001528201610798565b818111156107c6576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b03811681146107f357600080fd5b919050565b6000806040838503121561080b57600080fd5b610814836107dc565b946020939093013593505050565b60008060006060848603121561083757600080fd5b610840846107dc565b925061084e602085016107dc565b9150604084013590509250925092565b60006020828403121561087057600080fd5b610879826107dc565b9392505050565b6000806040838503121561089357600080fd5b61089c836107dc565b91506108aa602084016107dc565b90509250929050565b600181811c908216806108c757607f821691505b602082108114156108e857634e487b7160e01b600052602260045260246000fd5b50919050565b6000821982111561090f57634e487b7160e01b600052601160045260246000fd5b50019056fea264697066735822122009c6b9cb359a27dfc36d43332caaec135b69990dd3d06d691637eea75c6d0fdd64736f6c63430008090033",
        from,
      );

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      contract = new ethers.Contract(
        deployedListenerToken.address,
        ["function transfer(address to, uint256 value) public returns(bool)"],
        from,
      );

      // Create a test instance of the circuit
      newCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        undefined,
        true,
      );
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 120000,
      });

      generateUnsignedTransactionData =
        await newCircuit.generateUnsignedTransactionData(
          {
            contractAddress: contract.address as `0x${string}`,
            chainId: CHAIN_NAME.HARDHAT,
            gasLimit: 21584,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            from: fromAddress as `0x${string}`,
            functionName: "transfer",
            args: [to, 5000],
            abi: ListenerERC20ABI,
          },
          "http://127.0.0.1:8545",
        );

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

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });
    });

    it("Increments Nonce Data", async () => {
      const contractActions: Action[] = [
        {
          type: "contract",
          priority: 1,
          contractAddress: deployedListenerToken.address as `0x${string}`,
          abi: ListenerERC20ABI,
          functionName: "transfer",
          from: fromAddress as `0x${string}`,
          chainId: CHAIN_NAME.HARDHAT,
          providerURL: "http://127.0.0.1:8545",
          args: [to, 5000],
        },
        {
          type: "contract",
          priority: 2,
          contractAddress: contract.address as `0x${string}`,
          abi: ListenerERC20ABI,
          functionName: "transfer",
          from: fromAddress as `0x${string}`,
          chainId: CHAIN_NAME.HARDHAT,
          providerURL: "http://127.0.0.1:8545",
          args: [to, 5000],
        },
        {
          type: "contract",
          priority: 3,
          contractAddress: contract.address as `0x${string}`,
          abi: ListenerERC20ABI,
          functionName: "transfer",
          from: fromAddress as `0x${string}`,
          chainId: CHAIN_NAME.HARDHAT,
          providerURL: "http://127.0.0.1:8545",
          args: [to, 5000],
        },
      ];

      // Set the actions on the circuit
      const res = await newCircuit.setActions(contractActions);
      LitActionCode = res.litActionCode;
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      const mintTx = await deployedListenerToken.mint(
        pkpTokenData.address,
        ethers.utils.parseUnits("20", 18),
      );
      await mintTx.wait();

      await deployedListenerToken
        .connect(from)
        .approve(pkpTokenData.address, ethers.utils.parseUnits("20", 18));

      await from.sendTransaction({
        to: pkpTokenData.address,
        value: ethers.utils.parseEther("20.0"),
      });

      await newCircuit.start({
        publicKey,
        broadcast: true,
      });

      const responseLogResponse = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLogResponse[0].category).to.equal(1);
      expect(responseLogResponse[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );

      const responseLogBroadcast = newCircuit.getLogs(LogCategory.BROADCAST);

      const parsedOne = JSON.parse(
        responseLogBroadcast[0].responseObject,
      ).nonce;
      const parsedTwo = JSON.parse(
        responseLogBroadcast[1].responseObject,
      ).nonce;
      const parsedThree = JSON.parse(
        responseLogBroadcast[2].responseObject,
      ).nonce;

      expect(parsedOne).to.equal(0);
      expect(parsedTwo).to.equal(1);
      expect(parsedThree).to.equal(2);
    });
  });

  describe("FunctionsWithSecureKey", () => {
    let litActionCodeReturned: string,
      secureKeyReturned: string,
      from: any,
      fromAddress: any,
      to: any,
      ipfsClient: any;
    before(async () => {
      // Create a test instance of the circuit
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

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 10,
        maxLitActionCompletions: 1,
      });

      const fetchActions: FetchAction[] = [
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/zones/forecast/MIZ018/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Polygon" }],
        },
      ];
      const { unsignedTransactionDataObject, litActionCode, secureKey } =
        await newCircuit.setActions(fetchActions, true);

      ipfsClient = create({
        url: "https://ipfs.infura.io:5001/api/v0",
        headers: {
          authorization:
            "Basic " +
            Buffer.from(
              process.env.INFURA_PROJECT_ID +
                ":" +
                process.env.INFURA_SECRET_KEY,
            ).toString("base64"),
        },
      });

      const added = await ipfsClient.add(JSON.stringify(litActionCode));
      const ipfsBundledCID = added.path;

      litActionCodeReturned = litActionCode;
      secureKeyReturned = secureKey;

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsBundledCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
        ipfsCID: ipfsBundledCID,
        secureKey,
        broadcast: true,
      });
    });

    it("Returns the secure key hashes as in the Lit Action", async () => {
      const hash = CryptoJS.SHA256(secureKeyReturned);
      const stringHash = "0x" + hash.toString(CryptoJS.enc.Hex);
      const regex = /const CONDITIONAL_HASH = \"(0x[a-fA-F0-9]+)\"/;
      const match = litActionCodeReturned.match(regex);
      expect(match[1]).to.equal(stringHash);
    });

    it("Bundled code is returned accurately", async () => {
      expect(litActionCodeReturned.replace(/\s/g, "")).to.include(
        DENO_BUNDLED.replace(/\s/g, ""),
      );
    });

    it("Runs on the Lit Nodes and Broadcasts", async () => {
      const provider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545",
        31337,
      );
      const accounts = await provider.listAccounts();
      from = provider.getSigner(accounts[0]);
      fromAddress = await provider.getSigner(accounts[0]).getAddress();
      to = await provider.getSigner(accounts[1]).getAddress();

      const ListenerToken = new ethers.ContractFactory(
        ListenerERC20ABI,
        "0x608060405234801561001057600080fd5b50604080518082018252600d81526c04c697374656e6572455243323609c1b602080830191825283518085019094526004845263131254d560e21b90840152815191929161006091600391610159565b508051610074906004906020840190610159565b5050506100913369043c33c193756480000061009660201b60201c565b610253565b6001600160a01b0382166100f05760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825461010291906101f2565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b82805461016590610218565b90600052602060002090601f01602090048101928261018757600085556101cd565b82601f106101a057805160ff19168380011785556101cd565b828001600101855582156101cd579182015b828111156101cd5782518255916020019190600101906101b2565b506101d99291506101dd565b5090565b5b808211156101d957600081556001016101de565b6000821982111561021357634e487b7160e01b600052601160045260246000fd5b500190565b600181811c9082168061022c57607f821691505b6020821081141561024d57634e487b7160e01b600052602260045260246000fd5b50919050565b61094a80620002636000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c806340c10f191161007157806340c10f191461014157806370a082311461015657806395d89b411461017f578063a457c2d714610187578063a9059cbb1461019a578063dd62ed3e146101ad57600080fd5b806306fdde03146100b9578063095ea7b3146100d757806318160ddd146100fa57806323b872dd1461010c578063313ce5671461011f578063395093511461012e575b600080fd5b6100c16101c0565b6040516100ce9190610787565b60405180910390f35b6100ea6100e53660046107f8565b610252565b60405190151581526020016100ce565b6002545b6040519081526020016100ce565b6100ea61011a366004610822565b61026a565b604051601281526020016100ce565b6100ea61013c3660046107f8565b61028e565b61015461014f3660046107f8565b6102b0565b005b6100fe61016436600461085e565b6001600160a01b031660009081526020819052604090205490565b6100c16102be565b6100ea6101953660046107f8565b6102cd565b6100ea6101a83660046107f8565b61034d565b6100fe6101bb366004610880565b61035b565b6060600380546101cf906108b3565b80601f01602080910402602001604051908101604052809291908181526020018280546101fb906108b3565b80156102485780601f1061021d57610100808354040283529160200191610248565b820191906000526020600020905b81548152906001019060200180831161022b57829003601f168201915b5050505050905090565b600033610260818585610386565b5060019392505050565b6000336102788582856104aa565b610283858585610524565b506001949350505050565b6000336102608185856102a1838361035b565b6102ab91906108ee565b610386565b6102ba82826106c8565b5050565b6060600480546101cf906108b3565b600033816102db828661035b565b9050838110156103405760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b6102838286868403610386565b600033610260818585610524565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103e85760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610337565b6001600160a01b0382166104495760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610337565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b60006104b6848461035b565b9050600019811461051e57818110156105115760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e63650000006044820152606401610337565b61051e8484848403610386565b50505050565b6001600160a01b0383166105885760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610337565b6001600160a01b0382166105ea5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610337565b6001600160a01b038316600090815260208190526040902054818110156106625760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610337565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a361051e565b6001600160a01b03821661071e5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f2061646472657373006044820152606401610337565b806002600082825461073091906108ee565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b600060208083528351808285015260005b818110156107b457858101830151858201604001528201610798565b818111156107c6576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b03811681146107f357600080fd5b919050565b6000806040838503121561080b57600080fd5b610814836107dc565b946020939093013593505050565b60008060006060848603121561083757600080fd5b610840846107dc565b925061084e602085016107dc565b9150604084013590509250925092565b60006020828403121561087057600080fd5b610879826107dc565b9392505050565b6000806040838503121561089357600080fd5b61089c836107dc565b91506108aa602084016107dc565b90509250929050565b600181811c908216806108c757607f821691505b602082108114156108e857634e487b7160e01b600052602260045260246000fd5b50919050565b6000821982111561090f57634e487b7160e01b600052601160045260246000fd5b50019056fea264697066735822122009c6b9cb359a27dfc36d43332caaec135b69990dd3d06d691637eea75c6d0fdd64736f6c63430008090033",
        from,
      );

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      const contract = new ethers.Contract(
        deployedListenerToken.address,
        ["function transfer(address to, uint256 value) public returns(bool)"],
        from,
      );

      newCircuit = new Circuit(
        new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
        undefined,
        undefined,
        true,
      );
      newCircuit.setConditionalLogic({
        type: "EVERY",
        interval: 120000,
      });

      generateUnsignedTransactionData =
        await newCircuit.generateUnsignedTransactionData(
          {
            contractAddress: contract.address as `0x${string}`,
            chainId: CHAIN_NAME.HARDHAT,
            gasLimit: 21584,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            from: fromAddress as `0x${string}`,
            functionName: "transfer",
            args: [to, 5000],
            abi: ListenerERC20ABI,
          },
          "http://127.0.0.1:8545",
        );

      newCircuit.executionConstraints({
        conditionMonitorExecutions: 1,
      });

      const contractActions: Action[] = [
        {
          type: "contract",
          priority: 3,
          contractAddress: contract.address as `0x${string}`,
          abi: ListenerERC20ABI,
          functionName: "transfer",
          from: fromAddress as `0x${string}`,
          chainId: CHAIN_NAME.HARDHAT,
          providerURL: "http://127.0.0.1:8545",
          args: [to, 5000],
        },
      ];

      generateUnsignedTransactionData =
        await newCircuit.generateUnsignedTransactionData(
          {
            contractAddress: contract.address as `0x${string}`,
            chainId: CHAIN_NAME.HARDHAT,
            gasLimit: 21584,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            from: fromAddress as `0x${string}`,
            functionName: "transfer",
            args: [to, 5000],
            abi: ListenerERC20ABI,
          },
          "http://127.0.0.1:8545",
        );

      // Set the actions on the circuit
      const res = await newCircuit.setActions(contractActions, true);
      LitActionCode = res.litActionCode;
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      );
      const pkpTokenId = pkpTokenData.tokenId;
      publicKey = await pkpContract.getPubkey(pkpTokenId);

      const mintTx = await deployedListenerToken.mint(
        pkpTokenData.address,
        ethers.utils.parseUnits("20", 18),
      );
      await mintTx.wait();

      await deployedListenerToken
        .connect(from)
        .approve(pkpTokenData.address, ethers.utils.parseUnits("20", 18));

      await from.sendTransaction({
        to: pkpTokenData.address,
        value: ethers.utils.parseEther("20.0"),
      });

      const added = await ipfsClient.add(JSON.stringify(res.litActionCode));
      const ipfsBundledCID = added.path;

      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
        ipfsCID: ipfsBundledCID,
        secureKey: res.secureKey,
        broadcast: true,
      });

      // const responseLogResponse = newCircuit.getLogs(LogCategory.RESPONSE);

      // expect(responseLogResponse[0].category).to.equal(1);
      // expect(responseLogResponse[0].message.trim()).to.equal(
      //   `Circuit executed successfully. Lit Action Response.`.trim(),
      // );

      // const responseLogBroadcast = newCircuit.getLogs(LogCategory.BROADCAST);

      // const parsedOne = JSON.parse(
      //   responseLogBroadcast[0].responseObject,
      // ).nonce;
      // const parsedTwo = JSON.parse(
      //   responseLogBroadcast[1].responseObject,
      // ).nonce;
      // const parsedThree = JSON.parse(
      //   responseLogBroadcast[2].responseObject,
      // ).nonce;

      // expect(parsedOne).to.equal(0);
      // expect(parsedTwo).to.equal(1);
      // expect(parsedThree).to.equal(2);
    });
  });
});
