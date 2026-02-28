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
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <TopBar />

          {/* Chat feature design copied in-place so the chatbot page follows the landing UI */}
          <section className="relative mt-[40px] chat-feature min-h-[70vh]">
            <div>
              <h1 className="absolute font-pattaya text-[28px] md:text-[40px] -mt-6 ml-[140px] md:ml-[275px] text-[#9DE16A] text-stroke text-strokeGreen">
                powered by
              </h1>
              <h1 className="font-leagueGothic font-extrabold text-center text-[60px] md:text-[90px] leading-tight text-white">
                ARTIFICIAL<span className="text-[#9DE16A]"> INTELLIGENCE</span>
              </h1>
              <div className="absolute mt-16 md:mt-28 ml-[180px] md:ml-[280px]">
                <Image src={circle} alt="Circle" width={50} height={50} />
              </div>

              <div className="flex flex-col lg:flex-row p-6 lg:p-10 gap-10">
                <div className="flex-1 flex justify-center mt-8 relative">
                  <Image src={chatBg} alt="Chat Feature" width={500} height={1200} className="w-auto h-auto object-cover" />

                  <h1 className="absolute font-manrope text-black mt-24 font-semibold text-center text-[20px] w-[320px] md:w-[420px]">
                    Good morning, User
                    <br />
                    Can I help you with anything?
                  </h1>

                  <h2 className="absolute font-manrope text-[#8F8F8F] mt-40 text-center text-[13px] font-medium w-[320px] md:w-[420px]">
                    choose a prompt below or
                    <br />
                    write your own to start using the chatbot.
                  </h2>

                  {/* Prompt buttons */}
                  <div className="absolute mt-[210px] md:mt-[210px] w-full flex justify-center gap-4">
                    <div className="flex flex-wrap justify-center gap-4 max-w-[720px] px-4">
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
                  </div>

                  {/* Refresh prompts */}
                  <div className="absolute z-10 mt-[250px] md:mt-[250px] right-10 md:right-36 w-full flex justify-center md:justify-end px-6">
                    <button className="flex items-center gap-2 text-[#666] text-sm hover:opacity-70 transition">
                      <span className="text-lg">↻</span>
                      Refresh prompts
                    </button>
                  </div>

                  {/* Input bar */}
                  <div className="absolute w-full flex mt-[280px] md:mt-[280px] justify-center px-6">
                    <div className="flex items-center w-[320px] md:w-[500px] bg-white border border-[#B9B9B9] rounded-2xl shadow-md px-4 py-3">
                      <input type="text" placeholder="How may I help you today?" className="flex-1 outline-none text-sm text-[#555] placeholder:text-[#999] bg-transparent" />
                      <button className="ml-3 w-9 h-9 rounded-full bg-[#8F8F8F] text-white flex items-center justify-center hover:scale-105 transition">↗</button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 hidden lg:flex justify-center mt-8">
                  <Image src={chatBg} alt="Chat Feature" width={500} height={800} className="w-auto h-auto object-cover" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
