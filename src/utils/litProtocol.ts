import { ethers } from "ethers";
import bs58 from "bs58";
import { SiweMessage } from "siwe";
import { AuthSig } from "@lit-protocol/types";
import { DENO_BUNDLED } from "./../../src/constants";
let crypto: any, CryptoJS: any;

const loadNodebuild = async () => {
  if (typeof window === "undefined") {
    const stream = await import("stream");
    crypto = await import("crypto");
    CryptoJS = await import("crypto-js");
  }
};

loadNodebuild();

export const generateAuthSig = async (
  signer: ethers.Signer,
  chainId = 1,
  uri = "https://localhost/login",
  version = "1",
): Promise<AuthSig> => {
  try {
    const address = await signer.getAddress();
    const siweMessage = new SiweMessage({
      domain: "localhost",
      address,
      statement: "This is an Auth Sig for LitListenerSDK",
      uri: uri,
      version: version,
      chainId: chainId,
    });
    const signedMessage = siweMessage.prepareMessage();
    const sig = await signer.signMessage(signedMessage);
    return {
      sig,
      derivedVia: "web3.eth.personal.sign",
      signedMessage,
      address,
    };
  } catch (err) {
    throw new Error(`Error generating signed message ${err}`);
  }
};

export const getBytesFromMultihash = (multihash: string): string => {
  const decoded = bs58.decode(multihash);
  return `0x${Buffer.from(decoded).toString("hex")}`;
};

export const generateSecureRandomKey = (): string => {
  if (!crypto) {
    throw new Error("This function can only be run in a Node.js environment.");
  }
  return crypto.randomBytes(32).toString("hex");
};

export const hashHex = (input: string): string => {
  if (!CryptoJS) {
    throw new Error("This function can only be run in a Node.js environment.");
  }
  const hash = CryptoJS.SHA256(input);
  return "0x" + hash.toString(CryptoJS.enc.Hex);
};

export const bundleCodeManual = (dynamicCode: string): string => {
  return DENO_BUNDLED + "\n\n" + dynamicCode;
};
