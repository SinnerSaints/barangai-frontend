"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { HiMenu, HiX, HiArrowUp } from "react-icons/hi";
import heroImg from "@/assets/img/hero.png";
import Image from "next/image";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const links = ["Home", "Tutorials", "About us", "Register"];

  return (
    <nav className="w-full px-8 md:px-16 py-6 bg-brandGreen/90 backdrop-blur-md border-b-[1px] border-white/20 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <div className="text-2xl font-bold font-inter text-white hover:scale-105 transition-transform duration-300">
        Barang<span className="text-accentGreen text-3xl font-league">AI</span>
      </div>

      {/* Desktop Links */}
      <ul className="hidden md:flex items-center gap-8 text-[16px] text-white font-inter">
        {links.map((link) => (
          <li key={link}>
            <Link
              href={link === "Register" ? "/auth" : "#"}
              className="px-2 py-1 transition-colors duration-300 hover:text-accentGreen"
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop Button */}
      <Link
        href="/auth"
        className="hidden md:inline-block bg-accentGreen text-black px-5 py-2 rounded-full shadow-lg hover:-translate-y-1 hover:opacity-90 transition-all duration-300"
      >
        Join us
      </Link>

      {/* Mobile Hamburger */}
      <div className="md:hidden text-white">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <HiX size={28} /> : <HiMenu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-brandGreen/95 backdrop-blur-md border-b-[1px] border-white/30 flex flex-col items-center py-4 md:hidden">
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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <Navbar />

      {/* Scroll To Top Button */}
      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-accentGreen text-black p-4 rounded-full shadow-lg hover:-translate-y-1 hover:brightness-90 transition-all duration-300 z-50"
        >
          <HiArrowUp size={24} />
        </button>
      )}
    </>
  );
}