"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiHome, HiChat, HiBookOpen, HiClipboardList, HiChartBar, HiCog, HiMenu } from "react-icons/hi";
import ProfileMenu from "@/components/ui/ProfileMenu";

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ collapsed = false, onToggle }: Props) {
  const pathname = usePathname() || "/";
  const isControlled = typeof onToggle === "function";
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(collapsed);

  // initialize internal state from localStorage when uncontrolled
  useEffect(() => {
    if (isControlled) return;
    try {
      const v = localStorage.getItem("sidebar_collapsed");
      if (v !== null) setInternalCollapsed(v === "true");
    } catch (err) {
      // ignore
    }
  }, [isControlled]);

  // keep internalCollapsed in sync when parent-controlled prop changes
  useEffect(() => {
    if (isControlled) return;
    setInternalCollapsed(collapsed);
  }, [collapsed, isControlled]);
  const items = [
    { label: "Dashboard", href: "/dashboard", icon: HiHome },
    { label: "Chatbot", href: "/chatbot", icon: HiChat },
    { label: "Courses", href: "/courses", icon: HiBookOpen },
    { label: "Quizzes", href: "/quizzes", icon: HiClipboardList },
    { label: "Statistics", href: "/statistics", icon: HiChartBar },
    { label: "Settings", href: "/settings", icon: HiCog },
  ];

  const effectiveCollapsed = isControlled ? collapsed : internalCollapsed;

  const handleToggle = () => {
    if (isControlled) {
      onToggle && onToggle();
      return;
    }
    setInternalCollapsed((s) => {
      const next = !s;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <aside className={`bg-[#034440] text-white min-h-screen hidden md:flex flex-col p-4 gap-6 transition-[width] duration-300 ${effectiveCollapsed ? "w-20" : "w-64"}`}>
      <div className="flex items-center gap-3 px-2">
        {/* hamburger in header (replaces logo) */}
        <button onClick={handleToggle} className="text-white p-1">
          <HiMenu className="w-6 h-6" />
        </button>
            {!effectiveCollapsed && (
              <Link href="/" className="text-lg font-bold">
                Barang<span className="text-accentGreen">AI</span>
              </Link>
            )}
      </div>

      <nav className="flex-1">
        <ul className="flex flex-col gap-2 mt-6">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <li key={it.label}>
                <Link
                  href={it.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${collapsed ? "justify-center" : ""} ${!collapsed && active ? "bg-accentGreen/80" : "bg-transparent"}`}
                >
                  {/* icon: when collapsed and active, icon gets accent color; when expanded, icon/text turn white and row gets accent background */}
                  <it.icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      collapsed ? (active ? "text-accentGreen scale-110" : "text-[#AFAFAF]") : (active ? "text-white" : "text-[#AFAFAF]")
                    }`}
                  />
                  {!collapsed && <span className={`text-sm ${active ? "text-white" : "text-[#AFAFAF]"}`}>{it.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
