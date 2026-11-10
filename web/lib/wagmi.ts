"use client";

// Kept separate from lib/config.ts: RainbowKit's getDefaultConfig is
// client-only, and config.ts is also imported by server components.
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConnector, injected } from "wagmi";
import { injectedWallet, phantomWallet, zerionWallet } from "@rainbow-me/rainbowkit/wallets";
import { http } from "viem";
import { robinhoodChain } from "./config";
import { robinhoodServerTransport } from "./serverRpc";

// Robinhood reads go through our same-origin /api/rpc proxy in the browser, so
// the Alchemy key never ships to the client and can't be scraped. On the server
// (SSR) we hit the Alchemy endpoint directly from the server-only env var.
// `batch: true` lets viem coalesce concurrent single eth_call/eth_getLogs/etc.
// requests (e.g. curve reads, v4 reads, and pool reads all firing on the same
// tick) into ONE JSON-RPC array POST instead of several separate round trips —
// the proxy already accepts and de-dupes/caches batched array bodies (see
// app/api/rpc/route.ts), so this is a pure latency win with no server change.
const robinhoodTransport =
  typeof window === "undefined"
    ? robinhoodServerTransport()
    : http(`${window.location.origin}/api/rpc`, { batch: true });

const chains = [robinhoodChain] as const;

// Use MetaMask's browser extension directly. RainbowKit's bundled MetaMask SDK
// also pulls in optional React Native storage; this app only needs EIP-1193.
const metaMaskExtensionWallet = () => ({
  id: "metaMaskExtension",
  name: "MetaMask",
  iconUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='20' fill='%23f6851b'/><path fill='white' d='M10 10l8 6-2 4-7-5zm20 0l-8 6 2 4 7-5zM9 25l7-3 3 2-3 5zm22 0l-7-3-3 2 3 5z'/></svg>",
  iconBackground: "#f6851b",
  installed:
    typeof window !== "undefined" &&
    Boolean((window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask),
  createConnector: (walletDetails: Parameters<ReturnType<typeof injectedWallet>["createConnector"]>[0]) =>
    createConnector((config) => ({
      ...injected({ target: "metaMask" })(config),
      id: "metaMaskExtension",
      name: "MetaMask",
      ...walletDetails,
    })),
});

export const wagmiConfig = getDefaultConfig({
  appName: "PotatoPad",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "potatopad-demo",
  wallets: [
    {
      groupName: "Wallets",
      // Keep a generic injected-wallet fallback so browser wallets that are not
      // on RainbowKit's named-wallet list (Rabby, Brave, Coinbase, etc.) can connect.
      wallets: [metaMaskExtensionWallet, phantomWallet, zerionWallet, injectedWallet],
    },
  ],
  chains,
  transports: {
    [robinhoodChain.id]: robinhoodTransport,
  },
  // Every browser RPC read tunnels through /api/rpc → Alchemy. wagmi's 4s default
  // block-poll (balances, block number) multiplies that; 15s is plenty fresh for a
  // launchpad and cuts proxy/Alchemy load ~4x.
  pollingInterval: 30_000,
  ssr: true,
});
