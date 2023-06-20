import { expect } from "chai";
import { ethers } from "hardhat";
import { Circuit } from "./../src/circuit";
import {
  CHAIN_NAME,
  Condition,
  ContractCondition,
  CustomAction,
  LogCategory,
  WebhookCondition,
} from "./../src/@types/lit-listener-sdk";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ListenerERC20ABI from "./../src/abis/ListenerERC20.json";
import { CHRONICLE_PROVIDER } from "./../src/constants";
import { LitAuthSig } from "./../src/utils/litProtocol";

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
    owner: SignerWithAddress,
    toAddress: SignerWithAddress;

  // Initialize the new Circuit instance and deploy the ListenerERC20 Contract
  beforeEach(async () => {
    newCircuit = new Circuit(
      "http://127.0.0.1:8545",
      new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
    );
  });

  describe("Set the Conditions", () => {
    it("Add ContractCondition to Conditions Array", () => {
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

    it("Add WebhookCondition to Conditions Array", () => {
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

    it("Add Multiple Conditions to Conditions Array", () => {
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

  describe("Check for Different Expected Value Types on Webhook", () => {
    let authSig: LitAuthSig,
      pkpTokenData: {
        tokenId: string;
        publicKey: string;
        address: string;
      };
    beforeEach(async () => {
      const LitActionCode = newCircuit.setActions(customActions);
      newCircuit.executionConstraints({ conditionMonitorExecutions: 1 });

      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
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
        pkpPublicKey: pkpTokenData.publicKey,
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
        pkpPublicKey: pkpTokenData.publicKey,
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
            name: "This Afternoon",
            startTime: "2023-06-20T14:00:00-04:00",
            endTime: "2023-06-20T18:00:00-04:00",
            isDaytime: true,
            temperature: 80,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 30,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 17.222222222222221,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 56,
            },
            windSpeed: "14 mph",
            windDirection: "E",
            icon: "https://api.weather.gov/icons/land/day/rain_showers,30?size=medium",
            shortForecast: "Scattered Rain Showers",
            detailedForecast:
              "Scattered rain showers. Cloudy, with a high near 80. East wind around 14 mph, with gusts as high as 23 mph. Chance of precipitation is 30%. New rainfall amounts less than a tenth of an inch possible.",
          },
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
        pkpPublicKey: pkpTokenData.publicKey,
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
          name: "This Afternoon",
          startTime: "2023-06-20T14:00:00-04:00",
          endTime: "2023-06-20T18:00:00-04:00",
          isDaytime: true,
          temperature: 80,
          temperatureUnit: "F",
          temperatureTrend: null,
          probabilityOfPrecipitation: {
            unitCode: "wmoUnit:percent",
            value: 30,
          },
          dewpoint: {
            unitCode: "wmoUnit:degC",
            value: 17.222222222222221,
          },
          relativeHumidity: {
            unitCode: "wmoUnit:percent",
            value: 56,
          },
          windSpeed: "14 mph",
          windDirection: "E",
          icon: "https://api.weather.gov/icons/land/day/rain_showers,30?size=medium",
          shortForecast: "Scattered Rain Showers",
          detailedForecast:
            "Scattered rain showers. Cloudy, with a high near 80. East wind around 14 mph, with gusts as high as 23 mph. Chance of precipitation is 30%. New rainfall amounts less than a tenth of an inch possible.",
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
              name: "This Afternoon",
              startTime: "2023-06-20T14:00:00-04:00",
              endTime: "2023-06-20T18:00:00-04:00",
              isDaytime: true,
              temperature: 80,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 30,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 17.222222222222221,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 56,
              },
              windSpeed: "14 mph",
              windDirection: "E",
              icon: "https://api.weather.gov/icons/land/day/rain_showers,30?size=medium",
              shortForecast: "Scattered Rain Showers",
              detailedForecast:
                "Scattered rain showers. Cloudy, with a high near 80. East wind around 14 mph, with gusts as high as 23 mph. Chance of precipitation is 30%. New rainfall amounts less than a tenth of an inch possible.",
            },
            {
              number: 2,
              name: "Tonight",
              startTime: "2023-06-20T18:00:00-04:00",
              endTime: "2023-06-21T06:00:00-04:00",
              isDaytime: false,
              temperature: 66,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 50,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 18.333333333333332,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 90,
              },
              windSpeed: "13 mph",
              windDirection: "E",
              icon: "https://api.weather.gov/icons/land/night/rain_showers,40/rain_showers,50?size=medium",
              shortForecast: "Scattered Rain Showers",
              detailedForecast:
                "Scattered rain showers. Cloudy, with a low around 66. East wind around 13 mph, with gusts as high as 23 mph. Chance of precipitation is 50%. New rainfall amounts less than a tenth of an inch possible.",
            },
            {
              number: 3,
              name: "Wednesday",
              startTime: "2023-06-21T06:00:00-04:00",
              endTime: "2023-06-21T18:00:00-04:00",
              isDaytime: true,
              temperature: 73,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 60,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 17.222222222222221,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 90,
              },
              windSpeed: "13 to 17 mph",
              windDirection: "NE",
              icon: "https://api.weather.gov/icons/land/day/rain_showers,50/rain_showers,60?size=medium",
              shortForecast: "Chance Rain Showers",
              detailedForecast:
                "A chance of rain showers. Cloudy, with a high near 73. Northeast wind 13 to 17 mph, with gusts as high as 30 mph. Chance of precipitation is 60%. New rainfall amounts between a tenth and quarter of an inch possible.",
            },
            {
              number: 4,
              name: "Wednesday Night",
              startTime: "2023-06-21T18:00:00-04:00",
              endTime: "2023-06-22T06:00:00-04:00",
              isDaytime: false,
              temperature: 61,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 80,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 17.777777777777779,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 100,
              },
              windSpeed: "17 mph",
              windDirection: "NE",
              icon: "https://api.weather.gov/icons/land/night/tsra,80?size=medium",
              shortForecast: "Showers And Thunderstorms",
              detailedForecast:
                "Rain showers likely before 8pm, then showers and thunderstorms. Cloudy, with a low around 61. Northeast wind around 17 mph, with gusts as high as 29 mph. Chance of precipitation is 80%. New rainfall amounts between a half and three quarters of an inch possible.",
            },
            {
              number: 5,
              name: "Thursday",
              startTime: "2023-06-22T06:00:00-04:00",
              endTime: "2023-06-22T18:00:00-04:00",
              isDaytime: true,
              temperature: 74,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 80,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 20.555555555555557,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 100,
              },
              windSpeed: "15 mph",
              windDirection: "E",
              icon: "https://api.weather.gov/icons/land/day/tsra,80?size=medium",
              shortForecast: "Showers And Thunderstorms",
              detailedForecast:
                "Showers and thunderstorms. Cloudy, with a high near 74. East wind around 15 mph, with gusts as high as 26 mph. Chance of precipitation is 80%.",
            },
            {
              number: 6,
              name: "Thursday Night",
              startTime: "2023-06-22T18:00:00-04:00",
              endTime: "2023-06-23T06:00:00-04:00",
              isDaytime: false,
              temperature: 68,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 80,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 21.111111111111111,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 100,
              },
              windSpeed: "13 mph",
              windDirection: "E",
              icon: "https://api.weather.gov/icons/land/night/tsra,80?size=medium",
              shortForecast: "Showers And Thunderstorms",
              detailedForecast:
                "Showers and thunderstorms. Cloudy, with a low around 68. Chance of precipitation is 80%.",
            },
            {
              number: 7,
              name: "Friday",
              startTime: "2023-06-23T06:00:00-04:00",
              endTime: "2023-06-23T18:00:00-04:00",
              isDaytime: true,
              temperature: 82,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 80,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 22.777777777777779,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 100,
              },
              windSpeed: "12 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/day/tsra,60/tsra,80?size=medium",
              shortForecast: "Showers And Thunderstorms",
              detailedForecast:
                "Rain showers likely before 8am, then showers and thunderstorms. Mostly cloudy, with a high near 82. Chance of precipitation is 80%.",
            },
            {
              number: 8,
              name: "Friday Night",
              startTime: "2023-06-23T18:00:00-04:00",
              endTime: "2023-06-24T06:00:00-04:00",
              isDaytime: false,
              temperature: 68,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 80,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 22.222222222222221,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 100,
              },
              windSpeed: "7 to 12 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/night/tsra_sct,80/tsra_sct,60?size=medium",
              shortForecast: "Showers And Thunderstorms",
              detailedForecast:
                "Showers and thunderstorms. Mostly cloudy, with a low around 68. Chance of precipitation is 80%.",
            },
            {
              number: 9,
              name: "Saturday",
              startTime: "2023-06-24T06:00:00-04:00",
              endTime: "2023-06-24T18:00:00-04:00",
              isDaytime: true,
              temperature: 85,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 70,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 22.222222222222221,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 100,
              },
              windSpeed: "9 mph",
              windDirection: "SW",
              icon: "https://api.weather.gov/icons/land/day/rain_showers,40/tsra_hi,70?size=medium",
              shortForecast: "Showers And Thunderstorms Likely",
              detailedForecast:
                "A chance of rain showers before 2pm, then showers and thunderstorms likely. Partly sunny, with a high near 85. Chance of precipitation is 70%.",
            },
            {
              number: 10,
              name: "Saturday Night",
              startTime: "2023-06-24T18:00:00-04:00",
              endTime: "2023-06-25T06:00:00-04:00",
              isDaytime: false,
              temperature: 67,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 70,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 21.111111111111111,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 100,
              },
              windSpeed: "5 to 8 mph",
              windDirection: "SW",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,70/tsra_hi,30?size=medium",
              shortForecast: "Showers And Thunderstorms Likely",
              detailedForecast:
                "Showers and thunderstorms likely before 2am. Partly cloudy, with a low around 67. Chance of precipitation is 70%.",
            },
            {
              number: 11,
              name: "Sunday",
              startTime: "2023-06-25T06:00:00-04:00",
              endTime: "2023-06-25T18:00:00-04:00",
              isDaytime: true,
              temperature: 87,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 50,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 21.111111111111111,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 97,
              },
              windSpeed: "8 mph",
              windDirection: "W",
              icon: "https://api.weather.gov/icons/land/day/rain_showers,30/tsra_hi,50?size=medium",
              shortForecast:
                "Chance Rain Showers then Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of rain showers between 8am and 2pm, then a chance of showers and thunderstorms. Mostly sunny, with a high near 87. Chance of precipitation is 50%.",
            },
            {
              number: 12,
              name: "Sunday Night",
              startTime: "2023-06-25T18:00:00-04:00",
              endTime: "2023-06-26T06:00:00-04:00",
              isDaytime: false,
              temperature: 69,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 50,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 20.555555555555557,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 93,
              },
              windSpeed: "7 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,50/tsra_hi,30?size=medium",
              shortForecast: "Chance Showers And Thunderstorms",
              detailedForecast:
                "A chance of showers and thunderstorms before 8pm, then a chance of showers and thunderstorms between 8pm and 2am. Partly cloudy, with a low around 69. Chance of precipitation is 50%.",
            },
            {
              number: 13,
              name: "Monday",
              startTime: "2023-06-26T06:00:00-04:00",
              endTime: "2023-06-26T18:00:00-04:00",
              isDaytime: true,
              temperature: 89,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 60,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 21.666666666666668,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 97,
              },
              windSpeed: "6 to 10 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/day/rain_showers,30/tsra_hi,60?size=medium",
              shortForecast: "Showers And Thunderstorms Likely",
              detailedForecast:
                "A chance of rain showers between 8am and 2pm, then showers and thunderstorms likely. Partly sunny, with a high near 89. Chance of precipitation is 60%.",
            },
            {
              number: 14,
              name: "Monday Night",
              startTime: "2023-06-26T18:00:00-04:00",
              endTime: "2023-06-27T06:00:00-04:00",
              isDaytime: false,
              temperature: 69,
              temperatureUnit: "F",
              temperatureTrend: null,
              probabilityOfPrecipitation: {
                unitCode: "wmoUnit:percent",
                value: 60,
              },
              dewpoint: {
                unitCode: "wmoUnit:degC",
                value: 20.555555555555557,
              },
              relativeHumidity: {
                unitCode: "wmoUnit:percent",
                value: 93,
              },
              windSpeed: "8 to 12 mph",
              windDirection: "S",
              icon: "https://api.weather.gov/icons/land/night/tsra_hi,60/tsra_hi,50?size=medium",
              shortForecast: "Showers And Thunderstorms Likely",
              detailedForecast:
                "Showers and thunderstorms likely. Mostly cloudy, with a low around 69. Chance of precipitation is 60%.",
            },
          ],
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
        pkpPublicKey: pkpTokenData.publicKey,
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
            name: "This Afternoon",
            startTime: "2023-06-20T14:00:00-04:00",
            endTime: "2023-06-20T18:00:00-04:00",
            isDaytime: true,
            temperature: 80,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 30,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 17.222222222222221,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 56,
            },
            windSpeed: "14 mph",
            windDirection: "E",
            icon: "https://api.weather.gov/icons/land/day/rain_showers,30?size=medium",
            shortForecast: "Scattered Rain Showers",
            detailedForecast:
              "Scattered rain showers. Cloudy, with a high near 80. East wind around 14 mph, with gusts as high as 23 mph. Chance of precipitation is 30%. New rainfall amounts less than a tenth of an inch possible.",
          },
          {
            number: 2,
            name: "Tonight",
            startTime: "2023-06-20T18:00:00-04:00",
            endTime: "2023-06-21T06:00:00-04:00",
            isDaytime: false,
            temperature: 66,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 50,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 18.333333333333332,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 90,
            },
            windSpeed: "13 mph",
            windDirection: "E",
            icon: "https://api.weather.gov/icons/land/night/rain_showers,40/rain_showers,50?size=medium",
            shortForecast: "Scattered Rain Showers",
            detailedForecast:
              "Scattered rain showers. Cloudy, with a low around 66. East wind around 13 mph, with gusts as high as 23 mph. Chance of precipitation is 50%. New rainfall amounts less than a tenth of an inch possible.",
          },
          {
            number: 3,
            name: "Wednesday",
            startTime: "2023-06-21T06:00:00-04:00",
            endTime: "2023-06-21T18:00:00-04:00",
            isDaytime: true,
            temperature: 73,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 60,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 17.222222222222221,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 90,
            },
            windSpeed: "13 to 17 mph",
            windDirection: "NE",
            icon: "https://api.weather.gov/icons/land/day/rain_showers,50/rain_showers,60?size=medium",
            shortForecast: "Chance Rain Showers",
            detailedForecast:
              "A chance of rain showers. Cloudy, with a high near 73. Northeast wind 13 to 17 mph, with gusts as high as 30 mph. Chance of precipitation is 60%. New rainfall amounts between a tenth and quarter of an inch possible.",
          },
          {
            number: 4,
            name: "Wednesday Night",
            startTime: "2023-06-21T18:00:00-04:00",
            endTime: "2023-06-22T06:00:00-04:00",
            isDaytime: false,
            temperature: 61,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 80,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 17.777777777777779,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 100,
            },
            windSpeed: "17 mph",
            windDirection: "NE",
            icon: "https://api.weather.gov/icons/land/night/tsra,80?size=medium",
            shortForecast: "Showers And Thunderstorms",
            detailedForecast:
              "Rain showers likely before 8pm, then showers and thunderstorms. Cloudy, with a low around 61. Northeast wind around 17 mph, with gusts as high as 29 mph. Chance of precipitation is 80%. New rainfall amounts between a half and three quarters of an inch possible.",
          },
          {
            number: 5,
            name: "Thursday",
            startTime: "2023-06-22T06:00:00-04:00",
            endTime: "2023-06-22T18:00:00-04:00",
            isDaytime: true,
            temperature: 74,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 80,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 20.555555555555557,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 100,
            },
            windSpeed: "15 mph",
            windDirection: "E",
            icon: "https://api.weather.gov/icons/land/day/tsra,80?size=medium",
            shortForecast: "Showers And Thunderstorms",
            detailedForecast:
              "Showers and thunderstorms. Cloudy, with a high near 74. East wind around 15 mph, with gusts as high as 26 mph. Chance of precipitation is 80%.",
          },
          {
            number: 6,
            name: "Thursday Night",
            startTime: "2023-06-22T18:00:00-04:00",
            endTime: "2023-06-23T06:00:00-04:00",
            isDaytime: false,
            temperature: 68,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 80,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 21.111111111111111,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 100,
            },
            windSpeed: "13 mph",
            windDirection: "E",
            icon: "https://api.weather.gov/icons/land/night/tsra,80?size=medium",
            shortForecast: "Showers And Thunderstorms",
            detailedForecast:
              "Showers and thunderstorms. Cloudy, with a low around 68. Chance of precipitation is 80%.",
          },
          {
            number: 7,
            name: "Friday",
            startTime: "2023-06-23T06:00:00-04:00",
            endTime: "2023-06-23T18:00:00-04:00",
            isDaytime: true,
            temperature: 82,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 80,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 22.777777777777779,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 100,
            },
            windSpeed: "12 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/day/tsra,60/tsra,80?size=medium",
            shortForecast: "Showers And Thunderstorms",
            detailedForecast:
              "Rain showers likely before 8am, then showers and thunderstorms. Mostly cloudy, with a high near 82. Chance of precipitation is 80%.",
          },
          {
            number: 8,
            name: "Friday Night",
            startTime: "2023-06-23T18:00:00-04:00",
            endTime: "2023-06-24T06:00:00-04:00",
            isDaytime: false,
            temperature: 68,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 80,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 22.222222222222221,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 100,
            },
            windSpeed: "7 to 12 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/night/tsra_sct,80/tsra_sct,60?size=medium",
            shortForecast: "Showers And Thunderstorms",
            detailedForecast:
              "Showers and thunderstorms. Mostly cloudy, with a low around 68. Chance of precipitation is 80%.",
          },
          {
            number: 9,
            name: "Saturday",
            startTime: "2023-06-24T06:00:00-04:00",
            endTime: "2023-06-24T18:00:00-04:00",
            isDaytime: true,
            temperature: 85,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 70,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 22.222222222222221,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 100,
            },
            windSpeed: "9 mph",
            windDirection: "SW",
            icon: "https://api.weather.gov/icons/land/day/rain_showers,40/tsra_hi,70?size=medium",
            shortForecast: "Showers And Thunderstorms Likely",
            detailedForecast:
              "A chance of rain showers before 2pm, then showers and thunderstorms likely. Partly sunny, with a high near 85. Chance of precipitation is 70%.",
          },
          {
            number: 10,
            name: "Saturday Night",
            startTime: "2023-06-24T18:00:00-04:00",
            endTime: "2023-06-25T06:00:00-04:00",
            isDaytime: false,
            temperature: 67,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 70,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 21.111111111111111,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 100,
            },
            windSpeed: "5 to 8 mph",
            windDirection: "SW",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,70/tsra_hi,30?size=medium",
            shortForecast: "Showers And Thunderstorms Likely",
            detailedForecast:
              "Showers and thunderstorms likely before 2am. Partly cloudy, with a low around 67. Chance of precipitation is 70%.",
          },
          {
            number: 11,
            name: "Sunday",
            startTime: "2023-06-25T06:00:00-04:00",
            endTime: "2023-06-25T18:00:00-04:00",
            isDaytime: true,
            temperature: 87,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 50,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 21.111111111111111,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 97,
            },
            windSpeed: "8 mph",
            windDirection: "W",
            icon: "https://api.weather.gov/icons/land/day/rain_showers,30/tsra_hi,50?size=medium",
            shortForecast:
              "Chance Rain Showers then Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of rain showers between 8am and 2pm, then a chance of showers and thunderstorms. Mostly sunny, with a high near 87. Chance of precipitation is 50%.",
          },
          {
            number: 12,
            name: "Sunday Night",
            startTime: "2023-06-25T18:00:00-04:00",
            endTime: "2023-06-26T06:00:00-04:00",
            isDaytime: false,
            temperature: 69,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 50,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 20.555555555555557,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 93,
            },
            windSpeed: "7 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,50/tsra_hi,30?size=medium",
            shortForecast: "Chance Showers And Thunderstorms",
            detailedForecast:
              "A chance of showers and thunderstorms before 8pm, then a chance of showers and thunderstorms between 8pm and 2am. Partly cloudy, with a low around 69. Chance of precipitation is 50%.",
          },
          {
            number: 13,
            name: "Monday",
            startTime: "2023-06-26T06:00:00-04:00",
            endTime: "2023-06-26T18:00:00-04:00",
            isDaytime: true,
            temperature: 89,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 60,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 21.666666666666668,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 97,
            },
            windSpeed: "6 to 10 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/day/rain_showers,30/tsra_hi,60?size=medium",
            shortForecast: "Showers And Thunderstorms Likely",
            detailedForecast:
              "A chance of rain showers between 8am and 2pm, then showers and thunderstorms likely. Partly sunny, with a high near 89. Chance of precipitation is 60%.",
          },
          {
            number: 14,
            name: "Monday Night",
            startTime: "2023-06-26T18:00:00-04:00",
            endTime: "2023-06-27T06:00:00-04:00",
            isDaytime: false,
            temperature: 69,
            temperatureUnit: "F",
            temperatureTrend: null,
            probabilityOfPrecipitation: {
              unitCode: "wmoUnit:percent",
              value: 60,
            },
            dewpoint: {
              unitCode: "wmoUnit:degC",
              value: 20.555555555555557,
            },
            relativeHumidity: {
              unitCode: "wmoUnit:percent",
              value: 93,
            },
            windSpeed: "8 to 12 mph",
            windDirection: "S",
            icon: "https://api.weather.gov/icons/land/night/tsra_hi,60/tsra_hi,50?size=medium",
            shortForecast: "Showers And Thunderstorms Likely",
            detailedForecast:
              "Showers and thunderstorms likely. Mostly cloudy, with a low around 69. Chance of precipitation is 60%.",
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
      [owner, toAddress] = await ethers.getSigners();

      const ListenerToken = await ethers.getContractFactory("ListenerERC20");

      deployedListenerToken = await ListenerToken.deploy();
      await deployedListenerToken.deployed();

      const LitActionCode = newCircuit.setActions(customActions);
      newCircuit.executionConstraints({ maxLitActionCompletions: 1 });
      newCircuit.setConditionalLogic({ type: "EVERY", interval: 60000 });

      const ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
      pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
      authSig = await newCircuit.generateAuthSignature(80001);
    });

    it("Checks Against Transfer Event", async () => {
      newCircuit.setConditions([
        new ContractCondition(
          deployedListenerToken.address as `0x${string}`,
          ListenerERC20ABI,
          CHAIN_NAME.HARDHAT,
          "Transfer",
          ["from", "to", "value"],
          [owner.address, toAddress.address, BigNumber.from("5000")],
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
        pkpPublicKey: pkpTokenData.publicKey,
        authSig,
      });

      setTimeout(async () => {
        try {
          const tx = await deployedListenerToken.transfer(
            toAddress.address,
            "5000",
          );
          await tx.wait();
        } catch (err) {
          console.error(err);
        }
      }, 10000);

      await startPromise;

      const responseLog = newCircuit.getLogs(LogCategory.CONDITION);
      console.log({ responseLog });
      expect(responseLog[responseLog.length - 2].category).to.equal(2);
      expect(responseLog[responseLog.length - 2].message).to.equal(
        `Condition Matched with Emitted Value: `,
      );
      expect(responseLog[responseLog.length - 2].responseObject).to.equal(
        JSON.stringify([
          owner.address,
          toAddress.address,
          BigNumber.from("5000"),
        ]),
      );
    });
  });
});
