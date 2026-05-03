import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const OG_CHAIN_ID = "0x40D8";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type WalletContextType = {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongChain: boolean;
  hasWallet: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToOgChain: () => Promise<void>;
  error: string | null;
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  isWrongChain: false,
  hasWallet: false,
  connect: async () => {},
  disconnect: () => {},
  switchToOgChain: async () => {},
  error: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasWallet = typeof window !== "undefined" && !!window.ethereum;
  const isConnected = !!address;
  const isWrongChain = !!chainId && chainId.toLowerCase() !== OG_CHAIN_ID.toLowerCase();

  const switchToOgChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: OG_CHAIN_ID }],
      });
    } catch (switchError: unknown) {
      if ((switchError as { code?: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: OG_CHAIN_ID,
              chainName: "0G-Galileo-Testnet",
              nativeCurrency: { name: "AOGI", symbol: "AOGI", decimals: 18 },
              rpcUrls: ["https://evmrpc-testnet.0g.ai"],
              blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
            },
          ],
        });
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet detected. Please install MetaMask.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]!);
        const cid = (await window.ethereum.request({
          method: "eth_chainId",
        })) as string;
        setChainId(cid);
        if (cid.toLowerCase() !== OG_CHAIN_ID.toLowerCase()) {
          await switchToOgChain();
        }
      }
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4001) {
        setError("Connection rejected.");
      } else {
        setError("Failed to connect wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [switchToOgChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]!);
          (
            window.ethereum!.request({ method: "eth_chainId" }) as Promise<string>
          ).then(setChainId).catch(() => {});
        }
      })
      .catch(() => {});

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      setAddress(accs.length > 0 ? accs[0]! : null);
      if (accs.length === 0) setChainId(null);
    };
    const handleChainChanged = (cid: unknown) => {
      setChainId(cid as string);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected,
        isConnecting,
        isWrongChain,
        hasWallet,
        connect,
        disconnect,
        switchToOgChain,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);

export const DEMO_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export const useActiveWallet = () => {
  const { address } = useWallet();
  return address ?? DEMO_WALLET;
};
