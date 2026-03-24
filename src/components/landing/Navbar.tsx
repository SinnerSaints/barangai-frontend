"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import { HiMenu, HiX, HiArrowUp } from "react-icons/hi";
import Image from "next/image";
import heroImg from "@/assets/img/hero.png";
import ProfileMenu from "@/components/ui/ProfileMenu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const links = ["Home", "About us", "Contact us"];
  const auth = useAuth();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="w-full overflow-true px-8 md:px-16 py-6 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold font-inter text-white hover:scale-105 transition-transform duration-300">
        Barang<span className="text-accentGreen text-3xl font-league">AI</span>
      </Link>

      {/* Desktop Links */}
      <ul className="hidden md:flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[16px] text-white font-inter backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        {links.map((link) => (
          <li key={link}>
            <Link
              href={link === "Contact us" ? "/contact" : "#"}
              className="block rounded-full px-4 py-2 text-white/90 transition-all duration-300 hover:bg-white/20 hover:text-accentGreen hover:shadow-[0_0_20px_rgba(157,225,106,0.25)]"
            >
              {link}
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
        <div className="absolute top-full left-0 w-full bg-brandGreen/95 backdrop-blur-md flex flex-col items-center py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link}
              href={link === "Register" ? "/auth" : "#"}
              className="py-2 text-white hover:text-accentGreen text-lg transition-colors duration-300"
            >
              {link}
            </Link>
          ))}
          <button className="mt-2 bg-accentGreen text-black px-5 py-2 rounded-full shadow-lg hover:-translate-y-1 hover:opacity-90 transition-all duration-300">
            Contact us
          </button>
        </div>
      )}
    </nav>
  );
};

export default function Home() {
  const [showTop, setShowTop] = useState(false);

  // Show "scroll to top" button after scrolling down
  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar />
    </>
  );
}
