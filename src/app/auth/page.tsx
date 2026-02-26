"use client";

import { useState } from "react";
import bg from "@/assets/img/authBg.png";

export default function AuthPage() {
  const [active, setActive] = useState<"login" | "signup">("login");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(active === "login" ? "Logged in (demo)" : "Signed up (demo)");
  }

  const shift = active === "login" ? "0%" : "-50%";

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundImage: `url(${bg.src})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="w-full max-w-5xl p-6">
        {/* Top toggle */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActive("login")}
            className={`px-4 py-2 rounded-full ${active === "login" ? "bg-accentGreen text-black" : "bg-black/40 text-white/80"}`}
          >
            Login
          </button>
          <button
            onClick={() => setActive("signup")}
            className={`px-4 py-2 rounded-full ${active === "signup" ? "bg-accentGreen text-black" : "bg-black/40 text-white/80"}`}
          >
            Sign Up
          </button>
        </div>

        {/* Viewport */}
        <div className="relative overflow-hidden rounded-xl shadow-xl" style={{ height: 520 }}>
          <div
            className="flex w-[200%] h-full"
            style={{ transform: `translateX(${shift})`, transition: "transform 420ms cubic-bezier(.2,.9,.2,1)" }}
          >
            {/* Left - Login */}
            <div className="w-1/2 flex items-center justify-center p-8">
              <div className="bg-black/60 p-10 rounded-xl max-w-sm text-white">
                <h2 className="text-4xl font-league font-extrabold mb-6">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm opacity-80 mb-1">Email</label>
                    <input type="email" required className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm opacity-80 mb-1">Password</label>
                    <input type="password" required className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white" />
                  </div>
                  <button className="w-full mt-4 py-2 bg-[#9DE16A] text-[#034440] rounded-full font-semibold">Login</button>
                </form>
              </div>
            </div>

            {/* Right - Sign Up */}
            <div className="w-1/2 flex items-center justify-center p-8">
              <div className="bg-black/60 p-10 rounded-xl max-w-sm text-white">
                <h2 className="text-4xl font-league font-extrabold mb-6">Sign Up</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm opacity-80 mb-1">Email</label>
                    <input type="email" required className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm opacity-80 mb-1">Password</label>
                    <input type="password" required className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm opacity-80 mb-1">Confirm Password</label>
                    <input type="password" required className="w-full bg-transparent border-b border-white/20 py-2 px-1 focus:outline-none text-white" />
                  </div>
                  <button className="w-full mt-4 py-2 bg-[#9DE16A] text-[#034440] rounded-full font-semibold">Sign Up</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
