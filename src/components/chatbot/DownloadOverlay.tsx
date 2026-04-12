"use client";

import React from "react";
import { useTheme } from "@/context/theme";

export default function DownloadOverlay() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [modalOpen, setModalOpen] = React.useState<boolean>(() => {
    try {
      const s = localStorage.getItem("download_chatbot_state");
      // if user previously dismissed fully, don't open modal
      return s !== "closed" && s !== "minimized" ? true : false;
    } catch {
      return true;
    }
  });

  const [minimized, setMinimized] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem("download_chatbot_state") === "minimized";
    } catch {
      return false;
    }
  });

  const closeToAd = () => {
    setModalOpen(false);
    setMinimized(true);
    try {
      localStorage.setItem("download_chatbot_state", "minimized");
    } catch {}
  };

  const dismissFully = () => {
    setModalOpen(false);
    setMinimized(false);
    try {
      localStorage.setItem("download_chatbot_state", "closed");
    } catch {}
  };

  const reopen = () => {
    setModalOpen(true);
    setMinimized(false);
    try {
      localStorage.removeItem("download_chatbot_state");
    } catch {}
  };

  // If modalOpen is true, ensure minimized false
  React.useEffect(() => {
    if (modalOpen) setMinimized(false);
  }, [modalOpen]);

  // simple keyboard shortcut: Esc closes to ad
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeToAd();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const downloadUrl = "https://download.com/chatbot";

  return (
    <>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeToAd} />

          <div
            role="dialog"
            aria-modal="true"
            className={`relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl ${isDark ? "bg-zinc-900 text-white" : "bg-white text-black"}`}
          >
            <button
              aria-label="Close"
              onClick={closeToAd}
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-black/5"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold">Download Overlay Chatbot</h3>
            <p className="mt-2 text-sm text-gray-400">Install the lightweight overlay chatbot to get BarangAI help across pages. Try the demo or download the installer.</p>

            <div className="mt-4 flex gap-3">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accentGreen px-4 py-2 text-sm font-semibold text-black hover:brightness-95"
              >
                Download
              </a>

              <button
                onClick={closeToAd}
                className={`rounded-full px-4 py-2 text-sm ${isDark ? "bg-white/5 text-white" : "bg-gray-100 text-black"}`}
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {!modalOpen && minimized && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className={`group relative rounded-2xl ${isDark ? "bg-zinc-900 text-white" : "bg-white text-black"} shadow-lg border border-black/6 hover:shadow-xl transition-shadow`}>
            {/* dismiss (remove) button on minimized ad */}
            <button
              onClick={dismissFully}
              aria-label="Dismiss ad"
              className="absolute -top-2 -right-2 rounded-full p-1.5 text-sm text-gray-400 hover:bg-black/5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10"
            >
              ✕
            </button>

            <button
              onClick={reopen}
              className="flex items-center gap-3 px-4 py-2 hover:scale-105 transition-transform"
              aria-label="Open download chatbot"
            >
              <div className={`h-9 w-9 flex items-center justify-center rounded-full bg-accentGreen text-black font-bold`}>AI</div>
              <div className="text-sm text-left">
                <div className="font-medium">Download Overlay Chatbot</div>
                <div className="text-xs text-gray-400">Click to open • demo</div>
              </div>
            </button>

            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute -top-2 -left-10 hidden group-hover/block rounded-full bg-accentGreen p-2 text-black text-xs"
              aria-hidden
            >
              ↓
            </a>
          </div>
        </div>
      )}
    </>
  );
}
