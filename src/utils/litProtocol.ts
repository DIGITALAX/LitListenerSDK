import { ethers } from "ethers";
import bs58 from "bs58";
import { SiweMessage } from "siwe";
import { AuthSig } from "@lit-protocol/types";
let esbuild: any, Writable: any, crypto: any, CryptoJS: any;

const loadNodebuild = async () => {
  if (typeof window === "undefined") {
    esbuild = await import("esbuild");
    const stream = await import("stream");
    Writable = stream.Writable;
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

export const bundleCode = async (
  dynamicCode: string,
): Promise<{
  outputString?: string;
  error?: string;
}> => {
  if (!esbuild) {
    throw new Error("This function can only be run in a Node.js environment.");
  }
  try {
    const result = await esbuild.build({
      stdin: {
        contents: dynamicCode,
        resolveDir: process.cwd(),
        sourcefile: "in-memory-code.js",
      },
      bundle: true,
      platform: "neutral",
      write: false,
      target: "es6",
      format: "cjs",
    });

    const outputString = new TextDecoder().decode(
      result.outputFiles[0].contents,
    );

    return { outputString };
  } catch (err: any) {
    return { error: err.message };
  }
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
