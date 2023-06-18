import { expect } from "chai";
import { ethers } from "hardhat";
import { Circuit } from "../src/sdk";
import {
  CHAIN_NAME,
  ContractCondition,
  WebhookCondition,
} from "../src/@types/lit-listener-sdk";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";

describe("Set the Conditions of the Circuit", () => {
  let newCircuit: Circuit,
    deployedListenerToken: Contract,
    owner: SignerWithAddress;

  // Initialize the new Circuit instance and deploy the ListenerERC20 Contract
  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const ListenerToken = await ethers.getContractFactory("ListenerERC20");

    deployedListenerToken = await ListenerToken.deploy();
    await deployedListenerToken.deployed();

    newCircuit = new Circuit();
  });

  it("successfully deploys the contract", async () => {
    const ownerBalance = await deployedListenerToken.balanceOf(owner.address);
    expect(await deployedListenerToken.totalSupply()).to.equal(ownerBalance);
  });

  describe("setConditions", () => {
    it("should add ContractCondition to conditions array correctly", () => {
      // Prepare condition
      const contractCondition = new ContractCondition(
        "0x1234567890",
        ListenerERC20ABI,
        "Transfer",
        CHAIN_NAME.mumbai,
        "Transfer",
        async () => {

        },
        async () => {},
        () => {},
        "http://localhost:8545",
      );
      newCircuit.setConditions([contractCondition]);

      // Check if condition was added
      expect(newCircuit["conditions"].length).to.equal(1);
      expect(newCircuit["conditions"][0]).to.be.instanceOf(ContractCondition);
      expect(newCircuit["conditions"][0].contractAddress).to.equal(
        contractCondition.contractAddress,
      );
      // Add more asserts for other properties if necessary
    });

    it("should add WebhookCondition to conditions array correctly", () => {
      // Prepare condition
      const webhookCondition = new WebhookCondition(
        "http://localhost",
        "/endpoint",
        "responsePath",
        "expectedValue",
        "apiKey",
        async () => {},
        async () => {},
        () => {},
      );
      newCircuit.setConditions([webhookCondition]);

      // Check if condition was added
      expect(newCircuit["conditions"].length).to.equal(1);
      expect(newCircuit["conditions"][0]).to.be.instanceOf(WebhookCondition);
      expect(newCircuit["conditions"][0].baseUrl).to.equal(
        webhookCondition.baseUrl,
      );
      // Add more asserts for other properties if necessary
    });

    it("should add multiple conditions to conditions array correctly", () => {
      // Prepare conditions
      const contractCondition = new ContractCondition(
        undefined,
        "0x1234567890",
        {} as InterfaceAbi,
        "testEvent",
        CHAIN_NAME.MATIC,
        "testValue",
        async () => {},
        async () => {},
        () => {},
        "http://localhost:8545",
      );
      const webhookCondition = new WebhookCondition(
        undefined,
        "http://localhost",
        "/endpoint",
        "responsePath",
        "expectedValue",
        "apiKey",
        async () => {},
        async () => {},
        () => {},
      );
      newCircuit.setConditions([contractCondition, webhookCondition]);

      // Check if conditions were added
      expect(newCircuit["conditions"].length).to.equal(2);
      expect(newCircuit["conditions"][0]).to.be.instanceOf(ContractCondition);
      expect(newCircuit["conditions"][1]).to.be.instanceOf(WebhookCondition);
    });
  });
});
