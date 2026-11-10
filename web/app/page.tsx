"use client";

import { ArrowDown, ArrowUpRight, Coins, Crown, Heart, Hourglass, KeyRound, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MetaMaskConnectButton } from "@/components/MetaMaskConnectButton";
import { useEffect, useMemo, useState } from "react";
import type { Address, Hex } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { potatoCurvePadAbi, potatoV4PadAbi } from "@/lib/abi";
import { V4_POOL_MANAGER_ADDRESSES, WETH_ADDRESSES, ZERO_ADDRESS, isMigrated } from "@/lib/config";
import { useAncientTokens } from "@/lib/ancient";
import { useRecentBuys } from "@/lib/buys";
import { useLaunchActivity } from "@/lib/events";
import { usePad } from "@/lib/hooks";
import {
  priceWethPerToken,
  tokenIsToken0,
  uniswapV3PoolAbi,
  uniswapV4PoolManagerAbi,
  v4PoolStateSlot,
  v4SqrtPriceFromSlot,
  TOTAL_SUPPLY_WHOLE,
} from "@/lib/pool";
import { ANALYTICS_CHAIN_ID } from "@/lib/robinhoodPublicClient";
import { useProfiles } from "@/lib/profile/useProfile";
import { useFlipGrid } from "@/lib/useFlip";
import { useEthUsdPrice } from "@/lib/price";
import { NotDeployed } from "@/components/NotDeployed";
import { useSearch } from "@/components/SearchContext";
import { TokenCard, type TokenRow } from "@/components/TokenCard";
import { TokenCarousel } from "@/components/TokenCarousel";
import { recordWalletEarning, useWalletKeys } from "@/lib/walletKeys";

/** Discover feed is Robinhood-pinned; price with RH WETH, not wallet-chain WETH. */
const RH_WETH = WETH_ADDRESSES[ANALYTICS_CHAIN_ID] ?? ZERO_ADDRESS;

type TabId = "growing" | "ancient";
type SortId = "recent" | "new" | "old" | "mcap";

const TABS: { id: TabId; label: string }[] = [
  { id: "growing", label: "Coins" },
  { id: "ancient", label: "Ancients" },
];
const SORTS: { id: SortId; label: string }[] = [
  { id: "mcap", label: "Market Cap" },
  { id: "new", label: "Newest" },
  { id: "old", label: "Oldest" },
];

const GLITCH_PRIZES = [
  { id: "loot", title: "Loot misterioso", detail: "Una caja sellada del glitch", icon: "🧰", tint: "from-violet-300 to-fuchsia-500", glow: "rgba(192,132,252,0.2)" },
  { id: "boost", title: "Boost de visibilidad", detail: "Impulso para tu lanzamiento", icon: "⚡", tint: "from-lime-200 to-emerald-500", glow: "rgba(163,230,53,0.2)" },
  { id: "badge", title: "Badge glitch", detail: "Una insignia de colección", icon: "🏅", tint: "from-amber-200 to-orange-500", glow: "rgba(251,191,36,0.2)" },
  { id: "idea", title: "Idea destacada", detail: "Tu idea brilla en el feed", icon: "💡", tint: "from-cyan-200 to-blue-500", glow: "rgba(34,211,238,0.2)" },
  { id: "drop", title: "Drop sorpresa", detail: "Un hallazgo inesperado", icon: "🎁", tint: "from-pink-200 to-rose-500", glow: "rgba(244,114,182,0.2)" },
  { id: "gold", title: "Glitch dorado", detail: "Una edición poco común", icon: "✨", tint: "from-yellow-200 to-amber-500", glow: "rgba(250,204,21,0.2)" },
  { id: "secret", title: "Token secreto", detail: "Un secreto entre bloques", icon: "🔮", tint: "from-indigo-200 to-violet-500", glow: "rgba(129,140,248,0.2)" },
  { id: "extra", title: "Un giro extra", detail: "Otra oportunidad en la ruleta", icon: "🌀", tint: "from-teal-200 to-cyan-500", glow: "rgba(45,212,191,0.2)" },
];

const MMG_TOP_PRIZES = [
  {
    rank: "01",
    eyebrow: "EL GRAN PREMIO",
    figure: "50%",
    title: "del suministro de MMG",
    description: "Distribución gratuita prometida para traders activos de Solana.",
    Icon: Crown,
    theme: "gold",
  },
  {
    rank: "02",
    eyebrow: "INGRESOS QUE LLEGAN",
    figure: "SOL",
    title: "recompensas automáticas",
    description: "Se afirmaba que los holders de MMG recibirían SOL directamente en su wallet.",
    Icon: Coins,
    theme: "violet",
  },
  {
    rank: "03",
    eyebrow: "REPARTO A HOLDERS",
    figure: "4%",
    title: "de las comisiones de liquidez",
    description: "El anuncio planteaba devolver esa parte de las comisiones a los holders.",
    Icon: Zap,
    theme: "cyan",
  },
];

type Slot0 = readonly [bigint, number, number, number, number, number, boolean];

interface CachedMarketCap {
  eth: number;
  usd?: number;
  updatedAt: number;
}

const MARKET_CAP_CACHE_KEY = "potatopad:market-caps:v2";
const MARKET_CAP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readMarketCapCache(): Record<string, CachedMarketCap> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MARKET_CAP_CACHE_KEY) ?? "{}") as Record<
      string,
      CachedMarketCap
    >;
    const cutoff = Date.now() - MARKET_CAP_CACHE_TTL_MS;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) =>
          Number.isFinite(value?.eth) && value.eth > 0 && value.updatedAt >= cutoff,
      ),
    );
  } catch {
    return {};
  }
}

