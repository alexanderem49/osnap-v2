import { ethers } from "hardhat";
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { SnapshotERC20SendAction, Token, OptimisticOracleV3Interface } from "../typechain-types";

async function main() {
    const factory = await ethers.getContractFactory("SnapshotERC20SendAction");
    const contract = await factory.deploy() as SnapshotERC20SendAction;
    const signer = (await ethers.getSigners())[0];
    const tokenReceiver = (await ethers.getSigners())[1];

    const nativeEth = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    const token = await ethers.getContractAt("Token", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F") as Token;

    const tokenAmount = ethers.parseUnits("10", await token.decimals());

    if (await token.allowance(await signer.getAddress(), await contract.getAddress()) < tokenAmount) {
        console.log("approving")
        await (await token.connect(signer).approve(await contract.getAddress(), ethers.MaxUint256)).wait();
        console.log("approved")
    }

    console.log("Receiver balance before: ", (await token.balanceOf(await tokenReceiver.getAddress())).toString());

    const gasPaymentAmount = ethers.parseEther("1");
    const timeToSettle = 300;

    const data = await contract.encodeActionData(
        await token.getAddress(),
        await tokenReceiver.getAddress(),
        await signer.getAddress(),
        [
            ethers.parseUnits("10", await token.decimals()),
            ethers.parseUnits("20", await token.decimals()),
            ethers.parseUnits("30", await token.decimals())
        ]
    );

    const tx = await contract.postSnapshotResultsAndScheduleExec(
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
        timeToSettle,
        nativeEth,
        gasPaymentAmount,
        data,
        { value: gasPaymentAmount }
    );
    await tx.wait();
    console.log("posted");

    console.log("Receiver address:", await tokenReceiver.getAddress());
    console.log("Task id:", (await contract.request()).gelatoTaskId);
    
    // await time.increase(timeToSettle);

    // await contract.settleAndExecuteAction();

    // console.log("Receiver balance after: ", (await token.balanceOf(await tokenReceiver.getAddress())).toString());
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});