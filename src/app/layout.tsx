import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth";
import { ThemeProvider } from "@/context/theme";

import { League_Spartan, Sonsie_One, Poppins, Inter, Archivo_Black, League_Gothic, Pattaya, Manrope, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-league",
});

const senseiOne = Sonsie_One({
  subsets: ["latin"],
  weight: ["400"], 
  variable: "--font-sonsie",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-inter",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-archivo",
});

const league_gothic = League_Gothic({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-league-gothic",
});

const pattaya = Pattaya({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pattaya",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${leagueSpartan.variable} ${manrope.variable} ${senseiOne.variable} ${poppins.variable} ${archivoBlack.variable} ${league_gothic.variable} ${pattaya.variable} bg-brandGreen text-white`}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}