"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import TopBar from "@/components/dashboard/TopBar";
import { useTheme } from "@/context/theme";
import { fetchAssessmentStatistics } from "@/lib/preAssessment";
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
import { AlertCircle, Loader2 } from "lucide-react";

type DomainStatistics = {
  pre_mean: number;
  post_mean: number;
  pre_proficiency: string;
  post_proficiency: string;
};

type AssessmentStatistics = {
  domains: Record<string, DomainStatistics>;
  sus_score: number;
};

const COLORS = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#3b82f6"];

const shortDomainNames: Record<string, string> = {
  "Basic Computer Skills": "Computer",
  "Document Processing": "Documents",
  "Spreadsheet Skills": "Spreadsheets",
  "Email and Communication": "Email",
  "Internet and Online Platforms": "Internet",
};

const getSusRating = (score: number): { rating: string; color: string } => {
  if (score >= 80.3) return { rating: "Excellent", color: "text-green-500" };
  if (score >= 68) return { rating: "Good", color: "text-green-400" };
  if (score >= 51) return { rating: "Okay", color: "text-yellow-500" };
  return { rating: "Poor", color: "text-red-500" };
};

export default function StatisticsClient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [statsData, setStatsData] = useState<AssessmentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAssessmentStatistics();
        setStatsData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load statistics.");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const chartData = useMemo(() => {
    if (!statsData) return [];
    return Object.entries(statsData.domains).map(([name, values]) => ({
      name: shortDomainNames[name] || name,
      "Before Training": values.pre_mean,
      "After Training": values.post_mean,
    }));
  }, [statsData]);

  const overallScores = useMemo(() => {
    if (!statsData) return { pre: 0, post: 0, improvement: 0 };
    const domainCount = Object.keys(statsData.domains).length;
    if (domainCount === 0) return { pre: 0, post: 0, improvement: 0 };

    const totalPre = Object.values(statsData.domains).reduce((sum, d) => sum + d.pre_mean, 0);
    const totalPost = Object.values(statsData.domains).reduce((sum, d) => sum + d.post_mean, 0);

    const pre = totalPre / domainCount;
    const post = totalPost / domainCount;
    const improvement = pre > 0 ? ((post - pre) / pre) * 100 : 0;

    return {
      pre: pre.toFixed(2),
      post: post.toFixed(2),
      improvement: improvement.toFixed(1),
    };
  }, [statsData]);

  const statCards = useMemo(() => {
    if (!statsData) return [];
    const sus = statsData.sus_score ?? 0;
    const susRating = getSusRating(sus);

    return [
      { id: 1, label: "Initial Average Score", value: overallScores.pre },
      { id: 2, label: "Final Average Score", value: overallScores.post },
      { id: 3, label: "Overall Improvement", value: `${overallScores.improvement}%` },
      {
        id: 4,
        label: "System Usability",
        value: sus.toFixed(1),
        subValue: susRating.rating,
        subColor: susRating.color,
      },
    ];
  }, [statsData, overallScores]);

  const mostImprovedSkill = useMemo(() => {
    if (!statsData) return null;

    let maxImprovement = -Infinity;
    let skillName = "";

    Object.entries(statsData.domains).forEach(([name, values]) => {
      const improvement = values.post_mean - values.pre_mean;
      if (improvement > maxImprovement) {
        maxImprovement = improvement;
        skillName = name;
      }
    });

    return skillName ? { name: skillName, improvement: `+${maxImprovement.toFixed(2)} points` } : null;
  }, [statsData]);

  const proficiencyDistribution = useMemo(() => {
    if (!statsData) return { pre: [], post: [] };

    const countProficiency = (type: "pre" | "post") => {
      const counts: Record<string, number> = {};
      Object.values(statsData.domains).forEach((domain) => {
        const level = type === "pre" ? domain.pre_proficiency : domain.post_proficiency;
        counts[level] = (counts[level] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    return {
      pre: countProficiency("pre"),
      post: countProficiency("post"),
    };
  }, [statsData]);

  if (loading) {
    return (
      <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <div className="max-w-7xl mx-auto relative z-10">
          <TopBar />
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
        <div className="max-w-7xl mx-auto relative z-10">
          <TopBar />
          <div className={`mt-6 flex items-start gap-3 p-4 rounded-2xl border text-sm ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex-1 p-6 relative overflow-hidden ${
        isDark ? "text-white" : "text-black"
      }`}
    >
      {/* Background */}
      <div className="max-w-7xl mx-auto relative z-10">
        <TopBar />
        <h1 className="text-3xl font-bold mt-6">Training Progress & Impact</h1>
        <p
          className={`mt-1 max-w-3xl ${isDark ? "text-zinc-400" : "text-gray-600"}`}
        >
          Here’s a simple look at how digital skills have improved after the training program.
        </p>

        {/* ---------------- STAT CARDS ---------------- */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {statCards.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl p-4 backdrop-blur-md ${
                isDark ? "bg-white/5" : "bg-white/90"
              }`}
            >
              <div
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {s.label}
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold mt-2">{s.value}</div>
                {s.subValue && s.subColor && <div className={`text-sm font-semibold ${s.subColor}`}>{s.subValue}</div>}
              </div>

            </div>
          ))}
        </div>

        {/* ---------------- CHARTS ---------------- */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Assessment Score Comparison */}
          <div
            className={`p-6 rounded-xl ${
              isDark ? "bg-white/5" : "bg-white/90"
            }`}
          >
            <h2 className="font-semibold mb-4">Skill Growth: Before vs. After</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                <XAxis dataKey="name" tick={{ fill: isDark ? "#a1a1aa" : "#374151", fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fill: isDark ? "#a1a1aa" : "#374151", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                    borderRadius: "0.75rem",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "14px" }} />
                <Bar dataKey="Before Training" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="After Training" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Most Improved Skill */}
          {mostImprovedSkill && (
            <div className={`p-6 rounded-xl flex flex-col items-center justify-center text-center ${isDark ? "bg-white/5" : "bg-white/90"}`}>
              <h2 className="font-semibold mb-2">Top Improvement Area</h2>
              <div className="text-4xl text-accentGreen">🎉</div>
              <p className="mt-2 text-lg font-bold">{mostImprovedSkill.name}</p>
              <p className={`text-sm ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                saw the biggest score increase of <span className="font-bold text-accentGreen">{mostImprovedSkill.improvement}</span>.
              </p>
            </div>
          )}
        </div>
        <div className={`p-6 rounded-xl mt-6 ${isDark ? "bg-white/5" : "bg-white/90"}`}>
          <h2 className="font-semibold mb-4">Overall Skill Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-center text-sm font-medium mb-2">Skill Levels Before Training</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={proficiencyDistribution.pre} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {proficiencyDistribution.pre.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-center text-sm font-medium mb-2">Skill Levels After Training</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={proficiencyDistribution.post} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {proficiencyDistribution.post.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}