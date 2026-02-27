import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Featured from "@/components/landing/Featured";
import ChatFeature from "@/components/landing/ChatFeature";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Featured />
      <ChatFeature />
    </>
  );
}