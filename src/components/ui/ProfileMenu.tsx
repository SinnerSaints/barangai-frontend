"use client";

import { useState, useEffect, useRef } from "react";
import { HiPencil, HiCog, HiLogout } from "react-icons/hi";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type Props = {
  size?: number; // avatar size in px
  dropdownWidth?: number;
  compact?: boolean; // render smaller avatar (for topbar)
};

export default function ProfileMenu({ size = 40, dropdownWidth = 176, compact = false }: Props) {
  const auth = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [stylePos, setStylePos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const avatarUrl = (() => {
    if (typeof window !== "undefined") {
      const a = localStorage.getItem("user_avatar");
      const email = localStorage.getItem("user_email") || "";
      if (a) return a;
      if (email) return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=9DE16A&color=034440&rounded=true&size=128`;
    }
    return null;
  })();

  useEffect(() => {
    if (!open || !avatarRef.current) {
      setStylePos(null);
      return;
    }
    const rect = avatarRef.current.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.right + window.scrollX - dropdownWidth;
    setStylePos({ top, left });
    // small mount delay to allow CSS animation
    setMounted(false);
    requestAnimationFrame(() => setMounted(true));
  }, [open, dropdownWidth]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (avatarRef.current && avatarRef.current.contains(t)) return;
      if (dropdownRef.current && dropdownRef.current.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const doLogout = () => {
    setOpen(false);
    auth.logout();
    router.push("/");
  };

  return (
    <div className="relative">
      <button
        ref={avatarRef}
        onClick={() => setOpen((s) => !s)}
        style={{ width: size, height: size }}
        className={`rounded-full overflow-true border-2 border-white/30 bg-white/10 flex items-center justify-center ${compact ? "w-8 h-8" : ""}`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="profile" className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-sm">{(auth.user?.email || "?").charAt(0).toUpperCase()}</span>
        )}
      </button>

      {typeof document !== "undefined" && open && stylePos
        ? createPortal(
            <div
              ref={dropdownRef}
              style={{ position: "absolute", top: stylePos.top, left: stylePos.left, width: dropdownWidth }}
              className={`bg-white/95 text-black rounded-md shadow-lg overflow-true z-50 transform transition-all duration-150 ease-out ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <button
                className="w-full text-left px-4 py-2 hover:bg-black/5 flex items-center"
                onClick={() => {
                  setOpen(false);
                  router.push("/profile");
                }}
              >
                <HiPencil className="inline-block mr-2" />
                Edit Profile
              </button>

              <button
                className="w-full text-left px-4 py-2 hover:bg-black/5 flex items-center"
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
              >
                <HiCog className="inline-block mr-2" />
                Settings
              </button>

              <button className="w-full text-left px-4 py-2 hover:bg-black/5 flex items-center" onClick={doLogout}>
                <HiLogout className="inline-block mr-2" />
                Logout
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
