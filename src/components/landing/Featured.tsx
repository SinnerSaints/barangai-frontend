"use client"

import Image from "next/image"
import img1 from "@/assets/img/sample/sample1.png"
import img2 from "@/assets/img/sample/sample2.png"
import img3 from "@/assets/img/sample/sample3.png"
import RotatingText from "@/components/ui/text/RotatingText"


export default function Featured() {
  return (
    <section className="image-section">
      <div className="relative">
        <h1 className="-mt-[280px] font-league font-extrabold text-center text-[100px] md:text-[90px] leading-tight text-white">
          Featured{" "}
          <span className="text-[#9DE16A] inline-block align-middle">
            <RotatingText
              texts={["Courses", "Tutorials", "Lessons"]}
              mainClassName="inline-block"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.03}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </span>
        </h1>

        <div className="flex justify-center gap-8 flex-wrap">
                <div className="w-[300px] md:w-[360px]">
                <Image
                    src={img1}
                    alt="Course 1"
                    width={400}
                    height={300}
                    className="w-full h-auto r shadow-lg"
                />
                </div>

                <div className="w-[300px] md:w-[360px]">
                <Image
                    src={img2}
                    alt="Course 2"
                    width={400}
                    height={300}
                    className="w-full h-auto  shadow-lg"
                />
                </div>

                <div className="w-[300px] md:w-[360px]">
                <Image
                    src={img3}
                    alt="Course 3"
                    width={400}
                    height={300}
                    className="w-full h-auto  shadow-lg"
                />
                </div>
            </div>

            <div className="flex justify-center mt-8 px-50">
              <button className="border-4 border-[#034440] font-poppins px-6 py-2 bg-[#9DE16A] text-[#034440] rounded-full hover:brightness-90 transition shadow-lg">
                View All Courses
              </button>
            </div>

        {/* <button className="absolute -top-8 left-1/2 border-8 border-[#034440] -translate-x-1/2 font-poppins px-8 py-3 bg-[#9DE16A] text-[#034440] rounded-full hover:brightness-90 transition shadow-lg">
          Continue
        </button> */}
      </div>
    </section>
  );
}