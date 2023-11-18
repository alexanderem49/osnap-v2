import { ethers } from "hardhat";
import { Test__factory } from "../typechain-types";

async function main() {
    const factory = await ethers.getContractFactory("Test") as Test__factory;
    const contract = await factory.deploy();
    await contract.deploymentTransaction()?.wait();

    let tx = await contract.actionStep1({ value: ethers.parseEther("1") });
    await tx.wait();

    console.log(await contract.taskId())
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});