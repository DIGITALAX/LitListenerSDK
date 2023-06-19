import { Circuit } from "./../src/sdk";
import { expect } from "chai";

xdescribe("Confirm IPFS Hash", () => {
  let ipfsCID: string, newCircuit: Circuit;

  it("Generates the IPFSCID", async () => {
    newCircuit = new Circuit();
    ipfsCID = await newCircuit.getIPFSHash("Hello World");
    const sameIpfsCID = await newCircuit.getIPFSHash("Hello World");
    expect(typeof ipfsCID).to.equal("string");
    expect(ipfsCID).to.equal(sameIpfsCID);
    expect(ipfsCID).to.not.be.false;
  });
});
