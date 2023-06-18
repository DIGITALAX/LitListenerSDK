import * as IPFS from "@mdip/ipfs-core";
import { CID } from "@mdip/ipfs-core/src/block-storage";

export interface IPFSData {
  cid: CID;
  gatewayURL: string;
}

export const uploadToIPFS = async (code: string): Promise<IPFSData> => {
  try {
    const ipfs = await IPFS.create();

    const { cid, path } = await ipfs.add(code);

    const data: IPFSData = {
      cid: cid,
      gatewayURL: `https://ipfs.litgateway.com/ipfs/${path}`,
    };

    return data;
  } catch (err) {
    throw new Error(`Error uploading to file to IPFS: ${err}`);
  }
};
