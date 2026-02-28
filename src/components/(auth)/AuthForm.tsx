"use client";

import { useState } from "react";
import bg from "@/assets/img/authBg.png";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // signup state
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sConfirm, setSConfirm] = useState("");

  const router = useRouter();
  const auth = useAuth();

                  <div>
                    <label className="text-sm opacity-80">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as "user" | "admin")}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // use selected role when logging in
      await auth.login(email, password, role);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (sPassword !== sConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await auth.signup(sEmail, sPassword);
      // auth.signup may set user; ensure logged in then redirect
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const shift = mode === "login" ? "0%" : "-50%";

  return (
    
    <div
      className="min-h-screen flex relative text-white justify-center items-center"
      style={{
        backgroundImage: `url(${bg.src})`,
        backgroundSize: "cover",
        backgroundPosition: "start",
      }}
    >
      <div className="w-full max-w-5xl p-6 z-10">
        {/* Top centered toggle */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-full ${mode === "login" ? "bg-accentGreen text-black" : "bg-black/40 text-white/80"}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`px-4 py-2 rounded-full ${mode === "signup" ? "bg-accentGreen text-black" : "bg-black/40 text-white/80"}`}
          >
            Sign Up
          </button>
        </div>

        {/* Sliding viewport */}
        <div className="relative overflow-hidden " style={{ height: 560 }}>
          <div
            className="flex w-[200%] h-full"
            style={{ transform: `translateX(${shift})`, transition: "transform 1000ms cubic-bezier(.2,.9,.2,1)" }}
          >
            {/* Panel - Login (left) */}
            <div className="w-1/2 flex items-center justify-center p-8">
              <div className="w-[420px] bg-black/60 backdrop-blur-xl p-10 rounded-2xl">
                <h2 className="text-4xl font-extrabold mb-8">Login</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="text-sm opacity-80">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 opacity-80">
                      <input type="checkbox" className="accent-[#9DE16A]" />
                      Remember me
                    </label>
                    <button type="button" className="hover:underline opacity-80">
                      Forgot your password?
                    </button>
                  </div>
                  {error && <div className="text-sm text-red-300">{error}</div>}
                  <button
                    className="w-full py-3 mt-2 bg-[#9DE16A] text-[#034440] rounded-full font-semibold hover:scale-[1.02] transition disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Login"}
                  </button>
                </form>
              </div>
            </div>

            {/* Panel - Sign Up (right) */}
            <div className="w-1/2 flex items-center justify-center p-8">
              <div className="w-[420px] bg-black/60 backdrop-blur-xl p-10 rounded-2xl">
                <h2 className="text-4xl font-extrabold mb-8">Sign Up</h2>
                <form onSubmit={handleSignup} className="space-y-6">
                  <div>
                    <label className="text-sm opacity-80">Email</label>
                    <input
                      type="email"
                      required
                      value={sEmail}
                      onChange={(e) => setSEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Password</label>
                    <input
                      type="password"
                      required
                      value={sPassword}
                      onChange={(e) => setSPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={sConfirm}
                      onChange={(e) => setSConfirm(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none text-white"
                    />
                  </div>
                  {error && <div className="text-sm text-red-300">{error}</div>}
                  <button className="w-full py-3 mt-2 bg-[#9DE16A] text-[#034440] rounded-full font-semibold hover:scale-[1.02] transition disabled:opacity-60" disabled={loading}>
                    {loading ? "Creating..." : "Sign Up"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}