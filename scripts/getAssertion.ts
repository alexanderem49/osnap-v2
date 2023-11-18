import { ethers } from "hardhat";

async function main() {
    const oov3 = await ethers.getContractAt("OptimisticOracleV3Interface", "0xfb55F43fB9F48F63f9269DB7Dde3BbBe1ebDC0dE");

    console.log(
        await oov3.assertions(
            "0xb2f4fc3454cce516eb3b2f8c9edb189e601518e31ae2f0b821e73c973d15d9a3"
        )
    )
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});