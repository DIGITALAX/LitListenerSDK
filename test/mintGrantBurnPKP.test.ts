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

xdescribe("Mint Grant Burn PKP", () => {
  let LitActionCode: string,
    ipfsCID: string,
    randomNonce: string,
    pkpTokenId: string,
    pkpNftPublicKey: string,
    newCircuit: Circuit;

  before(() => {
    newCircuit = new Circuit(
      new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
    );
    newCircuit.setConditions([
      new WebhookCondition(
        "https://api.weather.gov",
        "/gridpoints/LWX/97,71/forecast",
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
    LitActionCode = newCircuit.setActions([
      {
        type: "custom",
        priority: 0,
        code: `async () => {
         Lit.Actions.setResponse({response: "Transaction Signed Successfully."});
        }`,
      },
    ]);
    newCircuit.executionConstraints({
      conditionMonitorExecutions: 1,
    });
  });

  it("Generates the IPFSCID of the Lit Action Code", async () => {
    ipfsCID = await newCircuit.getIPFSHash(LitActionCode + randomNonce);
    const sameIpfsCID = await newCircuit.getIPFSHash(
      LitActionCode + randomNonce,
    );
    expect(typeof ipfsCID).to.equal("string");
    expect(ipfsCID).to.equal(sameIpfsCID);
    expect(ipfsCID).to.not.be.false;
  });

  it("Mints a PKP with a Token ID and Public Key and Grants the Lit Action", async () => {
    const pkpTokenData = await newCircuit.mintGrantBurnPKP(ipfsCID);
    const pkpContract = new ethers.Contract(
      PKP_CONTRACT_ADDRESS,
      pkpABI,
      chronicleProvider,
    ) as PKPNFT;
    pkpTokenId = pkpTokenData.tokenId;
    pkpNftPublicKey = await pkpContract.getPubkey(pkpTokenId);
    expect(pkpNftPublicKey).to.equal(pkpTokenData.publicKey);
  });

  it("The PKP is Correctly Granted Permission to Run the ipfsCID", async () => {
    const pkpPermissionsContract = new ethers.Contract(
      PKP_PERMISSIONS_CONTRACT_ADDRESS,
      pkpPermissionsABI,
      chronicleProvider,
    ) as PKPPermissions;
    const [permittedAction] = await pkpPermissionsContract.getPermittedActions(
      ethers.BigNumber.from(pkpTokenId),
    );
    expect(getBytesFromMultihash(ipfsCID)).to.equal(permittedAction);
  });

  it("The tokenID Has No Owner", async () => {
    const pkpContract = new ethers.Contract(
      PKP_CONTRACT_ADDRESS,
      pkpABI,
      chronicleProvider,
    ) as PKPNFT;
    await expect(pkpContract.ownerOf(pkpTokenId)).to.be.rejected;
  });

  it("PKP Should not Allow Execution of Other Code", async () => {
    const rejectCircuit = new Circuit(
      new ethers.Wallet(process.env.PRIVATE_KEY, chronicleProvider),
    );
    rejectCircuit.setConditions([
      new WebhookCondition(
        "https://api.weather.gov",
        "/gridpoints/LWX/97,71/forecast",
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
    LitActionCode = rejectCircuit.setActions([
      {
        type: "custom",
        priority: 0,
        code: `async () => {
         Lit.Actions.setResponse({response: "Transaction Signed Successfully."});
        }`,
      },
    ]);
    rejectCircuit.executionConstraints({
      conditionMonitorExecutions: 1,
    });

    const otherCustomCode = `async () => {
      // this is the string "Hello World" for testing
      const toSign = [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100];
      // this requests a signature share from the Lit Node
      // the signature share will be automatically returned in the HTTP response from the node
      const sigShare = await Lit.Actions.signEcdsa({
        toSign,
        publicKey:
          "${pkpNftPublicKey}",
        sigName: "sig1",
      });
    };`;
    const authSig = await rejectCircuit.generateAuthSignature();
    rejectCircuit.setActions([
      {
        type: "custom",
        priority: 1,
        code: otherCustomCode,
      },
    ]);
    await expect(
      rejectCircuit.start({
        publicKey: pkpNftPublicKey,
        authSig: authSig,
      }),
    ).to.be.rejectedWith(
      "There was an error getting the signing shares from the nodes".trim(),
    );
  });

  it("PKP should successfully execute the Lit Action that was Granted upon Mint and Burn", async () => {
    const authSig = await newCircuit.generateAuthSignature();
    await newCircuit.start({
      publicKey: pkpNftPublicKey,
      authSig,
    });
    const responseLog = newCircuit.getLogs(LogCategory.RESPONSE);
    expect(responseLog[0].category).to.equal(1);
    expect(responseLog[0].message.trim()).to.equal(
      `Circuit executed successfully. Lit Action Response.`.trim(),
    );
    expect(responseLog[0].responseObject.trim()).to.equal(
      `{"signatures":{},"response":{"custom0":"Transaction Signed Successfully."},"logs":""}`.trim(),
    );
  });
});
