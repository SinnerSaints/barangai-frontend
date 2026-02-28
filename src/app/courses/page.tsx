import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import CoursesList from "@/components/courses/CoursesList";

export const metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <TopBar />
          <h1 className="text-2xl font-bold mt-6">Courses</h1>
          <p className="text-gray-400 mt-2">Browse available courses — mock data shown below.</p>
          <CoursesList apiUrl={undefined} />
        </div>
      </main>
    </div>
  );
}
