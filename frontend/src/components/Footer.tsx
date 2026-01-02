"use client";

import { Logo } from "./Logo";
import Link from "next/link";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t-2 border-ink-black/10 bg-paper-white/50 backdrop-blur-sm mt-20">
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <Logo size="md" />
                        <p className="text-sm text-ink-black/50 max-w-xs font-medium">
                            See the invisible structure of Japanese pitch accent.
                            Master the melody of the language.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-x-12 gap-y-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-black/40">Product</h4>
                            <ul className="space-y-2">
                                <li><Link href="/" className="text-sm text-ink-black/60 hover:text-primary-500 transition-colors">Analyze</Link></li>
                                <li><Link href="/learn" className="text-sm text-ink-black/60 hover:text-primary-500 transition-colors">Learn</Link></li>
                                <li><Link href="/examples" className="text-sm text-ink-black/60 hover:text-primary-500 transition-colors">Examples</Link></li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-black/40">Community</h4>
                            <ul className="space-y-2">
                                <li><Link href="#" className="text-sm text-ink-black/60 hover:text-primary-500 transition-colors">Discord</Link></li>
                                <li><Link href="#" className="text-sm text-ink-black/60 hover:text-primary-500 transition-colors">GitHub</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-ink-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-ink-black/40">
                        © {currentYear} MieruTone. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-xs text-ink-black/40 hover:text-ink-black">Privacy</Link>
                        <Link href="#" className="text-xs text-ink-black/40 hover:text-ink-black">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
