import { ethers } from "ethers";
import axios from 'axios';

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
          id
          title
          body
          choices
          start
          end
          snapshot
          state
          author
          scores
          space {
            id
            name
          }
        }
      }`;

    const result = await axios.post('https://hub.snapshot.org/graphql', { query })
    console.log(result.data.data.proposals[0]);
    
    return `Logged proposal ${id} to console.`
}