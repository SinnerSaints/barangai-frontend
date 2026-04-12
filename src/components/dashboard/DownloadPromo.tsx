"use client";

import React from "react";
import { DownloadCloud } from "lucide-react";
import { useTheme } from "@/context/theme";

export default function DownloadPromo() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [hidden, setHidden] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem("dashboard_download_promo") === "hidden";
    } catch {
      return false;
    }
  });

  if (hidden) return null;

  const downloadUrl = "https://download.com/chatbot";

  return (
    <section className={`w-full rounded-2xl p-5 mb-6 shadow-lg border ${isDark ? 'bg-zinc-900 border-white/6 text-white' : 'bg-white border-gray-100 text-black'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-accentGreen text-black font-bold text-lg">AI</div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Download Overlay Chatbot</h3>
              <p className="mt-1 text-sm text-gray-400">Install the lightweight overlay chatbot to get BarangAI help while browsing. Works across pages and stays accessible as a small ad.</p>
            </div>

            <div className="flex items-center gap-2">
              <a href={downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accentGreen px-4 py-2 text-sm font-semibold text-black hover:brightness-95">
                <DownloadCloud className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-400">Try the overlay to get instant assistance and quick links to community resources.</div>
        </div>
      </div>
    </section>
  );
}
