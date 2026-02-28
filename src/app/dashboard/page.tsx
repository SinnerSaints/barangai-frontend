"use client";

import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import CardsRow from "@/components/dashboard/CardsRow";

export default function DashboardPage() {
	const [collapsed, setCollapsed] = React.useState(false);

	// initialize collapsed state from localStorage on mount
	React.useEffect(() => {
		try {
			const v = localStorage.getItem("sidebar_collapsed");
			if (v !== null) setCollapsed(v === "true");
		} catch (err) {
			// ignore
		}
	}, []);

	const toggle = () => {
		setCollapsed((s) => {
			const next = !s;
			try {
				localStorage.setItem("sidebar_collapsed", String(next));
			} catch {}
			return next;
		});
	};

	return (
		<div className="min-h-screen bg-[#0b0b0b] text-white flex">
			<Sidebar collapsed={collapsed} onToggle={toggle} />

			<main className="flex-1 p-6">
				<div className="max-w-[1200px] mx-auto">
					  <TopBar />

					<div className="mt-6">
						<DashboardHero />
						<CardsRow apiUrl={undefined} />
					</div>
				</div>
			</main>
		</div>
	);
}
