"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import { isAdminRole } from "@/lib/roles";
import PreAssessmentEditor from "@/components/admin/PreAssessmentEditor";

export default function AdminPreAssessmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [gate, setGate] = useState<"pending" | "ok">("pending");

  useEffect(() => {
    const role = user?.role || (typeof window !== "undefined" ? localStorage.getItem("user_role") : null);
    if (!isAdminRole(role)) {
      router.replace("/dashboard");
      return;
    }
    setGate("ok");
  }, [user, router]);

  if (gate !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060606] text-white">
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking access…
        </div>
      </div>
    );
  }

  return <PreAssessmentEditor />;
}
