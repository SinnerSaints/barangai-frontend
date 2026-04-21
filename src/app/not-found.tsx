"use client";

import { useRouter } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { useTheme } from "@/context/theme";
import { BackgroundPaths } from "@/components/ui/paths";

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function NotFoundPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <BackgroundPaths>
      <LayoutGroup id="not-found-page">
        {/* FLOATING THEME TOGGLE (Top Right) */}
        <motion.div
          className="absolute top-4 right-4 md:top-6 md:right-8 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: easeOut }}
        >
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="group inline-flex items-center gap-2 rounded-full px-2 py-1 transition"
          >
            <span
              className={`relative inline-flex h-9 w-20 items-center rounded-full border px-1 transition ${
                isDark ? "border-[#2f3a2f] bg-[#034440]" : "border-[#7fb85a] bg-[#9DE16A]"
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
          </button>
        </motion.div>

        <motion.div
          className="min-h-[100dvh] flex items-center justify-center relative z-10 px-3 py-4 md:px-4 md:py-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <div className="w-full max-w-lg mx-auto text-center">
            <div className={`w-full rounded-2xl p-8 md:p-12 shadow-2xl border backdrop-blur-sm flex flex-col items-center transition-colors ${isDark ? "bg-black/80 text-white border-white/10" : "bg-white/90 text-black border-black/[0.06]"}`}>
              
              <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-accentGreen to-teal-700 tracking-tighter mb-2">
                404
              </h1>
              
              <div className="text-xl md:text-2xl font-bold mb-4" style={{ fontFamily: "'Poppins', 'Plus Jakarta Sans', sans-serif" }}>
                Lost in the <span className="text-accentGreen">BarangAI?</span>
              </div>
              
              <p className={`text-sm md:text-base mb-8 max-w-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                The page you are looking for doesn't exist, has been moved, or you don't have access to it.
              </p>

              <motion.button
                onClick={() => router.push("/")}
                className={isDark ? "w-full max-w-xs py-3 rounded-full bg-accentGreen text-black text-sm font-bold shadow-lg shadow-accentGreen/20" : "w-full max-w-xs py-3 rounded-full bg-black text-white text-sm font-bold shadow-lg"}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Return to Login
              </motion.button>
              
            </div>
          </div>
        </motion.div>
      </LayoutGroup>
    </BackgroundPaths>
  );
}