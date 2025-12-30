import Link from "next/link";

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-ink-black mb-4">
        History
      </h1>
      <div className="riso-card p-8 text-center">
        <p className="text-ink-black/60 mb-4">
          Full history view coming soon!
        </p>
        <p className="text-sm text-ink-black/40 mb-6">
          For now, check your recent analyses on the Dashboard.
        </p>
        <Link href="/dashboard" className="riso-button-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
