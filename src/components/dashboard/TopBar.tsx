"use client";

import { HiSearch } from "react-icons/hi";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/context/theme";

// Safely import the ProfileMenu only on the client side to prevent Vercel SSR crashes
const ProfileMenu = dynamic(() => import("@/components/ui/ProfileMenu"), {
  ssr: false,
});

type Props = {
  hideSearch?: boolean;
  // controlled search value (optional). If provided, TopBar will act as a controlled input.
  searchValue?: string;
  // called when the search input changes
  onSearch?: (val: string) => void;
};

export default function TopBar({ hideSearch = false, searchValue, onSearch }: Props) {
  const [internalQuery, setInternalQuery] = useState("");
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const value = typeof searchValue === "string" ? searchValue : internalQuery;
  const handleChange = (v: string) => {
    if (onSearch) onSearch(v);
    else setInternalQuery(v);
  };

  return (
    <div className="w-full">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 py-2">
        {/* left - reserved for title/controls (keeps layout balanced) */}
        <div className="flex items-center gap-4 min-w-0">
          {/* small placeholder to keep the left edge visually aligned with content */}
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate hidden sm:block">&nbsp;</div>
        </div>

        {/* center - search (compact, not full-bleed) */}
        {!hideSearch && (
          <div className="flex-1 max-w-[640px] w-full">
            <div className="relative">
              <input
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search courses, lessons..."
                className={isDark ? "w-full bg-[#0b0b0b] text-sm text-gray-200 rounded-full px-4 py-2 pl-10 border border-transparent focus:outline-none" : "w-full bg-white/90 text-sm text-gray-800 rounded-full px-4 py-2 pl-10 border border-transparent focus:outline-none"}
              />
              <HiSearch className={isDark ? "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" : "absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"} />
            </div>
          </div>
        )}

        {/* right - actions */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="group inline-flex items-center gap-2 rounded-full px-2 py-1 transition"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span
              className={`text-sm font-semibold transition ${
                isDark ? "text-zinc-400 group-hover:text-zinc-200" : "text-[#1f2a44]"
              }`}
            >
              Light
            </span>
            <span
              className={`relative inline-flex h-9 w-20 items-center rounded-full border px-1 transition ${
                isDark
                  ? "border-[#2f3a2f] bg-[#034440]"
                  : "border-[#7fb85a] bg-[#9DE16A]"
              }`}
            >
              <span
                className={`h-7 w-7 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-transform duration-300 ${
                  isDark ? "translate-x-10 bg-[#9DE16A]" : "translate-x-0 bg-white"
                }`}
              />
              <span className="pointer-events-none absolute right-4 top-2 h-1.5 w-1.5 rounded-full bg-white/80" />
              <span className="pointer-events-none absolute right-2.5 top-4 h-1.5 w-1.5 rounded-full bg-white/60" />
            </span>
            <span
              className={`text-sm font-semibold transition ${
                isDark ? "text-[#9DE16A]" : "text-zinc-400 group-hover:text-zinc-600"
              }`}
            >
              Dark
            </span>
          </button>
          <ProfileMenu compact />
        </div>
      </div>
    </div>
  );
}