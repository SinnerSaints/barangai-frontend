import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth";
import { ThemeProvider } from "@/context/theme";
import ClientWrapper from "@/components/dashboard/ClientWrapper";
import { Geist, League_Spartan, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-league",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "BarangAI",
  description: "Empowering Barangays one click at a time",
};

// The improved, professional warning message
const warningText = "BARANGAI IS CURRENTLY UNDER ACTIVE DEVELOPMENT. YOU MAY ENCOUNTER BUGS OR UNEXPECTED DISRUPTIONS. THANK YOU FOR YOUR PATIENCE.";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(geist.variable, leagueSpartan.variable, manrope.variable)}>
      <body className="bg-background text-foreground min-h-screen relative flex flex-col">
        
        {/* Inline style for the continuous scrolling loop */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: inline-block;
            white-space: nowrap;
            animation: marquee 30s linear infinite;
          }
          /* Pause the loop when the user hovers over it */
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
        
        {/* Looping Maintenance Banner */}
        <div className="w-full bg-[#9DE16A] text-[#034440] py-1.5 overflow-hidden flex items-center shrink-0 z-[100] border-b border-[#9DE16A]/50 shadow-sm relative">
          <div className="w-max animate-marquee font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] cursor-default">
            {/* Repeating the text multiple times ensures a seamless loop */}
            <span className="mx-4">{warningText}</span>
            <span className="mx-4">{warningText}</span>
            <span className="mx-4">{warningText}</span>
            <span className="mx-4">{warningText}</span>
          </div>
        </div>

        {/* Main Application Providers and Content */}
        <AuthProvider>
          <ThemeProvider>
            <ClientWrapper>
              <main className="flex-1 w-full">
                {children}
              </main>
            </ClientWrapper>
          </ThemeProvider>
        </AuthProvider>
        
      </body>
    </html>
  );
}