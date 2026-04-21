"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { HiMenu, HiX } from "react-icons/hi";
import ProfileMenu from "@/components/ui/ProfileMenu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const auth = useAuth();

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/aboutus" },
    { name: "Contact", href: "/contactus" },
  ];

  // Subtle glass effect intensifies on scroll for that premium feel
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full flex justify-center px-4 pt-6 pb-2 z-50 relative">
      <nav 
        className={`w-full max-w-6xl flex justify-between items-center px-5 py-3 md:px-8 md:py-4 rounded-full border transition-all duration-500 ease-out backdrop-blur-2xl ${
          scrolled 
            ? "bg-[#034440]/40 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)]" 
            : "bg-white/[0.02] border-white/5 shadow-none"
        }`}
      >
        {/* Classy Logo: Tight tracking, glowing accent, minimalist scale */}
        <Link
          href="/"
          className="group flex items-center gap-[1px]"
        >
          <span className="font-inter text-xl font-medium tracking-tight text-white transition-opacity duration-300 group-hover:opacity-80">
            Barang
          </span>
          <span className="font-league text-[26px] font-bold text-accentGreen drop-shadow-[0_0_12px_rgba(157,225,106,0.25)] transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(157,225,106,0.6)]">
            AI
          </span>
        </Link>

        {/* Desktop Links: Stripped back, floating text with elegant hovers */}
        <ul className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className="relative text-sm font-medium tracking-wide text-white/60 transition-colors duration-300 hover:text-white"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop Controls */}
        {auth.isAuthenticated ? (
          <div className="hidden md:flex items-center gap-4">
            <ProfileMenu compact />
          </div>
        ) : (
          /* Premium "Ghost to Solid" Button */
          <Link
            href="/auth"
            className="group hidden md:inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_24px_rgba(255,255,255,0.2)]"
          >
            Log In
            <svg 
              className="w-4 h-4 opacity-50 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        )}

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isOpen ? <HiX size={26} /> : <HiMenu size={26} />}
          </button>
        </div>
      </nav>

      {/* Floating Glass Mobile Menu */}
      {isOpen && (
        <div className="absolute top-[80px] inset-x-4 z-40 md:hidden">
          <div className="flex flex-col items-center py-6 gap-6 rounded-3xl border border-white/10 bg-[#034440]/90 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-white/80 hover:text-accentGreen transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {!auth.isAuthenticated && (
              <Link
                href="/auth"
                className="mt-2 flex items-center justify-center w-[80%] rounded-full bg-white px-6 py-3 text-base font-semibold text-black transition-transform active:scale-95"
                onClick={() => setIsOpen(false)}
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;