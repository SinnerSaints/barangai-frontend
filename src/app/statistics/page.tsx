import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export const metadata = { title: "Statistics" };

export default function StatisticsPage() {
  const stats = [
    { id: 1, label: "Active learners", value: 1245 },
    { id: 2, label: "Courses", value: 42 },
    { id: 3, label: "Assessments", value: 12 },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <TopBar />
          <h1 className="text-2xl font-bold mt-6">Statistics</h1>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.id} className="bg-white/5 rounded p-4">
                <div className="text-sm text-gray-400">{s.label}</div>
                <div className="text-2xl font-bold mt-2">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white/5 p-4 rounded">Placeholder charts / visuals (add charting library if needed)</div>
        </div>
      </main>
    </div>
  );
}
