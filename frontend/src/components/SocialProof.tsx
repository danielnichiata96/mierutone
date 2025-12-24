import { BookIcon, TargetIcon, HeadphoneIcon } from "@/components/icons/DoodleIcons";

export function SocialProof() {
  return (
    <section className="py-12 border-t-2 border-ink-black/10">
      <div className="text-center">
        <p className="text-sm text-ink-black/50 font-medium mb-4">
          Built for serious learners
        </p>

        <div className="flex flex-wrap justify-center items-center gap-6 text-ink-black/40">
          {/* Community badges */}
          <div className="flex items-center gap-2">
            <BookIcon size={24} className="text-ink-coral" />
            <span className="font-mono text-sm">r/LearnJapanese</span>
          </div>

          <div className="flex items-center gap-2">
            <TargetIcon size={24} className="text-ink-cornflower" />
            <span className="font-mono text-sm">JLPT Prep</span>
          </div>

          <div className="flex items-center gap-2">
            <HeadphoneIcon size={24} className="text-ink-mint" />
            <span className="font-mono text-sm">Immersion Method</span>
          </div>
        </div>

        {/* CTA for feedback */}
        <div className="mt-8 p-6 bg-primary-300/20 rounded-riso-lg border-2 border-primary-500/30 max-w-md mx-auto">
          <p className="font-medium text-ink-black/80 mb-2">
            Help shape PitchLab JP
          </p>
          <p className="text-sm text-ink-black/60 mb-4">
            We're building this for you. Tell us what features you need most.
          </p>
          <a
            href="https://forms.gle/YOUR_FORM_ID"
            target="_blank"
            rel="noopener noreferrer"
            className="riso-button-outline text-sm"
          >
            Give Feedback
          </a>
        </div>
      </div>
    </section>
  );
}
