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
            tokenAmount,
            "0x1234567890123456789012345678901234567890"
        )
        ))
}

// Output (new lines added for readability):
// Snapshot proposal is available at 'https://snapshot.org/#/stgdao.eth/proposal/0x6c9437b45e8a88978bca68238048fca8c670ed356fa7d4ae9ab9e7e93788c538', is 
// in 'Closed' state and has the following results for all options in the proposal: 

// 'yes' scoring 5394687.138654783000000000 (93.97%), 
// 'no' scoring 196007.858311675290000000 (3.41%), 
// 'abstain' scoring 150077.419395597070000000 (2.61%). 

// The JSON object in the proposal body does not contain 'data' field, or exactly matches following value: '0x'. 

// The JSON object in the proposal body contains 'executor' field which exacly matches following value: '0x1234567890123456789012345678901234567890'. 

// This UMA query identifier is set to 'ASSERT_TRUTH', callback recepient and escalation manager set to zero address 
// (0x0000000000000000000000000000000000000000), domain id set to bytes32(0) (0x0000000000000000000000000000000000000000000000000000000000000000), 
// asserter set to '0x91fbc6c7a98342eeb934c2ab1683ef12b6b120f8'. 

// This UMA query has a liveness of 300 seconds, is submitted on a blockchain with chain id 31337, has a bond token with address 
// 0x5d28fa9aa6f86d0d83b7a6441f390d9897477958 (symbol TEST) and the bond token amount is 1000.00 as declared in the JSON object of the proposal body 
// in fields 'liveness', 'chainId', 'bondToken' and 'bondTokenAmount' respectively.


// Expected format of the JSON object in the proposal body is as follows:
// {
//     data: "0x",
//     executor: "0x",
//     liveness: 100,
//     chainId: 1,
//     bondToken: "0x",
//     bondTokenAmount: 1.0
// }

main().catch((err) => {
    console.error(err);
    process.exit(1);
});