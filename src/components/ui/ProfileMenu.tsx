"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HiPencil, HiCog, HiLogout, HiX } from "react-icons/hi";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/theme";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/auth";
import { gsap } from "gsap";

// Helper to handle Django Media URLs vs Blob Previews vs Full URLs
const getFullImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("blob:") || path.startsWith("http")) return path;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${path}`;
};

type Props = {
  size?: number; // avatar size in px
  dropdownWidth?: number;
  compact?: boolean; // render smaller avatar (for topbar)
};

export default function ProfileMenu({ size = 40, dropdownWidth = 176, compact = false }: Props) {
  const auth = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  const avatarUrl = (() => {
    if (typeof window === "undefined") return null;

    // Prioritize auth context, then fallback to localStorage
    const avatarPath = auth.user?.avatar || localStorage.getItem("user_avatar");
    if (avatarPath) {
      return getFullImageUrl(avatarPath);
    }

    // Fallback to ui-avatars if no avatar is found
    const email = auth.user?.email || localStorage.getItem("user_email");
    if (email) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=9DE16A&color=034440&rounded=true&size=128`;
    }

    return null;
  })();

  const user = auth.user as
    | {
        email?: string;
        first_name?: string;
        last_name?: string;
        full_name?: string;
        name?: string;
        username?: string;
      }
    | null;
  const userEmail = user?.email || localStorage.getItem("user_email") || "";
  const userName =
    user?.full_name ||
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    (userEmail ? userEmail.split("@")[0] : "User");

  const isDark = theme === "dark";
  const palette = isDark
    ? {
        surface: "#0f1218",
        fg: "#e5edf7",
        fgSubtle: "#a8b6c9",
        border: "#263041",
        muted: "#161d28",
        accent: "#9de16a",
        danger: "#ff7272",
        layer1: "#1f2f24",
        layer2: "#034440",
      }
    : {
        surface: "#f8fbff",
        fg: "#0f172a",
        fgSubtle: "#475569",
        border: "#cfe4c8",
        muted: "#edf7e8",
        accent: "#034440",
        danger: "#c92020",
        layer1: "#cde8ba",
        layer2: "#9de16a",
      };

  useLayoutEffect(() => {
    if (!menuMounted) return;
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const preLayers = preLayersRef.current
        ? (Array.from(preLayersRef.current.querySelectorAll(".pm-prelayer")) as HTMLElement[])
        : [];
      preLayerElsRef.current = preLayers;

      gsap.set([panel, ...preLayers], { xPercent: 100, opacity: 1 });
      const labels = Array.from(panel.querySelectorAll(".pm-item-label")) as HTMLElement[];
      if (labels.length) gsap.set(labels, { yPercent: 120, rotate: 8 });
    }, wrapperRef);

    return () => ctx.revert();
  }, [menuMounted]);

  const openMenu = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setMenuMounted(true);
  }, []);

  useEffect(() => {
    if (!menuMounted || !open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const layers = preLayerElsRef.current;
    const labels = Array.from(panel.querySelectorAll(".pm-item-label")) as HTMLElement[];

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const tl = gsap.timeline({
      onComplete: () => {
        busyRef.current = false;
      },
    });
    layers.forEach((layer, i) => {
      tl.to(layer, { xPercent: 0, duration: 0.35, ease: "power4.out" }, i * 0.05);
    });
    tl.to(panel, { xPercent: 0, duration: 0.45, ease: "power4.out" }, 0.08);
    if (labels.length) {
      tl.to(
        labels,
        { yPercent: 0, rotate: 0, duration: 0.42, ease: "power3.out", stagger: 0.05 },
        0.16
      );
    }
    openTlRef.current = tl;
  }, [menuMounted, open]);

  const closeMenu = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) {
      setOpen(false);
      setMenuMounted(false);
      return;
    }
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const all = [...preLayerElsRef.current, panel];
    closeTweenRef.current = gsap.to(all, {
      xPercent: 100,
      duration: 0.24,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        setOpen(false);
        setMenuMounted(false);
        busyRef.current = false;
      },
    });
  }, []);

  useEffect(() => {
    if (!open || !menuMounted) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (avatarRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      closeMenu();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [closeMenu, menuMounted, open]);

  const doLogout = () => {
    closeMenu();
    auth.logout();
    router.push("/");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={avatarRef}
        onClick={() => {
          if (open) {
            closeMenu();
            return;
          }
          setOpen(true);
          openMenu();
        }}
        style={{ width: size, height: size }}
        className={`rounded-full overflow-hidden border-2 border-white/30 bg-white/10 flex items-center justify-center ${compact ? "w-8 h-8" : ""}`}
        aria-label={open ? "Close profile menu" : "Open profile menu"}
        aria-expanded={open}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="profile" className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-sm">{(auth.user?.email || "?").charAt(0).toUpperCase()}</span>
        )}
      </button>

      {menuMounted && (
        <>
          <div ref={preLayersRef} className="pointer-events-none fixed inset-y-0 right-0 z-[59]" aria-hidden={!open}>
            <div
              className="pm-prelayer absolute inset-y-0 right-0 w-[280px] max-w-[85vw]"
              style={{ backgroundColor: palette.layer1 }}
            />
            <div
              className="pm-prelayer absolute inset-y-0 right-0 w-[280px] max-w-[85vw]"
              style={{ backgroundColor: palette.layer2 }}
            />
          </div>

          <aside
            ref={panelRef}
            aria-hidden={!open}
            className="fixed inset-y-0 right-0 z-[60] w-[280px] max-w-[85vw] px-4 pb-4 pt-20 shadow-2xl"
            style={{
              width: Math.max(260, Math.min(dropdownWidth + 90, 320)),
              backgroundColor: palette.surface,
              color: palette.fg,
            }}
          >
            <button
              type="button"
              onClick={closeMenu}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full hover:brightness-95"
              style={{
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.muted,
                color: palette.fg,
              }}
              aria-label="Close profile menu"
            >
              <HiX className="text-lg" />
            </button>
            <div className="flex h-full flex-col gap-2">
              <div
                className="mb-3 flex items-center gap-3 rounded-lg p-3"
                style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.muted }}
              >
                <div
                  className="h-12 w-12 overflow-hidden rounded-full bg-white/10"
                  style={{ border: `1px solid ${palette.border}` }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-semibold">
                      {(userEmail || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-wide" style={{ color: palette.fg }}>
                    {userName}
                  </p>
                  <p className="truncate text-xs" style={{ color: palette.fgSubtle }}>
                    {userEmail || "No email available"}
                  </p>
                </div>
              </div>

              <button
                className="pm-item-label flex items-center gap-2 rounded-md px-2 py-2 text-left text-base font-semibold uppercase tracking-wide"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.muted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => {
                  closeMenu();
                  router.push("/profile");
                }}
              >
                <HiPencil className="text-lg" style={{ color: palette.accent }} />
                Edit Profile
              </button>

              <button
                className="pm-item-label flex items-center gap-2 rounded-md px-2 py-2 text-left text-base font-semibold uppercase tracking-wide"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.muted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => {
                  closeMenu();
                  router.push("/settings");
                }}
              >
                <HiCog className="text-lg" style={{ color: palette.accent }} />
                Settings
              </button>

              <button
                className="pm-item-label mt-auto flex items-center gap-2 rounded-md px-2 py-2 text-left text-base font-semibold uppercase tracking-wide"
                style={{ color: palette.danger }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.muted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={doLogout}
              >
                <HiLogout className="text-lg" />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
