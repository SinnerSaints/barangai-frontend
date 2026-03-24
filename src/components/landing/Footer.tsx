import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/aboutus" },
  { label: "Contact us", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-8 md:px-16 py-12 md:py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/"
              className="inline-block text-2xl font-bold font-inter text-white hover:opacity-90 transition-opacity"
            >
              Barang<span className="text-accentGreen text-3xl font-league">AI</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-white/70 leading-relaxed">
              Real-time AI support to strengthen digital literacy for barangay officials.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accentGreen">
              Quick links
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/80 hover:text-accentGreen transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} BarangAI. University of Cebu — Computer Studies.
          </p>
          <p>Thesis capstone project.</p>
        </div>
      </div>
    </footer>
  );
}
