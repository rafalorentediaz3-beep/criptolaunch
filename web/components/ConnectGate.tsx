"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { MetaMaskConnectButton } from "./MetaMaskConnectButton";

/**
 * Renders children only when a wallet is connected on a supported chain.
 * Otherwise shows a connect prompt or a chain-switch prompt.
 */
export function ConnectGate({ children }: { children: ReactNode }) {
  const { isConnected, chain } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-neutral-400">Connect a wallet to continue.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <MetaMaskConnectButton label="Connect MetaMask" className="btn-primary disabled:opacity-60" />
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!chain) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-neutral-400">
          Your wallet is on an unsupported network. Choose Robinhood Chain to continue.
        </p>
        <ConnectButton.Custom>
          {({ openChainModal, mounted }) => mounted ? (
            <button type="button" className="btn-secondary" onClick={openChainModal}>
              Switch network
            </button>
          ) : null}
        </ConnectButton.Custom>
      </div>
    );
  }

  return <>{children}</>;
}
