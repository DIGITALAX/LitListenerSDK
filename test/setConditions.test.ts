import { expect } from "chai";
import { ethers } from "hardhat";
import { Circuit } from "./../src/sdk";
import {
  CHAIN_NAME,
  ContractCondition,
  WebhookCondition,
} from "./../src/@types/lit-listener-sdk";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as ListenerERC20ABI from "./../src/abis/ListenerERC20.json";

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
    const totalSupply = await deployedListenerToken.totalSupply();
    expect(totalSupply.eq(ownerBalance)).to.be.true;

  });

  describe("setConditions", () => {
    it("should add ContractCondition to conditions array correctly", () => {
      // Prepare condition
      const contractCondition = new ContractCondition(
        "0x1234567890",
        ListenerERC20ABI,
        CHAIN_NAME.mumbai,
        "Transfer",
        ["from", "value"],
        [owner.address, 50000],
        async () => {
          console.log("matched");
        },
        async () => {
          console.log("unmatched");
        },
        (err) => console.error(err.message),
      );
      newCircuit.setConditions([contractCondition]);

      // Check if condition was added
      expect(newCircuit["conditions"].length).to.equal(1);
      expect(newCircuit["conditions"][0]).to.be.instanceOf(ContractCondition);
    });

    it("should add WebhookCondition to conditions array correctly", () => {
      // Prepare condition
      const webhookCondition = new WebhookCondition(
        "http://api.example.com",
        "/endpoint",
        "this.response.path",
        "returnedValue",
        undefined,
        async () => {},
        async () => {},
        () => {},
      );
      newCircuit.setConditions([webhookCondition]);

      // Check if condition was added
      expect(newCircuit["conditions"].length).to.equal(1);
      expect(newCircuit["conditions"][0]).to.be.instanceOf(WebhookCondition);
    });

    it("should add multiple conditions to conditions array correctly", () => {
      // Prepare conditions
      const contractCondition = new ContractCondition(
        "0x1234567890",
        ListenerERC20ABI,
        CHAIN_NAME.mumbai,
        "Transfer",
        ["from", "value"],
        [owner.address, 50000],
        async () => {
          console.log("matched");
        },
        async () => {
          console.log("unmatched");
        },
        (err) => console.error(err.message),
      );
      const webhookCondition = new WebhookCondition(
        "http://api.example.com",
        "/endpoint",
        "this.response.path",
        "returnedValue",
        undefined,
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
