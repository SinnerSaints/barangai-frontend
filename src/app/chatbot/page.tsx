"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import circle from "@/assets/img/eclipse.png";
import { useTheme } from "@/context/theme";

export default function ChatbotPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <BackgroundImage />
        <div className="max-w-6xl mx-auto relative z-10">
          <TopBar hideSearch />

          {/* Chat UI (clean design) */}
          <ChatSection />
        </div>
      </main>
    </div>
  );
}

function ChatSection() {
  const [entered, setEntered] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  const headingClass = isDark ? "text-center text-2xl md:text-3xl font-semibold text-white" : "text-center text-2xl md:text-3xl font-semibold text-black";
  const paraClass = isDark ? "text-center text-sm text-gray-300" : "text-center text-sm text-[#8F8F8F]";
  const btnClass = isDark ? "stagger-child bg-white/10 text-white text-[12px] px-4 md:px-8 py-2 rounded-xl shadow-md font-medium hover:scale-[1.02] transition" : "stagger-child bg-white text-[#555] text-[12px] px-4 md:px-8 py-2 rounded-xl shadow-md font-medium hover:scale-[1.02] transition";
  const inputWrap = isDark ? "flex items-center w-full bg-[#0b0b0b] border border-white/10 rounded-2xl shadow-md px-4 py-3 mt-3" : "flex items-center w-full bg-white border border-[#B9B9B9] rounded-2xl shadow-md px-4 py-3 mt-3";
  const inputClass = isDark ? "flex-1 outline-none text-sm text-gray-200 placeholder:text-gray-400 bg-transparent" : "flex-1 outline-none text-sm text-[#555] placeholder:text-[#999] bg-transparent";
  const refreshClass = isDark ? "flex items-center gap-2 text-gray-300 text-sm hover:opacity-70 transition" : "flex items-center gap-2 text-[#666] text-sm hover:opacity-70 transition";

  return (
    <section className={`mt-12 mb-12 ${entered ? "chat-enter" : "opacity-0"}`}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 md:w-14 md:h-14">
          <Image src={circle} alt="circle" width={56} height={56} className="object-cover" />
        </div>

        <h1 className={headingClass}>Good morning, User<br />Can I help you with anything?</h1>

        <p className={paraClass}>choose a prompt below or<br />write your own to start using the chatbot.</p>

        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {[
            "Make a report for my current progress",
            "Show me the list of my completed tutorials",
            "Suggest next steps for my learning",
            "Recommend community projects",
          ].map((text, i) => (
            <button key={i} className={btnClass} style={{ animationDelay: `${i * 80}ms` }}>
              {text}
            </button>
          ))}
        </div>

        <div className="w-full max-w-[680px]">
          <div className="flex items-center justify-between mt-4">
            <button className={refreshClass}>
              <span className="text-lg">↻</span>
              Refresh prompts
            </button>
          </div>

          <div className={inputWrap}>
            <input type="text" placeholder="How may I help you today?" className={inputClass} />
            <button className={isDark ? "ml-3 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:scale-105 transition" : "ml-3 w-9 h-9 rounded-full bg-[#8F8F8F] text-white flex items-center justify-center hover:scale-105 transition"}>↗</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BackgroundImage() {
  const { theme } = useTheme();
  const src = theme === "dark" ? chatBgDark : chatBgLight;
  return (
    <div className="absolute inset-0 z-0">
      <Image src={src} alt="background" fill className="object-cover" />
    </div>
  );
}
