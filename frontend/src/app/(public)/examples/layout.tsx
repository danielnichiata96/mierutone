import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Example Library | Japanese Pitch Accent",
  description: "Browse curated Japanese examples organized by category: greetings, minimal pairs, verbs, adjectives, and more. Click to analyze pitch patterns.",
};

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
