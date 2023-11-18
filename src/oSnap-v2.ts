import { ethers } from "ethers";
import axios from 'axios';
import { type } from "os";
import executorAbi from "./abis/ExecutorAbi.json";
import erc20Abi from "./abis/ERC20Abi.json";

type VoteParams = {
  data: string,
  executor: string,
  liveness: number,
  chainId: number,
  bondToken: string,
  bondTokenAmount: number
}

function extractJsonProposalBody(proposalBody: string): VoteParams | null {
  const regex = /\`\`\`json.*\`\`\`/gs;
  const match = proposalBody.match(regex);
  if (match != null) {
    const res = match![0].substring(8, match![0].length - 3);

    return JSON.parse(res) as VoteParams;
  }
  else {
    return null;
  }
}

export async function processProposal(id: string, provider: ethers.BrowserProvider) {
  if (!provider) {
    return "Connect to a wallet first.";
  }

  const query = `query Proposals {
        proposals(
          where: {
            id: "${id}"
          },
          orderBy: "created",
          orderDirection: desc
        ) {
          choices
          state
          scores
          body
          space {
            id
          }
        }
      }`;

  const result = (await axios.post('https://hub.snapshot.org/graphql', { query })).data.data.proposals[0]

  if (!result) {
    return "Proposal not found.";
  }
  console.log(result)

  const url = `https://snapshot.org/#/${result.space.id}/proposal/${id}`
  const options = result.choices
  const weights = result.scores.map((x: string) => ethers.parseEther(x.toString()))

  const bodyJson = extractJsonProposalBody(result.body)

  if (!bodyJson) {
    return "Proposal body not found.";
  }

  const chainId = (await provider.getNetwork()).chainId;

  if (chainId != BigInt(bodyJson.chainId) && chainId != BigInt(31337)) {
    return `Wrong network, switch to ${bodyJson.chainId}`;
  }

  const contract = new ethers.Contract(bodyJson.executor, executorAbi.abi, await provider.getSigner());
  const bondToken = new ethers.Contract(bodyJson.bondToken, erc20Abi.abi, await provider.getSigner());

  const nativeEth = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const gasAmount = ethers.parseEther("0.1");
  const signer = await provider.getSigner();

  const allowance = await bondToken.allowance(await signer.getAddress(), await contract.getAddress());
  if (allowance < bodyJson.bondTokenAmount) {
    console.log("approving")
    const tx = await bondToken.approve(await contract.getAddress(), ethers.MaxUint256);
    console.log("Tx hash (postSnapshotResultsAndScheduleExec):", tx.hash);
    await tx.wait();
    console.log("approved")
  }
  else {
    console.log("already approved")
  }

  const tx = await contract.postSnapshotResultsAndScheduleExec(
    url,
    options,
    weights,
    bodyJson.bondToken,
    ethers.parseUnits(bodyJson.bondTokenAmount.toString(), await bondToken.decimals()),
    bodyJson.liveness,
    nativeEth,
    gasAmount,
    bodyJson.data,
    { value: gasAmount }
  );
  console.log("Tx hash (postSnapshotResultsAndScheduleExec):", tx.hash);
  await tx.wait();
  console.log("posted");


  return `Logged proposal ${id} to console.`
}