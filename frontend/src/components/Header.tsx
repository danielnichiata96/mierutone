export function Header() {
  return (
    <header className="pb-8 mb-10 border-b-2 border-ink-black/10">
      <div className="flex items-center gap-3 mb-4">
        {/* Logo dots - Riso ink overlay effect */}
        <div className="relative w-12 h-7">
          <span className="absolute w-5 h-5 rounded-full bg-primary-500 riso-multiply left-0 top-0.5" />
          <span className="absolute w-5 h-5 rounded-full bg-accent-500 riso-multiply left-2.5 top-0" />
          <span className="absolute w-5 h-5 rounded-full bg-energy-500 riso-multiply left-5 top-1" />
        </div>
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
