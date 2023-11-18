import './App.css';
import { MetaMaskInpageProvider } from "@metamask/providers";

import { useReducer, useRef } from 'react';
import { ethers, formatEther } from 'ethers';
import { ActionButton } from './utlis';
import { processProposal } from './oSnap-v2';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
  }
}

type CounterAction =
  { type: "setWallet"; value: State["walletAddress"] } |
  { type: "setProcessResult"; value: State["processResult"] };;

const initialState: State = { walletAddress: "Not connected", processResult: "..." };

interface State {
  walletAddress: string,
  processResult: string
};

function stateReducer(state: State, action: CounterAction): State {
  switch (action.type) {
    case "setWallet":
      return { ...state, walletAddress: action.value };
    case "setProcessResult":
      return { ...state, processResult: action.value };
    default:
      throw new Error("Unknown action");
  }
}

let provider: ethers.BrowserProvider;

async function connectMetamask() {
  if (window.ethereum == null) {
    return "Wallet provider not installed, please install Metamask";
  } else {
    try {
      provider = new ethers.BrowserProvider(window.ethereum, "any")
      const signer = await provider.getSigner();
      return `Connected with address ${signer!.address}\nBalance: ${formatEther(await provider.getBalance(signer!.address))} ETH`;
    }
    catch (e: any) {
      console.error(e);
      return "Error connecting to wallet, check logs";
    }
  }

}

function App() {
  const [state, dispatch] = useReducer(stateReducer, initialState);
  const inputRef = useRef(null);

  const connectAction = async () => dispatch({ type: "setWallet", value: await connectMetamask() });
  // @ts-ignore-next-line
  const processAction = async () => dispatch({ type: "setProcessResult", value: await processProposal(inputRef.current.value as string, provider) });


  return (
    <div style={{ paddingLeft: '20px' }}>
      <h1>oSnapV2 demo</h1>

      <p>
        <ActionButton title="Connect Wallet" action={connectAction}></ActionButton> <br />
        {state.walletAddress}
      </p>

      <p>
        Snapshot proposal hash: <input
          ref={inputRef}
          type="text"
          id="message"
          name="message"
          autoComplete="off"
        />
        <ActionButton title="Process proposal" action={processAction}></ActionButton>
      </p>

      <p>
        Process result: {state.processResult}
      </p>
    </div>
  );
}

export default App;
