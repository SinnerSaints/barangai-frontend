"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useTheme } from "@/context/theme";

export default function ContactUsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      // demo: client-side only. Replace with real API call as needed.
      await new Promise((r) => setTimeout(r, 700));

      // Example API call (uncomment & adapt):
      // await fetch('/api/contact', { method: 'POST', body: JSON.stringify({ name, email, message }), headers: { 'Content-Type': 'application/json' } })

      setStatus({ ok: true, msg: 'Thanks! Your message was sent.' });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus({ ok: false, msg: 'Something went wrong — please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="text-white px-6 py-12 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl space-y-10 md:space-y-12">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br p-6">
          <div className="pointer-events-none absolute -right-32 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accentGreen/12 blur-[90px]" />
          <div className="pointer-events-none absolute -left-24 top-0 h-48 w-48 rounded-full bg-accentGreen/8 blur-[60px]" />

          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 items-start">
              <div className={`rounded-2xl p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] border ${isDark ? 'bg-black/30 border-white/10' : 'bg-white/5 border-white/10'}`}>
                <h2 className="text-2xl font-bold">Get in touch</h2>
                <p className="mt-3 text-sm text-white/70">Have questions or need help with BarangAI? Drop us a message and we’ll get back to you as soon as possible.</p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-3 bg-accentGreen text-black inline-flex"><Mail className="w-5 h-5" /></div>
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-xs text-white/60">support@barangai.org</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-3 bg-accentGreen text-black inline-flex"><Phone className="w-5 h-5" /></div>
                    <div>
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-xs text-white/60">+63 912 345 6789</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-3 bg-accentGreen text-black inline-flex"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <div className="text-sm font-medium">Office</div>
                      <div className="text-xs text-white/60">University of Cebu — IT Lab</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/6 pt-6">
                  <h4 className="text-sm font-semibold">Hours</h4>
                  <div className="mt-2 text-xs text-white/60">Mon — Fri: 9:00AM – 5:00PM</div>
                </div>
              </div>

              <div className={`rounded-2xl p-8 shadow-[0_18px_55px_rgba(0,0,0,0.5)] border ${isDark ? 'bg-black/40 border-white/10' : 'bg-white/5 border-white/10'}`}>
                <h3 className="text-lg font-semibold">Send us a message</h3>
                <p className="mt-2 text-sm text-white/70">We typically respond within 1-2 business days.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="sr-only">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className={`w-full rounded-lg px-4 py-3 border focus:ring-2 focus:ring-accentGreen bg-transparent ${isDark ? 'border-white/6 text-white' : 'border-white/10 text-white'}`}
                    />
                  </div>

                  <div>
                    <label className="sr-only">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      type="email"
                      required
                      className={`w-full rounded-lg px-4 py-3 border focus:ring-2 focus:ring-accentGreen bg-transparent ${isDark ? 'border-white/6 text-white' : 'border-white/10 text-white'}`}
                    />
                  </div>

                  <div>
                    <label className="sr-only">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      rows={5}
                      required
                      className={`w-full rounded-lg px-4 py-3 border focus:ring-2 focus:ring-accentGreen resize-y bg-transparent ${isDark ? 'border-white/6 text-white' : 'border-white/10 text-white'}`}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-full bg-accentGreen px-4 py-2 text-sm font-semibold text-black hover:brightness-95"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Sending…' : 'Send message'}
                    </button>

                    {status && (
                      <div className={`text-sm ${status.ok ? 'text-accentGreen' : 'text-red-400'}`}>{status.msg}</div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
