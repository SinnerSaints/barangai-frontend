"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Featured from "@/components/landing/Featured";
import ChatFeature from "@/components/landing/ChatFeature";
import DarkVeil from "@/components/ui/background/DarkVeil"; 

export default function Home() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth?.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [auth?.isAuthenticated, router]);

  if (auth?.isAuthenticated) return null;

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* DarkVeil background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <DarkVeil
          hueShift={51}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={3}
        />
      </div>

      {/* Page content */}
      <Navbar />

      {/* Hero section */}
      <Hero />

      {/* Featured content */}
      <Featured />

      {/* Chat feature */}
      <ChatFeature />
    </div>
  );
}