import './App.css';
import { MetaMaskInpageProvider } from "@metamask/providers";

import { useReducer } from 'react';
import { ethers, formatEther } from 'ethers';
import { ActionButton } from './utlis';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
  }
}

type CounterAction =
  { type: "setWallet"; value: State["walletAddress"] };

const initialState: State = { walletAddress: "Not connected" };

interface State {
  walletAddress: string
};

function stateReducer(state: State, action: CounterAction): State {
  switch (action.type) {
    case "setWallet":
      return { ...state, walletAddress: action.value };
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

  const connectAction = async () => dispatch({ type: "setWallet", value: await connectMetamask() });

  return (
    <div className="App">
      <p>
        <ActionButton title="Connect Wallet" action={connectAction}></ActionButton> <br />
        {state.walletAddress}
      </p>
    </div>
  );
}

export default App;
