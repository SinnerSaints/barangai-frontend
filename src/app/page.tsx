import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import heroImg from "@/assets/img/hero.png";

export default function Home() {
  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="hero-content bg-brandGreen p-8 md:p-16 min-h-[60vh] flex flex-col justify-center">
          <h1 className="font-league font-extrabold mr-32 text-center text-[100px] md:text-[90px] leading-tight text-white">
            EMPOWERING <br />
          </h1>
            <h1 className="font-poppins font-extrabold -mt-14 ml-56 text-center text-stroke text-strokeGreen text-[90px]">
              BARANGAYS
            </h1>

          <h3 className="font-sonsie text-center font-semibold text-2xl -mt-6 text-white">
            one click at a time.
          </h3>

          <p className="font-inter text-center mt-4 text-[14px] text-white/80">
            Come join us on the path of learning and digital evolution. We are<br/>
            here to help you and make technology easier and progressive.
          </p>
        </div>
      </section>

      <section className="image-section">
        <div className="relative">
          <Image
            src={heroImg}
            alt="Typing on laptop"
            width={1600}
            height={900}
            className="w-full h-auto"
            priority
          />

          <button className="absolute -top-8 left-1/2 border-8 border-[#034440] -translate-x-1/2 font-poppins px-8 py-3 bg-[#9DE16A] text-[#034440] rounded-full hover:brightness-90 transition shadow-lg">
            Get Started →
          </button>
        </div>
      </section>
    </>
  );
}