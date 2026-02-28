import Sidebar from "@/components/dashboard/Sidebar";
import CoursesClient from "@/components/courses/CoursesClient";

export const metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <CoursesClient apiUrl={undefined} />
    </div>
  );
}
