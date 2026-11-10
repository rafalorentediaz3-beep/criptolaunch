"use client";

import { useState } from "react";
import { useConnect } from "wagmi";

export function MetaMaskConnectButton({
  className,
  label = "Connect MetaMask",
}: {
  className: string;
  label?: string;
}) {
  const { connectors, connectAsync, isPending } = useConnect();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function connectMetaMask() {
    setErrorMessage(null);
    const connector = connectors.find((item) => item.id === "metaMaskExtension");
    if (!connector) {
      setErrorMessage("No se encontró el conector directo de MetaMask. Recarga la página e inténtalo otra vez.");
      return;
    }

    try {
      await connectAsync({ connector });
    } catch (error) {
      const details = error as { shortMessage?: string; message?: string };
      setErrorMessage(details.shortMessage || details.message || String(error));
    }
  }

  return (
    <>
      <button type="button" onClick={connectMetaMask} disabled={isPending} className={className}>
        {isPending ? "Connecting…" : label}
      </button>
      {errorMessage && (
        <div
          role="alert"
          className="fixed bottom-5 left-1/2 z-[200] w-[min(92vw,560px)] -translate-x-1/2 rounded-xl border border-red-400/30 bg-[#1b0d0d] p-4 text-sm text-red-100 shadow-2xl"
        >
          <div className="mb-1 flex items-center justify-between gap-4">
            <strong>No se pudo conectar MetaMask</strong>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-red-200/70 hover:text-white" aria-label="Cerrar error">×</button>
          </div>
          <p className="break-words text-red-100/80">{errorMessage}</p>
        </div>
      )}
    </>
  );
}
