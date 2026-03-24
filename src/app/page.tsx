"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Featured from "@/components/landing/Featured";
import ChatFeature from "@/components/landing/ChatFeature";
import DarkVeil from "@/components/ui/background/DarkVeil"; 
import { HiArrowUp } from "react-icons/hi";

// Scroll snap tuning:
// 0.00 = stop section at very top
// 0.10 = stop section 10% below top (recommended)
// 0.20 = stop section lower in viewport
const SNAP_STOP_OFFSET = 0.1;
const SNAP_DURATION = { min: 0.2, max: 0.6 };

export default function Home() {
  const auth = useAuth();
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [showTop, setShowTop] = useState(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (auth?.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [auth?.isAuthenticated, router]);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-scroll-section]");

      sections.forEach((section, index) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 48, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.2,
            ease: "power3.out",
            delay: index === 0 ? 0.1 : 0,
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              once: true,
            },
          }
        );
      });

      // Snap to the nearest section when user stops scrolling.
      ScrollTrigger.create({
        trigger: pageRef.current,
        start: "top top",
        end: "bottom bottom",
        snap: {
          snapTo: (progress) => {
            const max = ScrollTrigger.maxScroll(window) || 1;
            const offsetPx = window.innerHeight * SNAP_STOP_OFFSET;
            const points = sections.map((section) =>
              Math.max(0, (section.offsetTop - offsetPx) / max)
            );
            if (points.length === 0) return progress;
            return points.reduce((closest, point) =>
              Math.abs(point - progress) < Math.abs(closest - progress) ? point : closest
            );
          },
          duration: SNAP_DURATION,
          delay: 0.08,
          ease: "power1.inOut",
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  if (auth?.isAuthenticated) return null;

  return (
    <div ref={pageRef} className="relative w-full min-h-screen overflow-hidden">
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

      {/* Hero section (includes navbar) */}
      <section data-scroll-section>
        <Navbar />
        <Hero />
      </section>

      {/* Featured content */}
      <section data-scroll-section className="mt-6">
        <Featured />
      </section>

      {/* Chat feature */}
      <section data-scroll-section>
        <ChatFeature />
      </section>
      {/* Scroll To Top Button */}
      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-accentGreen text-black p-4 rounded-full shadow-lg hover:-translate-y-1 hover:brightness-90 transition-all duration-300 z-50"
        >
          <HiArrowUp size={24} />
        </button>
      )}
    </div>
  );
}