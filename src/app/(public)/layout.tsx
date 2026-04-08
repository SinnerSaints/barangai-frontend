"use client"

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import DarkVeil from "@/components/ui/background/DarkVeil";
import { useEffect } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
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
      <Navbar />
      <div className="flex-1 w-full">{children}</div>
      <div className="bg-[#000000]">
        <Footer />
      </div>
    </div>
  );
}
