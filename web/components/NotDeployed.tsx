"use client";

import { Moon } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SUPPORTED_CHAINS, chainName, isChainDeployed } from "@/lib/config";

/** Friendly empty state when PotatoPad has no address configured for this chain. */
export function NotDeployed({ chainId }: { chainId: number }) {
  const alternatives = SUPPORTED_CHAINS.filter(
    (c) => c.id !== chainId && isChainDeployed(c.id),
  );

  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <Moon className="mx-auto h-10 w-10 text-neutral-500" aria-hidden />
      <h2 className="mt-4 text-lg font-bold text-neutral-100">
        Switch to Robinhood Chain to create a token
      </h2>
      <p className="mt-2 text-sm text-neutral-400">
        Token launches are available on Robinhood Chain. Your wallet is currently connected to {chainName(chainId)}.
      </p>
      {alternatives.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {alternatives.map((c) => (
            <ConnectButton.Custom key={c.id}>
              {({ openChainModal, mounted }) => mounted ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={openChainModal}
                >
                  Switch to {c.name}
                </button>
              ) : null}
            </ConnectButton.Custom>
          ))}
        </div>
      )}
    </div>
  );
}
