"use client";

import Link from "next/link";

type SettingsContentProps = {
  isDark: boolean;
  isAdmin: boolean;
  chatbotOverlayState: string | null;
  dashboardPromoHidden: boolean;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  handleSidebarToggle: () => void;
  handleChatbotOverlayReset: () => void;
  handleDashboardPromoToggle: () => void;
};

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  isDark: boolean;
};

function ToggleRow({ label, description, checked, onToggle, isDark }: ToggleRowProps) {
  return (
    <div
      className={`relative overflow-hidden flex items-start justify-between gap-4 rounded-2xl border p-4 ${
        isDark ? "border-white/10 bg-[#0c1113]/80" : "border-[#d6e5d0] bg-[#f7fbf4]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-60 ${
          isDark ? "bg-[radial-gradient(circle_at_top_right,rgba(157,225,106,0.14),transparent_45%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(3,68,64,0.10),transparent_48%)]"
        }`}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold md:text-base">{label}</p>
        <p className={`mt-1 text-xs md:text-sm ${isDark ? "text-zinc-400" : "text-[#4f5f57]"}`}>{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
          checked
            ? isDark
              ? "border-[#9DE16A]/60 bg-[#9DE16A] shadow-[0_0_18px_rgba(157,225,106,0.45)]"
              : "border-[#7fb85a] bg-[#9DE16A]"
            : isDark
              ? "border-white/20 bg-zinc-700"
              : "border-gray-300 bg-gray-200"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsContent({
  isDark,
  isAdmin,
  chatbotOverlayState,
  dashboardPromoHidden,
  sidebarCollapsed,
  toggleTheme,
  handleSidebarToggle,
  handleChatbotOverlayReset,
  handleDashboardPromoToggle,
}: SettingsContentProps) {
  return (
    <section
      className={`relative mt-6 w-full overflow-hidden rounded-3xl border p-6 shadow-xl md:p-8 ${
        isDark
          ? "border-white/10 bg-[linear-gradient(135deg,rgba(13,18,20,0.95),rgba(8,10,12,0.95))] text-white"
          : "border-[#d6e5d0] bg-[linear-gradient(135deg,#ffffff,#f7fbf4)] text-[#102018]"
      }`}
    >
      <div
        className={`pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full blur-3xl ${
          isDark ? "bg-[#9DE16A]/12" : "bg-[#9DE16A]/25"
        }`}
      />
      <div
        className={`pointer-events-none absolute -right-20 top-16 h-64 w-64 rounded-full blur-3xl ${
          isDark ? "bg-[#034440]/40" : "bg-[#034440]/12"
        }`}
      />
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
          <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-[#4f5f57]"}`}>
            Personalize your workspace and tune key system behaviors.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isDark ? "border-[#9DE16A]/35 bg-[#9DE16A]/20 text-[#9DE16A]" : "border-[#b7d8a5] bg-[#e7f6dc] text-[#034440]"
          }`}
        >
          System Preferences
        </span>
      </div>

      <div className="relative z-[1] space-y-6">
        <div className={`rounded-2xl border p-5 backdrop-blur-sm ${isDark ? "border-white/10 bg-black/25" : "border-[#d6e5d0] bg-[#fbfef8]/95"}`}>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-[#4f5f57]"}`}>
            Manage your personal information, email, and avatar.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-accentGreen px-5 py-2 text-sm font-semibold text-black transition hover:brightness-95"
          >
            Edit Profile
          </Link>
        </div>

        {isAdmin && (
          <div className={`rounded-2xl border p-5 backdrop-blur-sm ${isDark ? "border-white/10 bg-black/25" : "border-[#d6e5d0] bg-[#fbfef8]/95"}`}>
            <h2 className="text-lg font-semibold">Administration</h2>
            <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-[#4f5f57]"}`}>
              Access admin tools to manage users, approvals, and system controls.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-accentGreen px-5 py-2 text-sm font-semibold text-black transition hover:brightness-95"
            >
              Open Admin Panel
            </Link>
          </div>
        )}

        <div className={`rounded-2xl border p-5 backdrop-blur-sm ${isDark ? "border-white/10 bg-black/25" : "border-[#d6e5d0] bg-[#fbfef8]/95"}`}>
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-[#4f5f57]"}`}>Adjust your visual workspace options.</p>
          <div className="mt-4 space-y-3">
            <ToggleRow
              label="Dark Mode"
              description="Switch between light and dark interface themes."
              checked={isDark}
              onToggle={toggleTheme}
              isDark={isDark}
            />
            <ToggleRow
              label="Collapse Sidebar"
              description="Use compact navigation to free more horizontal space."
              checked={sidebarCollapsed}
              onToggle={handleSidebarToggle}
              isDark={isDark}
            />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 backdrop-blur-sm ${isDark ? "border-white/10 bg-black/25" : "border-[#d6e5d0] bg-[#fbfef8]/95"}`}>
          <h2 className="text-lg font-semibold">Notifications & Promos</h2>
          <p className={`mt-1 text-sm ${isDark ? "text-zinc-400" : "text-[#4f5f57]"}`}>
            Control in-app overlays and promotional surfaces.
          </p>

          <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div>
              <p className="text-sm font-semibold">Chatbot Download Overlay</p>
              <p className={`mt-1 text-xs md:text-sm ${isDark ? "text-zinc-400" : "text-[#4f5f57]"}`}>
                Current state: {chatbotOverlayState || "default"}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleChatbotOverlayReset}
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Reset
            </button>
          </div>

          <div className="mt-3">
            <ToggleRow
              label="Dashboard Download Promo"
              description="Toggle visibility of the dashboard download promo block."
              checked={!dashboardPromoHidden}
              onToggle={handleDashboardPromoToggle}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
