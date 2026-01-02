"use client";

import Link from "next/link";

interface LogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
    className?: string; // Additional classes for the container
    href?: string;
}

export function Logo({
    size = "md",
    showText = true,
    className = "",
    href = "/"
}: LogoProps) {
    // Size mappings
    const dotSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-6 h-6",
        xl: "w-8 h-8",
    };

    const containerSizes = {
        sm: "w-6 h-4",
        md: "w-8 h-5",
        lg: "w-12 h-8",
        xl: "w-16 h-10",
    };

    const dotSpacing = {
        sm: { left: "left-0", mid: "left-1.5", right: "left-3" },
        md: { left: "left-0", mid: "left-2", right: "left-4" },
        lg: { left: "left-0", mid: "left-3", right: "left-6" },
        xl: { left: "left-0", mid: "left-4", right: "left-8" },
    };

    const textSizes = {
        sm: "text-sm",
        md: "text-xl",
        lg: "text-3xl",
        xl: "text-5xl",
    };

    const LogoContent = (
        <div className={`flex items-center gap-2 group ${className}`}>
            {/* 3 Riso Circles */}
            <div className={`relative ${containerSizes[size]}`}>
                <span className={`absolute ${dotSizes[size]} rounded-full bg-primary-500 riso-multiply ${dotSpacing[size].left} top-0.5`} />
                <span className={`absolute ${dotSizes[size]} rounded-full bg-accent-500 riso-multiply ${dotSpacing[size].mid} top-0`} />
                <span className={`absolute ${dotSizes[size]} rounded-full bg-energy-500 riso-multiply ${dotSpacing[size].right} top-0.5`} />
            </div>

            {/* Logotipo */}
            {showText && (
                <span className={`font-logo leading-none text-ink-black/70 group-hover:text-ink-black transition-colors ${textSizes[size]}`}>
                    Mieru<span className="-ml-[0.08em]">Tone</span>
                </span>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href}>
                {LogoContent}
            </Link>
        );
    }

    return LogoContent;
}
