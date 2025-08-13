const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  let greeter;

  beforeEach(async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    greeter = await Greeter.deploy("Hello, World!");
    await greeter.waitForDeployment();
  });

  it("Should return the greeting", async function () {
    expect(await greeter.greet()).to.equal("Hello, World!");
  });

  it("Should set a new greeting", async function () {
    const newGreeting = "Hello, Hardhat!";
    await greeter.setGreeting(newGreeting);
    expect(await greeter.greet()).to.equal(newGreeting);
  });
});
