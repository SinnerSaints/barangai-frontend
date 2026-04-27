import Link from "next/link";
import { Clock3, ShieldAlert } from "lucide-react";

type PendingApprovalPageProps = {
  searchParams?: Promise<{ email?: string }>;
};

export default async function PendingApprovalPage({ searchParams }: PendingApprovalPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const email = params?.email || "";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <ShieldAlert size={26} />
        </div>

        <h1 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Waiting for Admin Approval
        </h1>

        <p className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-300">
          Your Google account has been recognized, but access is locked until an admin approves your account.
        </p>

        {email ? (
          <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Account: <span className="font-semibold">{email}</span>
          </p>
        ) : null}

        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
          <p className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <Clock3 size={16} />
            Approval usually takes a short while. Please check back later.
          </p>
        </div>

        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            href="/auth"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-accentGreen dark:text-zinc-900"
          >
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
