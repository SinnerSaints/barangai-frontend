"use client";

import { HiSearch } from "react-icons/hi";
import { useState } from "react";
import ProfileMenu from "@/components/ui/ProfileMenu";

type Props = {
  hideSearch?: boolean;
};

export default function TopBar({ hideSearch = false }: Props) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="w-full flex items-center justify-between gap-4">
      {!hideSearch && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                placeholder="Search for a course, lesson, etc."
                className="w-full bg-[#0b0b0b] text-sm text-gray-200 rounded-full px-4 py-2 pl-10 border border-transparent focus:outline-none"
              />
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <ProfileMenu compact />
      </div>
    </div>
  );
}
