import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Circuit } from "../src/circuit";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";
import pkpABI from "./../src/abis/PKPNFT.json";
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
import { CHRONICLE_PROVIDER, PKP_CONTRACT_ADDRESS } from "./../src/constants";
import { PKPNFT } from "typechain-types/contracts/PKPNFT";

xdescribe("Set the Actions of the Circuit", () => {
  let LitActionCode: string,
    newCircuit: Circuit,
    deployedListenerToken: Contract,
    from: SignerWithAddress,
    to: SignerWithAddress,
    pkpPublicKey: string,
    ipfsCID: string;

  const chronicleProvider = new ethers.providers.JsonRpcProvider(
    CHRONICLE_PROVIDER,
    175177,
  );

  before(async () => {
    // Create a test instance of the circuit
    newCircuit = new Circuit(
      process.env.MUMBAI_PROVIDER_URL,
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

    newCircuit.executionConstraints({
      maxExecutions: 1,
    });
  });

  describe("Set custom actions correctly", () => {
    // Define the custom actions
    it("It should define the actions correctly", () => {
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
      LitActionCode = newCircuit.setActions(customActions);

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

    it("Return the correct response object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);

      const authSig = await newCircuit.generateAuthSignature(80001);
      await newCircuit.start({
        pkpPublicKey: pkpTokenData.publicKey,
        authSig,
      });

      const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].category).to.equal(1);
      expect(responseLog[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLog[0].responseObject);
      expect(parsed.response).to.deep.equal({
        custom0: "Custom Action 1",
        custom1: "Custom Action 2",
      });
    });
  });

  describe("Set fetch actions correctly", () => {
    it("It should define the actions correctly", () => {
      // Define the fetch actions
      const buffer = Buffer.from("polygon");
      const fetchActions: FetchAction[] = [
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/gridpoints/LWX/97,71/forecast",
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
      LitActionCode = newCircuit.setActions(fetchActions);
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
        `const response = await fetch('https://api.weather.gov/gridpoints/LWX/97,71/forecast', { headers });`.replace(
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
        `if (checkSignCondition(value, signCondition)) {`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `await Lit.Actions.signEcdsa({
          toSign: hashTransaction(generatedUnsignedData),
          publicKey,
          sigName: "sig1",
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

    it("It should not sign on incorrect condition met", async () => {
      const noSignCircuit = new Circuit(
        process.env.MUMBAI_PROVIDER_URL,
        new ethers.Wallet(process.env.MUMBAI_PRIVATE_KEY, chronicleProvider),
      );
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
      ];

      noSignCircuit.setConditions([
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

      noSignCircuit.executionConstraints({
        maxExecutions: 1,
      });

      // Set the actions on the circuit
      LitActionCode = noSignCircuit.setActions(fetchActions);

      ipfsCID = await noSignCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await noSignCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);
      const authSig = await noSignCircuit.generateAuthSignature(80001);
      await noSignCircuit.start({
        pkpPublicKey: pkpTokenData.publicKey,
        authSig,
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

    it("Should return the correct response object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);
      const authSig = await newCircuit.generateAuthSignature(80001);
      await newCircuit.start({
        pkpPublicKey: pkpTokenData.publicKey,
        authSig,
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

  describe("Should set contract actions correctly", () => {
    let generateUnsignedTransactionData: LitUnsignedTransaction;
    before(async () => {
      [from, to] = await ethers.getSigners();

      const ListenerToken = await ethers.getContractFactory("ListenerERC20");

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      generateUnsignedTransactionData =
        newCircuit.generateUnsignedTransactionData({
          contractAddress: deployedListenerToken.address as `0x${string}`,
          chainId: CHAIN_NAME.MUMBAI,
          gasLimit: undefined,
          gasPrice: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          from: from.address as `0x${string}`,
          functionName: "transferFrom",
          args: [from.address, to.address, 5000],
          abi: ListenerERC20ABI,
        });
    });

    it("It should define the actions correctly", async () => {
      // Define the contract actions
      const contractActions: ContractAction[] = [
        {
          type: "contract",
          priority: 0,
          contractAddress: deployedListenerToken.address as `0x${string}`,
          abi: ListenerERC20ABI,
          functionName: "transferFrom",
          from: from.address as `0x${string}`,
          chainId: CHAIN_NAME.MUMBAI,
          args: [from.address, to.address, 5000],
        },
      ];

      // Set the actions on the circuit
      LitActionCode = newCircuit.setActions(contractActions);
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
        `toSign: hashTransaction(generatedUnsignedData)`.replace(/\s/g, ""),
      );
      expect(LitActionCode.replace(/\s/g, "")).to.include(
        `concatenatedResponse.contract0 = generatedUnsignedData;`.replace(
          /\s/g,
          "",
        ),
      );
    });

    it("Should return the correct response object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);

      const authSig = await newCircuit.generateAuthSignature(80001);
      await newCircuit.start({
        pkpPublicKey,
        authSig,
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
          gasPrice: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
        },
      }).to.deep.equal({
        contract0: generateUnsignedTransactionData,
      });
    });
  });

  describe("Sets the combined actions correctly", () => {
    let generateUnsignedTransactionData: LitUnsignedTransaction;
    before(async () => {
      [from, to] = await ethers.getSigners();

      const ListenerToken = await ethers.getContractFactory("ListenerERC20");

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      generateUnsignedTransactionData =
        newCircuit.generateUnsignedTransactionData({
          contractAddress: deployedListenerToken.address as `0x${string}`,
          chainId: CHAIN_NAME.MUMBAI,
          gasLimit: undefined,
          gasPrice: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          from: from.address as `0x${string}`,
          functionName: "transferFrom",
          args: [from.address, to.address, 5000],
          abi: ListenerERC20ABI,
        });
    });

    it("Should set combined actions correctly", () => {
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
          endpoint: "/gridpoints/LWX/97,71/forecast",
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
          functionName: "transferFrom",
          from: from.address as `0x${string}`,
          chainId: CHAIN_NAME.MUMBAI,
          args: [from.address, to.address, 5000],
        },
      ];

      // Set the actions on the circuit
      LitActionCode = newCircuit.setActions(combinedActions);

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
        `concatenatedResponse.contract2 = generatedUnsignedData;`.replace(
          /\s/g,
          "",
        ),
      );
    });

    it("Should set actions order correctly", () => {
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

    it("Should revert if there is actions of the same priority number", async () => {
      const noSignCircuit = new Circuit(
        process.env.MUMBAI_PROVIDER_URL,
        new ethers.Wallet(process.env.MUMBAI_PRIVATE_KEY, chronicleProvider),
      );
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

      noSignCircuit.setConditions([
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

      noSignCircuit.executionConstraints({
        maxExecutions: 1,
      });

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

    it("Should return the correct response object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS,
        pkpABI,
        chronicleProvider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);

      const authSig = await newCircuit.generateAuthSignature(80001);
      await newCircuit.start({
        pkpPublicKey,
        authSig,
      });

      const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].category).to.equal(1);
      expect(responseLog[0].message.trim()).to.equal(
        `Circuit executed successfully. Lit Action Response.`.trim(),
      );
      const parsed = JSON.parse(responseLog[0].responseObject);
      expect({
        ...parsed.response,
        contract2: {
          ...parsed.response.contract2,
          gasPrice: undefined,
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
        },
      }).to.deep.equal({
        custom0: "Custom Action 1",
        custom1: "Custom Action 2",
        contract2: generateUnsignedTransactionData,
        fetch3: {
          value: "Polygon",
          signed: true,
        },
      });
    });
  });
});
