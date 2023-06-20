import { expect } from "chai";
import { ethers } from "hardhat";
import { Circuit } from "../src/circuit";
import {
  CHAIN_NAME,
  Condition,
  ContractCondition,
  WebhookCondition,
} from "./../src/@types/lit-listener-sdk";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";

xdescribe("Set the Conditions of the Circuit", () => {
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

  describe("Set the Conditions", () => {
    it("Should add ContractCondition to conditions array correctly", () => {
      // Prepare contract condition
      const contractCondition = new ContractCondition(
        deployedListenerToken.address as `0x${string}`,
        ListenerERC20ABI,
        CHAIN_NAME.MUMBAI,
        "Transfer",
        ["from", "value"],
        [owner.address, 5000],
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
      const newCircuitConditions: Condition[] = newCircuit["conditions"];
      expect(newCircuitConditions.length).to.equal(1);
      expect(newCircuitConditions[0]).to.be.instanceOf(ContractCondition);
      expect(
        (newCircuitConditions[0] as ContractCondition).contractAddress,
      ).to.equal(deployedListenerToken.address);
      expect(
        (newCircuitConditions[0] as ContractCondition).contractAddress,
      ).to.equal(deployedListenerToken.address);
      expect((newCircuitConditions[0] as ContractCondition).chainId).to.equal(
        CHAIN_NAME.MUMBAI,
      );
      expect((newCircuitConditions[0] as ContractCondition).id).to.equal("1");
      expect(
        (newCircuitConditions[0] as ContractCondition).eventArgName,
      ).to.deep.equal(["from", "value"]);
      expect(
        (newCircuitConditions[0] as ContractCondition).expectedValue,
      ).to.deep.equal([owner.address, 5000]);
      expect(
        (newCircuitConditions[0] as ContractCondition).onMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("matched");
        }).toString(),
      );
      expect(
        (newCircuitConditions[0] as ContractCondition).onUnMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("unmatched");
        }).toString(),
      );
      expect(
        (newCircuitConditions[0] as ContractCondition).onError.toString(),
      ).to.equal(((err) => console.error(err.message)).toString());
    });

    it("Add WebhookCondition to conditions array correctly", () => {
      // Prepare webhook condition
      const webhookCondition = new WebhookCondition(
        "http://api.example.com",
        "/endpoint",
        "this.response.path",
        "returnedValue",
        undefined,
        async () => {
          console.log("matched");
        },
        async () => {
          console.log("unmatched");
        },
        (err) => console.error(err.message),
      );
      newCircuit.setConditions([webhookCondition]);

      const newCircuitConditions: Condition[] = newCircuit["conditions"];

      // Check if condition was added
      expect(newCircuitConditions.length).to.equal(1);
      expect(newCircuitConditions[0]).to.be.instanceOf(WebhookCondition);
      expect((newCircuitConditions[0] as WebhookCondition).baseUrl).to.equal(
        "http://api.example.com",
      );
      expect((newCircuitConditions[0] as WebhookCondition).endpoint).to.equal(
        "/endpoint",
      );
      expect(
        (newCircuitConditions[0] as WebhookCondition).responsePath,
      ).to.equal("this.response.path");
      expect((newCircuitConditions[0] as WebhookCondition).id).to.equal("1");
      expect(
        (newCircuitConditions[0] as WebhookCondition).expectedValue,
      ).to.equal("returnedValue");
      expect((newCircuitConditions[0] as WebhookCondition).apiKey).to.equal(
        undefined,
      );
      expect(
        (newCircuitConditions[0] as WebhookCondition).onMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("matched");
        }).toString(),
      );
      expect(
        (newCircuitConditions[0] as WebhookCondition).onUnMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("unmatched");
        }).toString(),
      );
      expect(
        (newCircuitConditions[0] as WebhookCondition).onError.toString(),
      ).to.equal(((err) => console.error(err.message)).toString());
    });

    it("should add multiple conditions to conditions array correctly", () => {
      // Prepare multiple conditions
      const contractCondition = new ContractCondition(
        deployedListenerToken.address as `0x${string}`,
        ListenerERC20ABI,
        CHAIN_NAME.MUMBAI,
        "Transfer",
        ["from", "value"],
        [owner.address, 5000],
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
        async () => {
          console.log("matched");
        },
        async () => {
          console.log("unmatched");
        },
        (err) => console.error(err.message),
      );
      newCircuit.setConditions([contractCondition, webhookCondition]);

      // Check if conditions were added
      expect(newCircuit["conditions"].length).to.equal(2);
      expect(newCircuit["conditions"][0]).to.be.instanceOf(ContractCondition);
      expect(
        (newCircuit["conditions"][0] as ContractCondition).contractAddress,
      ).to.equal(deployedListenerToken.address);
      expect(
        (newCircuit["conditions"][0] as ContractCondition).contractAddress,
      ).to.equal(deployedListenerToken.address);
      expect(
        (newCircuit["conditions"][0] as ContractCondition).chainId,
      ).to.equal(CHAIN_NAME.MUMBAI);
      expect((newCircuit["conditions"][0] as ContractCondition).id).to.equal(
        "1",
      );
      expect(
        (newCircuit["conditions"][0] as ContractCondition).eventArgName,
      ).to.deep.equal(["from", "value"]);
      expect(
        (newCircuit["conditions"][0] as ContractCondition).expectedValue,
      ).to.deep.equal([owner.address, 5000]);
      expect(
        (newCircuit["conditions"][0] as ContractCondition).onMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("matched");
        }).toString(),
      );
      expect(
        (
          newCircuit["conditions"][0] as ContractCondition
        ).onUnMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("unmatched");
        }).toString(),
      );
      expect(
        (newCircuit["conditions"][0] as ContractCondition).onError.toString(),
      ).to.equal(((err) => console.error(err.message)).toString());

      expect(newCircuit["conditions"][1]).to.be.instanceOf(WebhookCondition);
      expect(
        (newCircuit["conditions"][1] as WebhookCondition).baseUrl,
      ).to.equal("http://api.example.com");
      expect(
        (newCircuit["conditions"][1] as WebhookCondition).endpoint,
      ).to.equal("/endpoint");
      expect(
        (newCircuit["conditions"][1] as WebhookCondition).responsePath,
      ).to.equal("this.response.path");
      expect((newCircuit["conditions"][1] as WebhookCondition).id).to.equal(
        "2",
      );
      expect(
        (newCircuit["conditions"][1] as WebhookCondition).expectedValue,
      ).to.equal("returnedValue");
      expect((newCircuit["conditions"][1] as WebhookCondition).apiKey).to.equal(
        undefined,
      );
      expect(
        (newCircuit["conditions"][1] as WebhookCondition).onMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("matched");
        }).toString(),
      );
      expect(
        (
          newCircuit["conditions"][1] as WebhookCondition
        ).onUnMatched.toString(),
      ).to.equal(
        (async () => {
          console.log("unmatched");
        }).toString(),
      );
      expect(
        (newCircuit["conditions"][1] as WebhookCondition).onError.toString(),
      ).to.equal(((err) => console.error(err.message)).toString());
    });
  });
});
