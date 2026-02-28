"use client";

import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import chatBg from "@/assets/img/chatBg.png";
import circle from "@/assets/img/eclipse.png";

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex">
      <Sidebar />
      <main className="flex-1 p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src={chatBg} alt="background" fill className="object-cover" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <TopBar hideSearch />

          {/* Chat UI (clean design) */}
          <section className="mt-12 mb-12">
            <div className="flex flex-col items-center gap-6">
              <div className="w-12 h-12 md:w-14 md:h-14">
                <Image src={circle} alt="circle" width={56} height={56} className="object-cover" />
              </div>

              <h1 className="text-center text-2xl md:text-3xl font-semibold text-black">Good morning, User<br/>Can I help you with anything?</h1>

              <p className="text-center text-sm text-[#8F8F8F]">choose a prompt below or<br/>write your own to start using the chatbot.</p>

              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {[
                  "Make a report for my current progress",
                  "Show me the list of my completed tutorials",
                  "Suggest next steps for my learning",
                  "Recommend community projects",
                ].map((text, i) => (
                  <button key={i} className="bg-white text-[#555] text-[12px] px-4 md:px-8 py-2 rounded-xl shadow-md font-medium hover:scale-[1.02] transition">
                    {text}
                  </button>
                ))}
              </div>

              <div className="w-full max-w-[680px]">
                <div className="flex items-center justify-between mt-4">
                  <button className="flex items-center gap-2 text-[#666] text-sm hover:opacity-70 transition">
                    <span className="text-lg">↻</span>
                    Refresh prompts
                  </button>
                </div>

                <div className="flex items-center w-full bg-white border border-[#B9B9B9] rounded-2xl shadow-md px-4 py-3 mt-3">
                  <input type="text" placeholder="How may I help you today?" className="flex-1 outline-none text-sm text-[#555] placeholder:text-[#999] bg-transparent" />
                  <button className="ml-3 w-9 h-9 rounded-full bg-[#8F8F8F] text-white flex items-center justify-center hover:scale-105 transition">↗</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
