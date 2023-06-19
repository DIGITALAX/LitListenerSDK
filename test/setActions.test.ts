import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Circuit } from "./../src/sdk";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";
import pkpABI from "./../src/abis/PKPNFT.json";
import {
  CHAIN_NAME,
  ContractAction,
  CustomAction,
  FetchAction,
  LogCategory,
  WebhookCondition,
} from "./../src/@types/lit-listener-sdk";
import { PKP_CONTRACT_ADDRESS_MUMBAI } from "./../src/constants";
import { PKPNFT } from "typechain-types/contracts/PKPNFT";

xdescribe("Set the Actions of the Circuit", () => {
  let LitActionCode: string,
    newCircuit: Circuit,
    deployedListenerToken: Contract,
    from: SignerWithAddress,
    to: SignerWithAddress,
    pkpPublicKey: string,
    ipfsCID: string;

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.MUMBAI_PROVIDER_URL,
  );

  before(async () => {
    // Create a test instance of the circuit
    newCircuit = new Circuit(
      process.env.MUMBAI_PROVIDER_URL,
      new ethers.Wallet(process.env.MUMBAI_PRIVATE_KEY, provider),
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

  describe("should set custom actions correctly", () => {
    // Define the custom actions
    it("it should define the actions correctly", () => {
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
        'concatenatedResponse.custom0 = "Custom Action 1";',
      );
      expect(LitActionCode).to.include(
        'concatenatedResponse.custom1 = "Custom Action 2";',
      );
      expect(LitActionCode.indexOf("custom1")).to.be.greaterThan(
        LitActionCode.indexOf("custom0"),
      );
    });

    it("should return the correct response object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS_MUMBAI,
        pkpABI,
        provider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);

      const authSig = await newCircuit.generateAuthSignature();
      await newCircuit.start({
        pkpPublicKey,
        ipfsCID,
        authSig,
      });

      const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
      expect(responseLog[0].message).to.equal({
        custom0: "Custom Action 1",
        custom1: "Custom Action 2",
      });
    });
  });

  xdescribe("should set fetch actions correctly", () => {
    it("it should define the actions correctly", () => {
      // Define the fetch actions
      const fetchActions: FetchAction[] = [
        {
          type: "fetch",
          priority: 0,
          apiKey: undefined,
          baseUrl: "https://api.weather.gov",
          endpoint: "/gridpoints/LWX/97,71/forecast",
          responsePath: "geometry.type",
          signCondition: [{ type: "&&", operator: "==", value: "Polygon" }],
          toSign: "Polygon",
        },
      ];

      // Set the actions on the circuit
      LitActionCode = newCircuit.setActions(fetchActions);

      // Assert that the generated code contains the expected fetch action
      expect(LitActionCode).to.include(`const fetch0 = async () => {`);
      expect(LitActionCode).to.include(
        `const headers = undefined ? { Authorization: 'Bearer undefined' } : undefined;`,
      );
      expect(LitActionCode).to.include(
        `const response = await fetch('https://api.weather.gov', { headers });`,
      );
      expect(LitActionCode).to.include(
        `const responseJSON = await response.json();`,
      );
      expect(LitActionCode).to.include(`let value = responseJSON;`);
      expect(LitActionCode).to.include(
        `const pathParts = 'geometry.type'.split('.');`,
      );
      expect(LitActionCode).to.include(`for (const part of pathParts) {`);
      expect(LitActionCode).to.include(`value = value[part];`);
      expect(LitActionCode).to.include(`if (value === undefined) {`);
      expect(LitActionCode).to.include(
        `if (checkSignCondition(value, [{ type: '&&', operator: '==', value: "Polygon" }])) {`,
      );
      expect(LitActionCode).to.include(
        `await Lit.Actions.signEcdsa({ toSign: 'dataToSign', publicKey: {{pkpPublicKey}}, sigName: sigName });`,
      );
      expect(LitActionCode).to.include(
        `concatenatedResponse.fetch0 = { value, signed: true };`,
      );
      expect(LitActionCode).to.include(`} else {`);
      expect(LitActionCode).to.include(
        `concatenatedResponse.fetch0 = { value, signed: false };`,
      );
      expect(LitActionCode).to.include(`} catch (err) {`);
      expect(LitActionCode).to.include(
        `console.log('Error thrown on fetch at priority 0: ', err);`,
      );
    });

    it("it should set the signed condition correctly", () => {});

    it("should return the correct response object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS_MUMBAI,
        pkpABI,
        provider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);
    });
  });

  xdescribe("should set contract actions correctly", () => {
    beforeEach(async () => {
      [from, to] = await ethers.getSigners();

      const ListenerToken = await ethers.getContractFactory("ListenerERC20");

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();
    });

    it("it should define the actions correctly", async () => {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.MUMBAI_PROVIDER_URL,
      );

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

      const generateUnsignedTransactionData =
        newCircuit.generateUnsignedTransactionData({
          contractAddress: deployedListenerToken.address as `0x${string}`,
          chainId: CHAIN_NAME.MUMBAI,
          from: from.address as `0x${string}`,
          functionName: "transferFrom",
          args: [from.address, to.address, 5000],
          abi: ListenerERC20ABI,
        });

      // Assert that the generated code contains the expected contract action
      expect(LitActionCode).to.include(`const contract0 = async () => {`);
      expect(LitActionCode).to.include(`const contract = new ethers.Contract(`);
      expect(LitActionCode).to.include(deployedListenerToken.address);
      expect(LitActionCode).to.include(ListenerERC20ABI);
      expect(LitActionCode).to.include(
        `new ethers.providers.JsonRpcProvider('${provider}', 80001));`,
      );
      expect(LitActionCode).to.include(
        `const processEvent = async (eventData) => {`,
      );
      expect(LitActionCode).to.include(`try {`);
      expect(LitActionCode).to.include(
        `await LitActions.signEcdsa({ toSign: hashTransaction(${generateUnsignedTransactionData}), publicKey: ${pkpPublicKey}, sigName: sigName });`,
      );
      expect(LitActionCode).to.include(
        `concatenatedResponse.contract0 = ${generateUnsignedTransactionData};`,
      );
      expect(LitActionCode).to.include(
        `console.log('Error thrown on contract at priority 0: ', err);`,
      );
    });
  });

  xdescribe("sets the combined actions correctly", () => {
    it("should set combined actions correctly", () => {});

    it("should set contract actions order correctly", () => {
      // returns even when start from 2 not 0
    });

    it("should revert if there is actions of the same priority number", () => {
      
    });

    it("should return the correct response object", async () => {
      ipfsCID = await newCircuit.getIPFSHash(LitActionCode);

      const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      const pkpContract = new ethers.Contract(
        PKP_CONTRACT_ADDRESS_MUMBAI,
        pkpABI,
        provider,
      ) as PKPNFT;
      const pkpTokenId = pkpTokenData.tokenId;
      pkpPublicKey = await pkpContract.getPubkey(pkpTokenId);
    });
  });
});
