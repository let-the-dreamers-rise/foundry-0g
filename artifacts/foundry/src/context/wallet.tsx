import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

const OG_CHAIN_ID = "0x40D8";

function domainFields(domain: Record<string, unknown>): Array<{ name: string; type: string }> {
  const fields: Array<{ name: string; type: string }> = [];
  if (typeof domain.name === "string") fields.push({ name: "name", type: "string" });
  if (typeof domain.version === "string") fields.push({ name: "version", type: "string" });
  if (typeof domain.chainId === "number" || typeof domain.chainId === "bigint")
    fields.push({ name: "chainId", type: "uint256" });
  if (typeof domain.verifyingContract === "string")
    fields.push({ name: "verifyingContract", type: "address" });
  return fields;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

type WalletContextType = {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongChain: boolean;
  hasWallet: boolean;
  openConnectModal: () => void;
  signTypedData: (data: unknown) => Promise<string>;
  disconnect: () => void;
  switchToOgChain: () => Promise<void>;
  signTypedData: (
    domain: Record<string, unknown>,
    types: Record<string, Array<{ name: string; type: string }>>,
    message: Record<string, unknown>,
    primaryType: string
  ) => Promise<string | null>;
  error: string | null;
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  isWrongChain: false,
  hasWallet: false,
  openConnectModal: () => {},
  signTypedData: async () => "",
  disconnect: () => {},
  switchToOgChain: async () => {},
  signTypedData: async () => null,
  error: null,
});

export function useWallet() {
  return useContext(WalletContext);
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
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
        const cid = (await window.ethereum.request({ method: "eth_chainId" })) as string;
        setChainId(cid);
        if (cid.toLowerCase() !== OG_CHAIN_ID.toLowerCase()) {
          await switchToOgChain();
        }
        setModalOpen(false);
      }
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4001) {
        setError("Connection rejected.");
      } else {
        setError("Failed to connect wallet.");
        console.error("MetaMask connection failed:", err);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [switchToOgChain]);

  const connectWalletConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;
      if (!projectId) {
        alert(
          "WalletConnect requires a project ID.\n\n" +
          "Set VITE_WALLETCONNECT_PROJECT_ID in your environment variables.\n" +
          "Get a free project ID at https://cloud.walletconnect.com"
        );
        return;
      }
      const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
      const provider = await EthereumProvider.init({
        projectId,
        chains: [1],
        showQrModal: true,
      });
      await provider.connect();
      const accounts = provider.accounts as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setModalOpen(false);
      }
    } catch (err) {
      console.error("WalletConnect failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const signTypedData = useCallback(async (data: unknown) => {
    if (!window.ethereum || !address) {
      throw new Error("Wallet not connected");
    }
    try {
      const signature = (await window.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(data)],
      })) as string;
      return signature;
    } catch (err) {
      console.error("Signing failed:", err);
      throw err;
    }
  }, [address]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  const signTypedData = useCallback(
    async (
      domain: Record<string, unknown>,
      types: Record<string, Array<{ name: string; type: string }>>,
      message: Record<string, unknown>,
      primaryType: string,
    ): Promise<string | null> => {
      if (!window.ethereum || !address) return null;
      const payload = {
        domain,
        types: { EIP712Domain: domainFields(domain), ...types },
        primaryType,
        message,
      };
      try {
        const sig = (await window.ethereum.request({
          method: "eth_signTypedData_v4",
          params: [address, JSON.stringify(payload)],
        })) as string;
        return sig;
      } catch (err) {
        if ((err as { code?: number }).code !== 4001) {
          // 4001 = user rejected, don't log as error
          // eslint-disable-next-line no-console
          console.warn("signTypedData failed:", err);
        }
        return null;
      }
    },
    [address],
  );

  const openConnectModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]!);
          (window.ethereum!.request({ method: "eth_chainId" }) as Promise<string>)
            .then(setChainId)
            .catch(() => {});
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
        openConnectModal,
        signTypedData,
        disconnect,
        switchToOgChain,
        signTypedData,
        error,
      }}
    >
      {children}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-sm dark">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Connect Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Connect your wallet to access the Studio, Dashboard, and all
              wallet-gated features.
            </p>
            <Button
              className="w-full h-12 text-sm font-semibold justify-start gap-3"
              onClick={connectMetaMask}
              disabled={isConnecting}
            >
              <img
                src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/SVG_MetaMask_Icon_Color.svg"
                alt="MetaMask"
                className="h-6 w-6"
              />
              {window.ethereum?.isMetaMask
                ? "MetaMask"
                : window.ethereum
                ? "Browser Wallet"
                : "Install MetaMask"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-sm font-semibold justify-start gap-3 border-border/60"
              onClick={connectWalletConnect}
              disabled={isConnecting}
            >
              <img
                src="https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg"
                alt="WalletConnect"
                className="h-6 w-6"
              />
              WalletConnect
            </Button>
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              By connecting, you agree to the terms of service.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </WalletContext.Provider>
  );
}
