"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Featured from "@/components/landing/Featured";
import ChatFeature from "@/components/landing/ChatFeature";

export default function Home() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // if user is authenticated redirect to dashboard
    if (auth?.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [auth?.isAuthenticated, router]);

  // show landing page for unauthenticated users
  if (auth?.isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <Hero />
      <Featured />
      <ChatFeature />
    </>
  );
}