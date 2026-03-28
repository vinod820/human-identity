const { expect } = require("chai");

describe("CivicProofRegistry", function () {
  it("registers an identity commitment", async function () {
    const Registry = await ethers.getContractFactory("CivicProofRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const commitment = ethers.id("identity-1");
    await registry.registerIdentity(commitment);

    expect(await registry.isIdentityRegistered(commitment)).to.equal(true);
  });
});
