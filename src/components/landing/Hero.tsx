"use client";

import Image from "next/image";
import Link from "next/link";
import heroImg from "@/assets/img/hero.png";
import SplitText from "@/components/ui/text/splitText";
import TextType from "@/components/ui/text/textType";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content min-h-[60vh] flex flex-col justify-center relative z-10 text-center overflow-hidden">
        <h1 className="font-league font-extrabold mr-32 text-center text-[100px] md:text-[90px] leading-tight text-white">
          <TextType
            text={[
              "EMPOWERING",
              "CONNECTING",
              "DIGITALIZING"
            ]}
            typingSpeed={30}
            deletingSpeed={30}
            pauseDuration={2000}
            showCursor
            cursorCharacter="."
          />
          <br />
        </h1>
        <h1 className="font-poppins font-extrabold -mt-14 ml-56 text-center text-stroke text-strokeGreen text-[90px]">
          BARANGAYS
        </h1>

        <SplitText
          text="one click at a time."
          className="font-sonsie text-center font-semibold text-2xl -mt-6 text-white"
          delay={60}
          duration={1.25}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
        />

        <p className="font-inter text-center mt-4 text-[14px] text-white/80 max-w-xl mx-auto">
          Come join us on the path of learning and digital evolution. We are<br />
          here to help you and make technology easier and progressive.
        </p>
      </div>

      {/* Hero Image with Get Started Button */}
      <div className="relative pt-[600px]">
        {/* <Image
          src={heroImg}
          alt="Typing on laptop"
          width={1600}
          height={900}
          className="w-full h-auto max-h-screen object-cover"
          priority
        /> */}
        <Link
          href="/auth">
          <button className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 font-poppins px-8 py-3 bg-[#FFF] text-[#034440] rounded-full hover:brightness-90 transition shadow-lg">
            Get Started 
          </button>
        </Link>
      </div>
    </section>
  );
}