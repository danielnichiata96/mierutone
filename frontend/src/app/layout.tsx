import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PitchLab JP | Japanese Pitch Accent Training",
    template: "%s | PitchLab JP",
  },
  description: "Master Japanese pitch accent with cozy, gamified ear training. PitchLab JP helps learners see the invisible structure of Japanese Audio.",
  keywords: [
    "Japanese pitch accent",
    "Japanese ear training",
    "Japanese pronunciation",
    "Ojad",
    "Dogen",
    "Japanese intonation",
    "Pitch pattern practice",
  ],
  authors: [{ name: "PitchLab Team" }],
  creator: "PitchLab Team",
  publisher: "PitchLab JP",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pitchlab.jp", // Placeholder domain
    title: "PitchLab JP | Master Japanese Pitch Accent",
    description: "Cozy, gamified ear training for Japanese learners. Visualize and practice pitch patterns.",
    siteName: "PitchLab JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchLab JP",
    description: "Master Japanese pitch accent with cozy ear training.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "PitchLab JP",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "description": "A cozy, gamified web application for training Japanese pitch accent listening skills.",
      "featureList": [
        "Interactive playback",
        "Pitch vizualization",
        "Gamified quizzes",
        "Cozy design",
      ],
    },
    {
      "@type": "LearningResource",
      "name": "Japanese Pitch Accent Ear Training",
      "description": "Interactive exercises to distinguish between Heiban, Atamadaka, Nakadaka, and Odaka patterns.",
      "educationalLevel": "Beginner to Advanced",
      "teaches": "Japanese Pitch Accent",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-paper-white text-ink-black font-medium antialiased">
        <Navigation />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
