import Sidebar from "@/components/dashboard/Sidebar";
import StatisticsClient from "@/components/dashboard/StatisticsClient";

export const metadata = { title: "Statistics" };

export default function StatisticsPage() {
  const stats = [
    { id: 1, label: "Active learners", value: 1245 },
    { id: 2, label: "Courses", value: 42 },
    { id: 3, label: "Assessments", value: 12 },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <StatisticsClient/>
    </div>
  );
}
