"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";
import bgEdit from "@/assets/img/authBg.png";

export default function ProfilePage() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  useEffect(() => {
    const e = auth.user?.email || localStorage.getItem("user_email") || "";
    setEmail(e);
    const av = localStorage.getItem("user_avatar");
    if (av) setPreview(av);
  }, [auth.user]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (password && password !== confirm) {
      setStatus("Passwords do not match");
      return;
    }
    try {
      await auth.updateProfile({ email: email || undefined, password: password || undefined, avatarFile });
      setStatus("Profile updated");
      setPassword("");
      setConfirm("");
      setAvatarFile(null);
    } catch (err: any) {
      setStatus(err?.message || "Update failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      {/* background image full bleed */}
      <div className="absolute inset-0 -z-10">
        <Image 
            src={bgEdit} 
            fill 
            className="object-cover" 
            alt="background"
        />
      </div>

      <div className="w-full max-w-6xl mx-auto justify-center my-12 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Right form card */}
        <div className="md:col-span-5 flex items-center">
          <div className={isDark ? "w-full bg-black/80 text-white rounded-2xl p-8 shadow-lg" : "w-full bg-white text-black rounded-2xl p-8 shadow-lg"}>
            <h1 className="text-2xl font-bold mb-2">Update your details here</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"} />
              </div>

              <div>
                <label className="block text-sm mb-1">New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"} />
              </div>

              <div>
                <label className="block text-sm mb-1">Confirm password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"} />
              </div>

              <div>
                <label className="block text-sm mb-1">Profile picture</label>
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="w-full" />
              </div>

              {status && <div className={isDark ? "text-yellow-200" : "text-yellow-700"}>{status}</div>}

              <div>
                <button type="submit" className={isDark ? "w-full py-3 rounded-full bg-accentGreen text-black font-semibold" : "w-full py-3 rounded-full bg-black text-white font-semibold"}>Save</button>
              </div>

              <div className="text-center text-sm opacity-70 mt-2">
                Want to go back?{" "}
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-accentGreen hover:underline"
                >
                  Back to previous page
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
