import { ethers } from "ethers";
import bs58 from "bs58";
import { SiweMessage } from "siwe";
import { LitAuthSig } from "src/@types/lit-listener-sdk";

export const generateAuthSig = async (
  signer: ethers.Signer,
  chainId = 1,
  uri = "https://localhost/login",
  version = "1",
): Promise<LitAuthSig> => {
  try {
    const address = await signer.getAddress();
    const siweMessage = new SiweMessage({
      domain: "localhost",
      address: await signer.getAddress(),
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
