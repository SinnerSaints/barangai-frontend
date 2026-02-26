import type { Metadata } from "next";
import "./globals.css";

import { League_Spartan, Sonsie_One, Poppins, Inter, Archivo_Black } from "next/font/google";

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
    <html lang="en">
      <body className={`${leagueSpartan.variable} ${senseiOne.variable} ${poppins.variable} bg-brandGreen text-white`}>
        {children}
      </body>
    </html>
  );
}