"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnalyticsIcon } from "./icons/DoodleIcons";

const tools = [
  { href: "/", label: "Analyzer", icon: AnalyticsIcon },
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

          {/* Tool Tabs */}
          <nav className="flex gap-1">
            {tools.map((tool) => {
              const isActive = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-riso font-medium text-sm
                    transition-all duration-200
                    ${isActive
                      ? "bg-primary-500 text-ink-black shadow-riso"
                      : "text-ink-black/60 hover:text-ink-black hover:bg-primary-300/20"
                    }
                  `}
                >
                  <tool.icon size={16} />
                  <span>{tool.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
