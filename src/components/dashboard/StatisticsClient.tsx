"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { useTheme } from "@/context/theme";
import { gsap } from "gsap";
import {
  fetchGeneralStatisticsReport,
  fetchGrowthTimeline,
  type GeneralStatisticsReport,
  type GrowthTimelineResponse,
} from "@/lib/statistics";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  AlertCircle,
  Loader2,
  BookOpen,
  CheckCircle,
  Target,
  Brain,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  checkCertificateEligibility, 
  type CertificateEligibilityResponse
} from "@/lib/statistics";
import CertificateModal from "./CertificateModal";

// --- MAGIC BENTO CORE LOGIC ---
const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 350;
const MOBILE_BREAKPOINT = 768;

const createParticleElement = (x: number, y: number, color: string): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

const ParticleCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
}> = ({
  children,
  className = "",
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = "180, 237, 124", 
  enableTilt = true,
  clickEffect = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLDivElement[]>([]);
  const particlesInitialized = useRef(false);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {particle.parentNode?.removeChild(particle)},
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) initializeParticles();

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(element, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: "power2.out",
        transformPerspective: 1000,
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;
      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.8, ease: "power2.out", onComplete: () => ripple.remove() }
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, clickEffect, glowColor]);

  return (
    <div ref={cardRef} className={`${className} relative overflow-hidden`} style={style}>
      {children}
    </div>
  );
};

const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  glowColor?: string;
}> = ({ gridRef, disableAnimations = false, glowColor = "180, 237, 124" }) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current) return;

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest(".bento-section");
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll(".bento-card");

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
        cards.forEach((card) => (card as HTMLElement).style.setProperty("--glow-intensity", "0"));
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(DEFAULT_SPOTLIGHT_RADIUS);
      let minDistance = Infinity;

      cards.forEach((card) => {
        const cardElement = card as HTMLElement;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);
        let glowIntensity = 0;
        if (effectiveDistance <= proximity) glowIntensity = 1;
        else if (effectiveDistance <= fadeDistance) glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, DEFAULT_SPOTLIGHT_RADIUS);
      });

      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1, ease: "power2.out" });

      const targetOpacity =
        minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;

      gsap.to(spotlightRef.current, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5, ease: "power2.out" });
    };

    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll(".bento-card").forEach((card) => {
        (card as HTMLElement).style.setProperty("--glow-intensity", "0");
      });
      if (spotlightRef.current) gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, glowColor]);

  return null;
};

// --- MAIN STATISTICS COMPONENT ---
const COLORS = ["#B4ED7C", "#86C750", "#5A9B29", "#3E7416", "#E2F6C8"];

const statusConfig: Record<string, { label: string; colorDark: string; colorLight: string; bgDark: string; bgLight: string }> = {
  improving: { label: "Improving", colorDark: "text-[#B4ED7C]", colorLight: "text-[#3E7416]", bgDark: "bg-[#B4ED7C]/10", bgLight: "bg-[#B4ED7C]/30" },
  steady: { label: "Steady", colorDark: "text-amber-400", colorLight: "text-amber-600", bgDark: "bg-amber-400/10", bgLight: "bg-amber-500/20" },
  needs_support: { label: "Needs Support", colorDark: "text-rose-400", colorLight: "text-rose-600", bgDark: "bg-rose-400/10", bgLight: "bg-rose-500/20" },
};

