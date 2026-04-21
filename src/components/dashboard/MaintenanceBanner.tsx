"use client";

import { useEffect, useState } from "react";

const warningText = "BARANGAI IS CURRENTLY UNDER ACTIVE DEVELOPMENT. YOU MAY ENCOUNTER BUGS OR UNEXPECTED DISRUPTIONS. THANK YOU FOR YOUR PATIENCE.";

export default function MaintenanceBanner() {
  // Default to true, but we'll update it on the client
  const [show, setShow] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial state from local storage
    const stored = localStorage.getItem("show_maintenance_banner");
    if (stored !== null) {
      setShow(stored === "true");
    }

    // Listen for custom event from the Admin Dashboard
    const handleToggle = () => {
      const updated = localStorage.getItem("show_maintenance_banner");
      if (updated !== null) setShow(updated === "true");
    };

    window.addEventListener("banner_toggle", handleToggle);
    return () => window.removeEventListener("banner_toggle", handleToggle);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !show) return null;

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="w-full bg-[#9DE16A] text-[#034440] py-1.5 overflow-hidden flex items-center shrink-0 z-[100] border-b border-[#9DE16A]/50 shadow-sm relative">
        <div className="w-max animate-marquee font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] cursor-default">
          <span className="mx-4">{warningText}</span>
          <span className="mx-4">{warningText}</span>
          <span className="mx-4">{warningText}</span>
          <span className="mx-4">{warningText}</span>
        </div>
      </div>
    </>
  );
}