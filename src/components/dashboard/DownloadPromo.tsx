"use client";

import React from "react";
import { Download, Sparkles } from "lucide-react";
import { useTheme } from "@/context/theme";
import Image from "next/image";
import icon from "@/assets/img/icon.png";

export default function DownloadPromo() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const downloadUrl = "https://github.com/SinnerSaints/barangai-overlay-app/releases/download/v1.1.0/BarangAI-v1.1.0.exe";

  return (
    <section 
      className={`group relative w-full overflow-hidden rounded-[2rem] p-6 mb-8 border shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
        isDark 
          ? "bg-[#1A322D]/40 border-[#B4ED7C]/20 backdrop-blur-xl" 
          : "bg-gradient-to-br from-[#E2F6C8]/40 to-white border-[#5A9B29]/20 backdrop-blur-xl"
      }`}
    >
      {/* --- FULL CARD SHINE EFFECT --- */}
      <div className="absolute top-0 -left-[150%] w-[150%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 group-hover:translate-x-[200%] transition-transform duration-[1500ms] ease-in-out pointer-events-none z-50" />

      {/* Ambient Glowing Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-60 ${isDark ? "bg-[#B4ED7C]/20" : "bg-[#5A9B29]/10"}`} />
        <div className={`absolute -bottom-32 -right-10 w-80 h-80 rounded-full blur-[80px] opacity-60 ${isDark ? "bg-[#5A9B29]/20" : "bg-[#B4ED7C]/40"}`} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">
        
        {/* App Icon Container (App Store Style) */}
        <div className="shrink-0 relative">
          <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg border z-10 ${
            isDark ? "bg-white/10 border-white/20" : "bg-white border-[#5A9B29]/20"
          }`}>
            <Image 
              src={icon}
              alt="BarangAI App Icon"
              width={64}
              height={64}
              className="w-10 h-10 object-contain drop-shadow-md"
            />
          </div>
          {/* Sparkle Badge */}
          <div className={`absolute -top-2 -right-2 p-1 rounded-full z-20 ${isDark ? "bg-[#1A322D] text-[#B4ED7C]" : "bg-white text-[#5A9B29]"}`}>
            <Sparkles size={16} className="animate-pulse" fill="currentColor" />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className={`text-xl font-extrabold tracking-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}>
              BarangAI Desktop Overlay
            </h3>
            <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              isDark ? "bg-[#B4ED7C]/20 text-[#B4ED7C]" : "bg-[#5A9B29]/10 text-[#5A9B29]"
            }`}>
              Install Now!
            </span>
          </div>
          <p className={`text-sm leading-relaxed max-w-3xl ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
            Get instant assistance, fast community resources, and workflow help directly on your desktop without leaving your current window.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
          
          {/* Glossy Download Button */}
          <a 
            href={downloadUrl} 
            target="_blank" 
            rel="noreferrer" 
            className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold overflow-hidden shadow-lg transition-transform duration-300 active:scale-95 ${
              isDark 
                ? "bg-[#B4ED7C] text-black shadow-[#B4ED7C]/20" 
                : "bg-[#5A9B29] text-white shadow-[#5A9B29]/30"
            }`}
          >
            <Download size={18} className="relative z-10" />
            <span className="relative z-10">Download Now</span>
          </a>

        </div>
      </div>
    </section>
  );
}