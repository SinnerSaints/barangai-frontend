"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/theme";
import { BackgroundPaths } from "@/components/ui/paths";

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signup state
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sConfirm, setSConfirm] = useState("");
  const [sRole, setSRole] = useState<string>("CAPTAIN");
  const [sFirstName, setSFirstName] = useState<string>("");
  const [sLastName, setSLastName] = useState<string>("");

  const router = useRouter();
  const auth = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.login(email, password, firstName, lastName);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (sPassword !== sConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await auth.signup(sEmail, sPassword, sFirstName, sLastName, sRole);
      setMode("login");
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Google credential handler
  const handleCredentialResponse = async (response: any) => {
    const id_token = response?.credential;
    if (!id_token) {
      setError("Google sign-in failed: no credential.");
      return;
    }

    const tokenClaims = decodeJwtPayload(id_token);

    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/accounts/google-login/";
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.detail || "Google login failed");
        return;
      }

      if ((auth as any)?.loginWithTokens) {
        // Merge ID-token claims so we can populate first/last name even if the backend
        // returns them under different keys or doesn't include them yet.
        await (auth as any).loginWithTokens(data.access, data.refresh, { ...(tokenClaims ?? {}), ...(data.user ?? {}) });
      } else if ((auth as any)?.setTokens) {
        (auth as any).setTokens(data.access, data.refresh);
        if ((auth as any).setUser && data.user) (auth as any).setUser(data.user);
      } else {
        // Save with same keys as regular login
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("user_id", data.user.id.toString());
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role);
        localStorage.setItem("first_name", data.user.first_name || tokenClaims?.given_name || "");
        localStorage.setItem("last_name", data.user.last_name || tokenClaims?.family_name || "");
        if (data.user.avatar_url || tokenClaims?.picture) localStorage.setItem("user_avatar", data.user.avatar_url || tokenClaims?.picture);
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Network error during Google login");
    } finally {
      setLoading(false);
    }
  };

  // Load Google Identity Services
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google && (window as any).google.accounts) {
      try {
        (window as any).google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large" }
        );
      } catch (e) {}
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
          callback: handleCredentialResponse,
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large" }
        );
      }
    };
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BackgroundPaths>
      <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
        <div className="w-full max-w-6xl my-12 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left hero panel */}
          <div className="hidden md:block md:col-span-7 rounded-lg overflow-hidden">
            <div className="h-full w-full flex flex-col justify-center items-start p-12 text-white">
              <div className="mb-6">
                <div className="text-2xl font-bold">
                  Barang<span className="text-accentGreen">AI</span>
                </div>
              </div>
              <h2 className="text-4xl font-extrabold leading-tight mb-4">
                Adaptive system. Faster learning. Help with AI.
              </h2>
              <p className="text-sm opacity-80">
                From one-time seminars, long and hassle Google searching, works that could've been made easier. Our system has everything you need to learn, adapt, and provide work assistance.
              </p>
            </div>
          </div>

          {/* Right form card */}
          <div className="md:col-span-5 flex items-center">
            <div
              className={`w-full rounded-2xl p-8 shadow-lg relative flex flex-col ${isDark ? "bg-black/80 text-white" : "bg-white text-black"}`}
              style={{ minHeight: "530px" }}
            >
              {/* Mode toggle */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome Back!" : "Create an account"}</h1>
                <div className="space-x-2">
                  <button
                    onClick={() => setMode("login")}
                    className={mode === "login" ? "px-3 py-1 rounded-full bg-accentGreen text-black" : "px-3 py-1 rounded-full bg-transparent"}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={mode === "signup" ? "px-3 py-1 rounded-full bg-accentGreen text-black" : "px-3 py-1 rounded-full bg-transparent"}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Login Form */}
              {mode === "login" ? (
                <form onSubmit={handleLogin} className="flex flex-col h-full">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 opacity-80">
                        <input type="checkbox" className="accent-[#9DE16A]" />
                        Remember me
                      </label>
                      <button type="button" className="hover:underline opacity-80">Forgot your password?</button>
                    </div>

                    {error && <div className={isDark ? "text-red-300" : "text-red-600"}>{error}</div>}
                  </div>

                  <div className="mt-[140px]">
                    <button
                      className={isDark ? "w-full py-3 rounded-full bg-accentGreen text-black font-semibold" : "w-full py-3 rounded-full bg-black text-white font-semibold"}
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Login"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="flex flex-col h-full">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={sEmail}
                        onChange={(e) => setSEmail(e.target.value)}
                        className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"}
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <label className="block text-sm mb-1">First Name</label>
                        <input
                          type="text"
                          required
                          value={sFirstName}
                          onChange={(e) => setSFirstName(e.target.value)}
                          className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"}
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-sm mb-1">Last Name</label>
                        <input
                          type="text"
                          required
                          value={sLastName}
                          onChange={(e) => setSLastName(e.target.value)}
                          className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={sPassword}
                        onChange={(e) => setSPassword(e.target.value)}
                        className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={sConfirm}
                        onChange={(e) => setSConfirm(e.target.value)}
                        className={isDark ? "w-full p-3 rounded border border-white/10 bg-transparent" : "w-full p-3 rounded border border-gray-200 bg-white"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Role</label>
                      <select
                        value={sRole}
                        onChange={(e) => setSRole(e.target.value)}
                        className={isDark ? "w-full p-2 rounded border border-white/10 bg-transparent" : "w-full p-2 rounded border border-gray-200 bg-white"}
                      >
                        <option value="CAPTAIN">Barangay Captain</option>
                        <option value="OFFICIAL">Barangay Official</option>
                      </select>
                    </div>

                    {error && <div className={isDark ? "text-red-300" : "text-red-600"}>{error}</div>}
                  </div>

                  <div className="mt-[20px]">
                    <button
                      className={isDark ? "w-full py-3 rounded-full bg-accentGreen text-black font-semibold" : "w-full py-3 rounded-full bg-black text-white font-semibold"}
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Sign Up"}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-auto pt-4 text-center text-sm opacity-70">
                Or continue with
                <div id="googleSignInDiv" className="mt-3 flex justify-center"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackgroundPaths>
  );
}
