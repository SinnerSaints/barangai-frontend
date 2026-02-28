"use client";

import Image from "next/image";
import TopBar from "@/components/dashboard/TopBar";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

type Stat = { id: number; label: string; value: number };

export default function StatisticsClient({ stats }: { stats: Stat[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
      <div className="absolute inset-0 z-0">
        <Image src={isDark ? chatBgDark : chatBgLight} alt="background" fill className="object-cover opacity-95" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <TopBar />
        <h1 className="text-2xl font-bold mt-6">Statistics</h1>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.id} className={isDark ? "bg-white/5 rounded p-4" : "bg-white/90 rounded p-4"}>
              <div className={isDark ? "text-sm text-gray-400" : "text-sm text-gray-700"}>{s.label}</div>
              <div className={isDark ? "text-2xl font-bold mt-2 text-white" : "text-2xl font-bold mt-2 text-gray-900"}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className={isDark ? "mt-6 bg-white/5 p-4 rounded" : "mt-6 bg-white/90 p-4 rounded"}>Placeholder charts / visuals (add charting library if needed)</div>
      </div>
    </main>
  );
}
