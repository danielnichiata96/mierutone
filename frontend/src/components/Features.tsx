import { WaveIcon, HeadphoneIcon, TargetIcon, BookIcon } from "@/components/icons/DoodleIcons";

const features = [
  {
    icon: WaveIcon,
    title: "Instant Visualization",
    description: "Type any Japanese text and see pitch patterns instantly. No guessing, no confusion.",
    color: "bg-primary-300",
  },
  {
    icon: HeadphoneIcon,
    title: "Native Audio",
    description: "Listen to natural pronunciation powered by Azure Neural TTS. Hear the melody clearly.",
    color: "bg-secondary-300",
  },
  {
    icon: TargetIcon,
    title: "Compare Your Voice",
    description: "Record yourself and compare pitch contours with native audio. See where you differ.",
    color: "bg-accent-300",
  },
  {
    icon: BookIcon,
    title: "Learn the Patterns",
    description: "Understand Heiban, Atamadaka, Nakadaka, Odaka. 80+ curated examples to practice.",
    color: "bg-energy-300",
  },
];

export function Features() {
  return (
    <section className="py-16">
      <div className="text-center mb-10">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
          Everything you need to master pitch
        </h2>
        <p className="text-ink-black/60 max-w-xl mx-auto">
          Simple tools that actually help you improve. No fluff, just results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <div key={feature.title} className="riso-card p-6 flex gap-4">
            <div className={`w-12 h-12 rounded-riso ${feature.color} flex items-center justify-center flex-shrink-0`}>
              <feature.icon size={24} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg mb-1">{feature.title}</h3>
              <p className="text-ink-black/60 text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
