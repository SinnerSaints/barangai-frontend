"use client";

import { useTheme } from "@/context/theme";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import Image from "next/image";
import { useEffect } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return (
    <>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image 
          src={isDark ? chatBgDark : chatBgLight} 
          alt="background" 
          fill 
          className="object-cover opacity-95" 
          priority
        />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </>
  );
}