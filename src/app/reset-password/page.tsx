"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // This points to your PasswordResetCompleteView in Django
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    
    const res = await fetch(`${API_URL}accounts/password-reset/complete/`, {
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
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="p-8 border rounded-lg shadow-md bg-white">
        <h1 className="text-xl font-bold mb-4 text-black">Create New Password</h1>
        <input 
          type="password" 
          placeholder="New Password"
          className="w-full p-2 border rounded mb-4 text-black"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-black text-white p-2 rounded">
          Reset Password
        </button>
        {status && <p className="mt-4 text-sm text-center text-blue-600">{status}</p>}
      </form>
    </div>
  );
}