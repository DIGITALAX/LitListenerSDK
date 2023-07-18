import { expect } from "chai";
import { ethers } from "hardhat";
import { Circuit } from "./../src/circuit";
import {
  CHAIN_NAME,
  Condition,
  ContractCondition,
  CustomAction,
  LitAuthSig,
  LogCategory,
  WebhookCondition,
} from "./../src/@types/lit-listener-sdk";
import { Contract } from "ethers";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";
import { CHRONICLE_PROVIDER } from "./../src/constants";

const chronicleProvider = new ethers.providers.JsonRpcProvider(
  CHRONICLE_PROVIDER,
  175177,
);

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

xdescribe("Set the Conditions of the Circuit", () => {
  let newCircuit: Circuit,
    deployedListenerToken: Contract,
    owner: any,
    toAddress: any,
    ownerAddress: any,
    contract: Contract;

  // Initialize the new Circuit instance and deploy the ListenerERC20 Contract
  beforeEach(async () => {
    newCircuit = new Circuit(
      new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
    );
  });

  describe("Set the Conditions", () => {
    before(async () => {
      const provider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545",
      );
      const accounts = await provider.listAccounts();
      owner = provider.getSigner(accounts[0]);
      toAddress = await provider.getSigner(accounts[1]).getAddress();
      ownerAddress = await provider.getSigner(accounts[0]).getAddress();

      const ListenerToken = new ethers.ContractFactory(
        ListenerERC20ABI,
        "0x608060405234801561001057600080fd5b50604080518082018252600d81526c04c697374656e6572455243323609c1b602080830191825283518085019094526004845263131254d560e21b90840152815191929161006091600391610159565b508051610074906004906020840190610159565b5050506100913369010f0cf064dd5920000061009660201b60201c565b610253565b6001600160a01b0382166100f05760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825461010291906101f2565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b82805461016590610218565b90600052602060002090601f01602090048101928261018757600085556101cd565b82601f106101a057805160ff19168380011785556101cd565b828001600101855582156101cd579182015b828111156101cd5782518255916020019190600101906101b2565b506101d99291506101dd565b5090565b5b808211156101d957600081556001016101de565b6000821982111561021357634e487b7160e01b600052601160045260246000fd5b500190565b600181811c9082168061022c57607f821691505b6020821081141561024d57634e487b7160e01b600052602260045260246000fd5b50919050565b61085d806102626000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b411461015f578063a457c2d714610167578063a9059cbb1461017a578063dd62ed3e1461018d57600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101a0565b6040516100c3919061069a565b60405180910390f35b6100df6100da36600461070b565b610232565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610735565b61024a565b604051601281526020016100c3565b6100df61013136600461070b565b61026e565b6100f3610144366004610771565b6001600160a01b031660009081526020819052604090205490565b6100b6610290565b6100df61017536600461070b565b61029f565b6100df61018836600461070b565b61031f565b6100f361019b366004610793565b61032d565b6060600380546101af906107c6565b80601f01602080910402602001604051908101604052809291908181526020018280546101db906107c6565b80156102285780601f106101fd57610100808354040283529160200191610228565b820191906000526020600020905b81548152906001019060200180831161020b57829003601f168201915b5050505050905090565b600033610240818585610358565b5060019392505050565b60003361025885828561047c565b6102638585856104f6565b506001949350505050565b600033610240818585610281838361032d565b61028b9190610801565b610358565b6060600480546101af906107c6565b600033816102ad828661032d565b9050838110156103125760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b6102638286868403610358565b6000336102408185856104f6565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103ba5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610309565b6001600160a01b03821661041b5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610309565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6000610488848461032d565b905060001981146104f057818110156104e35760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e63650000006044820152606401610309565b6104f08484848403610358565b50505050565b6001600160a01b03831661055a5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610309565b6001600160a01b0382166105bc5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610309565b6001600160a01b038316600090815260208190526040902054818110156106345760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610309565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a36104f0565b600060208083528351808285015260005b818110156106c7578581018301518582016040015282016106ab565b818111156106d9576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b038116811461070657600080fd5b919050565b6000806040838503121561071e57600080fd5b610727836106ef565b946020939093013593505050565b60008060006060848603121561074a57600080fd5b610753846106ef565b9250610761602085016106ef565b9150604084013590509250925092565b60006020828403121561078357600080fd5b61078c826106ef565b9392505050565b600080604083850312156107a657600080fd5b6107af836106ef565b91506107bd602084016106ef565b90509250929050565b600181811c908216806107da57607f821691505b602082108114156107fb57634e487b7160e01b600052602260045260246000fd5b50919050565b6000821982111561082257634e487b7160e01b600052601160045260246000fd5b50019056fea2646970667358221220141fefbdec7fc3f92535f0b10f40d8a4ce87f2b1a7f029959160fca73bcfa0db64736f6c63430008090033",
        owner,
      );

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      contract = new ethers.Contract(
        deployedListenerToken.address,
        ["function transfer(address to, uint256 value) public returns(bool)"],
        owner,
      );
    });

    it("Add ContractCondition to Conditions Array", () => {
      // Prepare contract condition
      const contractCondition = new ContractCondition(
        deployedListenerToken.address as `0x${string}`,
        ListenerERC20ABI,
        CHAIN_NAME.MUMBAI,
        "https://alchemy.com",
        "Transfer",
        ["from", "value"],
        [ownerAddress, 5000],
        "===",
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
      ).to.deep.equal([ownerAddress, 5000]);
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

    it("Add WebhookCondition to Conditions Array", () => {
      // Prepare webhook condition
      const webhookCondition = new WebhookCondition(
        "http://api.example.com",
        "/endpoint",
        "this.response.path",
        "returnedValue",
        "===",
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

    it("Add Multiple Conditions to Conditions Array", () => {
      // Prepare multiple conditions
      const contractCondition = new ContractCondition(
        deployedListenerToken.address as `0x${string}`,
        ListenerERC20ABI,
        CHAIN_NAME.MUMBAI,
        "https://alchemy.com",
        "Transfer",
        ["from", "value"],
        [owner.address, 5000],
        "===",
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
        "===",
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

  describe("Check for Different Expected Value Types on Webhook", () => {
    let authSig: LitAuthSig,
      pkpTokenData: {
        tokenId: string;
        publicKey: string;
        address: string;
      };
    beforeEach(async () => {
      const LitActionCode = await newCircuit.setActions(customActions);
      newCircuit.executionConstraints({ conditionMonitorExecutions: 1 });

      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode.litActionCode);
      pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      authSig = await newCircuit.generateAuthSignature(80001);
    });

    it("Compares for String", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/gridpoints/LWX/97,71/forecast",
          "geometry.type",
          "Polygon",
          "===",
          undefined,
          async (emittedValue) => {
            console.log("matched: ", { emittedValue });
          },
          async (emittedValue) => {
            console.log("unmatched: ", { emittedValue });
          },
          (err) => console.error(err.message),
        ),
      ]);
      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
        authSig,
      });

      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 2].category).to.equal(2);
      expect(responseLog[responseLog.length - 2].message).to.equal(
        `Condition Matched with Emitted Value: `,
      );
      expect(responseLog[responseLog.length - 2].responseObject).to.equal(
        JSON.stringify("Polygon"),
      );
    });

    it("Compares for Number", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/gridpoints/LWX/97,71/forecast",
          "properties.periods[0].number",
          1,
          "===",
          undefined,
          async (emittedValue) => {
            console.log("matched: ", { emittedValue });
          },
          async (emittedValue) => {
            console.log("unmatched: ", { emittedValue });
          },
          (err) => console.error(err.message),
        ),
      ]);

      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
        authSig,
      });

      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 2].category).to.equal(2);
      expect(responseLog[responseLog.length - 2].message).to.equal(
        `Condition Matched with Emitted Value: `,
      );
      expect(responseLog[responseLog.length - 2].responseObject).to.equal(
        JSON.stringify(1),
      );
    });

    it("Compares for Object", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/gridpoints/LWX/97,71/forecast",
          "properties.periods[0]",
          {
            number: 1,
            name: "Tonight",
            startTime: "2023-07-15T22:00:00-04:00",
            endTime: "2023-07-16T06:00:00-04:00",
            isDaytime: false,
            temperature: 76,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 90,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 23.888888888888889,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 97,
            },
            windSpeed: "7 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/night/tsra,90?size=medium",
            shortForecast: "Widespread Showers And Thunderstorms",
            detailedForecast:
              "Widespread showers and thunderstorms. Mostly cloudy, with a low around 76. South wind around 7 mph. Chance of precipitation is 90%. New rainfall amounts between three quarters and one inch possible.",
          },
          "===",
          undefined,
          async (emittedValue) => {
            console.log("matched: ", { emittedValue });
          },
          async (emittedValue) => {
            console.log("unmatched: ", { emittedValue });
          },
          (err) => console.error(err.message),
        ),
      ]);

      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
        authSig,
      });

      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 2].category).to.equal(2);
      expect(responseLog[responseLog.length - 2].message).to.equal(
        `Condition Matched with Emitted Value: `,
      );
      expect(responseLog[responseLog.length - 2].responseObject).to.equal(
        JSON.stringify({
          number: 1,
          name: "Tonight",
          startTime: "2023-07-15T22:00:00-04:00",
          endTime: "2023-07-16T06:00:00-04:00",
          isDaytime: false,
          temperature: 76,
          temperatureUnit: "F",
          temperatureTrend: null,
          probabilityOfPrecipitation: {
            unitCode: "wmoUnit:percent",
            value: 90,
          },
          dewpoint: {
            unitCode: "wmoUnit:degC",
            value: 23.888888888888889,
          },
          relativeHumidity: {
            unitCode: "wmoUnit:percent",
            value: 97,
          },
          windSpeed: "7 mph",
          windDirection: "S",
          icon: "https://api.weather.gov/icons/land/night/tsra,90?size=medium",
          shortForecast: "Widespread Showers And Thunderstorms",
          detailedForecast:
            "Widespread showers and thunderstorms. Mostly cloudy, with a low around 76. South wind around 7 mph. Chance of precipitation is 90%. New rainfall amounts between three quarters and one inch possible.",
        }),
      );
    });

    it("Compares for Object Array", async () => {
      newCircuit.setConditions([
        new WebhookCondition(
          "https://api.weather.gov",
          "/gridpoints/LWX/97,71/forecast",
          "properties.periods",
          [
            {
              number: 1,
              name: "Tonight",
              startTime: "2023-07-15T23:00:00-04:00",
              endTime: "2023-07-16T06:00:00-04:00",
              isDaytime: false,
              temperature: 76,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "7 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/night/tsra,90?size=medium",
              shortForecast: "Widespread Showers And Thunderstorms",
              detailedForecast:
                "Widespread showers and thunderstorms. Mostly cloudy, with a low around 76. South wind around 7 mph. Chance of precipitation is 90%. New rainfall amounts between three quarters and one inch possible.",
            },
            {
              number: 2,
              name: "Sunday",
              startTime: "2023-07-16T06:00:00-04:00",
              endTime: "2023-07-16T18:00:00-04:00",
              isDaytime: true,
              temperature: 90,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "7 mph",
              windDirection: "SW",
              icon: "https://api.weather.gov/icons/land/day/tsra,60?size=medium",
              shortForecast: "Showers And Thunderstorms Likely",
              detailedForecast:
                "A chance of rain showers before 8am, then showers and thunderstorms likely between 8am and 5pm, then a chance of showers and thunderstorms. Mostly cloudy, with a high near 90. Southwest wind around 7 mph. Chance of precipitation is 60%. New rainfall amounts between a quarter and half of an inch possible.",
            },
            {
              number: 3,
              name: "Sunday Night",
              startTime: "2023-07-16T18:00:00-04:00",
              endTime: "2023-07-17T06:00:00-04:00",
              isDaytime: false,
              temperature: 72,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "6 mph",
              windDirection: "W",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,50/sct?size=medium",
              shortForecast:
                "Chance Showers And Thunderstorms then Partly Cloudy",
              detailedForecast:
                "A chance of showers and thunderstorms before 8pm. Partly cloudy, with a low around 72. West wind around 6 mph. Chance of precipitation is 50%. New rainfall amounts less than a tenth of an inch possible.",
            },
            {
              number: 4,
              name: "Monday",
              startTime: "2023-07-17T06:00:00-04:00",
              endTime: "2023-07-17T18:00:00-04:00",
              isDaytime: true,
              temperature: 93,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "3 to 7 mph",
              windDirection: "W",
              icon: "https://api.weather.gov/icons/land/day/few?size=medium",
              shortForecast: "Sunny",
              detailedForecast:
                "Sunny, with a high near 93. West wind 3 to 7 mph.",
            },
            {
              number: 5,
              name: "Monday Night",
              startTime: "2023-07-17T18:00:00-04:00",
              endTime: "2023-07-18T06:00:00-04:00",
              isDaytime: false,
              temperature: 73,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "6 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/night/sct?size=medium",
              shortForecast: "Partly Cloudy",
              detailedForecast:
                "Partly cloudy, with a low around 73. South wind around 6 mph.",
            },
            {
              number: 6,
              name: "Tuesday",
              startTime: "2023-07-18T06:00:00-04:00",
              endTime: "2023-07-18T18:00:00-04:00",
              isDaytime: true,
              temperature: 92,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "3 to 12 mph",
              windDirection: "W",
              icon: "https://api.weather.gov/icons/land/day/sct/tsra_hi,30?size=medium",
              shortForecast:
                "Mostly Sunny then Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of showers and thunderstorms after 2pm. Mostly sunny, with a high near 92. Chance of precipitation is 30%.",
            },
            {
              number: 7,
              name: "Tuesday Night",
              startTime: "2023-07-18T18:00:00-04:00",
              endTime: "2023-07-19T06:00:00-04:00",
              isDaytime: false,
              temperature: 71,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "7 to 12 mph",
              windDirection: "W",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,30/sct?size=medium",
              shortForecast:
                "Chance Showers And Thunderstorms then Partly Cloudy",
              detailedForecast:
                "A chance of showers and thunderstorms before 8pm. Partly cloudy, with a low around 71. Chance of precipitation is 30%.",
            },
            {
              number: 8,
              name: "Wednesday",
              startTime: "2023-07-19T06:00:00-04:00",
              endTime: "2023-07-19T18:00:00-04:00",
              isDaytime: true,
              temperature: 90,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "6 to 9 mph",
              windDirection: "E",
              icon: "https://api.weather.gov/icons/land/day/bkn/tsra_hi,30?size=medium",
              shortForecast:
                "Partly Sunny then Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of showers and thunderstorms after 2pm. Partly sunny, with a high near 90. Chance of precipitation is 30%.",
            },
            {
              number: 9,
              name: "Wednesday Night",
              startTime: "2023-07-19T18:00:00-04:00",
              endTime: "2023-07-20T06:00:00-04:00",
              isDaytime: false,
              temperature: 73,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "9 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,40?size=medium",
              shortForecast: "Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of showers and thunderstorms. Mostly cloudy, with a low around 73. Chance of precipitation is 40%.",
            },
            {
              number: 10,
              name: "Thursday",
              startTime: "2023-07-20T06:00:00-04:00",
              endTime: "2023-07-20T18:00:00-04:00",
              isDaytime: true,
              temperature: 91,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "7 to 10 mph",
              windDirection: "SW",
              icon: "https://api.weather.gov/icons/land/day/rain_showers/tsra_hi,30?size=medium",
              shortForecast:
                "Slight Chance Rain Showers then Chance Showers And Thunderstorms",
              detailedForecast:
                "A slight chance of rain showers before 8am, then a chance of showers and thunderstorms. Mostly sunny, with a high near 91. Chance of precipitation is 30%.",
            },
            {
              number: 11,
              name: "Thursday Night",
              startTime: "2023-07-20T18:00:00-04:00",
              endTime: "2023-07-21T06:00:00-04:00",
              isDaytime: false,
              temperature: 72,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "10 mph",
              windDirection: "SW",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,30?size=medium",
              shortForecast: "Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of showers and thunderstorms before 2am. Partly cloudy, with a low around 72. Chance of precipitation is 30%.",
            },
            {
              number: 12,
              name: "Friday",
              startTime: "2023-07-21T06:00:00-04:00",
              endTime: "2023-07-21T18:00:00-04:00",
              isDaytime: true,
              temperature: 90,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "8 to 12 mph",
              windDirection: "W",
              icon: "https://api.weather.gov/icons/land/day/sct/tsra_hi,30?size=medium",
              shortForecast:
                "Mostly Sunny then Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of showers and thunderstorms after 2pm. Mostly sunny, with a high near 90. Chance of precipitation is 30%.",
            },
            {
              number: 13,
              name: "Friday Night",
              startTime: "2023-07-21T18:00:00-04:00",
              endTime: "2023-07-22T06:00:00-04:00",
              isDaytime: false,
              temperature: 69,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "12 mph",
              windDirection: "NW",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,30/tsra_hi?size=medium",
              shortForecast: "Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of showers and thunderstorms before 2am. Partly cloudy, with a low around 69. Chance of precipitation is 30%.",
            },
            {
              number: 14,
              name: "Saturday",
              startTime: "2023-07-22T06:00:00-04:00",
              endTime: "2023-07-22T18:00:00-04:00",
              isDaytime: true,
              temperature: 87,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: [Object],
              dewpoint: [Object],
              relativeHumidity: [Object],
              windSpeed: "10 mph",
              windDirection: "NW",
              icon: "https://api.weather.gov/icons/land/day/sct/tsra_hi?size=medium",
              shortForecast:
                "Mostly Sunny then Slight Chance Showers And Thunderstorms",
              detailedForecast:
                "A slight chance of showers and thunderstorms after 2pm. Mostly sunny, with a high near 87.",
            },
          ],
          "===",
          undefined,
          async (emittedValue) => {
            console.log("matched: ", { emittedValue });
          },
          async (emittedValue) => {
            console.log("unmatched: ", { emittedValue });
          },
          (err) => console.error(err.message),
        ),
      ]);

      await newCircuit.start({
        publicKey: pkpTokenData.publicKey,
        authSig,
      });

      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 2].category).to.equal(2);
      expect(responseLog[responseLog.length - 2].message).to.equal(
        `Condition Matched with Emitted Value: `,
      );
      expect(responseLog[responseLog.length - 2].responseObject).to.equal(
        JSON.stringify([
          {
            number: 1,
            name: "Tonight",
            startTime: "2023-07-15T23:00:00-04:00",
            endTime: "2023-07-16T06:00:00-04:00",
            isDaytime: false,
            temperature: 76,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "7 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/night/tsra,90?size=medium",
            shortForecast: "Widespread Showers And Thunderstorms",
            detailedForecast:
              "Widespread showers and thunderstorms. Mostly cloudy, with a low around 76. South wind around 7 mph. Chance of precipitation is 90%. New rainfall amounts between three quarters and one inch possible.",
          },
          {
            number: 2,
            name: "Sunday",
            startTime: "2023-07-16T06:00:00-04:00",
            endTime: "2023-07-16T18:00:00-04:00",
            isDaytime: true,
            temperature: 90,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "7 mph",
            windDirection: "SW",
            icon: "https://api.weather.gov/icons/land/day/tsra,60?size=medium",
            shortForecast: "Showers And Thunderstorms Likely",
            detailedForecast:
              "A chance of rain showers before 8am, then showers and thunderstorms likely between 8am and 5pm, then a chance of showers and thunderstorms. Mostly cloudy, with a high near 90. Southwest wind around 7 mph. Chance of precipitation is 60%. New rainfall amounts between a quarter and half of an inch possible.",
          },
          {
            number: 3,
            name: "Sunday Night",
            startTime: "2023-07-16T18:00:00-04:00",
            endTime: "2023-07-17T06:00:00-04:00",
            isDaytime: false,
            temperature: 72,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "6 mph",
            windDirection: "W",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,50/sct?size=medium",
            shortForecast:
              "Chance Showers And Thunderstorms then Partly Cloudy",
            detailedForecast:
              "A chance of showers and thunderstorms before 8pm. Partly cloudy, with a low around 72. West wind around 6 mph. Chance of precipitation is 50%. New rainfall amounts less than a tenth of an inch possible.",
          },
          {
            number: 4,
            name: "Monday",
            startTime: "2023-07-17T06:00:00-04:00",
            endTime: "2023-07-17T18:00:00-04:00",
            isDaytime: true,
            temperature: 93,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "3 to 7 mph",
            windDirection: "W",
            icon: "https://api.weather.gov/icons/land/day/few?size=medium",
            shortForecast: "Sunny",
            detailedForecast:
              "Sunny, with a high near 93. West wind 3 to 7 mph.",
          },
          {
            number: 5,
            name: "Monday Night",
            startTime: "2023-07-17T18:00:00-04:00",
            endTime: "2023-07-18T06:00:00-04:00",
            isDaytime: false,
            temperature: 73,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "6 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/night/sct?size=medium",
            shortForecast: "Partly Cloudy",
            detailedForecast:
              "Partly cloudy, with a low around 73. South wind around 6 mph.",
          },
          {
            number: 6,
            name: "Tuesday",
            startTime: "2023-07-18T06:00:00-04:00",
            endTime: "2023-07-18T18:00:00-04:00",
            isDaytime: true,
            temperature: 92,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "3 to 12 mph",
            windDirection: "W",
            icon: "https://api.weather.gov/icons/land/day/sct/tsra_hi,30?size=medium",
            shortForecast: "Mostly Sunny then Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of showers and thunderstorms after 2pm. Mostly sunny, with a high near 92. Chance of precipitation is 30%.",
          },
          {
            number: 7,
            name: "Tuesday Night",
            startTime: "2023-07-18T18:00:00-04:00",
            endTime: "2023-07-19T06:00:00-04:00",
            isDaytime: false,
            temperature: 71,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "7 to 12 mph",
            windDirection: "W",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,30/sct?size=medium",
            shortForecast:
              "Chance Showers And Thunderstorms then Partly Cloudy",
            detailedForecast:
              "A chance of showers and thunderstorms before 8pm. Partly cloudy, with a low around 71. Chance of precipitation is 30%.",
          },
          {
            number: 8,
            name: "Wednesday",
            startTime: "2023-07-19T06:00:00-04:00",
            endTime: "2023-07-19T18:00:00-04:00",
            isDaytime: true,
            temperature: 90,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "6 to 9 mph",
            windDirection: "E",
            icon: "https://api.weather.gov/icons/land/day/bkn/tsra_hi,30?size=medium",
            shortForecast: "Partly Sunny then Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of showers and thunderstorms after 2pm. Partly sunny, with a high near 90. Chance of precipitation is 30%.",
          },
          {
            number: 9,
            name: "Wednesday Night",
            startTime: "2023-07-19T18:00:00-04:00",
            endTime: "2023-07-20T06:00:00-04:00",
            isDaytime: false,
            temperature: 73,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "9 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,40?size=medium",
            shortForecast: "Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of showers and thunderstorms. Mostly cloudy, with a low around 73. Chance of precipitation is 40%.",
          },
          {
            number: 10,
            name: "Thursday",
            startTime: "2023-07-20T06:00:00-04:00",
            endTime: "2023-07-20T18:00:00-04:00",
            isDaytime: true,
            temperature: 91,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "7 to 10 mph",
            windDirection: "SW",
            icon: "https://api.weather.gov/icons/land/day/rain_showers/tsra_hi,30?size=medium",
            shortForecast:
              "Slight Chance Rain Showers then Chance Showers And Thunderstorms",
            detailedForecast:
              "A slight chance of rain showers before 8am, then a chance of showers and thunderstorms. Mostly sunny, with a high near 91. Chance of precipitation is 30%.",
          },
          {
            number: 11,
            name: "Thursday Night",
            startTime: "2023-07-20T18:00:00-04:00",
            endTime: "2023-07-21T06:00:00-04:00",
            isDaytime: false,
            temperature: 72,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "10 mph",
            windDirection: "SW",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,30?size=medium",
            shortForecast: "Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of showers and thunderstorms before 2am. Partly cloudy, with a low around 72. Chance of precipitation is 30%.",
          },
          {
            number: 12,
            name: "Friday",
            startTime: "2023-07-21T06:00:00-04:00",
            endTime: "2023-07-21T18:00:00-04:00",
            isDaytime: true,
            temperature: 90,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "8 to 12 mph",
            windDirection: "W",
            icon: "https://api.weather.gov/icons/land/day/sct/tsra_hi,30?size=medium",
            shortForecast: "Mostly Sunny then Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of showers and thunderstorms after 2pm. Mostly sunny, with a high near 90. Chance of precipitation is 30%.",
          },
          {
            number: 13,
            name: "Friday Night",
            startTime: "2023-07-21T18:00:00-04:00",
            endTime: "2023-07-22T06:00:00-04:00",
            isDaytime: false,
            temperature: 69,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "12 mph",
            windDirection: "NW",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,30/tsra_hi?size=medium",
            shortForecast: "Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of showers and thunderstorms before 2am. Partly cloudy, with a low around 69. Chance of precipitation is 30%.",
          },
          {
            number: 14,
            name: "Saturday",
            startTime: "2023-07-22T06:00:00-04:00",
            endTime: "2023-07-22T18:00:00-04:00",
            isDaytime: true,
            temperature: 87,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: [Object],
            dewpoint: [Object],
            relativeHumidity: [Object],
            windSpeed: "10 mph",
            windDirection: "NW",
            icon: "https://api.weather.gov/icons/land/day/sct/tsra_hi?size=medium",
            shortForecast:
              "Mostly Sunny then Slight Chance Showers And Thunderstorms",
            detailedForecast:
              "A slight chance of showers and thunderstorms after 2pm. Mostly sunny, with a high near 87.",
          },
        ]),
      );
    });
  });

  describe("Check for Different Expected Value Types on Contract", () => {
    let authSig: LitAuthSig,
      pkpTokenData: {
        tokenId: string;
        publicKey: string;
        address: string;
      };

    beforeEach(async () => {
      const LitActionCode = await newCircuit.setActions(customActions);
      newCircuit.executionConstraints({
        maxLitActionCompletions: 1,
        conditionMonitorExecutions: 1,
      });
      newCircuit.setConditionalLogic({ type: "EVERY", interval: 60000 });

      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode.litActionCode);
      pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      authSig = await newCircuit.generateAuthSignature(80001);
    });

    it("Checks Against Transfer Event", async () => {
      newCircuit.setConditions([
        new ContractCondition(
          deployedListenerToken.address as `0x${string}`,
          ListenerERC20ABI,
          CHAIN_NAME.HARDHAT,
          "http://127.0.0.1:8545",
          "Transfer",
          ["from", "to", "value"],
          [ownerAddress, toAddress, ethers.utils.parseEther("5000")],
          "===",
          async (emittedValue) => {
            console.log("matched: ", { emittedValue });
          },
          async (emittedValue) => {
            console.log("unmatched: ", { emittedValue });
          },
          (err) => console.error(err.message),
        ),
      ]);
      const startPromise = newCircuit.start({
        publicKey: pkpTokenData.publicKey,
        authSig,
      });

      setTimeout(async () => {
        try {
          const tx = await contract
            .connect(owner)
            .transfer(toAddress, ethers.utils.parseEther("5000"));
          await tx.wait();
        } catch (err) {
          console.error(err);
        }
      }, 10000);

      await startPromise;

      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      expect(responseLog[responseLog.length - 2].category).to.equal(2);
      expect(responseLog[responseLog.length - 2].message).to.equal(
        `Condition Matched with Emitted Value: `,
      );
      expect(responseLog[responseLog.length - 2].responseObject).to.equal(
        JSON.stringify([
          ownerAddress,
          toAddress,
          ethers.utils.parseEther("5000"),
        ]),
      );
    });
  });
});
