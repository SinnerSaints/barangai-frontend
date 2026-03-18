"use client"
import FeaturedChatBot from "@/components/chatbot/FeaturedChatBot";

export default function ChatFeature() {
  return (
    <section className="relative chat-feature min-h-screen mt-[100px] flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* "powered by" on top */}
        <h1 className="absolute font-pattaya text-[40px] text-[#9DE16A] -mt-[25px] mr-[500px] text-stroke text-strokeGreen mb-4">
          powered by
        </h1>

        {/* Main heading */}
        <h1 className="font-leagueGothic font-extrabold text-center text-[100px] md:text-[90px] leading-tight text-white">
          ARTIFICIAL <span className="text-[#9DE16A]">INTELLIGENCE</span>
        </h1>
        <div className="w-full h-full max-w-4xl mt-8 rounded-3xl overflow-hidden">
            <FeaturedChatBot />
        </div>
      </div>
    </section>
  )
}