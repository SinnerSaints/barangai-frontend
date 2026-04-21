"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";
import ProfileMenu from "@/components/ui/ProfileMenu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const auth = useAuth();

  // ✅ Clean link structure
  const links = [
    { name: "Home", href: "/" },
    { name: "About us", href: "/aboutus" },
    { name: "Contact us", href: "/contactus" },
  ];

  return (
    <nav className="w-full px-8 md:px-16 py-6 flex justify-between items-center transition-all duration-300">
      
      {/* DIY Premium Logo Text: 
        Uses tight tracking on "Barang" and heavy font-weight on "AI" 
        to create a modern, high-end tech aesthetic.
      */}
      <Link
        href="/"
        className="group flex items-baseline text-white transition-all duration-300 hover:scale-[1.02]"
      >
        <span className="font-sans text-2xl font-semibold tracking-tighter opacity-90">
          Barang
        </span>
        <span className="font-league text-[28px] font-black tracking-normal text-accentGreen ml-[1px] drop-shadow-[0_0_12px_rgba(157,225,106,0.25)] group-hover:drop-shadow-[0_0_20px_rgba(157,225,106,0.5)] transition-all duration-300">
          AI
        </span>
      </Link>

      {/* Desktop Links */}
      <ul className="hidden md:flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[16px] text-white font-inter backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="block rounded-full px-4 py-2 text-white/90 transition-all duration-300 hover:bg-white/20 hover:text-accentGreen hover:shadow-[0_0_20px_rgba(157,225,106,0.25)]"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop Button / Profile */}
      {auth.isAuthenticated ? (
        <div className="hidden md:flex items-center gap-4">
          <ProfileMenu compact />
        </div>
      ) : (
        /* Pure Glassy Log In Button (No Arrow) */
        <Link
          href="/auth"
          className="hidden md:inline-flex items-center justify-center rounded-full border border-white/20 bg-accentGreen/80 px-7 py-2 text-sm font-medium text-black backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_20px_rgba(157,225,106,0.15)] hover:text-accentGreen"
        >
          Log In
        </Link>
      )}

      {/* Mobile Hamburger */}
      <div className="md:hidden text-white">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <HiX size={28} /> : <HiMenu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-brandGreen/95 backdrop-blur-md flex flex-col items-center py-4 md:hidden z-50">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="py-2 text-white hover:text-accentGreen text-lg transition-colors duration-300"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          {!auth.isAuthenticated && (
            /* Glassy Mobile Log In Button (No Arrow) */
            <Link
              href="/auth"
              className="mt-3 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-10 py-2.5 text-base font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:text-accentGreen"
              onClick={() => setIsOpen(false)}
            >
              Log In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;