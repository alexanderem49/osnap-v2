import { ethers } from "hardhat";
import { ActionRouter, Token } from "../typechain-types";

async function main() {
    const factory = await ethers.getContractFactory("ActionRouter");
    const contract = await factory.deploy("0x9923D42eF695B5dd9911D05Ac944d4cAca3c4EAB") as ActionRouter;
    const signer = (await ethers.getSigners())[0];

    const token = await ethers.getContractAt("Token", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F") as Token;

    const tokenAmount = ethers.parseUnits("10", await token.decimals());

    if (await token.allowance(await signer.getAddress(), await contract.getAddress()) < tokenAmount) {
        console.log("approving")
        await (await token.connect(signer).approve(await contract.getAddress(), ethers.MaxUint256)).wait();
        console.log("approved")
    }

    try {
        const txPromise = await contract.postSnapshotResultsAndScheduleExec(
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
            await token.getAddress(),
            tokenAmount,
            20,
            await token.getAddress(),
            0,
            "0x",
            await token.getAddress()
        );
    }
    catch (err) {
        console.log((await ethers.provider.getTransactionReceipt(err.transactionHash)));
        console.log(err);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});