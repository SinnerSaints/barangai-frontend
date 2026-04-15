"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import Hero from "@/components/landing/Hero";
import Featured from "@/components/landing/Featured";
import ChatFeature from "@/components/landing/ChatFeature";
import { HiArrowUp } from "react-icons/hi";

export default function Home() {
  const auth = useAuth();
  const router = useRouter();
  const [showTop, setShowTop] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Handle the "Scroll to Top" button visibility
  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ensure scroll starts at top on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (auth?.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [auth?.isAuthenticated, router]);

  if (auth?.isAuthenticated) return null;

  return (
    <div className="relative w-full min-h-screen">
      {/* Standard Sections without GSAP data-attributes */}
      <section>
        <Hero />
      </section>

      <section>
        <Featured />
      </section>

      <section className="mt-[300px]">
        <ChatFeature />
      </section>

      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-accentGreen text-black p-4 rounded-full shadow-lg hover:-translate-y-1 hover:brightness-90 transition-all duration-300 z-50"
          aria-label="Scroll to top"
        >
          <HiArrowUp size={24} />
        </button>
      )}
    </div>
  );
}