"use client";

import React from "react";
import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import CardsRow from "@/components/dashboard/CardsRow";
import chatBgLight from "@/assets/img/chatBotBg-white.png";
import chatBgDark from "@/assets/img/chatBotBg-black.png";
import { useTheme } from "@/context/theme";

export default function DashboardPage() {
	const [collapsed, setCollapsed] = React.useState(false);
	const { theme } = useTheme();
	const isDark = theme === "dark";

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
			<div className="min-h-screen flex">
				<Sidebar collapsed={collapsed} onToggle={toggle} />

				<main className={`flex-1 p-6 relative overflow-hidden ${isDark ? "text-white" : "text-black"}`}>
					{/* subtle full-bleed background */}
					<div className="absolute inset-0 z-0">
						<Image src={isDark ? chatBgDark : chatBgLight} alt="background" fill className="object-cover opacity-95" />
					</div>

					<div className="max-w-[1200px] mx-auto relative z-10">
						<TopBar />

						<div className="mt-6">
							<DashboardHero />
							<CardsRow />
						</div>
					</div>
				</main>
			</div>
		);
}
