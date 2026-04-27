"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  FolderOpen,
  MessageSquarePlus,
  Search as SearchIcon,
  Trash2,
  ArrowUp,
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

export function ChatSection({ compact = false }: { compact?: boolean }) {
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

  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  const activeSessionRef = useRef<string | null>(null);
  
  // Keep the ref constantly updated with whatever session the user is looking at
  useEffect(() => {
    activeSessionRef.current = sessionUUID;
  }, [sessionUUID]);

  // 1. LOAD HISTORY & USER ON MOUNT
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const storedEmail = localStorage.getItem("user_email");
    const firstName = localStorage.getItem("first_name");

    if (storedEmail) {
      const emailName = storedEmail.split("@")[0];
      setUserName((firstName ?? "").trim() || emailName);
    }

    const fetchHistoryFromDB = async () => {
      if (!userId) {
        setEntered(true); 
        return;
      }
      
      try {
        const baseUrl = OPENAI_API_KEY.replace(/\/$/, "");
        const token = localStorage.getItem("access_token");

        const res = await fetch(`${baseUrl}/sessions/?user_id=${userId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Backend not responding");

        const sessionList = await res.json();
        
        if (Array.isArray(sessionList) && sessionList.length > 0) {
          setHistory(sessionList.map((s: any) => ({
            id: s.session_uuid,
            title: s.dialogue_state?.current_topic || "Previous Chat",
            messages: [], 
            lastUpdated: s.created_at
          })));

          const latestUUID = sessionList[0].session_uuid;
          const msgRes = await fetch(`${baseUrl}/sessions/${latestUUID}/messages`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const messageHistory = await msgRes.json();
          
          if (Array.isArray(messageHistory)) {
            setMessages(messageHistory);
            setSessionUUID(latestUUID);
            setHasStartedChat(true);
          }
        }
      } catch (error) {
        console.error("History fetch failed:", error);
      } finally {
        setEntered(true); 
      }
    };

    fetchHistoryFromDB();
  }, []);

  // 2. SAVE HISTORY WHENEVER MESSAGES CHANGE
  useEffect(() => {
    if (sessionUUID && messages.length > 0) {
      const otherSessions = history.filter(s => s.id !== sessionUUID);
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

      const finalHistory = [newSessionEntry, ...otherSessions];
      setHistory(finalHistory);
      localStorage.setItem("barangai_chat_history", JSON.stringify(finalHistory));
    }
  }, [messages, sessionUUID]);

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
    
    setIsWaitingForAI(true); 

    // FIX: Capture the session ID *before* the fetch begins
    const startingSessionId = sessionUUID;

    try {
      const baseUrl = OPENAI_API_KEY.replace(/\/$/, "");
      const token = localStorage.getItem("access_token");

      const payload = {
        message: userMessage,
        user_id: localStorage.getItem("user_id"),
        session_uuid: sessionUUID, 
        user_name: userName,
        preferred_language: localStorage.getItem("preferred_language") || "default",
        screenshot: null
      }

      const res = await fetch(`${baseUrl}/chat/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      setIsWaitingForAI(false);

      const activeSessionId = data.session_uuid || sessionUUID || crypto.randomUUID();

      // This prevents the loop from thinking we switched chats on brand new conversations
      if (activeSessionRef.current === startingSessionId) {
        activeSessionRef.current = activeSessionId;
      }

      if (!sessionUUID) {
        setSessionUUID(activeSessionId);
      }

      if (data.dialogue_state?.current_topic) {
        setHistory((prev) => {
          const exists = prev.find(s => s.id === activeSessionId);
          if (exists) {
            return prev.map(s => s.id === activeSessionId ? { ...s, title: data.dialogue_state.current_topic } : s);
          } else {
            return [{
              id: activeSessionId,
              title: data.dialogue_state.current_topic,
              messages: [],
              lastUpdated: new Date().toISOString()
            }, ...prev];
          }
        });
      }

      const fullText = data.response || "No response received.";
      let currentText = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", time: new Date().toISOString(), typing: true },
      ]);

      const requestSessionId = activeSessionId; 

      for (let i = 0; i < fullText.length; i++) {
        // Check if the user clicks new chat or recent chat
        if (activeSessionRef.current !== requestSessionId) {
          // Save the full response directly to the correct session in background
          setHistory((prevHistory) => prevHistory.map(session => {
            if (session.id === requestSessionId) {
              const updatedMessages = [...session.messages];
              // Ensure the assistant message exists before updating
              if (updatedMessages.length > 0) {
                updatedMessages[updatedMessages.length - 1] = {
                  ...updatedMessages[updatedMessages.length - 1],
                  content: fullText, // Instantly drop the full text in
                  typing: false
                };
              }
              return { ...session, messages: updatedMessages };
            }
            return session;
          }));
          
          // Break out of the loop completely to save memory/CPU
          break; 
        }

        // If the user is STILL looking at this chat, continue the animation
        currentText += fullText[i];
        await new Promise((resolve) => setTimeout(resolve, 10));
        
        setMessages((prev) => {
          // CRASH PREVENTION: If messages were cleared right before the loop broke, ignore
          if (prev.length === 0) return prev; 
          
          const updated = [...prev];
          updated[updated.length - 1].content = currentText;
          return updated;
        });

        if (isNearBottomRef.current) {
          scrollToBottom("auto"); 
        }
      }

      // Cleanup: Turn off the typing indicator dot (only if they are still on this chat)
      if (activeSessionRef.current === requestSessionId) {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[updated.length - 1].typing = false;
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to server.", time: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  // FUNCTIONAL SIDEBAR ACTIONS
  const startNewChat = () => {
    setHasStartedChat(false);
    setMessages([]);
    setSessionUUID(null);
    setMessage("");
  };

  const loadChat = async (session: ChatSession) => {
    setLoading(true);
    setMessages([]); 
    
    try {
      const baseUrl = OPENAI_API_KEY.replace(/\/$/, "");
      const token = localStorage.getItem("access_token");
      
      const res = await fetch(`${baseUrl}/sessions/${session.id}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const messageHistory = await res.json();
      
      if (Array.isArray(messageHistory)) {
        setMessages(messageHistory);
        setSessionUUID(session.id);
        setHasStartedChat(true);

        setTimeout(() => scrollToBottom("auto"), 50); 
      }
    } catch (e) {
      console.error("Error loading chat:", e);
    } finally {
      setLoading(false);
      setIsWaitingForAI(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();

    setHistory((prev) => prev.filter((session) => session.id !== idToDelete));

    if (sessionUUID === idToDelete) {
      startNewChat();
    }

    try {
      const baseUrl = OPENAI_API_KEY.replace(/\/$/, "");
      const token = localStorage.getItem("access_token");
      
      await fetch(`${baseUrl}/sessions/${idToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isChatMode = hasStartedChat || messages.length > 0 || loading;

  // Glassy UI Styling variables
  const headingClass = isDark ? "text-center text-2xl md:text-3xl font-semibold text-white" : "text-center text-2xl md:text-3xl font-semibold text-black";
  const paraClass = isDark ? "text-center text-sm text-gray-300" : "text-center text-sm text-[#8F8F8F]";
  
  const btnClass = isDark 
    ? "stagger-child bg-white/5 hover:bg-[#8CD559]/10 border border-white/10 hover:border-[#8CD559]/30 hover:text-[#8CD559] text-white text-[12px] px-4 md:px-8 py-2 rounded-xl shadow-md font-medium hover:scale-[1.02] backdrop-blur-md transition-all" 
    : "stagger-child bg-white/60 hover:bg-white border border-[#B9B9B9]/50 hover:border-brandGreen hover:text-brandGreen text-[#555] text-[12px] px-4 md:px-8 py-2 rounded-xl shadow-md font-medium hover:scale-[1.02] backdrop-blur-md transition-all";
  
  const inputWrap = isDark 
    ? "flex items-center w-full bg-[#0b0b0b]/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-4 py-3 mt-3 transition-colors focus-within:border-[#8CD559]/50 focus-within:bg-[#0b0b0b]/80" 
    : "flex items-center w-full bg-white/60 backdrop-blur-md border border-[#B9B9B9]/50 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] px-4 py-3 mt-3 transition-colors focus-within:border-brandGreen focus-within:bg-white/90";
  
  const inputClass = isDark 
    ? "flex-1 outline-none text-sm text-gray-200 placeholder:text-gray-400 bg-transparent" 
    : "flex-1 outline-none text-sm text-[#555] placeholder:text-[#999] bg-transparent";
  
  const sendButtonClass = isDark 
    ? "ml-3 w-9 h-9 rounded-full bg-[#8CD559] text-black flex items-center justify-center hover:scale-105 hover:bg-[#7bc04e] shadow-[0_0_10px_rgba(140,213,89,0.3)] transition disabled:opacity-50 disabled:cursor-not-allowed" 
    : "ml-3 w-9 h-9 rounded-full bg-brandGreen text-white flex items-center justify-center hover:scale-105 hover:bg-brandGreen/90 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed";
  
  const newChatButtonClass = isDark 
    ? "flex items-center gap-3 text-sm font-semibold rounded-xl px-3 py-2.5 transition bg-[#8CD559]/15 text-[#8CD559] border border-[#8CD559]/10 hover:bg-[#8CD559]/25 hover:shadow-[0_0_15px_rgba(140,213,89,0.1)]" 
    : "flex items-center gap-3 text-sm font-semibold rounded-xl px-3 py-2.5 transition bg-brandGreen/10 text-brandGreen border border-brandGreen/20 hover:bg-brandGreen/20";

  const sectionClass = compact
    ? `${entered ? "chat-enter" : "opacity-0"} h-full`
    : `${entered ? "chat-enter" : "opacity-0"} mt-4`;
  const chatModeContainerClass = compact
    ? "h-full grid grid-cols-1 gap-3"
    : "h-[calc(100vh-132px)] grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 lg:gap-6 mt-2";
  const showDesktopSidebar = !compact;
  const messagePanelClass = compact
    ? "chat-scroll-area flex-1 overflow-y-auto px-2 pb-36"
    : "chat-scroll-area flex-1 overflow-y-auto px-2 md:px-5 pb-40";
  const inputWrapPositionClass = compact
    ? "absolute bottom-2 left-0 right-0 px-2 bg-transparent"
    : "absolute bottom-3 left-0 right-0 px-2 md:px-5 bg-transparent";
  const compactTopActionsClass = compact
    ? `mb-2 flex items-center justify-end px-2 ${isDark ? "text-zinc-200" : "text-zinc-700"}`
    : "hidden";
  const compactIntroWrapClass = compact
    ? "flex h-full flex-col items-center gap-5 px-4 pt-8 pb-4 text-center"
    : "flex flex-col items-center gap-6 mt-8";
  const compactHeadingClass = compact
    ? isDark
      ? "text-center text-4xl font-bold leading-tight text-white"
      : "text-center text-4xl font-bold leading-tight text-black"
    : headingClass;
  const compactParaClass = compact
    ? isDark
      ? "text-center text-base text-zinc-300"
      : "text-center text-base text-zinc-600"
    : paraClass;
  const compactInputMaxWidthClass = compact ? "w-full max-w-full" : "w-full max-w-[680px]";
  const showRecentChatsInIntro = !compact;

  return (
    <>
      {!entered && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
            <div
              className={`rounded-3xl border p-5 shadow-2xl backdrop-blur-xl ${
                isDark
                  ? "border-white/10 bg-zinc-950/80 text-zinc-100"
                  : "border-zinc-200 bg-white/90 text-zinc-900"
              }`}
            >
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full blur-md ${
                    isDark ? "bg-[#8CD559]/40" : "bg-brandGreen/25"
                  }`}
                />
                <div
                  className={`absolute h-14 w-14 rounded-full border-2 border-transparent border-t-current border-r-current animate-spin ${
                    isDark ? "border-[#8CD559]" : "border-brandGreen"
                  }`}
                />
                <div
                  className={`relative h-10 w-10 overflow-hidden rounded-full ring-2 ${
                    isDark ? "ring-zinc-700 bg-zinc-900" : "ring-zinc-200 bg-white"
                  }`}
                >
                  <Image src="/favicon.ico" alt="BIDA icon" fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
      )}
      <section className={sectionClass}>
        {!isChatMode ? (
          <div className={compactIntroWrapClass}>
            <div className="w-12 h-12 md:w-14 md:h-14 drop-shadow-[0_0_15px_rgba(140,213,89,0.2)]">
              <Image src={circle} alt="circle" width={56} height={56} className="object-cover" />
            </div>
            <h1 className={compactHeadingClass}>Good morning, {userName}!<br />Can I help you with anything?</h1>
            <p className={compactParaClass}>Write your message below to start chatting with BIDA.</p>
            <div className={compactInputMaxWidthClass}>
              <div className={inputWrap}>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="How may I help you today?" className={inputClass} />
                <button onClick={() => sendMessage()} disabled={loading || !message.trim()} className={sendButtonClass}>
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            {showRecentChatsInIntro && history.length > 0 && (
              <div className="mt-4 w-full max-w-[680px]">
                <p className={`text-xs font-semibold uppercase mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Recent chats</p>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {history.slice(0,3).map(chat => (
                    <button key={chat.id} onClick={() => loadChat(chat)} className={`border rounded-lg px-3 py-2 text-xs whitespace-nowrap backdrop-blur-sm transition-colors ${isDark ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-[#8CD559]/30" : "bg-white/60 border-black/10 text-gray-600 hover:bg-white hover:border-brandGreen/30"}`}>{chat.title}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={chatModeContainerClass}>
            <aside className={`${showDesktopSidebar ? "hidden lg:flex" : "hidden"} flex-col pr-4 border-r h-full max-h-[calc(100vh-160px)] ${isDark ? "border-white/10" : "border-black/15"}`}>
              <button onClick={startNewChat} className={newChatButtonClass}>
                <MessageSquarePlus size={18} /> New chat
              </button>
              <div className="mt-5 relative">
                <SearchIcon size={16} strokeWidth={2.5} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-[#8CD559]/70" : "text-brandGreen/70"}`} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Chats" 
                  className={`w-full rounded-xl border pl-10 pr-3 py-2 text-sm outline-none backdrop-blur-sm transition-colors ${isDark ? "bg-white/5 border-white/10 text-gray-200 focus:border-[#8CD559]/50" : "bg-white/60 border-black/10 text-gray-800 focus:border-brandGreen/50"}`} 
                />
              </div>
              <div className="mt-4 flex-1 overflow-y-auto chat-scroll-area pr-2">
                {filteredHistory
                  .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                  .map((item) => {
                    const isActive = sessionUUID === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => loadChat(item)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative flex items-center justify-between mb-1 ${
                          isActive 
                            ? (isDark 
                                ? "bg-[#8CD559]/15 text-[#8CD559] border border-[#8CD559]/30 shadow-[0_0_15px_rgba(140,213,89,0.05)] backdrop-blur-sm" 
                                : "bg-brandGreen/5 text-brandGreen border border-brandGreen/20 backdrop-blur-sm")
                            : (isDark 
                                ? "text-gray-400 hover:bg-white/5 border border-transparent" 
                                : "text-gray-600 hover:bg-black/5 border border-transparent")
                        }`}
                        >
                        <div className="flex items-center gap-2 truncate pr-8">
                          {isActive && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse shadow-[0_0_8px_currentColor] ${isDark ? "bg-[#8CD559]" : "bg-brandGreen"}`} />}
                          <span className={`truncate font-medium ${isActive ? "" : "opacity-80"}`}>{item.title}</span>
                        </div>

                        <div
                          onClick={(e) => deleteSession(e, item.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-all z-10"
                          title="Delete Chat"
                        >
                          <Trash2 size={16} />
                        </div>
                      </button>
                    );
                })}
              </div>
            </aside>

            <main className="relative flex flex-col h-full min-h-0 overflow-hidden">
              {compact && (
                <div className={compactTopActionsClass}>
                  <button
                    onClick={startNewChat}
                    className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isDark
                        ? "bg-[#8CD559]/15 text-[#8CD559] border border-[#8CD559]/30 hover:bg-[#8CD559]/25"
                        : "bg-brandGreen/10 text-brandGreen border border-brandGreen/30 hover:bg-brandGreen/20"
                    }`}
                  >
                    <MessageSquarePlus size={14} />
                    New Chat
                  </button>
                </div>
              )}
              <div ref={scrollContainerRef} onScroll={handleScroll} className={messagePanelClass}>
                <div className="max-w-3xl mx-auto w-full pt-3 space-y-5">
                  {loading && !isWaitingForAI && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-32 opacity-80 animate-fadeIn">
                      <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-3 shadow-sm ${isDark ? "border-[#8CD559]" : "border-brandGreen"}`}></div>
                      <div className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Loading conversation...
                      </div>
                    </div>
                  )}

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
                        <div className="text-[10px] opacity-50 mt-1 font-medium">
                          {new Date(
                            msg.time.endsWith("Z") || msg.time.includes("+") ? msg.time : `${msg.time}Z`
                          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}

                  {/* BUBBLE TYPING EFFECT */}
                  {isWaitingForAI && (
                    <div className="flex justify-start animate-fadeIn">
                      <div className={`px-4 py-3.5 rounded-2xl text-sm w-fit flex items-center gap-1.5 ${isDark ? "bg-white/10 backdrop-blur-md border border-white/5" : "bg-white/80 backdrop-blur-md border border-black/5 shadow-sm"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-[#8CD559]" : "bg-brandGreen"}`} style={{ animationDelay: "0ms" }}></div>
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-[#8CD559]" : "bg-brandGreen"}`} style={{ animationDelay: "150ms" }}></div>
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-[#8CD559]" : "bg-brandGreen"}`} style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-20 w-full" />
                </div>
              </div>
              
              <div className={inputWrapPositionClass}>
                <div className="max-w-3xl mx-auto">
                  <div className={inputWrap}>
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="How may I help you today?" className={inputClass} />
                    <button onClick={() => sendMessage()} disabled={loading || !message.trim()} className={sendButtonClass}>
                      <ArrowUp size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </section>
    </>
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