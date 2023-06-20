import { expect } from "chai";
import { ethers } from "hardhat";
import { CHRONICLE_PROVIDER } from "./../src/constants";

const chronicleProvider = new ethers.providers.JsonRpcProvider(
  CHRONICLE_PROVIDER,
  175177,
);

describe("Emits Logs of the Circuit", () => {
  describe("Emit Condition Logs", () => {});

  describe("Emit Response Logs", () => {});

  describe("Emit Response Logs", () => {});
});
