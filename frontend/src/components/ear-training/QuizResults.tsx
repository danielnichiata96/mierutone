import { useRef, useEffect } from "react";
import { QuizWord, PATTERN_INFO } from "@/types/quiz";
import { StarIcon, SyncIcon, BagIcon } from "@/components/icons/DoodleIcons";

interface QuizResultsProps {
  score: number;
  total: number;
  questions: QuizWord[];
  userAnswers: Record<number, boolean>; // Index -> Correct
  onRestart: () => void;
}

export function QuizResults({ score, total, questions, userAnswers, onRestart }: QuizResultsProps) {
  const collectedWords = questions.filter((_, idx) => userAnswers[idx]);
  const percentage = Math.round((collectedWords.length / total) * 100);

  return (
    <div className="riso-card text-center space-y-8 py-8 animate-soft-fade-in">
      <div className="space-y-2 animate-gentle-bounce">
        <div className="text-center space-y-4 mb-8">
          <BagIcon size={48} className="mx-auto text-ink-black animate-gentle-bounce" />
          <h2 className="font-display text-3xl font-bold text-ink-black">
            Your Collection
          </h2>
          <p className="text-ink-black/60">
            You collected {collectedWords.length} new words this session.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
          {questions.map((word, idx) => {
            const isCorrect = userAnswers[idx];
            return (
              <div
                key={idx}
                className={`p-3 rounded-riso border-2 transition-cozy ${isCorrect
                  ? "bg-secondary-300/20 border-secondary-500"
                  : "bg-paper-off border-ink-black/10 opacity-70"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-display font-bold text-lg text-ink-black">
                    {word.word}
                  </span>
                  {isCorrect && <StarIcon size={16} className="text-pitch-cornflower" />}
                </div>
                <div className="text-xs text-ink-black/60 font-mono mb-2">
                  {word.reading}
                </div>
                <div
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-block ${isCorrect ? "bg-white/50 text-ink-black" : "bg-ink-black/5 text-ink-black/40"
                    }`}
                >
                  {PATTERN_INFO[word.pattern].label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t-2 border-ink-black/10 space-y-3">
          <button
            type="button"
            onClick={onRestart}
            className="riso-button w-full justify-center animate-scale-press"
          >
            Collect More
          </button>
          <p className="text-sm text-ink-black/50">
            Every word you hear makes your ear stronger. Keep going!
          </p>
        </div>
      </div>
    </div>
  );
}
