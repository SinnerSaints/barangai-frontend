"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { useTheme } from "@/context/theme";
import { BackgroundPaths } from "@/components/ui/paths";

const easeOut = [0.22, 1, 0.36, 1] as const;

function ResetPasswordFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputClass = isDark
    ? "w-full py-1.5 px-2 rounded-md border border-white/10 bg-white/5 text-[13px] outline-none transition focus:border-accentGreen/60 focus:ring-1 focus:ring-accentGreen/25"
    : "w-full py-1.5 px-2 rounded-md border border-gray-200 bg-white text-[13px] outline-none transition focus:border-black/25 focus:ring-1 focus:ring-black/10";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!uid || !token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://barangaibackend-production.up.railway.app/";
      const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;

      const res = await fetch(`${baseUrl}accounts/password-reset/complete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 3000);
      } else {
        setError(data.error || "The link may be expired or invalid.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const heroCopy = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accentGreen/95 mb-1.5" style={{ fontFamily: "'Poppins', 'Plus Jakarta Sans', sans-serif" }}>
        ACCOUNT RECOVERY
      </p>
      <div className="text-lg md:text-xl font-bold mb-2" style={{ fontFamily: "'Poppins', 'Plus Jakarta Sans', sans-serif" }}>
        Barang<span className="text-accentGreen">AI</span>
      </div>
      <h2 className="text-base md:text-lg font-extrabold leading-snug mb-1.5">
        Secure your account.
      </h2>
      <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-md">
        Enter a new, strong password below to regain access to your workspace. Make sure it's something memorable!
      </p>
    </>
  );

  const mobileHeroStrip = (
    <div className="md:hidden text-center text-white mb-2 px-1">
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-accentGreen/90" style={{ fontFamily: "'Poppins', 'Plus Jakarta Sans', sans-serif" }}>
        ACCOUNT RECOVERY
      </p>
      <p className="text-sm font-bold" style={{ fontFamily: "'Poppins', 'Plus Jakarta Sans', sans-serif" }}>
        Barang<span className="text-accentGreen">AI</span>
        <span className="font-normal text-white/75 text-xs"> · Secure your account</span>
      </p>
    </div>
  );

  return (
    <>
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: easeOut }}
      >
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-start">
          {mobileHeroStrip}
          
          <div className="hidden md:flex md:col-span-6 flex-col justify-center text-white px-1 md:pr-4 pt-0">
            <motion.div className="rounded-none border-0 bg-transparent p-0 md:py-1 text-left">
              {heroCopy}
            </motion.div>
          </div>

          <div className="md:col-span-6 w-full max-w-md mx-auto md:max-w-none md:mx-0">
            <div className={`w-full rounded-xl p-4 md:p-5 shadow-lg border flex flex-col transition-colors ${isDark ? "bg-black/80 text-white border-white/10" : "bg-white text-black border-black/[0.06]"}`}>
              <div className="flex flex-col gap-3 mb-4">
                <h2 className="text-lg font-bold tracking-tight">Create New Password</h2>
              </div>

              {success ? (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-accentGreen/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-accentGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-md font-bold">Password Updated!</h3>
                  <p className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>Redirecting you to login...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wide mb-1 opacity-90">New Password</label>
                      <input 
                        type="password" 
                        required 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className={inputClass} 
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wide mb-1 opacity-90">Confirm Password</label>
                      <input 
                        type="password" 
                        required 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className={inputClass} 
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>

                  <div className="min-h-[1.5rem]">
                    {error && <p className={`text-[11px] leading-snug ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>}
                  </div>

                  <motion.button
                    type="submit"
                    className={isDark ? "w-full py-2 rounded-full bg-accentGreen text-black text-sm font-semibold mt-2" : "w-full py-2 rounded-full bg-black text-white text-sm font-semibold mt-2"}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                  >
                    {loading ? "Updating..." : "Reset Password"}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <BackgroundPaths>
      <LayoutGroup id="reset-page">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
          <ResetPasswordFormInner />
        </Suspense>
      </LayoutGroup>
    </BackgroundPaths>
  );
}