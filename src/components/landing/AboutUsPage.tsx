"use client";

import Link from "next/link";
import { useState, type ComponentType } from "react";
import { Code2, Database, Layers, Sparkles } from "lucide-react";

const teamMembers = [
  {
    name: "Neil Andre Ibona",
    role: "Project Lead | Researcher | Fullstack Developer | UI/UX Designer",
    focus: "Fullstack development, UI/UX design, AI engineering, and Project Management.",
    image:
      "https://i.postimg.cc/yxKRw9ck/Unknown3123.jpg",
  },
  {
    name: "Jamescarl A. Galvez",
    role: "Data Analyst | Researcher | Technical Writer | System Tester",
    focus: "Data analysis, Implementation support, testing, and technical documentation.",
    image:
      "https://scontent.fceb9-1.fna.fbcdn.net/v/t39.30808-6/517381743_718962401097017_7959348603691953503_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeEky4kVg7PYQzjfXtoap_MBPGYMfQqzwXg8Zgx9CrPBeKszmzSbWMYJBcaVI2Win1JLnEeVHVlhd43NtZE9tHL_&_nc_ohc=-Uy3hKI88TQQ7kNvwHF7lac&_nc_oc=AdqjLFo90GOo76D02uCwvNNSretTQ0QvYpLfTYOrVKJ0QubVevb4PYtn5kl79tw7AZk&_nc_zt=23&_nc_ht=scontent.fceb9-1.fna&_nc_gid=-Y0mU2mk2wh9_qtFRpLnkg&_nc_ss=7b2a8&oh=00_Af2xpHcdeE-YEWHfb6mUJQFdq29VzbPvKffOesgfY7pkqw&oe=69F560B7",
  },
  {
    name: "Clint Joseph S. Ubanan",
    role: "Backend Developer | Researcher| AI Engineer | Database Engineer",
    focus: "Backend development, AI engineering, database engineering.",
    image:
      "https://i.postimg.cc/cC5sQGxr/Unknown424234.jpg",
  },
];

const toolsUsed = [
  {
    category: "Language",
    items: [
      {
        name: "TypeScript",
        logo: "https://cdn.simpleicons.org/typescript/3178C6",
      },
      {
        name: "Python",
        logo: "https://cdn.simpleicons.org/python/3776AB",
      },
    ],
  },
  {
    category: "Framework",
    items: [
      {
        name: "Next.js",
        logo: "https://cdn.simpleicons.org/nextdotjs/FFFFFF",
      },
      {
        name: "React",
        logo: "https://cdn.simpleicons.org/react/61DAFB",
      },
      {
        name: "Django",
        logo: "https://cdn.simpleicons.org/django/44B78B",
      },
      {
        name: "FastAPI",
        logo: "https://cdn.simpleicons.org/fastapi/009688",
      },
      {
        name: "Tailwind CSS",
        logo: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
      },
    ],
  },
  {
    category: "Artificial Model",
    items: [
      {
        name: "OpenAI",
        logo: "https://api.iconify.design/simple-icons:openai.svg?color=%23FFFFFF",
      },
      {
        name: "scikit-learn",
        logo: "https://cdn.simpleicons.org/scikitlearn/F7931E",
      },
    ],
  },
  {
    category: "Database",
    items: [
      {
        name: "PostgreSQL",
        logo: "https://cdn.simpleicons.org/postgresql/4169E1",
      },
      {
        name: "SQLAlchemy",
        logo: "https://cdn.simpleicons.org/sqlalchemy/D71F00",
      },
    ],
  },
];

const toolsCategoryIcon: Record<string, ComponentType<{ className?: string }>> = {
  Language: Code2,
  Framework: Layers,
  "Artificial Model": Sparkles,
  Database: Database,
};

type ToolsGroup = (typeof toolsUsed)[number];

const toolsByCategory = Object.fromEntries(
  toolsUsed.map((g) => [g.category, g]),
) as Record<string, ToolsGroup>;

