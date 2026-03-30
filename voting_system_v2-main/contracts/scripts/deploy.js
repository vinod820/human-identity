const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("CivicProofRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const ElectionManager = await hre.ethers.getContractFactory("ElectionManager");
  const electionManager = await ElectionManager.deploy();
  await electionManager.waitForDeployment();

  console.log("CivicProofRegistry:", await registry.getAddress());
  console.log("ElectionManager:", await electionManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
