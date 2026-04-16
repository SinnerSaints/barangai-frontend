"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import circle from "@/assets/img/eclipse.png";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import ReactMarkdown from "react-markdown";
import { OPENAI_API_KEY } from "@/lib/auth";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  time: string;
  typing?: boolean;
};

export default function FeaturedChatBot() {
  return (
    <main className="relative w-full overflow-hidden rounded-3xl">
      <BackgroundImage />
      <div className="relative z-10 w-full max-w-3xl px-4 py-4 md:py-5">
        <ChatSection />
      </div>
    </main>
  );
}

function ChatSection() {
  const [userName, setUserName] = useState("User");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [promptCount, setPromptCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    const firstName = localStorage.getItem("first_name");

    if (!storedEmail) return;
    const emailName = storedEmail.split("@")[0];
    const trimmedFirst = (firstName ?? "").trim();
    setUserName(trimmedFirst || emailName);
  }, []);

  const suggestions = [
    "Make a report for my current progress",
    "Show me my completed tutorials",
    "Suggest next steps for my learning",
    "Recommend community projects",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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
      const res = await fetch(`${OPENAI_API_KEY}/chat/`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, user_id: 1 }),
      });

      if (!res.ok) {
        throw new Error(`Server Error: ${res.status}`);
      }

      const data = await res.json();
      
      // FIX 1: Read 'reply' instead of 'response' and provide a fallback
      const fullText = data.reply || "No response text found.";

      // assistant typing bubble
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", time: new Date().toISOString(), typing: true },
      ]);

      let currentText = "";
      for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = currentText;
          return updated;
        });

        await new Promise((r) => setTimeout(r, 10));
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].typing = false;
        return updated;
      });

      setPromptCount((prev) => prev + 1);
    } catch (err: any) {
      console.error("Chat Error:", err);
      
      // FIX 2: Print actual errors to the chat bubble
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message || "Failed to connect to server."}`,
          time: new Date().toISOString(),
        },
      ]);
    } finally {
      // FIX 3: Ensure loading is always disabled
      setLoading(false);
    }
  };

  const inputWrap =
    "flex items-center w-full backdrop-blur-md bg-white/70 border border-white/40 rounded-2xl shadow-lg px-4 py-3";

  const inputClass =
    "flex-1 outline-none text-sm text-black placeholder:text-gray-500 bg-transparent";

  const sendButtonClass =
    "ml-3 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:scale-105 hover:bg-emerald-500 transition disabled:opacity-50";

  return (
    <section>
      <div className="relative flex flex-col items-center gap-4">

        {/* Floating animation */}
        <div className="h-10 w-10 animate-bounce">
          <Image src={circle} alt="circle" width={40} height={40} />
        </div>

        <h1 className="text-center text-xl md:text-2xl font-semibold text-black animate-fadeIn">
          Good morning, {userName}! <br />
          How can I assist you today?
        </h1>

        {/* Suggestions */}
        {promptCount < 5 && messages.length === 0 && (
          <div className="mt-1 flex flex-wrap justify-center gap-2 animate-fadeIn">
            {suggestions.map((text) => (
              <button
                key={text}
                onClick={() => sendMessage(text)}
                className="rounded-xl bg-gray-100/80 px-3 py-1.5 text-xs text-black shadow-md backdrop-blur-md transition hover:scale-[1.03]"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Chat Card */}
        <div className="relative h-[300px] w-full rounded-3xl border border-white/30 bg-white/40 shadow-2xl backdrop-blur-xl overflow-hidden md:h-[350px]">

          {/* Messages */}
          <div className="absolute inset-0 overflow-y-auto p-4 pb-24 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-slideUp`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-black"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.typing && <span className="ml-1 animate-pulse">|</span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input FIXED */}
          <div className="absolute bottom-0 left-0 w-full p-3">
            <div className={inputWrap}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  promptCount >= 5
                    ? "Limit reached. Login to continue..."
                    : "Type your message..."
                }
                className={inputClass}
                disabled={loading || promptCount >= 5}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !message.trim() || promptCount >= 5}
                className={sendButtonClass}
              >
                ↗
              </button>
            </div>
          </div>
        </div>

        {/* Limit Message */}
        {promptCount >= 5 && (
          <p className="text-red-500 text-sm text-center animate-fadeIn">
            You’ve reached 5 prompts. Please login or sign up to continue.
          </p>
        )}
      </div>
    </section>
  );
}

function BackgroundImage() {
  return (
    <div className="absolute inset-0 z-0">
      <Image src={chatBgLight} alt="background" fill className="object-cover" />
    </div>
  );
}