function ToolsCategoryCard({ group }: { group: ToolsGroup }) {
  const Icon = toolsCategoryIcon[group.category] ?? Layers;
  return (
    <article className="group/card relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:border-accentGreen/35 hover:shadow-[0_12px_40px_rgba(157,225,106,0.12)] md:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(900px circle at 10% -20%, rgba(157,225,106,0.12), transparent 45%)",
        }}
      />
      <div className="relative flex items-start gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accentGreen/30 bg-accentGreen/15 text-accentGreen shadow-[0_0_24px_rgba(157,225,106,0.25)]">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">{group.category}</h3>
            <p className="text-xs text-white/45">
              {group.items.length} {group.items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-3">
        {group.items.map((tool) => (
          <div
            key={tool.name}
            className="group/tile flex min-w-[calc(50%-0.375rem)] flex-1 basis-[140px] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-3 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-accentGreen/45 hover:shadow-[0_8px_28px_rgba(157,225,106,0.18)] sm:min-w-[120px] sm:basis-auto"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/50 ring-1 ring-white/10 transition-transform duration-300 group-hover/tile:scale-105 group-hover/tile:ring-accentGreen/30">
              <img
                src={tool.logo}
                alt=""
                className="h-7 w-7 object-contain"
                loading="lazy"
              />
            </span>
            <span className="text-center text-xs font-medium leading-snug text-white/90">
              {tool.name}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function AboutUsPage() {
  const [revealedMembers, setRevealedMembers] = useState<Record<string, boolean>>({});

  return (
    <main className="text-white px-6 py-12 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl space-y-10 md:space-y-12">
        {/* About — hero first */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-black/40 to-black/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:p-12 lg:p-14">
          <div
            className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-accentGreen/25 blur-[120px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-accentGreen/10 blur-[90px]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accentGreen/50 to-transparent" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-accentGreen/40 bg-accentGreen/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accentGreen shadow-[0_0_24px_rgba(157,225,106,0.2)]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accentGreen shadow-[0_0_12px_rgba(157,225,106,0.9)]" />
                About Us
              </p>
              <span className="hidden text-xs text-white/40 sm:inline">University of Cebu · Computer Science</span>
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl md:leading-[1.05]">
              We build{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-white via-accentGreen to-accentGreen bg-clip-text text-transparent">
                  BarangAI
                </span>
                <span
                  className="absolute -bottom-1 left-0 right-0 h-2 rounded-full bg-accentGreen/30 blur-md md:h-3"
                  aria-hidden
                />
              </span>{" "}
              <span className="text-white">for smarter barangay work.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium text-white/90 md:text-xl">
              Real-time AI support that helps officials level up digital skills while they get things done.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-sm">
                Barangay-first · Context-aware · Built for real workflows
              </span>
            </div>
          </div>
        </section>

        {/* Research team */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 shadow-[0_18px_55px_rgba(0,0,0,0.5)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accentGreen">
            Research Team
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {teamMembers.map((member) => {
              const roleParts = member.role
                .split("|")
                .map((part) => part.trim())
                .filter(Boolean);
              const primaryRole = roleParts[0] ?? member.role;
              const isRevealed = Boolean(revealedMembers[member.name]);

              return (
                <article
                  key={member.name}
                  onMouseEnter={() =>
                    setRevealedMembers((prev) => ({ ...prev, [member.name]: true }))
                  }
                  onFocus={() =>
                    setRevealedMembers((prev) => ({ ...prev, [member.name]: true }))
                  }
                  className={`group relative overflow-hidden rounded-[2rem] border border-white/15 bg-black/30 shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-500 hover:-translate-y-1 hover:border-accentGreen/45 hover:shadow-[0_24px_70px_rgba(157,225,106,0.2)] ${
                    isRevealed ? "h-[560px] md:h-[600px]" : "h-[420px] md:h-[450px]"
                  }`}
                >
                <div className="relative h-full w-full">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold leading-tight text-white">{member.name}</h3>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accentGreen text-black shadow-[0_0_16px_rgba(157,225,106,0.65)]">
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                        <path d="M7.8 13.9 4.7 10.8l1.4-1.4 1.7 1.7 5-5 1.4 1.4-6.4 6.4Z" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-1 inline-flex items-center gap-2 text-[11px] md:text-[11px] uppercase tracking-[0.12em] text-white/65">
                    <span className="h-1.5 w-1.5 rounded-full bg-accentGreen/80" />
                    {primaryRole}
                  </p>
                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      isRevealed
                        ? "mt-2 max-h-80 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      {roleParts.map((role) => (
                        <span
                          key={`${member.name}-${role}`}
                          className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-white/80"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-white/80 leading-relaxed">
                      {member.focus}
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 fill-none stroke-current"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 3c4.97 0 9 3.36 9 7.5S16.97 18 12 18c-.9 0-1.76-.11-2.57-.31L5 20l1.08-3.24C4.19 15.4 3 13.56 3 10.5 3 6.36 7.03 3 12 3Z"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Get in Touch
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        </section>

        {/* Tools used — stacked tech wall */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-black/30 to-black/50 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)] md:p-10">
          <div
            className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-accentGreen/20 blur-[100px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-accentGreen/10 blur-[90px]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accentGreen/40 to-transparent" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-accentGreen/35 bg-accentGreen/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accentGreen">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Stack
              </p>
              <h2 className="mt-3 text-2xl font-bold md:text-4xl md:tracking-tight">
                Tools we build with
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/75 md:text-base">
                Languages, frameworks, artificial models, and data — one stack, tuned for BarangAI.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45 md:text-right">
              {toolsUsed.reduce((n, g) => n + g.items.length, 0)} technologies · production-ready
            </p>
          </div>

          <div className="relative mt-8 flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {toolsByCategory.Language && <ToolsCategoryCard group={toolsByCategory.Language} />}
              {toolsByCategory["Artificial Model"] && (
                <ToolsCategoryCard group={toolsByCategory["Artificial Model"]} />
              )}
            </div>
            {toolsByCategory.Framework && <ToolsCategoryCard group={toolsByCategory.Framework} />}
            {toolsByCategory.Database && <ToolsCategoryCard group={toolsByCategory.Database} />}
          </div>
        </section>
      </div>
    </main>
  );
}