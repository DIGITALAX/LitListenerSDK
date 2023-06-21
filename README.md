![Lit Listener](https://chromadin.infura-ipfs.io/ipfs/QmVt1J27ZQHYRTFFggEFnMx4WXqk6mWwiNE9V4dcztPMk6)

An open source typescript SDK, compatible with node and browser, with an easy interface to automate responses from webhooks, subscribed on-chain events and intervals through triggered callback functions and the use of [Lit Protocol](https://litprotocol.com) PKPs.

The __LitListenerSDK__ is designed around the principle of conditionally pre-approved chain reactions with account abstraction. 

![Lit Listener](https://chromadin.infura-ipfs.io/ipfs/Qmdmr63FxiEm4AAxv6kmPK5PvEPMNNxS2KLzkCQdcbkFHr)


### Check out the [documentation](https://docs.irrevocable.dev) for in depth implementation details.

To install the SDK run:

```bash
npm i lit-listener-sdk
```

## Quick Start
```typescript
import { ethers, BigNumber } from "ethers";
import { Circuit } from "lit-listener-sdk";

const chronicleProvider = new ethers.providers.JsonRpcProvider("https://chain-rpc.litprotocol.com/http", 175177);
const chronicleSigner = new ethers.Wallet(YOUR_PRIVATE_KEY, chronicleProvider);

const quickStartCircuit = new Circuit(YOUR_PROVIDER_URL, chronicleSigner);

quickStartCircuit.setConditions([
 new ContractCondition(
    "0xAbC1234567890", // contract address
    [
     {
      "anonymous": false,
      "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
       },
       {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
        }
          ],
          "name": "Transfer",
          "type": "event"
        },
      ], // abi
      "Transfer", // event name
      CHAIN_NAME.polygon, // chainId
      ["from", "value"], // event name args
      ["0x456000000000", BigNumber.from("500000")], // expected value
      "===", // match operator
      async () => { console.log("Matched!"); }, // onMatched function
      async () => { console.log("Unmatched!"); }, // onUnMatched function
      (error: Error) => { console.log("Error:", error); } // onError function,
), ]);
        
const litActionCode = quickStartCircuit.setActions([{
  type: "contract", 
  priority: 2, 
  contractAddress: "0xAbcDefGhiJklMnoPqrStuVwxYz0123456789Abcd", 
  abi: [
     {
      constant: true,
      inputs: [{ name: "numberValue", type: "uint256" }],
      name: "your_function_name",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "external",
      type: "function",
      },
  ], 
  functionName: "your_function_name", 
  chainId: "polygon", 
  nonce: 1, 
  gasLimit: 100000, 
  gasPrice: 1000, 
  value: 0, 
  maxPriorityFeePerGas: 1000, 
  maxFeePerGas: 10000, 
  args: [20], 
};
]);

// Assuming you have already uploaded the Lit Action Code to IPFS and just need to retrive the hash
const ipfsCID = await quickStartCircuit.getIPFSHash(litActionCode);
const { publicKey, tokenId, address } = await quickStartCircuit.mintGrantBurnPKP(ipfsCID);

await quickStartCircuit.start({publicKey, ipfsCID});
```

### Account abstraction enticing you to abstract away the code too?
Check out a no code implementation of the SDK live [here](https://listener.irrevocable.dev).

![Abstracted][https://chromadin.infura-ipfs.io/ipfs/QmfMuhWVsCvRs6fAgWuL3yS7mNhqeasNLFQEr8cEbRfA9n]