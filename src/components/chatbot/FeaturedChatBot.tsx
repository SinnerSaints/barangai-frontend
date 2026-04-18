"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import circle from "@/assets/img/eclipse.png";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import ReactMarkdown from "react-markdown";
import { OPENAI_API_KEY } from "@/lib/auth";
import Link from "next/link"; // Assuming you use Next.js routing

import { useTheme } from "@/context/theme";

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
      <div className="relative z-10 w-full max-w-3xl px-4 py-4 md:py-5 mx-auto">
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
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Persist Prompt Count and Load User Info
  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    const firstName = localStorage.getItem("first_name");
    const savedCount = localStorage.getItem("guest_prompt_count");

    if (savedCount) {
      setPromptCount(parseInt(savedCount, 10));
    }

    if (!storedEmail) return;
    const emailName = storedEmail.split("@")[0];
    const trimmedFirst = (firstName ?? "").trim();
    setUserName(trimmedFirst || emailName);
  }, []);

  // Update localStorage whenever promptCount changes
  useEffect(() => {
    localStorage.setItem("guest_prompt_count", promptCount.toString());
  }, [promptCount]);

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
    if (promptCount >= 5) {
      setShowLimitModal(true);
      return;
    }

    const userMessage = (prompt ?? message).trim();
    if (!userMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, time: new Date().toISOString() },
    ]);

    setMessage("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", time: new Date().toISOString(), typing: true },
    ]);

    try {
      const baseUrl = OPENAI_API_KEY.replace(/\/$/, "");

      const res = await fetch(`${baseUrl}/chat/guest/`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // user_id is ignored by the backend now, but we send it so the schema doesn't complain
        body: JSON.stringify({ message: userMessage, user_id: 1 }),
      });

      // ---> Check specifically for the Rate Limit error (HTTP 429) <---
      if (res.status === 429) {
        setPromptCount(5); 
        setShowLimitModal(true);
        // Remove the typing indicator message since it failed
        setMessages((prev) => prev.slice(0, -1));
        return; 
      }

      if (!res.ok) throw new Error(`Server Error: ${res.status}`);

      const data = await res.json();
      const fullText = data.response || data.reply || "No response received.";

      await new Promise((r) => setTimeout(r, 800));

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = { ...updated[lastIndex], content: fullText, typing: false };
        return updated;
      });

      const nextCount = promptCount + 1;
      setPromptCount(nextCount);
      if (nextCount >= 5) {
        setTimeout(() => setShowLimitModal(true), 1500); 
      }

    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
            role: "assistant", 
            content: "Error: Could not connect to server.", 
            time: new Date().toISOString(), 
            typing: false 
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = "flex items-center w-full backdrop-blur-md bg-white/70 border border-white/40 rounded-2xl shadow-lg px-4 py-3";
  const inputClass = "flex-1 outline-none text-sm text-black placeholder:text-gray-500 bg-transparent";
  const sendButtonClass = "ml-3 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:scale-105 hover:bg-emerald-500 transition disabled:opacity-50";

  return (
    <section>
      <div className="relative flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-bounce">
          <Image src={circle} alt="circle" width={40} height={40} />
        </div>

        <h1 className="text-center text-xl md:text-2xl font-semibold text-black animate-fadeIn">
          Good morning, {userName}! <br />
          How can I assist you today?
        </h1>

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

        <div className="relative h-[300px] w-full rounded-3xl border border-white/30 bg-white/40 shadow-2xl backdrop-blur-xl overflow-hidden md:h-[350px]">
          <div className="absolute inset-0 overflow-y-auto p-4 pb-24 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === "user" 
                    ? (isDark ? "bg-[#8CD559] text-black shadow-[0_4px_15px_rgba(140,213,89,0.15)] font-medium" : "bg-[#9DE16A] text-black shadow-sm font-medium") 
                    : (isDark ? "bg-white/10 text-gray-200 backdrop-blur-md border border-white/5" : "bg-white/80 text-black backdrop-blur-md border border-black/5")
                  }`}>
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-2" {...props} />,
                      a: ({ node, ...props }) => <a className="underline underline-offset-2 hover:opacity-80 transition-opacity font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                      code: ({ node, inline, className, children, ...props }: any) => {
                        return inline ? (
                          <code className="bg-black/10 dark:bg-black/20 rounded px-1.5 py-0.5 text-sm font-mono text-current" {...props}>
                            {children}
                          </code>
                        ) : (
                          <div className="bg-black/10 dark:bg-black/40 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono border border-black/5 dark:border-white/5">
                            <code {...props}>{children}</code>
                          </div>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                    {msg.typing && <span className={`inline-block w-2 h-3.5 ml-1.5 align-middle animate-pulse ${isDark ? "bg-[#8CD559]" : "bg-black"}`}></span>}
                    <div className="text-[10px] opacity-50 mt-1 font-medium">{new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

          <div className="absolute bottom-0 left-0 w-full p-3">
            <div className={inputWrap}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={promptCount >= 5 ? "Limit reached..." : "Type your message..."}
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

        {promptCount >= 5 && (
          <p className="text-red-600 font-bold text-sm text-center animate-pulse">
            Prompt limit reached. Please Sign Up to continue.
          </p>
        )}
      </div>

      {/* POP-UP MODAL */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-up-center">
            <div className="flex justify-center mb-4">
                <div className="bg-emerald-100 p-4 rounded-full">
                    <Image src={circle} alt="circle" width={40} height={40} className="animate-pulse" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Limit Reached!</h2>
            <p className="text-gray-600 mb-6">
              You've used all 5 guest prompts. Sign up now to unlock unlimited AI assistance and save your chat history.
            </p>
            <div className="flex flex-col gap-3">
              <Link 
                href="/signup" 
                className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
              >
                Sign Up for Free
              </Link>
              <button 
                onClick={() => setShowLimitModal(false)}
                className="text-gray-400 text-sm hover:text-gray-600 transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
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