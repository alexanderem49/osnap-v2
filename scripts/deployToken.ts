import { ethers } from "hardhat";
import { Token } from "../typechain-types";

async function main() {
    const factory = await ethers.getContractFactory("Token");

    const token6 = await factory.deploy("Test6", "TEST6", 6) as Token;
    await token6.deploymentTransaction()?.wait()
    const token18 = await factory.deploy("Test18", "TEST18", 18) as Token;
    await token18.deploymentTransaction()?.wait()


    console.log("Token6 deployed to:", await token6.getAddress());
    console.log("Token18 deployed to:", await token18.getAddress());
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});