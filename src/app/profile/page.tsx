"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";

export default function ProfilePage() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-start justify-center py-16 px-4 bg-transparent">
      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-md rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        <div className="flex gap-8">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-black/20 flex items-center justify-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{(auth.user?.email || "?").charAt(0).toUpperCase()}</span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1">
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className="w-full p-2 rounded bg-black/30 mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />

            <label className="block text-sm mb-1">New password</label>
            <input type="password" className="w-full p-2 rounded bg-black/30 mb-4" value={password} onChange={(e) => setPassword(e.target.value)} />

            <label className="block text-sm mb-1">Confirm password</label>
            <input type="password" className="w-full p-2 rounded bg-black/30 mb-4" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

            <label className="block text-sm mb-1">Profile picture</label>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="mb-4" />

            {status && <div className="mb-4 text-sm text-yellow-200">{status}</div>}

            <div className="flex gap-4">
              <button className="px-4 py-2 bg-accentGreen text-black rounded" type="submit">Save</button>
              <button className="px-4 py-2 bg-white/5 text-white rounded" type="button" onClick={() => { setAvatarFile(null); setPreview(localStorage.getItem('user_avatar') || null); }}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
