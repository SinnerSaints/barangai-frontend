"use client"
import FeaturedChatBot from "@/components/chatbot/FeaturedChatBot";

export default function ChatFeature() {
  return (
    <section className="relative w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center">
        
        {/* powered by */}
        <h2 className="mb-2 font-pattaya text-2xl text-[#9DE16A] text-stroke text-strokeGreen md:text-[32px]">
          powered by
        </h2>

        {/* Main heading */}
        <h1 className="font-leagueGothic text-5xl font-extrabold leading-[0.95] text-white md:text-7xl lg:text-[88px]">
          ARTIFICIAL <span className="text-[#9DE16A]">INTELLIGENCE</span>
        </h1>

        {/* Chatbot */}
        <div className="mt-6 mb-6 w-full max-w-3xl overflow-hidden rounded-3xl md:mt-8">
          <FeaturedChatBot />
        </div>
      </div>
    </section>
  );
}