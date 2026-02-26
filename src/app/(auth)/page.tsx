"use client";

import { useState } from "react";
import bg from "@/assets/img/authBg.png";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(mode === "login" ? "Logged in (demo)" : "Signed up (demo)");
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundImage: `url(${bg.src})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Left Login Panel */}
      <div className="hidden md:flex w-1/2 items-center justify-center">
        <div className="bg-black/50 p-10 rounded-xl max-w-sm text-white shadow-xl">
          <h2 className="text-4xl font-league font-extrabold mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm opacity-80 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white"
              />
            </div>
            <div>
              <label className="block text-sm opacity-80 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white"
              />
            </div>
            <button className="w-full mt-4 py-2 bg-[#9DE16A] text-[#034440] rounded-full font-semibold">
              Login
            </button>
          </form>
        </div>
      </div>

      {/* Right SignUp Panel */}
      <div className="flex-1 flex items-center justify-center md:justify-end p-8">
        <div className="bg-black/50 p-10 rounded-xl max-w-sm text-white shadow-xl">
          <h2 className="text-4xl font-league font-extrabold mb-6">Sign Up</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm opacity-80 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white"
              />
            </div>
            <div>
              <label className="block text-sm opacity-80 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white"
              />
            </div>
            <div>
              <label className="block text-sm opacity-80 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white"
              />
            </div>
            <button className="w-full mt-4 py-2 bg-[#9DE16A] text-[#034440] rounded-full font-semibold">
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}