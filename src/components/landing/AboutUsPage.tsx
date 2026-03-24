import Link from "next/link";

const teamMembers = [
  {
    name: "Neil Andre Ibona",
    role: "Researcher and Developer",
    focus: "Frontend experience, system integration, and real-time interface flow.",
  },
  {
    name: "Jamescarl A. Galvez",
    role: "Researcher and Developer",
    focus: "UI workflows and practical digital literacy support features.",
  },
  {
    name: "Clint Joseph S. Ubanan",
    role: "Researcher and Developer",
    focus: "Implementation support, testing, and technical documentation.",
  },
];

export default function AboutUsPage() {
  return (

    <main className="min-h-screen bg-[#05070E] text-white px-6 py-12 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <p className="inline-block rounded-full border border-accentGreen/40 bg-accentGreen/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accentGreen">
            About Us
          </p>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
            Building <span className="text-accentGreen">BarangAI</span> for smarter local governance
          </h1>
          <p className="mt-5 max-w-3xl text-white/80 leading-relaxed">
            We are Computer Science students from the University of Cebu developing
            a real-time AI support system that helps barangay officials strengthen
            digital literacy while doing day-to-day administrative tasks.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold text-accentGreen">Our Mission</h2>
            <p className="mt-3 text-white/80 leading-relaxed">
              Make digital upskilling practical, accessible, and continuous for local
              government units through context-aware AI guidance.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold text-accentGreen">Who We Support</h2>
            <p className="mt-3 text-white/80 leading-relaxed">
              Barangay officials, especially those handling documents, reports, and
              communication workflows that require everyday computer use.
            </p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl md:text-3xl font-bold">Meet the Team</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {teamMembers.map((member) => (
              <article
                key={member.name}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors duration-300 hover:border-accentGreen/40"
              >
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="mt-1 text-sm text-accentGreen">{member.role}</p>
                <p className="mt-3 text-sm text-white/75 leading-relaxed">{member.focus}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-2xl font-semibold">Project Snapshot</h2>
          <p className="mt-3 text-white/80 leading-relaxed">
            BarangAI focuses on real-time support, localized language guidance, and
            skill tracking to improve confidence and performance in digital tasks
            within barangay operations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-accentGreen px-5 py-2 text-black font-semibold hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/20 px-5 py-2 text-white hover:border-accentGreen/50 hover:text-accentGreen transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}