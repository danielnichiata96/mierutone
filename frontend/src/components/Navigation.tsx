"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnalyticsIcon, BookIcon, TargetIcon } from "./icons/DoodleIcons";

const navLinks = [
  { href: "/", label: "Praticar", icon: AnalyticsIcon },
  { href: "/learn", label: "Aprender", icon: BookIcon },
  { href: "/examples", label: "Exemplos", icon: TargetIcon },
];

export function Navigation() {
  const pathname = usePathname();

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

          {/* Navigation Links */}
          <nav className="flex gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-riso font-medium text-sm
                    transition-all duration-200
                    ${isActive
                      ? "bg-primary-500 text-ink-black shadow-riso"
                      : "text-ink-black/60 hover:text-ink-black hover:bg-primary-300/20"
                    }
                  `}
                >
                  <link.icon size={16} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
