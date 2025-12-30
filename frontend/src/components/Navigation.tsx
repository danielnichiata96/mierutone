"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { AnalyticsIcon, BookIcon, TargetIcon } from "./icons/DoodleIcons";
import { useAuth } from "@/hooks/useAuth";
import { getSubscriptionStatus, SubscriptionStatus } from "@/lib/api";

const navLinks = [
  { href: "/app", label: "Practice", icon: AnalyticsIcon },
  { href: "/learn", label: "Learn", icon: BookIcon },
  { href: "/examples", label: "Examples", icon: TargetIcon },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch subscription status for logged-in users
  useEffect(() => {
    if (user) {
      getSubscriptionStatus().then(setSubscription).catch(() => {
        // Default to free if fetch fails
        setSubscription({ plan: "free", status: null, current_period_end: null, cancel_at_period_end: false });
      });
    }
  }, [user]);

  return (
    <header className="border-b-2 border-ink-black/10 bg-paper-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-5">
              <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-500 riso-multiply left-0 top-0.5" />
              <span className="absolute w-3.5 h-3.5 rounded-full bg-accent-500 riso-multiply left-1.5 top-0" />
              <span className="absolute w-3.5 h-3.5 rounded-full bg-energy-500 riso-multiply left-3 top-0.5" />
            </div>
            <span className="font-display font-bold text-lg text-ink-black group-hover:text-primary-500 transition-colors">
              MieruTone
            </span>
          </Link>

          {/* Navigation Links + User Menu */}
          <div className="flex items-center gap-4">
            <nav className="flex gap-1" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-label={link.label}
                    aria-current={isActive ? "page" : undefined}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-riso font-medium text-sm
                      transition-all duration-200
                      ${isActive
                        ? "bg-primary-500 text-ink-black shadow-riso"
                        : "text-ink-black/60 hover:text-ink-black hover:bg-primary-300/20"
                      }
                    `}
                  >
                    <link.icon size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Upgrade Button (for free users) */}
            {user && subscription && subscription.plan === "free" && (
              <Link
                href="/pricing"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium rounded-riso hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade
              </Link>
            )}

            {/* User Menu / Sign In */}
            {!loading && (
              user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-riso hover:bg-ink-black/5 transition-colors"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full border-2 border-ink-black/10"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-300 flex items-center justify-center text-sm font-bold text-ink-black">
                        {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 text-ink-black/40 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-paper-white border-2 border-ink-black/10 rounded-riso shadow-riso py-2 z-50">
                      <div className="px-4 py-2 border-b border-ink-black/10">
                        <p className="text-sm font-medium text-ink-black truncate">
                          {user.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs text-ink-black/50 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-ink-black/70 hover:bg-ink-black/5 hover:text-ink-black transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {subscription && subscription.plan === "free" && (
                        <Link
                          href="/pricing"
                          className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          Upgrade to Pro
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-ink-black/70 hover:bg-ink-black/5 hover:text-ink-black transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  className="px-4 py-2 text-sm font-medium text-ink-black/60 hover:text-ink-black border-2 border-ink-black/10 hover:border-ink-black/30 rounded-riso transition-all"
                >
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
