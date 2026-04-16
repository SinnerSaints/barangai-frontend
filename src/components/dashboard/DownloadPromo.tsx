"use client";

import React from "react";
import { DownloadCloud } from "lucide-react";
import { useTheme } from "@/context/theme";
import Image from "next/image";
import icon from "@/assets/img/icon.png";

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

  const downloadUrl = "https://github.com/SinnerSaints/barangai-overlay-app/releases/download/v0.2.0-beta/BarangAI.exe";

  return (
    <section className={`w-full rounded-2xl p-5 mb-6 shadow-lg border ${isDark ? 'bg-zinc-900 border-white/6 text-white' : 'bg-white border-gray-100 text-black'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
            <Image 
              src={icon}
              alt="ai icon"
              height={50}
              width={50}
            />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Download Overlay Chatbot</h3>
              <p className="mt-1 text-sm text-gray-400">Install the lightweight overlay chatbot to get BarangAI help while browsing. Works across pages and applications!</p>
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
