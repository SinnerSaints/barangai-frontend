"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import circle from "@/assets/img/eclipse.png";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";
import ReactMarkdown from "react-markdown";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  time: string;
  typing?: boolean;
};

export default function FeaturedChatBot() {
  return (
    <div>
      <main className="relative min-h-screen">
        <BackgroundImage />
        <div className="max-w-3xl mx-auto relative z-10 pt-24 px-4">
          <ChatSection />
        </div>
      </main>
    </div>
  );
}

function ChatSection() {
  const { theme } = useTheme();

  const [userName, setUserName] = useState("User");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [promptCount, setPromptCount] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get username from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    const firstName = localStorage.getItem("first_name");

    if (storedEmail) {
      const name = storedEmail.split("@")[0];
      setUserName(firstName ?? name);
    }
  }, []);

  const suggestions = [
    "Make a report for my current progress",
    "Show me my completed tutorials",
    "Suggest next steps for my learning",
    "Recommend community projects",
  ];

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages]);

  const sendMessage = async (prompt?: string) => {
    if (promptCount >= 5) return;

    const userMessage = (prompt ?? message).trim();
    if (!userMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, time: new Date().toISOString() },
    ]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, user_id: 1 }),
      });

      const data = await res.json();

      const fullText = data.response;
      let currentText = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", time: new Date().toISOString(), typing: true },
      ]);

      for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];
        await new Promise((resolve) => setTimeout(resolve, 10));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = currentText;
          return updated;
        });
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].typing = false;
        return updated;
      });

      setPromptCount((prev) => prev + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to server.", time: new Date().toISOString() },
      ]);
    }

    setLoading(false);
  };

  const inputWrap = "flex items-center w-full bg-white border border-gray-300 rounded-2xl shadow-md px-4 py-3 mt-3";
  const inputClass = "flex-1 outline-none text-sm text-black placeholder:text-gray-500 bg-transparent";
  const sendButtonClass = "ml-3 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:scale-105 hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <section>
      <div className="flex flex-col items-center gap-6 mt-8">
        <div className="w-12 h-12 md:w-14 md:h-14">
          <Image src={circle} alt="circle" width={56} height={56} className="object-cover" />
        </div>

        <h1 className="text-center text-2xl md:text-3xl font-semibold text-black">
          Good morning, {userName}!
          <br />
          How can I assist you today?
        </h1>

        {promptCount < 5 ? (
          <>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {suggestions.map((text, i) => (
                <button
                  key={text}
                  className="bg-gray-100 text-black px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] transition text-sm"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => sendMessage(text)}
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="w-full max-w-[500px] mt-4">
              <div className={inputWrap}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message..."
                  className={inputClass}
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !message.trim()}
                  className={sendButtonClass}
                >
                  ↗
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 text-center text-sm text-red-500">
            You have reached the maximum of 5 prompts. Please login or sign up to continue.
          </div>
        )}

        <div ref={scrollContainerRef} className="mt-6 w-full max-w-3xl flex flex-col gap-4 overflow-y-auto h-[400px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                {msg.typing && <span className="ml-1 animate-pulse">|</span>}
                <div className="text-[10px] opacity-60 mt-1">
                  {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </section>
  );
}

function BackgroundImage() {
  const { theme } = useTheme();
  const src = chatBgLight; // always use light background now
  return (
    <div className="absolute inset-0 z-0">
      <Image src={src} alt="background" fill className="object-cover" />
    </div>
  );
}