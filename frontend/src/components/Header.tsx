import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="pb-8 mb-10 border-b-2 border-ink-black/10">
      <div className="flex items-center gap-3 mb-4">
        {/* Logo dots - Riso ink overlay effect */}
        <Logo showText={false} size="lg" href={undefined} />
        <span className="riso-badge">Pitch Accent Training</span>
      </div>

      <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-none mb-4">
        See the Invisible Structure
        <br />
        <span className="text-primary-500">of Japanese</span>
      </h1>

      <p className="text-lg text-ink-black/60 max-w-2xl font-medium">
        Stop sounding like a robot. Visualize pitch accent patterns,
        compare your pronunciation with native speakers, and finally
        master the melody of Japanese.
      </p>
    </header>
  );
}