export default function DiscoverPage() {
  // `weth` is intentionally NOT taken from usePad: the feed is Robinhood-pinned,
  // so pricing uses RH_WETH rather than the connected wallet's chain WETH.
  const { chainId, curvePad, isDeployed } = usePad();
  const { address: playerWallet } = useAccount();
  const keyInventory = useWalletKeys(playerWallet);
  const { query, setQuery } = useSearch();
  const [tab, setTab] = useState<TabId>("growing");
  const [sort, setSort] = useState<SortId>("mcap");
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<string | null>(null);
  const [wheelPrizeWallet, setWheelPrizeWallet] = useState<Address | null>(null);
  const [openedBox, setOpenedBox] = useState<string | null>(null);
  const [cachedMarketCaps, setCachedMarketCaps] = useState<Record<string, CachedMarketCap>>({});
  const isAncientTab = tab === "ancient";
  const { usd: ethUsd } = useEthUsdPrice();

  useEffect(() => {
    setCachedMarketCaps(readMarketCapCache());
  }, []);

  // PotatoPad launches — span ALL pads (curve + direct/legacy). Robinhood-pinned.
  const {
    creations,
    state: launchState,
    unavailable: launchUnavailable,
    isLoading: launchLoading,
  } = useLaunchActivity();
  const mmgToken = useMemo(
    () => creations
      .filter((creation) => creation.symbol.trim().toUpperCase() === "MMG")
      .sort((a, b) => b.timestamp - a.timestamp)[0],
    [creations],
  );
  const mmgStatus = mmgToken
    ? launchState === "stale"
      ? "Last on-chain data · refreshing"
      : "Live on Robinhood Chain"
    : launchLoading
      ? "Checking the live launch feed"
      : launchUnavailable
        ? "Feed unavailable · retrying"
        : launchState === "stale"
          ? "Last feed snapshot · checking again"
        : "Pending launch · MMG not detected on-chain yet";
  // Pre-existing Robinhood "ancient" runners (Noxa etc.), served by /api/ancient.
  const {
    tokens: ancientTokens,
    unavailable: ancientUnavailable,
    isLoading: ancientLoading,
  } = useAncientTokens();

  // Pass 1: curve metadata (curves + progress) for every creation. Non-curve
  // tokens return zeros (allowFailure) — harmless. 2 reads per token, index-aligned
  // so creation i is at [2i, 2i+1].
  const hasCurve = curvePad !== ZERO_ADDRESS && creations.some((c) => c.kind === "curve");
  const curveContracts = useMemo(
    () =>
      creations.flatMap((c) => [
        { address: curvePad, abi: potatoCurvePadAbi, functionName: "curves", args: [c.token] },
        { address: curvePad, abi: potatoCurvePadAbi, functionName: "curveProgressBps", args: [c.token] },
      ]),
    [creations, curvePad],
  );
  const { data: curveReads } = useReadContracts({
    contracts: curveContracts as never[],
    allowFailure: true,
    query: { enabled: isDeployed && hasCurve },
  });

  // Direct-to-v4 launches have no pool contract address at all — v4 pools are
  // singleton-managed and identified by a bytes32 PoolId. Resolve each v4
  // creation's PoolId from the pad THAT LAUNCHED IT (c.pad) first (pass 1b) —
  // several superseded v4 pads remain live read-only (see legacyPads in
  // config.ts), so this can't use a single "current v4 pad" address — then
  // read that pool's packed Slot0 word straight off the PoolManager via
  // `extsload` (pass 2b). Same index-alignment trick as the curve reads: call
  // for every creation (harmless no-op for non-v4 kinds under allowFailure) so
  // array indices stay aligned to `creations` without a second bookkeeping pass.
  const v4Manager = V4_POOL_MANAGER_ADDRESSES[ANALYTICS_CHAIN_ID] ?? ZERO_ADDRESS;
  const hasV4 = v4Manager !== ZERO_ADDRESS && creations.some((c) => c.kind === "v4");
  const v4TokenReadIndexes = useMemo(
    () =>
      creations
        .map((c, i) => (c.kind === "v4" && !c.poolId ? i : -1))
        .filter((i) => i >= 0),
    [creations],
  );
  const v4TokenContracts = useMemo(
    () =>
      v4TokenReadIndexes.map((i) => ({
        address: creations[i].pad,
        abi: potatoV4PadAbi,
        functionName: "v4Tokens" as const,
        args: [creations[i].token],
      })),
    [creations, v4TokenReadIndexes],
  );
  const { data: v4TokenReads } = useReadContracts({
    contracts: v4TokenContracts as never[],
    allowFailure: true,
    query: { enabled: isDeployed && hasV4 && v4TokenContracts.length > 0 },
  });
  const resolvedV4PoolIds = useMemo(() => {
    const map = new Map<number, Hex>();
    v4TokenReadIndexes.forEach((creationIndex, readIndex) => {
      const info = v4TokenReads?.[readIndex]?.result as
        | readonly [Address, Hex, bigint, number]
        | undefined;
      if (info?.[0] && info[0] !== ZERO_ADDRESS) map.set(creationIndex, info[1]);
    });
    return map;
  }, [v4TokenReadIndexes, v4TokenReads]);

  // v4Tokens() => (creator, poolId, lpTokenId, feeTier); poolId undefined when
  // the creation isn't (yet) resolved as a v4 token — that read is skipped below.
  const ZERO_POOL_ID = `0x${"0".repeat(64)}` as Hex;
  const v4PoolIds = useMemo<(Hex | undefined)[]>(
    () =>
      creations.map((c, i) => {
        if (c.kind !== "v4") return undefined;
        return c.poolId ?? resolvedV4PoolIds.get(i);
      }),
    [creations, resolvedV4PoolIds],
  );
  const v4StateReadIndexes = useMemo(
    () => v4PoolIds.map((poolId, i) => (poolId ? i : -1)).filter((i) => i >= 0),
    [v4PoolIds],
  );
  const v4StateContracts = useMemo(
    () =>
      v4StateReadIndexes.map((i) => ({
        address: v4Manager,
        abi: uniswapV4PoolManagerAbi,
        functionName: "extsload" as const,
        args: [v4PoolStateSlot(v4PoolIds[i] ?? ZERO_POOL_ID)],
        chainId: ANALYTICS_CHAIN_ID,
      })),
    [v4PoolIds, v4StateReadIndexes, v4Manager],
  );
  const { data: v4StateReads } = useReadContracts({
    contracts: v4StateContracts as never[],
    allowFailure: true,
    query: { enabled: hasV4 && v4StateContracts.length > 0 },
  });
  const v4StateByCreationIndex = useMemo(() => {
    const map = new Map<number, Hex>();
    v4StateReadIndexes.forEach((creationIndex, readIndex) => {
      const stateWord = v4StateReads?.[readIndex]?.result as Hex | undefined;
      if (stateWord) map.set(creationIndex, stateWord);
    });
    return map;
  }, [v4StateReadIndexes, v4StateReads]);

  // The Uniswap pool to price each token from. Curve tokens (single-sided-v3) have
  // a live pool from block one — pre- AND post-migration — so use curves().pool;
  // direct tokens use their own pool from the creation event.
  const effectivePools = useMemo<Address[]>(
    () =>
      creations.map((c, i) => {
        if (c.kind === "curve") {
          const cv = curveReads?.[2 * i]?.result as
            | readonly [Address, Address, bigint, bigint, boolean]
            | undefined;
          return cv?.[1] ?? c.pool ?? ZERO_ADDRESS;
        }
        return c.pool ?? ZERO_ADDRESS;
      }),
    [creations, curveReads],
  );

  // Pass 2: pool slot0 for each effective pool, index-aligned to `creations`.
  // V4 pools are resolved separately from their PoolManager state below.
  const poolReadIndexes = useMemo(
    () =>
      effectivePools
        .map((address, i) => (creations[i]?.kind !== "v4" && address !== ZERO_ADDRESS ? i : -1))
        .filter((i) => i >= 0),
    [creations, effectivePools],
  );
  const poolContracts = useMemo(
    () =>
      poolReadIndexes.map((i) => ({
        address: effectivePools[i],
        abi: uniswapV3PoolAbi,
        functionName: "slot0" as const,
        chainId: ANALYTICS_CHAIN_ID,
      })),
    [effectivePools, poolReadIndexes],
  );

  const { data: poolReads, refetch: refetchPoolReads } = useReadContracts({
    contracts: poolContracts as never[],
    allowFailure: true,
    query: {
      enabled: isDeployed && poolContracts.length > 0,
      // These ~39 pool reads multiply per visitor. Hold them 60s and don't refetch on
      // every window focus, to cut proxy/RPC load.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const poolSlot0ByCreationIndex = useMemo(() => {
    const map = new Map<number, Slot0>();
    poolReadIndexes.forEach((creationIndex, readIndex) => {
      const slot0 = poolReads?.[readIndex]?.result as Slot0 | undefined;
      if (slot0) map.set(creationIndex, slot0);
    });
    return map;
  }, [poolReadIndexes, poolReads]);

  // Live buys: ONE Swap filter spans every pool (constant RPC cost). A buy
  // bumps its token to the front of "Recent buys" and refreshes pool prices
  // right away instead of on the slow 60s cadence.
  const buyPairs = useMemo(
    () =>
      creations
        .map((c, i) => ({ token: c.token, pool: effectivePools[i] ?? ZERO_ADDRESS }))
        .filter((p) => p.pool !== ZERO_ADDRESS),
    [creations, effectivePools],
  );
  const { lastBuyAt } = useRecentBuys(buyPairs, () => {
    void refetchPoolReads();
  });

  const creatorAddresses = useMemo(() => creations.map((c) => c.creator), [creations]);
  // ONE batched request resolves every planter name on this page, never one per card.
  const { data: creatorProfiles } = useProfiles(creatorAddresses);

  const padRows = useMemo<TokenRow[]>(
    () =>
      creations.map((c, i) => {
        const isCurveTok = c.kind === "curve";
        const cv = curveReads?.[2 * i]?.result as
          | readonly [Address, Address, bigint, boolean]
          | undefined;
        const curveProg = curveReads?.[2 * i + 1]?.result as bigint | undefined;
        const bonded = isCurveTok ? isMigrated(c.token, cv?.[3] ?? false) : true;
        const onCurve = isCurveTok && !bonded;

        // Curve and direct tokens have a live Uniswap V3 pool from block one,
        // so they price off its slot0. v4 launches have no pool contract at
        // all — their price comes from the PoolManager's packed Slot0 word
        // (read via extsload against the resolved PoolId) instead.
        let sqrtPriceX96: bigint | undefined;
        if (c.kind === "v4") {
          const stateWord = v4StateByCreationIndex.get(i);
          sqrtPriceX96 = v4SqrtPriceFromSlot(stateWord);
        } else {
          const slot0 = poolSlot0ByCreationIndex.get(i);
          sqrtPriceX96 = slot0?.[0];
        }
        const cached = cachedMarketCaps[c.token.toLowerCase()];
        const quoteToken = c.quoteToken ?? RH_WETH;
        const isWethQuote = quoteToken.toLowerCase() === RH_WETH.toLowerCase();
        // Failed / missing live price falls back to the last valid snapshot so
        // returning visitors never wait on the RPC before seeing an FDV.
        let priceWeth: number | null = null;
        if (sqrtPriceX96 !== undefined && sqrtPriceX96 > 0n) {
          const priceQuote = priceWethPerToken(sqrtPriceX96, tokenIsToken0(c.token, quoteToken));
          if (isWethQuote) priceWeth = Number.isFinite(priceQuote) && priceQuote > 0 ? priceQuote : null;
        }
        const marketCapEth =
          isWethQuote && priceWeth != null
            ? priceWeth * TOTAL_SUPPLY_WHOLE
            : isWethQuote && c.marketCapEth > 0
              ? c.marketCapEth
              : isWethQuote ? (cached?.eth ?? null) : null;
        const marketCapUsd =
          c.marketCapUsd > 0
            ? c.marketCapUsd
            : isWethQuote && ethUsd !== null && marketCapEth != null
              ? marketCapEth * ethUsd
              : isWethQuote
                ? cached?.usd
                : undefined;
        return {
          address: c.token,
          name: c.name,
          symbol: c.symbol,
          creator: c.creator,
          creatorName: creatorProfiles?.[c.creator.toLowerCase()]?.username,
          // Curve tokens price from curves().pool; direct tokens from the event pool.
          pool: effectivePools[i],
          priceWeth: priceWeth ?? (marketCapEth ? marketCapEth / TOTAL_SUPPLY_WHOLE : null),
          marketCapEth,
          marketCapUsd,
          createdAt: c.timestamp,
          imageURI: c.imageURI,
          website: c.website,
          twitter: c.twitter,
          telegram: c.telegram,
          volume24Usd: c.volume24Usd,
          lastBuyAt: lastBuyAt(c.token),
          curve: isCurveTok,
          bonded,
          curveProgressBps: onCurve ? (curveProg ?? 0n) : undefined,
        };
      }),
    [
      creations,
      curveReads,
      poolSlot0ByCreationIndex,
      v4StateByCreationIndex,
      effectivePools,
      creatorProfiles,
      cachedMarketCaps,
      ethUsd,
      lastBuyAt,
    ],
  );

  useEffect(() => {
    if (padRows.length === 0) return;
    const now = Date.now();
    const next: Record<string, CachedMarketCap> = {};
    for (const row of padRows) {
      if (row.marketCapEth == null || !Number.isFinite(row.marketCapEth) || row.marketCapEth <= 0) {
        continue;
      }
      next[row.address.toLowerCase()] = {
        eth: row.marketCapEth,
        usd: row.marketCapUsd,
        updatedAt: now,
      };
    }
    if (Object.keys(next).length === 0) return;
    try {
      window.localStorage.setItem(MARKET_CAP_CACHE_KEY, JSON.stringify(next));
    } catch {
      // Storage is an acceleration only; live reads remain the source of truth.
    }
  }, [padRows]);

  const ancientRows = useMemo<TokenRow[]>(
    () =>
      ancientTokens.map((t) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        creator: ZERO_ADDRESS,
        pool: t.tradePool,
        priceWeth: null,
        marketCapEth: null,
        imageURI: t.imageUrl,
        ancient: true,
        marketCapUsd: t.fdvUsd,
        volume24Usd: t.volume24Usd,
      })),
    [ancientTokens],
  );

  const activeRows = isAncientTab ? ancientRows : padRows;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Keep the discover feed focused on launches with both core social links.
    let list = activeRows.filter(
      (row) => Boolean(row.twitter?.trim()) && Boolean(row.website?.trim()),
    );
    if (q) {
      const isAddressQuery = q.startsWith("0x");
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.symbol.toLowerCase().includes(q) ||
          (isAddressQuery && r.address.toLowerCase().startsWith(q)),
      );
    }
    list = Array.from(
      list
        .reduce((unique, row) => {
          const key = row.address.toLowerCase();
          if (!unique.has(key)) unique.set(key, row);
          return unique;
        }, new Map<string, TokenRow>())
        .values(),
    );
    if (isAncientTab) {
      return [...list].sort((a, b) => (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0));
    }
    switch (sort) {
      case "recent":
        // Live buys first (most recent wins); tokens with no observed buy keep
        // the 24h-volume order so first paint matches the previous behavior.
        return [...list].sort((a, b) => {
          const ba = a.lastBuyAt ?? 0;
          const bb = b.lastBuyAt ?? 0;
          if (bb !== ba) return bb - ba;
          return (b.volume24Usd ?? 0) - (a.volume24Usd ?? 0);
        });
      case "new":
        return [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      case "old":
        return [...list].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      case "mcap":
        // Null FDVs sort last (unknown ≠ zero).
        return [...list].sort((a, b) => {
          if (a.marketCapEth != null || b.marketCapEth != null) {
            return (b.marketCapEth ?? -1) - (a.marketCapEth ?? -1);
          }
          return (b.marketCapUsd ?? -1) - (a.marketCapUsd ?? -1);
        });
      default:
        return list;
    }
  }, [activeRows, query, sort, isAncientTab]);

  // FLIP reorder animation: whenever the visible order changes (a live buy
  // bumping a card, a sort switch, a new launch), moved cards glide instead of
  // jumping. Keys are token addresses — stable across re-sorts.
  const visibleOrderKey = useMemo(() => visible.map((r) => r.address).join(","), [visible]);
  const gridRef = useFlipGrid<HTMLDivElement>(visibleOrderKey);

  function spinGlitchWheel() {
    if (!playerWallet || wheelSpinning) return;
    const prizeIndex = Math.floor(Math.random() * GLITCH_PRIZES.length);
    const landingOffset = 360 - prizeIndex * (360 / GLITCH_PRIZES.length);
    setWheelPrize(null);
    setWheelPrizeWallet(null);
    setWheelSpinning(true);
    setWheelRotation((current) => current + 360 * 6 + landingOffset);
    window.setTimeout(() => {
      setWheelPrize(GLITCH_PRIZES[prizeIndex].title);
      setWheelPrizeWallet(playerWallet);
      setWheelSpinning(false);
    }, 5200);
  }

  function openMysteryBox(prize: (typeof GLITCH_PRIZES)[number]) {
    if (!playerWallet) return;
    if (!keyInventory.claimed) {
      keyInventory.claim();
      setOpenedBox("Has recibido tus llaves. Vuelve a pulsar para abrir esta caja.");
      return;
    }
    if (!keyInventory.spend()) {
      setOpenedBox("No te quedan llaves. Cada wallet puede reclamar un lote de 1 a 4 llaves.");
      return;
    }
    recordWalletEarning(playerWallet, { boxId: prize.id, title: prize.title, detail: prize.detail });
    setOpenedBox(`Caja abierta para ${playerWallet.slice(0, 6)}…${playerWallet.slice(-4)}: ${prize.title}. Guardada en Earnings.`);
  }

  if (!isDeployed) {
    return <NotDeployed chainId={chainId} />;
  }

  // Treat a soft-degraded scan (unavailable) as "still loading", not "empty", so a
  // transient RPC / cold-cache blip never flashes the empty state.
  const loading = isAncientTab
    ? (ancientLoading || ancientUnavailable) && ancientTokens.length === 0
    : (launchLoading || launchUnavailable) && creations.length === 0;

  const segBase =
    "rounded-full px-3.5 py-2 text-xs font-semibold tracking-tight transition-all";

  return (
    <div className="space-y-12">
      <section className="matrix-hero relative isolate overflow-hidden rounded-[28px] border border-lime-400/20 px-5 py-12 text-center shadow-[0_30px_100px_-55px_rgba(34,197,94,0.5)] sm:px-10 sm:py-16">
        <div aria-hidden className="matrix-rain absolute inset-0 -z-10" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_85%,rgba(34,197,94,0.19),transparent_55%)]" />
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-black/55 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-lime-300 sm:text-xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-400" /> Nassdaq launchpad <span className="text-white/30">/</span> Robinhood Chain
          </div>
          <h1 className="matrix-title text-4xl font-black uppercase leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
            El próximo glitch
            <span className="mt-2 block text-lime-300">empieza aquí.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base sm:leading-7">
            Sigue MMG y el estado real de su lanzamiento. Cuando aparezca en la cadena, esta página actualizará sus datos automáticamente.
            El código está a la vista. La sorpresa, todavía no.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div id="mmg-status" className="flex min-w-[min(100%,370px)] items-center gap-3 rounded-2xl border border-lime-200/30 bg-black/55 px-4 py-3 text-left shadow-[0_0_35px_-20px_rgba(163,230,53,0.8)] backdrop-blur sm:px-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-lime-200/30 bg-lime-300/10 font-mono text-sm font-black tracking-widest text-lime-100">MMG</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Token de esta página</span>
                <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-white sm:text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${mmgToken && launchState === "fresh" ? "animate-pulse bg-lime-300" : launchUnavailable ? "bg-amber-300" : "bg-neutral-500"}`} />
                  <span className="truncate">{mmgStatus}</span>
                </span>
              </span>
              {mmgToken && <Link href={`/token/${mmgToken.token}`} className="shrink-0 rounded-full border border-lime-200/25 px-3 py-1.5 text-xs font-bold text-lime-100 transition hover:bg-lime-200/10">Ver MMG</Link>}
            </div>
            <a href="#coins" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-lime-300/50 hover:bg-lime-300/10">
              Explorar tokens <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <div className="mx-auto mt-9 flex max-w-2xl items-start justify-center gap-3 rounded-2xl border border-lime-300/15 bg-black/45 px-4 py-3 text-left backdrop-blur-sm sm:items-center sm:px-5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-lime-300 sm:mt-0" />
            <p className="text-xs leading-5 text-neutral-300 sm:text-sm">
              <span className="font-semibold text-white">Hay algo más en camino.</span> Se prevén recompensas para wallets elegibles, sujetas al cumplimiento de la normativa aplicable. <Link href="/rules" className="whitespace-nowrap text-lime-300 underline decoration-lime-300/40 underline-offset-4 hover:text-lime-200">Ver normativa</Link>
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Opciones del launchpad" className="grid gap-3 sm:grid-cols-3">
        <a href="#mmg-status" className="matrix-option group">
          <span className="matrix-option-icon font-mono text-sm font-black">MMG</span>
          <span className="block text-sm font-semibold text-white">Estado del token</span>
          <span className="mt-1 block text-xs text-neutral-400">{mmgStatus}</span>
          <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-neutral-600 transition group-hover:text-lime-300" />
        </a>
        <a href="#coins" className="matrix-option group">
          <span className="matrix-option-icon"><Search className="h-5 w-5" /></span>
          <span className="block text-sm font-semibold text-white">Explorar el feed</span>
          <span className="mt-1 block text-xs text-neutral-400">Encuentra lanzamientos y actividad reciente.</span>
          <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-neutral-600 transition group-hover:text-lime-300" />
        </a>
        <Link href="/rules" className="matrix-option group">
          <span className="matrix-option-icon"><ShieldCheck className="h-5 w-5" /></span>
          <span className="block text-sm font-semibold text-white">Recompensas y normativa</span>
          <span className="mt-1 block text-xs text-neutral-400">Consulta las bases y sus novedades.</span>
          <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-neutral-600 transition group-hover:text-lime-300" />
        </Link>
      </section>

      {/* Unified header + controls */}
      <div id="coins" className="scroll-mt-28 space-y-5 sm:space-y-6">
        <p
          className="matrix-tagline text-center text-xl font-normal italic leading-none sm:text-2xl"
          style={{ fontFamily: 'Didot, "Bodoni MT", "Bodoni 72", Georgia, serif' }}
        >
          hot ideas born here.
        </p>

        <section aria-labelledby="glitch-wheel-title" className="relative overflow-hidden rounded-[28px] border border-lime-300/20 bg-[#050906]/90 px-5 py-8 shadow-[0_24px_80px_-42px_rgba(34,197,94,0.38)] sm:px-8 sm:py-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(163,230,53,0.12),transparent_58%)]" />
          <div className="relative mx-auto max-w-6xl">
            <div className="text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-lime-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" /> anomalía detectada
              </div>
              <h2 id="glitch-wheel-title" className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">Premios ocultos del glitch</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-400">Cajas misteriosas con NFT únicos. Echa un vistazo a lo que puede aparecer y gira la ruleta para descubrir tu caja.</p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {GLITCH_PRIZES.map((prize, index) => (
                <article key={prize.id} className="group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/85 p-3 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_14px_36px_-20px_rgba(163,230,53,0.45)] sm:p-4">
                  <div aria-hidden className="absolute inset-0 -z-10 opacity-70 transition group-hover:opacity-100" style={{ background: `radial-gradient(circle at 20% 0%, ${prize.glow}, transparent 65%)` }} />
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 font-mono text-[9px] font-bold tracking-[0.16em] text-neutral-400">CAJA 0{index + 1}</span>
                    <span aria-hidden className="text-xs text-lime-200/70">✦</span>
                  </div>
                  <div className={`mx-auto my-4 flex aspect-square w-full max-w-[92px] items-center justify-center rounded-[22px] border border-white/25 bg-gradient-to-br ${prize.tint} text-4xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_12px_28px_-14px_rgba(0,0,0,0.9)] transition duration-300 group-hover:scale-105 sm:my-5 sm:text-5xl`}>
                    <span aria-hidden>{prize.icon}</span>
                  </div>
                  <h3 className="text-center text-xs font-bold leading-5 text-white sm:text-sm">{prize.title}</h3>
                  <p className="mt-1 text-center text-[10px] leading-4 text-neutral-500 sm:text-[11px]">{prize.detail}</p>
                  <div aria-hidden className="mt-3 flex justify-center gap-1">
                    <span className="h-1 w-5 rounded-full bg-white/25" /><span className="h-1 w-1 rounded-full bg-white/15" /><span className="h-1 w-1 rounded-full bg-white/15" />
                  </div>
                  {playerWallet ? (
                    <button
                      type="button"
                      onClick={() => openMysteryBox(prize)}
                      disabled={keyInventory.claimed && keyInventory.keys < 1}
                      className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200/25 bg-amber-200/10 px-2 py-2 text-[10px] font-bold text-amber-100 transition hover:bg-amber-200/20 disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {!keyInventory.claimed ? "Recibir llaves" : keyInventory.keys > 0 ? "Abrir · 1 llave" : "Sin llaves"}
                    </button>
                  ) : (
                    <ConnectButton.Custom>
                      {({ openConnectModal, mounted }) => (
                        <button type="button" onClick={openConnectModal} disabled={!mounted} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-lime-200/20 bg-lime-200/5 px-2 py-2 text-[10px] font-bold text-lime-100 transition hover:bg-lime-200/10 disabled:opacity-40 sm:text-xs">
                          <KeyRound className="h-3.5 w-3.5" /> Conecta wallet
                        </button>
                      )}
                    </ConnectButton.Custom>
                  )}
                </article>
              ))}
            </div>

            <p aria-live="polite" className="mt-4 min-h-5 text-center text-xs font-semibold text-amber-100">{openedBox ?? (playerWallet ? `Inventario de ${playerWallet.slice(0, 6)}…${playerWallet.slice(-4)}: ${keyInventory.keys} llaves` : "Conecta una wallet y reclama de 1 a 4 llaves para abrir una caja.")}</p>

            <div className="mt-9 grid items-center gap-8 border-t border-white/10 pt-8 md:grid-cols-[1fr_auto] md:gap-12">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">La ruleta del glitch</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-400">Cada segmento es una de las cajas de arriba. ¿Cuál revelará la señal?</p>
                {playerWallet ? (
                  <button type="button" onClick={spinGlitchWheel} disabled={wheelSpinning} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-bold text-black shadow-[0_0_28px_-10px_rgba(163,230,53,0.8)] transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60">
                    <Sparkles className={`h-4 w-4 ${wheelSpinning ? "animate-spin" : ""}`} /> {wheelSpinning ? "Descifrando..." : "Girar la ruleta"}
                  </button>
                ) : (
                  <MetaMaskConnectButton label="Conectar MetaMask" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-bold text-black shadow-[0_0_28px_-10px_rgba(163,230,53,0.8)] transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60" />
                )}
                <p aria-live="polite" className="mt-4 min-h-6 text-sm font-semibold text-lime-200">{wheelPrize ? `Vista previa para ${wheelPrizeWallet ? `${wheelPrizeWallet.slice(0, 6)}…${wheelPrizeWallet.slice(-4)}` : "tu wallet"}: ${wheelPrize}` : wheelSpinning ? "La señal está cambiando..." : playerWallet ? `Jugador: ${playerWallet.slice(0, 6)}…${playerWallet.slice(-4)} · ¿Qué NFT esconde el glitch?` : "Conecta tu wallet de Robinhood para identificarte como jugador."}</p>
                <p className="mt-3 text-[11px] leading-5 text-neutral-600">Vista previa del sorteo: la asignación real de NFT y su canje por SOL se activarán al definir las bases, cantidades y entrega de premios.</p>
              </div>

              <div className="mx-auto w-full max-w-[310px]">
                <div className="relative mx-auto aspect-square w-full">
                  <div aria-hidden className="absolute -inset-3 rounded-full border border-lime-300/15 shadow-[0_0_50px_-18px_rgba(163,230,53,0.6)]" />
                  <div aria-hidden className="absolute left-1/2 top-[-8px] z-20 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-lime-200 drop-shadow-[0_0_8px_rgba(190,242,100,0.8)]" />
                  <div aria-label="Ruleta con las ocho cajas de premios de arriba" role="img" className="absolute inset-0 rounded-full border-[5px] border-[#b8f47a] shadow-[inset_0_0_0_5px_rgba(0,0,0,0.65)] transition-transform duration-[5200ms] [transition-timing-function:cubic-bezier(0.12,0.72,0.08,1)]" style={{ transform: `rotate(${wheelRotation}deg)`, background: "conic-gradient(from -22.5deg, #b8f47a 0deg 45deg, #17351f 45deg 90deg, #d2ff91 90deg 135deg, #102719 135deg 180deg, #a6df68 180deg 225deg, #183a24 225deg 270deg, #d2ff91 270deg 315deg, #102719 315deg 360deg)" }}>
                    {GLITCH_PRIZES.map((prize, index) => <span key={prize.id} className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-white/50 bg-gradient-to-br from-white/90 to-lime-200 text-lg shadow-[0_3px_10px_rgba(0,0,0,0.35)]" style={{ transform: `translate(-50%, -50%) rotate(${index * 45}deg) translateY(-91px) rotate(-${index * 45}deg)` }}><span aria-hidden>{prize.icon}</span></span>)}
                  </div>
                  <div aria-hidden className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-lime-200/70 bg-black text-lime-200 shadow-[0_0_22px_rgba(163,230,53,0.45)]"><Zap className="h-6 w-6" /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-neutral-600" />
          <input
            type="search"
            aria-label="Search coins by name or symbol"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens"
            style={{ colorScheme: "light" }}
            className="relative w-full appearance-none rounded-full border border-lime-300/15 bg-black/55 py-3.5 pl-11 pr-4 text-sm font-medium text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_-24px_rgba(34,197,94,0.4)] outline-none backdrop-blur-2xl placeholder:font-semibold placeholder:text-neutral-500 focus:border-lime-300/40 focus:ring-4 focus:ring-lime-300/10"
          />
        </div>

        {/* Mobile search — the header search bar is desktop-only (md:block). */}
        <div className="relative md:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            aria-label="Search coins by name or symbol"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens"
            className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-3 pl-11 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-700 focus:ring-4 focus:ring-white/5"
          />
        </div>

      </div>

      <div
        className={
          isAncientTab
            ? "rounded-[28px] border border-neutral-800 bg-neutral-900 p-5 sm:p-7 shadow-[0_18px_60px_-35px_rgba(0,0,0,0.5)]"
            : "relative left-1/2 w-[calc(100vw-2rem)] max-w-[1560px] -translate-x-1/2 sm:w-[94vw]"
        }
      >
        <div className="mb-6 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-neutral-100 sm:text-3xl">
              {isAncientTab ? (
                "Ancient Heritage"
              ) : (
                <span
                  className="font-normal italic"
                  style={{ fontFamily: 'Didot, "Bodoni MT", "Bodoni 72", Georgia, serif' }}
                >
                  Coins
                </span>
              )}
              {isAncientTab ? (
                <span
                  suppressHydrationWarning
                  className="ml-2 inline-flex rounded-full bg-[linear-gradient(180deg,#ffd84a_0%,#f2b90f_48%,#d88a05_100%)] px-2.5 py-1 align-middle text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,218,0.7),0_4px_10px_-6px_rgba(180,108,0,0.9)]"
                >
                  {activeRows.length}
                </span>
              ) : (
                <span
                  suppressHydrationWarning
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-[linear-gradient(180deg,#ff8fc7_0%,#ff4f9e_48%,#e6197a_100%)] px-2.5 py-1 align-middle text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,220,235,0.7),0_4px_10px_-6px_rgba(200,10,110,0.9)]"
                >
                  <Heart className="h-3 w-3 fill-white" aria-hidden />
                  {activeRows.length}
                </span>
              )}
            </h1>
            {isAncientTab && (
              <p className="mt-2 text-sm text-neutral-500">Verified legacy runners from Robinhood.</p>
            )}
          </div>
          {!isAncientTab && (
            <div className="flex w-fit flex-wrap gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_-18px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:justify-self-center">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`rounded-full px-3.5 py-2 text-[11px] transition-all ${
                  sort === s.id ? "bg-[linear-gradient(180deg,#ffd84a_0%,#f2b90f_48%,#d88a05_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,218,0.7),0_4px_14px_-8px_rgba(180,108,0,0.9)]" : "text-neutral-500 hover:bg-white/10 hover:text-neutral-100"
                  }`}
                >
                  {s.id === "recent" && (
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${sort === s.id ? "bg-white" : "bg-amber-500"}`} />
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <a href="#mmg-status" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/5 px-3 py-2.5 text-xs font-semibold text-lime-100 transition-colors hover:bg-lime-300/10 sm:justify-self-end sm:px-4 sm:text-sm">
            <span className="font-mono font-black">MMG</span> Status
          </a>
        </div>
        {!isAncientTab && (
          <section aria-labelledby="mmg-top-prizes" className="relative isolate overflow-hidden mb-6 rounded-[32px] border border-amber-200/30 bg-[#08070b] px-5 py-8 shadow-[0_30px_100px_-45px_rgba(234,179,8,0.28)] sm:px-8 sm:py-10">
            <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(234,179,8,0.22),transparent_48%),radial-gradient(ellipse_at_0%_100%,rgba(168,85,247,0.12),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgba(34,211,238,0.12),transparent_45%)]" />
            <div aria-hidden className="pointer-events-none absolute inset-4 -z-10 rounded-[26px] border border-white/[0.04]" />

            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/35 bg-amber-200/10 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100 shadow-[0_0_28px_-12px_rgba(251,191,36,0.8)] sm:text-xs">
                <Crown className="h-3.5 w-3.5" aria-hidden /> Top 3 premios MMG
              </div>
              <h2 id="mmg-top-prizes" className="text-balance text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                The promise of money that simply arrives
              </h2>
              <blockquote className="mx-auto mt-5 max-w-3xl text-xl font-medium italic leading-relaxed text-amber-100 sm:text-2xl">
                “There is no finer form of income than the kind that simply arrives.”
              </blockquote>
              <p className="mt-2 text-sm text-neutral-400 sm:text-base">
                «No existe una forma de ingreso mejor que aquella que simplemente llega.»
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-300">
                Airdrops, comisiones compartidas y SOL directo a la wallet: esta era la promesa de recompensas inesperadas de MMG.
              </p>
            </div>

            <div className="mx-auto mt-7 grid max-w-6xl gap-4 md:grid-cols-3 md:items-stretch sm:mt-8 sm:gap-5">
              {MMG_TOP_PRIZES.map(({ rank, eyebrow, figure, title, description, Icon, theme }) => {
                const themeClass = theme === "gold"
                  ? "border-amber-200/60 bg-[linear-gradient(155deg,rgba(120,80,12,0.48),rgba(18,14,8,0.96)_55%)] shadow-[0_18px_60px_-25px_rgba(245,158,11,0.42)]"
                  : theme === "violet"
                    ? "border-violet-300/40 bg-[linear-gradient(155deg,rgba(88,28,135,0.42),rgba(14,10,22,0.96)_55%)] shadow-[0_18px_60px_-30px_rgba(168,85,247,0.4)]"
                    : "border-cyan-200/40 bg-[linear-gradient(155deg,rgba(8,92,112,0.4),rgba(8,15,21,0.96)_55%)] shadow-[0_18px_60px_-30px_rgba(34,211,238,0.38)]";
                const accentClass = theme === "gold" ? "text-amber-100" : theme === "violet" ? "text-violet-100" : "text-cyan-100";
                const glowClass = theme === "gold" ? "bg-amber-300/15 text-amber-100" : theme === "violet" ? "bg-violet-300/15 text-violet-100" : "bg-cyan-300/15 text-cyan-100";

                return (
                  <article key={rank} className={`group relative flex min-h-[310px] flex-col overflow-hidden rounded-[26px] border p-5 transition duration-300 hover:-translate-y-1.5 sm:p-6 ${themeClass} ${rank === "01" ? "md:scale-[1.035] md:-translate-y-2" : ""}`}>
                    <div aria-hidden className={`absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl transition group-hover:scale-125 ${glowClass.split(" ")[0]}`} />
                    <div className="flex items-center justify-between gap-3">
                      <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${accentClass}`}>{eyebrow}</span>
                      <span className="font-mono text-xs text-white/35">#{rank}</span>
                    </div>
                    <div className={`mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 ${glowClass}`}>
                      <Icon className="h-7 w-7" aria-hidden />
                    </div>
                    <div className={`mt-4 text-5xl font-black leading-none tracking-[-0.06em] sm:text-6xl ${accentClass}`}>{figure}</div>
                    <h3 className="mt-3 text-base font-bold leading-6 text-white sm:text-lg">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">{description}</p>
                    <div className="mt-auto pt-5">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/60">
                        <span className={`h-1.5 w-1.5 rounded-full ${theme === "gold" ? "bg-amber-300" : theme === "violet" ? "bg-violet-300" : "bg-cyan-300"}`} /> Recompensa anunciada
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="mx-auto mt-7 max-w-4xl text-center text-[11px] leading-5 text-neutral-500">
              Presentación de los anuncios atribuidos a MMG; su ejecución, disponibilidad y elegibilidad no se dan por verificadas. La narrativa del proyecto giraba en torno al misterio, los ingresos pasivos y las recompensas inesperadas.
            </p>
          </section>
        )}
        {loading ? (
          <div className="min-h-[420px]" aria-busy="true" aria-live="polite" />
        ) : activeRows.length === 0 ? (
          <div className="mx-auto max-w-lg px-6 py-12 text-center">
            {isAncientTab ? (
              <>
                <Hourglass className="mx-auto h-10 w-10 text-amber-500/70" aria-hidden />
                <h2 className="mt-4 text-lg font-bold text-neutral-100">No ancient tokens yet</h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Couldn&apos;t load the pre-existing Robinhood runners right now. Try again in a
                  moment.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-neutral-100">MMG is waiting for its on-chain launch</h2>
                <p className="mt-2 text-sm text-neutral-500">{mmgStatus}. This status changes when MMG appears in the live launch feed.</p>
              </>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div className="mx-auto max-w-lg px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-neutral-100">No coins match</h2>
            <p className="mt-2 text-sm text-neutral-500">
              {query.trim()
                ? `Nothing matches “${query.trim()}” in this patch of the field.`
                : "Nothing in this patch of the field yet."}
            </p>
          </div>
        ) : !isAncientTab ? (
          <TokenCarousel rows={visible} />
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((row) => (
              <TokenCard key={row.address} row={row} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
