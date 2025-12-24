export function Legend() {
  return (
    <div className="riso-card-outline p-5">
      <h3 className="font-display font-bold text-sm text-ink-black/80 mb-3 tracking-wide">
        Accent Legend
      </h3>
      <div className="text-sm text-ink-black/60 space-y-2 font-medium">
        <p className="flex items-start gap-2">
          <span className="font-mono text-ink-black font-bold min-w-[60px]">Type 0:</span>
          <span>平板 (Heiban) - pitch rises then stays high</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="font-mono text-ink-black font-bold min-w-[60px]">Type 1:</span>
          <span>頭高 (Atamadaka) - starts high, drops after first mora</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="font-mono text-ink-black font-bold min-w-[60px]">Type N:</span>
          <span>中高 (Nakadaka) - drops after the Nth mora</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="font-mono text-ink-black font-bold min-w-[60px]">Type N=last:</span>
          <span>尾高 (Odaka) - drops after the last mora</span>
        </p>
      </div>
    </div>
  );
}
