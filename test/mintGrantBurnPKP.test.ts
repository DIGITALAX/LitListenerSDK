import {
  CHRONICLE_PROVIDER,
  PKP_CONTRACT_ADDRESS,
  PKP_PERMISSIONS_CONTRACT_ADDRESS,
} from "./../src/constants/index";
import pkpABI from "./../src/abis/PKPNFT.json";
import pkpPermissionsABI from "./../src/abis/PKPPermissions.json";
import { PKPNFT } from "./../typechain-types/contracts/PKPNFT";
import { PKPPermissions } from "./../typechain-types/contracts/PKPPermissions";
import { Circuit } from "../src/circuit";
import { getBytesFromMultihash } from "./../src/utils/litProtocol";
import {
  LogCategory,
  WebhookCondition,
} from "./../src/@types/lit-listener-sdk";
import { ethers } from "hardhat";
import { expect } from "chai";

const chronicleProvider = new ethers.providers.JsonRpcProvider(
  CHRONICLE_PROVIDER,
  175177,
);

describe("MintGrantBurnPKP", () => {
  let LitActionCode: string,
    ipfsCID: string,
    randomNonce: string,
    pkpTokenId: string,
    pkpNftPublicKey: string,
    newCircuit: Circuit;

  const pkpContract = new ethers.Contract(
    PKP_CONTRACT_ADDRESS,
    pkpABI,
    chronicleProvider,
  ) as PKPNFT;
  const init = async () => {
    newCircuit = new Circuit(
      new ethers.Wallet(
        "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
        chronicleProvider,
      ),
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
    const res = await newCircuit.setActions([
      {
        type: "custom",
        priority: 0,
        code: `async () => {
          Lit.Actions.setResponse({response: "Transaction Signed Successfully."});
        }`,
      },
    ]);
    LitActionCode = res.litActionCode;
    newCircuit.executionConstraints({
      conditionMonitorExecutions: 1,
    });

    ipfsCID = await newCircuit.getIPFSHash(LitActionCode);
  };

  const createPkp = async (pkpContract) => {
    const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
    pkpTokenId = pkpTokenData.tokenId;
    pkpNftPublicKey = await pkpContract.getPubkey(pkpTokenId);
  };

  it("Generates the IPFSCID of the Lit Action Code", async () => {
    if (!ipfsCID) {
      await init();
    }

    const sameIpfsCID = await newCircuit.getIPFSHash(LitActionCode);
    expect(typeof ipfsCID).to.equal("string");
    
    expect(ipfsCID).to.equal(sameIpfsCID);
    expect(ipfsCID).to.not.be.false;
  });

  it("The PKP is Correctly Granted Permission to Run the ipfsCID", async () => {
    if (!ipfsCID) {
      await init();
    }

    if (!pkpTokenId) {
      await createPkp(pkpContract);
    }

    const pkpPermissionsContract = new ethers.Contract(
      PKP_PERMISSIONS_CONTRACT_ADDRESS,
      pkpPermissionsABI,
      chronicleProvider,
    ) as PKPPermissions;
    const [permittedAction] = await pkpPermissionsContract.getPermittedActions(
      ethers.BigNumber.from(pkpTokenId),
    );
    // todo: uncomment once MintGrantBurn is used 
    //expect(getBytesFromMultihash(ipfsCID)).to.equal(permittedAction);
  });

  it("The tokenID Has No Owner", async () => {
    if (!pkpTokenId) {
      await createPkp(pkpContract);
    }

    // TODO: Refactor to use burn
    //await expect(pkpContract.ownerOf(pkpTokenId)).to.be.rejected;
  });

  //TODO: Add testcase back for mintgrantburn not allowing other actions from executing.

  it("PKP should successfully execute the Lit Action that was Granted upon Mint and Burn", async () => {
    await newCircuit.start({
      publicKey: pkpNftPublicKey,
    });
    const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);

    expect(responseLog.length).to.equal(1);
    expect(responseLog[0].category).to.equal(1);
    expect(responseLog[0].message.trim()).to.equal(
      `Circuit executed successfully. Lit Action Response.`.trim(),
    );
    expect(responseLog[0].responseObject).to.include(
      '{"signatures":{},"response":{"0":"{\\"custom0\\":\\"Transaction Signed Successfully.\\"}"},"logs":"\\nValid secure key, code running.\\n"}',
    );
  });
});
