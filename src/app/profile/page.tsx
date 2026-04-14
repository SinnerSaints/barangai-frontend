"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme";
import { useAuth } from "@/context/auth";
import bgEdit from "@/assets/img/authBg.png";
import { API_BASE_URL, updateProfile } from "@/lib/auth"; 

// Helper to handle Django Media URLs vs Blob Previews
const getFullImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("blob:") || path.startsWith("http")) return path;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${path}`;
};

const getAvatarPath = (data: any) => {
  return data?.avatar || data?.avatar_url || data?.photo || data?.picture || null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const auth = useAuth();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user info
  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email") || "";
    const storedAvatar = localStorage.getItem("user_avatar");
    const storedRole = localStorage.getItem("user_role");
    const storedFirstName = localStorage.getItem("first_name") || "";
    const storedLastName = localStorage.getItem("last_name") || "";

    setUser({
      email: storedEmail,
      avatar: storedAvatar,
      role: storedRole,
      first_name: storedFirstName,
      last_name: storedLastName
    });

    setEmail(storedEmail);
    setFirstName(storedFirstName);
    setLastName(storedLastName);
    if (storedAvatar) setPreview(getFullImageUrl(storedAvatar));
  }, [auth.user]);

  // Avatar preview logic
  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); // Ensure default form submission is prevented
    if (password && password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    // ... existing logic ...
    try {
      setLoading(true);
      const data = await updateProfile({
        email,
        password: password || undefined,
        avatarFile,
        first_name,
        last_name
      });

      // Update LOCAL STORAGE so it persists on refresh
      const avatarPath = getAvatarPath(data);
      if (avatarPath) localStorage.setItem("user_avatar", avatarPath);
      if (data.email) localStorage.setItem("user_email", data.email);
      if (data.first_name) localStorage.setItem("first_name", data.first_name);
      if (data.last_name) localStorage.setItem("last_name", data.last_name);

      // Update LOCAL STATE so the UI changes immediately
      setUser({ 
        ...user, 
        email: data.email, 
        avatar: avatarPath ?? user?.avatar, // Support avatar/avatar_url/photo responses
        first_name: first_name,
        last_name: last_name
      });

      setEditMode(false);
      setStatus("Profile updated successfully ✅");
    } catch (err: any) {
      setStatus(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // DELETE ACCOUNT
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const user_id = localStorage.getItem("user_id");
      if (!token) throw new Error("Not authenticated");

      const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const res = await fetch(`${base}/accounts/users/${user_id}/delete/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Delete failed");

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/"; // Para ma redirect padung landing page after ma delete ang account.
    } catch (err: any) {
      setStatus(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-50 dark:bg-black/90">
      <div className="absolute inset-0 -z-10">
        <Image src={bgEdit} fill alt="Background" className="object-cover" priority />
      </div>

      <div
        className={`w-full max-w-lg p-8 rounded-3xl shadow-2xl backdrop-blur-md ${
          isDark
            ? "bg-black/70 text-white border border-white/10"
            : "bg-white/90 text-black border border-gray-200"
        }`}
      >
        {/* PROFILE OVERVIEW */}
        {!editMode ? (
          <>
            <div className="flex flex-col items-center space-y-4">
              {user?.avatar ? (
                <Image
                  src={getFullImageUrl(user.avatar) || ""}
                  alt="Avatar"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-2 border-accentGreen"
                  unoptimized
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">
                  No Image
                </div>
              )}
              <h2 className="text-xl font-bold">{user?.email}</h2>
              <p className="text-sm opacity-70 uppercase tracking-widest">{user?.role}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => setEditMode(true)}
                className="w-full py-3 rounded-full bg-accentGreen text-black font-semibold hover:opacity-90 transition"
              >
                Edit Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 rounded-full bg-red-600 text-white font-semibold hover:opacity-90 transition"
              >
                Delete Account
              </button>
              <button
                onClick={() => router.back()}
                className="w-full py-2 text-sm text-center opacity-70 hover:underline"
              >
                Back to Previous Page
              </button>
            </div>
          </>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleUpdate} className="space-y-4">
            <h2 className="text-xl font-bold text-center">Edit Account</h2>
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-3 rounded border ${
                isDark ? "bg-black/30 border-white/20" : "bg-white border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-accentGreen`}
              placeholder="Email"
            />

            <input
              type="first_name"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full p-3 rounded border ${
                isDark ? "bg-black/30 border-white/20" : "bg-white border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-accentGreen`}
              placeholder="First Name"
            />

            <input 
              type="last_name"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full p-3 rounded border ${
                isDark ? "bg-black/30 border-white/20" : "bg-white border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-accentGreen`}
              placeholder="Last Name"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-3 rounded border ${
                isDark ? "bg-black/30 border-white/20" : "bg-white border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-accentGreen`}
              placeholder="New Password (optional)"
            />

            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full p-3 rounded border ${
                isDark ? "bg-black/30 border-white/20" : "bg-white border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-accentGreen`}
              placeholder="Confirm New Password"
            />

            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-medium self-start">Update Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accentGreen file:text-black hover:file:bg-opacity-80"
              />
            </div>

            {preview && (
              <div className="flex justify-center py-2">
                <Image
                  src={preview}
                  alt="Avatar Preview"
                  width={100}
                  height={100}
                  className="rounded-full object-cover border-2 border-accentGreen"
                  unoptimized
                />
              </div>
            )}

            {status && (
              <p className={`text-center text-sm ${status.includes("✅") ? "text-green-500" : "text-yellow-500"}`}>
                {status}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-accentGreen text-black font-semibold hover:opacity-90 transition disabled:bg-gray-500"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setStatus(null);
                }}
                className="w-full py-2 text-sm opacity-70 hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-xl border border-gray-200 dark:border-white/10">
            <h3 className="font-bold text-lg text-center dark:text-white">Confirm Delete</h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Enter your password to permanently delete your account. This action cannot be undone.
            </p>
            <input
              type="password"
              placeholder="Your Password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full p-3 rounded border dark:bg-black/50 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm bg-gray-200 dark:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
