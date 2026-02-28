"use client";

import { useState } from "react";
import Image from "next/image";
import bg from "@/assets/img/authBg.png";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/theme";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // role removed from login; signup will collect role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // signup state
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sConfirm, setSConfirm] = useState("");
  const [sRole, setSRole] = useState<string>("CAPTAIN");

  const router = useRouter();
  const auth = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  try {
  // login should not pass a role (role is only for signup)
  await auth.login(email, password);
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
      await auth.signup(sEmail, sPassword, sRole);
      // auth.signup may set user; ensure logged in then redirect
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* background image full-bleed */}
      <div className="absolute inset-0 -z-10">
        <Image src={bg} alt="background" fill className="object-cover" />
      </div>

      <div className="w-full max-w-6xl mx-auto my-12 grid grid-cols-1 md:grid-cols-12 gap-6 px-4">
        {/* Left hero panel (visual) */}
        <div className="hidden md:block md:col-span-7 rounded-lg overflow-hidden">
          <div className="h-full w-full flex flex-col justify-center items-start p-12 text-white">
            <div className="mb-6">
              <div className="text-2xl font-bold">Barang<span className="text-accentGreen">AI</span></div>
            </div>

            <h2 className="text-4xl font-extrabold leading-tight mb-4">Adaptive system. Faster learning. Help with AI.</h2>
            <p className="text-sm opacity-80">From one time seminars, long and hassle google searching, works that could've been made easier. Our system has everything you need to learn, adapt, and provide work assistance.</p>
          </div>
        </div>

        {/* Right form card */}
        <div className="md:col-span-5 flex items-center">
          <div
            className={`w-full rounded-2xl p-8 shadow-lg ${isDark ? "bg-black/80 text-white" : "bg-white text-black"}`}
            style={{ height: "530px" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">
                {mode === 'login' ? 'Welcome Back!' : 'Create an account'}
              </h1>
              <div className="space-x-2">
                <button onClick={() => setMode('login')} className={mode==='login' ? 'px-3 py-1 rounded-full bg-accentGreen text-black' : 'px-3 py-1 rounded-full bg-transparent'}>Login</button>
                <button onClick={() => setMode('signup')} className={mode==='signup' ? 'px-3 py-1 rounded-full bg-accentGreen text-black' : 'px-3 py-1 rounded-full bg-transparent'}>Sign Up</button>
              </div>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col h-full">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={isDark ? 'w-full p-3 rounded border border-white/10 bg-transparent' : 'w-full p-3 rounded border border-gray-200 bg-white'} />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Password</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={isDark ? 'w-full p-3 rounded border border-white/10 bg-transparent' : 'w-full p-3 rounded border border-gray-200 bg-white'} />
                  </div>

                  {/* role selection removed from login */}

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 opacity-80">
                      <input type="checkbox" className="accent-[#9DE16A]" />
                      Remember me
                    </label>
                    <button type="button" className="hover:underline opacity-80">Forgot your password?</button>
                  </div>

                  {error && <div className={isDark ? 'text-red-300' : 'text-red-600'}>{error}</div>}
                </div>

                <div className="mt-[140px]">
                  <button className={isDark ? ' w-full py-3 rounded-full bg-accentGreen text-black font-semibold' : 'w-full py-3 rounded-full bg-black text-white font-semibold'} disabled={loading}>
                    {loading ? 'Signing in...' : 'Login'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="flex flex-col h-full">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input type="email" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} className={isDark ? 'w-full p-3 rounded border border-white/10 bg-transparent' : 'w-full p-3 rounded border border-gray-200 bg-white'} />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Password</label>
                    <input type="password" required value={sPassword} onChange={(e) => setSPassword(e.target.value)} className={isDark ? 'w-full p-3 rounded border border-white/10 bg-transparent' : 'w-full p-3 rounded border border-gray-200 bg-white'} />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Confirm Password</label>
                    <input type="password" required value={sConfirm} onChange={(e) => setSConfirm(e.target.value)} className={isDark ? 'w-full p-3 rounded border border-white/10 bg-transparent' : 'w-full p-3 rounded border border-gray-200 bg-white'} />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Role</label>
                    <select value={sRole} onChange={(e) => setSRole(e.target.value)} className={isDark ? 'w-full p-2 rounded border border-white/10 bg-transparent' : 'w-full p-2 rounded border border-gray-200 bg-white'}>
                      <option value="CAPTAIN">Barangay Captain</option>
                      <option value="OFFICIALS">Barangay Official</option>
                    </select>
                  </div>

                  {error && <div className={isDark ? 'text-red-300' : 'text-red-600'}>{error}</div>}
                </div>

                <div className="mt-[20px]">
                  <button className={isDark ? 'w-full py-3 rounded-full bg-accentGreen text-black font-semibold' : 'w-full py-3 rounded-full bg-black text-white font-semibold'} disabled={loading}>
                    {loading ? 'Creating...' : 'Sign Up'}
                  </button>
                </div>
              </form>
            )}

            <div className="-mt-16 text-center text-sm opacity-70">Or continue with <a href="#" className="text-accentGreen">Google</a></div>
          </div>
        </div>
      </div>
    </div>
  );
}