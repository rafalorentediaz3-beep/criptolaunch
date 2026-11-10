"use client";

import { useCallback, useEffect, useState } from "react";

export interface WalletKeyInventory {
  keys: number;
  claimed: boolean;
}

export interface WalletEarning {
  id: string;
  boxId: string;
  title: string;
  detail: string;
  wallet: string;
  openedAt: number;
}

const KEY_EVENT = "potatopad:wallet-key-inventory";
const EARNINGS_EVENT = "potatopad:wallet-earnings";
const EMPTY_INVENTORY: WalletKeyInventory = { keys: 0, claimed: false };

function inventoryKey(address: string): string {
  return `potatopad:wallet-keys:v1:${address.toLowerCase()}`;
}

function earningsKey(address: string): string {
  return `potatopad:wallet-earnings:v1:${address.toLowerCase()}`;
}

function readEarnings(address?: string | null): WalletEarning[] {
  if (!address || typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(earningsKey(address)) ?? "[]") as WalletEarning[];
    return Array.isArray(value) ? value.filter((item) => item && typeof item.title === "string") : [];
  } catch {
    return [];
  }
}

export function recordWalletEarning(
  address: string,
  reward: Pick<WalletEarning, "boxId" | "title" | "detail">,
): WalletEarning | null {
  if (typeof window === "undefined") return null;
  const entry: WalletEarning = {
    ...reward,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    wallet: address,
    openedAt: Date.now(),
  };
  try {
    const next = [entry, ...readEarnings(address)];
    window.localStorage.setItem(earningsKey(address), JSON.stringify(next));
    window.dispatchEvent(new Event(EARNINGS_EVENT));
    return entry;
  } catch {
    return null;
  }
}

function readInventory(address?: string | null): WalletKeyInventory {
  if (!address || typeof window === "undefined") return EMPTY_INVENTORY;
  try {
    const value = JSON.parse(window.localStorage.getItem(inventoryKey(address)) ?? "null") as Partial<WalletKeyInventory> | null;
    if (!value) return EMPTY_INVENTORY;
    return {
      keys: Number.isInteger(value.keys) && (value.keys ?? 0) >= 0 ? value.keys! : 0,
      claimed: value.claimed === true,
    };
  } catch {
    return EMPTY_INVENTORY;
  }
}

function writeInventory(address: string, inventory: WalletKeyInventory): void {
  try {
    window.localStorage.setItem(inventoryKey(address), JSON.stringify(inventory));
    window.dispatchEvent(new Event(KEY_EVENT));
  } catch {
    // Keep the UI responsive if browser storage is disabled or full.
  }
}

export function claimWalletKeys(address?: string | null): WalletKeyInventory {
  if (!address || typeof window === "undefined") return EMPTY_INVENTORY;
  const current = readInventory(address);
  if (current.claimed) return current;

  const inventory = { keys: Math.floor(Math.random() * 4) + 1, claimed: true };
  writeInventory(address, inventory);
  return inventory;
}

export function spendWalletKey(address?: string | null): boolean {
  if (!address || typeof window === "undefined") return false;
  const current = readInventory(address);
  if (current.keys < 1) return false;
  writeInventory(address, { ...current, keys: current.keys - 1 });
  return true;
}

export function useWalletKeys(address?: string | null) {
  const [inventory, setInventory] = useState<WalletKeyInventory>(EMPTY_INVENTORY);

  useEffect(() => {
    const sync = () => setInventory(readInventory(address));
    sync();
    window.addEventListener(KEY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(KEY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [address]);

  const claim = useCallback(() => {
    const next = claimWalletKeys(address);
    setInventory(next);
    return next;
  }, [address]);

  const spend = useCallback(() => {
    const didSpend = spendWalletKey(address);
    if (didSpend) setInventory(readInventory(address));
    return didSpend;
  }, [address]);

  return { ...inventory, claim, spend };
}

export function useWalletEarnings(address?: string | null) {
  const [earnings, setEarnings] = useState<WalletEarning[]>([]);

  useEffect(() => {
    const sync = () => setEarnings(readEarnings(address));
    sync();
    window.addEventListener(EARNINGS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EARNINGS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [address]);

  return earnings;
}
