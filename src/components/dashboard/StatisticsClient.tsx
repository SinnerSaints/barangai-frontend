"use client";

import Image from "next/image";
import TopBar from "@/components/dashboard/TopBar";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

type Stat = {
  id: number;
  label: string;
  value: string | number;
};

export default function StatisticsClient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  /* ---------------- MOCK DATA ---------------- */

  const stats: Stat[] = [
    { id: 1, label: "Digital Literacy Score", value: "3.8 / 5" },
    { id: 2, label: "Tasks Assisted", value: 124 },
    { id: 3, label: "AI Help Requests", value: 67 },
    { id: 4, label: "Errors Detected", value: 12 },
    { id: 5, label: "Officials Using System", value: 11 },
    { id: 6, label: "Avg Task Completion Time", value: "2m 34s" }
  ];

  const aiRequests = [
    { day: "Mon", requests: 5 },
    { day: "Tue", requests: 9 },
    { day: "Wed", requests: 6 },
    { day: "Thu", requests: 11 },
    { day: "Fri", requests: 13 },
    { day: "Sat", requests: 8 },
    { day: "Sun", requests: 7 }
  ];

  const taskCompletion = [
    { task: "Word", time: 3 },
    { task: "Excel", time: 4 },
    { task: "Email", time: 2 },
    { task: "Reports", time: 5 }
  ];

  const skillDistribution = [
    { name: "Limited", value: 2 },
    { name: "Moderate", value: 4 },
    { name: "Competent", value: 3 },
    { name: "Highly Competent", value: 2 }
  ];

  const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"];

  /* ---------------- UI ---------------- */

  return (
    <main
      className={`flex-1 p-6 relative overflow-hidden ${
        isDark ? "text-white" : "text-black"
      }`}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={isDark ? chatBgDark : chatBgLight}
          alt="background"
          fill
          className="object-cover opacity-95"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <TopBar />

        <h1 className="text-2xl font-bold mt-6">
          BarangAI Analytics Dashboard
        </h1>

        {/* ---------------- STAT CARDS ---------------- */}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {stats.map((s) => (
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

              <div className="text-2xl font-bold mt-2">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ---------------- CHARTS ---------------- */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

          {/* AI Requests Chart */}

          <div
            className={`p-6 rounded-xl ${
              isDark ? "bg-white/5" : "bg-white/90"
            }`}
          >
            <h2 className="font-semibold mb-4">AI Assistance Requests</h2>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={aiRequests}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#22c55e"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Task Completion Chart */}

          <div
            className={`p-6 rounded-xl ${
              isDark ? "bg-white/5" : "bg-white/90"
            }`}
          >
            <h2 className="font-semibold mb-4">
              Avg Task Completion Time (minutes)
            </h2>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={taskCompletion}>
                <XAxis dataKey="task" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="time" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Skill Distribution */}

          <div
            className={`p-6 rounded-xl ${
              isDark ? "bg-white/5" : "bg-white/90"
            }`}
          >
            <h2 className="font-semibold mb-4">Digital Skill Distribution</h2>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={skillDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                >
                  {skillDistribution.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </main>
  );
}