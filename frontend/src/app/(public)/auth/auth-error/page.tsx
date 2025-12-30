"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error") || "An unknown error occurred";

    return (
        <main className="min-h-screen bg-paper-white flex items-center justify-center px-6">
            <div className="riso-card p-8 max-w-md w-full text-center border-accent-500">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-500 font-bold text-xl">
                        !
                    </div>
                </div>

                <h1 className="font-display text-2xl font-bold text-ink-black mb-2">
                    Authentication Failed
                </h1>
                <p className="text-ink-black/60 mb-8">
                    We couldn't sign you in.
                </p>

                <div className="bg-ink-black/5 p-4 rounded-riso mb-8 text-sm font-mono text-ink-black/80 break-words">
                    {error}
                </div>

                <Link
                    href="/login"
                    className="block w-full px-4 py-3 bg-primary-500 text-ink-black rounded-riso hover:bg-primary-400 hover:shadow-riso transition-all font-medium"
                >
                    Try Again
                </Link>

                <div className="mt-4">
                    <Link href="/" className="text-sm text-ink-black/40 hover:text-ink-black transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthErrorContent />
        </Suspense>
    );
}
