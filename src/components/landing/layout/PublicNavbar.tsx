"use client";

import type { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";

type PublicNavbarProps = {
  children: ReactNode;
};

export default function PublicNavbar({ children }: PublicNavbarProps) {
  return (
    <div className="relative w-full min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}
