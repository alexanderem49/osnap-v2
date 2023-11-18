import { ethers } from "hardhat";
import { ActionRouter, Token } from "../typechain-types";

async function main() {
    const factory = await ethers.getContractFactory("ActionRouter");
    const contract = await factory.deploy("0xd54A2392c8F2AD3a4e927Cf24EC12797f2503C7b") as ActionRouter;

    const erc20Factory = await ethers.getContractFactory("Token");
    const token = await erc20Factory.deploy("Test", "TEST", 6) as Token;



    const tokenAmount = ethers.parseUnits("1000", await token.decimals());

    console.log(
        (await contract.formatClaim(
            "https://snapshot.org/#/stgdao.eth/proposal/0x6c9437b45e8a88978bca68238048fca8c670ed356fa7d4ae9ab9e7e93788c538",
            [
                "yes",
                "no",
                "abstain"
            ],
            [
                5394687.138654783,
                196007.85831167529,
                150077.41939559707
            ].map((x) => ethers.parseEther(x.toString())),
            300,
            "0x",
            await token.getAddress(),
            tokenAmount
        )
        ))
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});