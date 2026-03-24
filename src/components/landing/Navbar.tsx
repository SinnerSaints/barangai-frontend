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
    { name: "Contact us", href: "/contact" },
  ];

  return (
    <nav className="w-full px-8 md:px-16 py-6 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-bold font-inter text-white hover:scale-105 transition-transform duration-300"
      >
        Barang<span className="text-accentGreen text-3xl font-league">AI</span>
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
        <Link
          href="/auth"
          className="hidden md:inline-block bg-accentGreen text-black px-5 py-2 rounded-full shadow-lg hover:-translate-y-1 hover:opacity-90 transition-all duration-300"
        >
          Join us
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
            <Link
              href="/auth"
              className="mt-3 bg-accentGreen text-black px-5 py-2 rounded-full shadow-lg hover:-translate-y-1 hover:opacity-90 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              Join us
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default function Home() {
  return (
    <>
      <Navbar />
    </>
  );
}