"use client";

import { HiSearch, HiSun, HiMoon } from "react-icons/hi";
import { useState } from "react";
import ProfileMenu from "@/components/ui/ProfileMenu";
import { useTheme } from "@/context/theme";

type Props = {
  hideSearch?: boolean;
  // controlled search value (optional). If provided, TopBar will act as a controlled input.
  searchValue?: string;
  // called when the search input changes
  onSearch?: (val: string) => void;
};

export default function TopBar({ hideSearch = false, searchValue, onSearch }: Props) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
            className={isDark ? "inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 transition" : "inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-black/10 text-black/90 hover:brightness-95 transition"}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <HiMoon className="w-4 h-4" /> : <HiSun className="w-4 h-4" />}
          </button>
          <ProfileMenu compact />
        </div>
      </div>
    </div>
  );
}