export default function StatisticsClient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Use a slightly darker green for the hover glow in light mode to ensure it's visible on white
  const glowColor = isDark ? "180, 237, 124" : "90, 155, 41"; 

  const bentoGridRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reportData, setReportData] = useState<GeneralStatisticsReport | null>(null);
  const [growthData, setGrowthData] = useState<GrowthTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certData, setCertData] = useState<CertificateEligibilityResponse | null>(null);
  const [isCertLoading, setIsCertLoading] = useState(false);

  const handleOpenCertificate = async () => {
    setIsCertModalOpen(true);
    setIsCertLoading(true);
    try {
      const data = await checkCertificateEligibility();
      setCertData(data);
    } catch (err) {
      console.error("Failed to check eligibility:", err);
    } finally {
      setIsCertLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [report, growth] = await Promise.all([
          fetchGeneralStatisticsReport(),
          fetchGrowthTimeline(),
        ]);
        setReportData(report);
        setGrowthData(growth);
      } catch (err: any) {
        setError(err.message || "Failed to load statistics.");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const statCards = useMemo(() => {
    if (!reportData) return [];
    const lesson = reportData.lesson_progress;
    const quiz = reportData.quiz_progress;

    // Added dynamic light/dark colors to icons and text so they are legible on white
    return [
      { id: 1, label: "Completed Lessons", value: `${lesson.completed_lessons}/${lesson.total_lessons}`, icon: BookOpen, color: isDark ? "text-[#B4ED7C]" : "text-[#5A9B29]" },
      { id: 2, label: "Lesson Completion", value: `${lesson.completion_rate_percent.toFixed(1)}%`, icon: CheckCircle, color: isDark ? "text-[#97D960]" : "text-[#3E7416]" },
      { id: 3, label: "Quiz Attempts", value: quiz.total_attempts, icon: Target, color: isDark ? "text-[#E2F6C8]" : "text-[#1A322D]" },
      { id: 4, label: "Average Quiz Score", value: `${quiz.average_score.toFixed(1)}%`, icon: Brain, color: isDark ? "text-white" : "text-slate-800" },
      { id: 5, label: "Score Growth", value: `${quiz.score_growth >= 0 ? "+" : ""}${quiz.score_growth}%`, icon: TrendingUp, color: quiz.score_growth >= 0 ? (isDark ? "text-[#B4ED7C]" : "text-[#5A9B29]") : (isDark ? "text-rose-400" : "text-rose-600") },
    ];
  }, [reportData, isDark]);

  const topicGrowthChart = useMemo(() => {
    if (!growthData) return [];
    return growthData.topic_growth.map((topic) => ({
      topic: topic.topic,
      "Average Score": Number(topic.avg_score.toFixed(2)),
      "Baseline Score": topic.first_score,
      "Best Score": topic.best_score,
    }));
  }, [growthData]);

  const strengthsData = useMemo(() => {
    if (!reportData) return [];
    return reportData.strengths.map((item) => ({ name: item.topic, value: item.accuracy_percent }));
  }, [reportData]);

  const weaknessData = useMemo(() => {
    if (!reportData) return [];
    return reportData.weaknesses.map((item) => ({ name: item.topic, value: item.accuracy_percent }));
  }, [reportData]);

  const latestAttempts = useMemo(() => {
    if (!growthData) return [];
    return [...growthData.timeline].reverse().slice(0, 5);
  }, [growthData]);

  const status = reportData ? statusConfig[reportData.overall_report.status] : null;

  const mainBgClasses = isDark ? "text-white bg-transparent" : "text-slate-900 bg-transparent";

  const glassCardClasses = `backdrop-blur-xl border rounded-2xl shadow-lg transition-all duration-300 ${
    isDark
      ? "bg-[#1A322D]/40 border-white/10 shadow-black/40 hover:bg-[#1A322D]/60"
      : "bg-white border-[#1A322D]/10 shadow-[#1A322D]/5 hover:bg-white/90"
  }`;

  if (loading) {
    return (
      <main className={`flex-1 min-h-screen p-6 relative overflow-hidden ${mainBgClasses}`}>
        <div className="max-w-7xl mx-auto relative z-10">
          <TopBar />
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className={`w-10 h-10 animate-spin ${isDark ? "text-[#B4ED7C]" : "text-[#5A9B29]"}`} />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`flex-1 min-h-screen p-6 relative overflow-hidden ${mainBgClasses}`}>
        <div className="max-w-7xl mx-auto relative z-10">
          <TopBar />
          <div className={`mt-8 flex items-start gap-3 p-5 rounded-2xl border backdrop-blur-md text-sm ${isDark ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50/80 border-rose-200 text-rose-600"}`}>
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p className="text-base font-medium">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex-1 min-h-screen p-6 relative overflow-hidden ${mainBgClasses}`}>
      <style>{`
        .bento-section {
          --glow-x: 50%;
          --glow-y: 50%;
          --glow-intensity: 0;
          --glow-radius: 200px;
        }
        .bento-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 600px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(3, 1fr); }
          .bento-grid > .bento-card:nth-child(4) { grid-column: span 2; }
        }
        .bento-card::after {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
              rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
              rgba(${glowColor}, calc(var(--glow-intensity) * 0.2)) 40%,
              transparent 70%);
          border-radius: inherit;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.3s ease;
          z-index: 1;
        }
        .bento-card:hover {
          box-shadow: 0 4px 20px rgba(${glowColor}, 0.1), 0 0 30px rgba(${glowColor}, 0.15);
        }
        .particle::before {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          background: rgba(${glowColor}, 0.2);
          border-radius: 50%;
          z-index: -1;
        }
      `}</style>

      <GlobalSpotlight gridRef={bentoGridRef} disableAnimations={isMobile} glowColor={glowColor} />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8 bento-section">
        <TopBar />
        
        <div className="pt-4">
          <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${isDark ? "from-[#B4ED7C] to-[#E2F6C8]" : "from-[#3E7416] to-[#5A9B29]"}`}>
            Training Progress & Impact
          </h1>
          <p className={`mt-2 max-w-3xl text-lg ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
            Track your lesson completion, quiz growth, strongest topics, and areas that need more focus.
          </p>
        </div>

        {/* ---------------- COMPACT MAGIC BENTO CARDS ---------------- */}
        <div className="bento-grid" ref={bentoGridRef}>
          {statCards.map((s) => (
            <ParticleCard
              key={s.id}
              className={`bento-card flex flex-col justify-between p-6 rounded-[20px] backdrop-blur-xl border border-solid transition-colors duration-300 ${
                isDark ? "bg-[#1A322D]/40 border-white/10" : "bg-white border-[#1A322D]/10"
              }`}
              disableAnimations={isMobile}
              glowColor={glowColor}
              enableTilt={!isMobile}
            >
              <div className="flex items-center justify-between mb-6 relative z-10">
                <span className={`text-sm font-semibold tracking-wide ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  {s.label}
                </span>
                <div className={`p-2 rounded-xl backdrop-blur-md ${isDark ? "bg-white/5" : "bg-[#B4ED7C]/30"}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <div className={`text-4xl font-extrabold tracking-tight relative z-10 ${isDark ? "text-white" : "text-slate-800"}`}>
                {s.value}
              </div>
            </ParticleCard>
          ))}
        </div>

        {/* ---------------- CHARTS & LOWER SECTION ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className={`${glassCardClasses} p-6 lg:col-span-2 flex flex-col`}>
            <h2 className="text-lg font-bold mb-6">Topic Growth Overview</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicGrowthChart} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                  <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "rgba(26, 50, 45, 0.9)" : "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(12px)",
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                      borderRadius: "1rem",
                      color: isDark ? "#fff" : "#000"
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "13px" }} iconType="circle" />
                  <Bar dataKey="Baseline Score" fill="#5A9B29" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Average Score" fill="#86C750" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Best Score" fill="#B4ED7C" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {reportData && status && (
            <div className={`${glassCardClasses} p-8 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
              <div className={`absolute inset-0 opacity-20 blur-3xl rounded-full scale-150 ${isDark ? status.bgDark : status.bgLight}`} />
              <h2 className="text-lg font-bold mb-4 relative z-10">Overall Progress Report</h2>
              <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full mb-6 ${isDark ? status.bgDark : status.bgLight} border ${isDark ? "border-white/10" : "border-black/5"} relative z-10`}>
                <span className={`text-xl font-bold ${isDark ? status.colorDark : status.colorLight}`}>{status.label}</span>
              </div>
              <p className={`text-base leading-relaxed relative z-10 ${isDark ? "text-zinc-300" : "text-slate-600"}`}>
                {reportData.overall_report.insight}
              </p>

              {/* NEW: CLAIM CERTIFICATE BUTTON */}
              <button 
                onClick={handleOpenCertificate}
                className="relative z-10 mt-auto flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all bg-gradient-to-r from-[#5A9B29] to-[#86C750] text-white hover:scale-105 shadow-lg shadow-[#5A9B29]/20"
              >
                <Award size={18} />
                View Certificate
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          <div className={`${glassCardClasses} p-6`}>
            <h2 className="text-lg font-bold mb-6">Topic Accuracy Distribution</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <h3 className={`text-sm font-semibold mb-4 px-3 py-1 rounded-full ${isDark ? "bg-[#B4ED7C]/10 text-[#B4ED7C]" : "bg-[#B4ED7C]/30 text-[#3E7416]"}`}>Top Strengths</h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={strengthsData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none">
                        {strengthsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none', backgroundColor: isDark ? 'rgba(26, 50, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <h3 className={`text-sm font-semibold mb-4 px-3 py-1 rounded-full ${isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-100 text-rose-700"}`}>Needs More Focus</h3>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={weaknessData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none">
                        {weaknessData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none', backgroundColor: isDark ? 'rgba(26, 50, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className={`${glassCardClasses} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Recent Attempts</h2>
            </div>
            <div className="space-y-4">
              {latestAttempts.length > 0 ? (
                latestAttempts.map((attempt) => (
                  <div key={attempt.attempt_id} className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${isDark ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10" : "bg-[#1A322D]/5 border-white/50 hover:bg-[#1A322D]/10 hover:shadow-sm"}`}>
                    <div>
                      <div className="font-semibold text-base mb-1">{attempt.lesson_title}</div>
                      <div className={`text-sm flex items-center gap-2 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                        <span className={`w-2 h-2 rounded-full ${isDark ? "bg-[#B4ED7C]" : "bg-[#5A9B29]"}`}></span>
                        {attempt.topic}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${isDark ? "text-[#B4ED7C]" : "text-[#5A9B29]"}`}>{attempt.score}%</div>
                      <div className={`text-xs mt-1 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                        {attempt.correct_count}/{attempt.total_questions} correct
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`text-center py-10 rounded-xl border border-dashed ${isDark ? "border-white/10 text-zinc-500" : "border-[#1A322D]/30 text-slate-500"}`}>
                  <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No quiz attempts yet. Complete a quiz to start your growth timeline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CertificateModal 
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        data={certData}
        isLoading={isCertLoading}
      />
    </main>
  );
}