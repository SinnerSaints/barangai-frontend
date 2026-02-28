"use client";

import { HiSearch, HiSun, HiMoon } from "react-icons/hi";
import { useState } from "react";
import ProfileMenu from "@/components/ui/ProfileMenu";
import { useTheme } from "@/context/theme";

type Props = {
  hideSearch?: boolean;
};

export default function TopBar({ hideSearch = false }: Props) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="w-full flex items-center justify-between gap-4">
      {!hideSearch && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                placeholder="Search for a course, lesson, etc."
                className={isDark ? "w-full bg-[#0b0b0b] text-sm text-gray-200 rounded-full px-4 py-2 pl-10 border border-transparent focus:outline-none" : "w-full bg-white/70 text-sm text-gray-800 rounded-full px-4 py-2 pl-10 border border-transparent focus:outline-none"}
              />
              <HiSearch className={isDark ? "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" : "absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle theme"
          onClick={toggle}
          className={isDark ? "hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 transition" : "hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/80 border border-black/10 text-black/90 hover:brightness-95 transition"}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <HiMoon className="w-4 h-4" /> : <HiSun className="w-4 h-4" />}
        </button>
        <ProfileMenu compact />
      </div>
    </div>
  );
}
