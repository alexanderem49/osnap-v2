import { ethers as hethers } from "hardhat";
import { ethers } from "ethers";
import snapshot from "@snapshot-labs/snapshot.js";
import { SnapshotERC20SendAction, Token } from "../typechain-types";
import { ProposalType } from "@snapshot-labs/snapshot.js/dist/sign/types";

async function main() {
    const account = (await hethers.getSigners())[0];
    const receiverAddress = "0xCF6D983Fca328587022b5925862f8931cD8A9edE";

    const token = await hethers.getContractAt("Token", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F") as Token;
    
    const factory = await hethers.getContractFactory("SnapshotERC20SendAction");
    const contract = await factory.deploy() as SnapshotERC20SendAction;
    await contract.deploymentTransaction()?.wait();

    console.log("contract address: ", await contract.getAddress());

    const hub = "https://hub.snapshot.org";
    const client = new snapshot.Client712(hub);

    const data = await contract.encodeActionData(
        await token.getAddress(),
        receiverAddress,
        await account.getAddress(),
        [
            ethers.parseUnits("10", await token.decimals()),
            ethers.parseUnits("20", await token.decimals()),
            ethers.parseUnits("30", await token.decimals())
        ]
    )

    const space = "hw.alexanderem49.eth";
    let body = "As soon as this proposal is closed, the SnapshotERC20SendAction contract can be called to trustlessly execute the proposal. Please note that at the bottom of the proposal is a JSON that is used by oSnap-V2 to execute the proposal. That JSON contains has `data` field which contains ABI encoded data which includes the token address, treasury address, receiver address and amount of USDC tokens to send depending on the final decision of this proposal.";
    body += "\n\n```json\n" + JSON.stringify({
        data,
        executor: await contract.getAddress(),
        liveness: 300,
        chainId: 5,
        bondToken: await token.getAddress(),
        bondTokenAmount: 10.0
    }, null, 4) + "\n```";

    const proposalLength = 60

    const proposal = {
        from: await account.getAddress(),
        space,
        timestamp: Math.floor(Date.now() / 1e3),
        title: `How many USDC tokens on Goerli should we send to ${receiverAddress}?}`,
        body,
        type: 'quadratic' as ProposalType,
        discussion: "https://google.com",
        choices: [
            "10.0 USDC",
            "20.0 USDC",
            "30.0 USDC"
        ],
        start: Math.floor(Date.now() / 1e3),
        end: Math.floor(Date.now() / 1e3) + proposalLength,
        snapshot: await hethers.provider.getBlockNumber(),
        plugins: "{}"
    };

    console.log(proposal)

    await client.proposal({...account, _signTypedData : (domain, types, value) => {
        return account.signTypedData(domain, types, value);
    }, }, await account.getAddress(), proposal);

    console.log("proposal created");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});