"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  FolderOpen,
  MessageSquarePlus,
  Search as SearchIcon,
} from "lucide-react";
import TopBar from "@/components/dashboard/TopBar";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import circle from "@/assets/img/eclipse.png";
import { useTheme } from "@/context/theme";
import ReactMarkdown from "react-markdown";
import { OPENAI_API_KEY } from "@/lib/auth";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  time: string;
  typing?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: string;
};

export default function ChatbotPage() {
  return (
    <div>
      <main>
        <BackgroundImage />
        <div className="max-w-7xl mx-auto relative z-10">
          <TopBar hideSearch />
          <ChatSection />
        </div>
      </main>
    </div>
  );
}

function ChatSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [entered, setEntered] = useState(false);
  const [userName, setUserName] = useState("User");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [sessionUUID, setSessionUUID] = useState<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. LOAD HISTORY & USER ON MOUNT
  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    const firstName = localStorage.getItem("first_name");
    if (storedEmail) {
      const emailName = storedEmail.split("@")[0];
      setUserName((firstName ?? "").trim() || emailName);
    }

    const savedHistory = localStorage.getItem("barangai_chat_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        
        // Auto-load the most recent chat if it exists
        if (parsed.length > 0) {
          const latest = parsed[0];
          setMessages(latest.messages);
          setSessionUUID(latest.id);
          setHasStartedChat(true);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    setEntered(true);
  }, []);

  // 2. SAVE HISTORY WHENEVER MESSAGES CHANGE
  useEffect(() => {
    if (sessionUUID && messages.length > 0) {
      const updatedHistory = history.filter(s => s.id !== sessionUUID);
      const currentSession = history.find(s => s.id === sessionUUID) || {
        id: sessionUUID,
        title: messages[0].content.substring(0, 30),
        messages: [],
        lastUpdated: new Date().toISOString()
      };

      const newSessionEntry: ChatSession = {
        ...currentSession,
        messages: messages,
        lastUpdated: new Date().toISOString()
      };

      const finalHistory = [newSessionEntry, ...updatedHistory];
      setHistory(finalHistory);
      localStorage.setItem("barangai_chat_history", JSON.stringify(finalHistory));
    }
  }, [messages]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("smooth");
      setShowJumpToLatest(false);
    } else {
      setShowJumpToLatest(true);
    }
  }, [messages, loading]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setIsUserScrolling(true);
    if (scrollIdleTimeoutRef.current) clearTimeout(scrollIdleTimeoutRef.current);
    scrollIdleTimeoutRef.current = setTimeout(() => setIsUserScrolling(false), 700);

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  };

  // 3. UPDATED SEND MESSAGE WITH DYNAMIC UUID
  const sendMessage = async (prompt?: string) => {
    const userMessage = (prompt ?? message).trim();
    if (!userMessage || loading) return;

    setHasStartedChat(true);
    const newMsg: ChatMessage = { role: "user", content: userMessage, time: new Date().toISOString() };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");
    setLoading(true);

    try {
      const baseUrl = OPENAI_API_KEY.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          user_id: 1,
          session_uuid: sessionUUID, // Send existing ID or null for new chat
        }),
      });

      const data = await res.json();

      // If this was a new chat, the backend should return a session_uuid
      if (!sessionUUID && data.session_uuid) {
        setSessionUUID(data.session_uuid);
      } else if (!sessionUUID) {
        // Fallback ID if backend doesn't provide one
        setSessionUUID(crypto.randomUUID());
      }

      const fullText = data.response || "No response received.";
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
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to server.", time: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  // 4. FUNCTIONAL SIDEBAR ACTIONS
  const startNewChat = () => {
    setHasStartedChat(false);
    setMessages([]);
    setSessionUUID(null);
    setMessage("");
  };

  const loadChat = (session: ChatSession) => {
    setSessionUUID(session.id);
    setMessages(session.messages);
    setHasStartedChat(true);
  };

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isChatMode = hasStartedChat || messages.length > 0 || loading;

  // Existing Classes (Unchanged)
  const headingClass = isDark ? "text-center text-2xl md:text-3xl font-semibold text-white" : "text-center text-2xl md:text-3xl font-semibold text-black";
  const paraClass = isDark ? "text-center text-sm text-gray-300" : "text-center text-sm text-[#8F8F8F]";
  const btnClass = isDark ? "stagger-child bg-white/10 text-white text-[12px] px-4 md:px-8 py-2 rounded-xl shadow-md font-medium hover:scale-[1.02] transition" : "stagger-child bg-white text-[#555] text-[12px] px-4 md:px-8 py-2 rounded-xl shadow-md font-medium hover:scale-[1.02] transition";
  const inputWrap = isDark ? "flex items-center w-full bg-[#0b0b0b] border border-white/10 rounded-2xl shadow-md px-4 py-3 mt-3" : "flex items-center w-full bg-white border border-[#B9B9B9] rounded-2xl shadow-md px-4 py-3 mt-3";
  const inputClass = isDark ? "flex-1 outline-none text-sm text-gray-200 placeholder:text-gray-400 bg-transparent" : "flex-1 outline-none text-sm text-[#555] placeholder:text-[#999] bg-transparent";
  const refreshClass = isDark ? "flex items-center gap-2 text-gray-300 text-sm hover:opacity-70 transition" : "flex items-center gap-2 text-[#666] text-sm hover:opacity-70 transition";
  const sendButtonClass = isDark ? "ml-3 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-105 hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed" : "ml-3 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:scale-105 hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const newChatButtonClass = isDark ? "flex items-center gap-3 text-sm rounded-xl px-3 py-2.5 transition bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25" : "flex items-center gap-3 text-sm rounded-xl px-3 py-2.5 transition bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

  return (
    <section className={`${entered ? "chat-enter" : "opacity-0"} mt-4`}>
      {!isChatMode ? (
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="w-12 h-12 md:w-14 md:h-14">
            <Image src={circle} alt="circle" width={56} height={56} className="object-cover" />
          </div>
          <h1 className={headingClass}>Good morning, {userName}!<br />Can I help you with anything?</h1>
          <p className={paraClass}>choose a prompt below or<br />write your own to start using the chatbot.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {["Make a report for my current progress", "Show me my completed tutorials", "Suggest next steps", "Recommend community projects"].map((text, i) => (
              <button key={text} className={btnClass} style={{ animationDelay: `${i * 80}ms` }} onClick={() => sendMessage(text)}>{text}</button>
            ))}
          </div>
          <div className="w-full max-w-[680px]">
            <div className={inputWrap}>
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="How may I help you today?" className={inputClass} />
              <button onClick={() => sendMessage()} disabled={loading || !message.trim()} className={sendButtonClass}>↗</button>
            </div>
          </div>
          {/* History List for Mobile/Initial view */}
          {history.length > 0 && (
             <div className="mt-4 w-full max-w-[680px]">
               <p className="text-xs font-semibold uppercase opacity-50 mb-2">Recent chats</p>
               <div className="flex gap-2 overflow-x-auto pb-2">
                 {history.slice(0,3).map(chat => (
                   <button key={chat.id} onClick={() => loadChat(chat)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs whitespace-nowrap">{chat.title}</button>
                 ))}
               </div>
             </div>
          )}
        </div>
      ) : (
        <div className="h-[calc(100vh-132px)] grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 lg:gap-6 mt-2">
          <aside className={`hidden lg:flex flex-col pr-4 border-r ${isDark ? "border-white/10" : "border-black/15"}`}>
            <button onClick={startNewChat} className={newChatButtonClass}>
              <MessageSquarePlus size={18} /> New chat
            </button>
            <button className={`mt-1 flex items-center gap-3 text-sm rounded-xl px-3 py-2.5 transition ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              <FolderOpen size={18} /> Uploads
            </button>
            <div className="mt-5 relative">
              <SearchIcon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Chats" 
                className={`w-full rounded-xl border pl-9 pr-3 py-2 text-sm outline-none ${isDark ? "bg-white/5 border-white/15 text-gray-200" : "bg-white/85 border-black/20 text-gray-800"}`} 
              />
            </div>
            <div className="mt-4 space-y-1 overflow-y-auto pr-1 chat-scroll-area">
              {filteredHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadChat(item)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition ${
                    sessionUUID === item.id
                      ? isDark ? "bg-white/10 text-white" : "bg-[#e6ebf5] text-[#1c2b57]"
                      : isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-black/5"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </aside>

          <main className="relative min-h-0 flex flex-col">
            <div ref={scrollContainerRef} onScroll={handleScroll} className="chat-scroll-area flex-1 overflow-y-auto px-2 md:px-5 pb-28 scroll-smooth">
              <div className="max-w-3xl mx-auto w-full pt-3 space-y-5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow ${msg.role === "user" ? (isDark ? "bg-[#608247] text-white" : "bg-[#9DE16A] text-black") : (isDark ? "bg-white/10 text-gray-200" : "bg-gray-200 text-black")}`}>
                      <ReactMarkdown
                        components={{
                          // Style standard paragraphs
                          p: ({ node, ...props }) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
                          
                          // Style bullet and numbered lists
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                          
                          // Style headings
                          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-2" {...props} />,
                          
                          // Style links
                          a: ({ node, ...props }) => <a className="underline underline-offset-2 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer" {...props} />,
                          
                          // Style bold text
                          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,

                          // Style code (handles both inline `code` and multi-line ```code blocks```)
                          code: ({ node, inline, className, children, ...props }: any) => {
                            return inline ? (
                              <code className="bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="bg-black/20 dark:bg-black/40 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono border border-black/10 dark:border-white/10">
                                <code {...props}>{children}</code>
                              </div>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {msg.typing && <span className="ml-1 animate-pulse">|</span>}
                      <div className="text-[10px] opacity-60 mt-1">{new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                ))}
                {loading && <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>BarangAI is typing...</div>}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="absolute bottom-3 left-0 right-0 px-2 md:px-5">
              <div className="max-w-3xl mx-auto">
                <div className={inputWrap}>
                  <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="How may I help you today?" className={inputClass} />
                  <button onClick={() => sendMessage()} disabled={loading || !message.trim()} className={sendButtonClass}>↗</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
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