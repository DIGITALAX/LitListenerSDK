The ListenerSDK enables developers with an easy interface to automate responses from webhooks, subscribed on-chain events and intervals through triggered callback functions and the use of PKPs.

Check out our [gitbook documentation](https://) for in depth implementation details.

// something about pkps
// something about lit actions 
// features of the sdk for event listening (node + browser)

**TESTING:**
To compile and run tests locally:

IMPORTANT NOTE: Test Matic is required in order for a number of tests to pass. Copy the .env.sample file into a .env file, and add a MATIC private key with some native tokens. You will also need an RPC url for both MATIC You can find the Mumbai faucet at https://mumbaifaucet.com/


```
npm install
npx hardhat compile
npm run test
```

---

To install the SDK in an existing project, open your terminal and type the following two lines:

```
npm i ethers
npm i lit-listener-sdk
```

---
