"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

// 1. Move the logic into a child component
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://barangaibackend-production.up.railway.app/";
    const baseUrl = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;

    try {
      const res = await fetch(`${baseUrl}accounts/password-reset/complete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });

      if (res.ok) {
        setStatus("Success! Password reset. Redirecting to login...");
        setTimeout(() => router.push("/"), 3000);
      } else {
        setStatus("Error: The link may be expired or invalid.");
      }
    } catch (err) {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 border rounded-xl shadow-lg bg-black/80 backdrop-blur-md border-white/10 text-white">
      <h1 className="text-xl font-bold mb-4">Create New Password</h1>
      <input 
        type="password" 
        placeholder="New Password"
        className="w-full p-2 rounded-md bg-white/5 border border-white/10 mb-4 outline-none focus:border-accentGreen/50"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-accentGreen text-black p-2 rounded-full font-bold hover:opacity-90 transition-opacity"
      >
        {loading ? "Updating..." : "Reset Password"}
      </button>
      {status && <p className="mt-4 text-sm text-center text-accentGreen">{status}</p>}
    </form>
  );
}

// 2. The main page component wraps it in Suspense
export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#021a1a]">
       <Suspense fallback={<div className="text-white">Loading reset form...</div>}>
         <ResetPasswordForm />
       </Suspense>
    </div>
  );
}