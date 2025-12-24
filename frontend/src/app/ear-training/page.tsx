"use client";

import { useState, useCallback, useMemo } from "react";
import { QuizCard } from "@/components/ear-training/QuizCard";
import { QuizResults } from "@/components/ear-training/QuizResults";
import { HeadphoneIcon } from "@/components/icons/DoodleIcons";
import { quizWords, shuffleArray } from "@/data/quizWords";
import type { QuizWord } from "@/types/quiz";

const QUESTIONS_PER_ROUND = 10;

export default function EarTrainingPage() {
  const [gameState, setGameState] = useState<"intro" | "playing" | "results">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<QuizWord[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, boolean>>({});

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(quizWords).slice(0, QUESTIONS_PER_ROUND);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswers({});
    setGameState("playing");
  }, []);

  const handleAnswer = useCallback((correct: boolean) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: correct }));
    if (correct) {
      setScore((prev) => prev + 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setGameState("results");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const currentWord = useMemo(() => questions[currentIndex], [questions, currentIndex]);

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Hero */}
        <section className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-black mb-3">
            Ear Training
          </h1>
          <p className="text-ink-black/60 text-lg">
            Train your ear to recognize Japanese pitch accent patterns
          </p>
        </section>

        {gameState === "intro" && (
          <div className="riso-card text-center space-y-6 py-8 animate-soft-fade-in">
            <div className="space-y-4">
              <HeadphoneIcon size={48} className="animate-gentle-bounce inline-block text-ink-black" />
              <h2 className="font-display text-2xl font-bold text-ink-black">
                How it works
              </h2>
              <div className="text-ink-black/70 space-y-2 max-w-md mx-auto">
                <p>1. Listen to a word being spoken</p>
                <p>2. Identify its pitch accent pattern</p>
                <p>3. Learn from feedback after each answer</p>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-ink-black/10">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="riso-card-outline p-3">
                  <div className="font-bold text-ink-black">{QUESTIONS_PER_ROUND}</div>
                  <div className="text-ink-black/50">Questions</div>
                </div>
                <div className="riso-card-outline p-3">
                  <div className="font-bold text-ink-black">4</div>
                  <div className="text-ink-black/50">Patterns</div>
                </div>
              </div>

              <button type="button" onClick={startGame} className="riso-button w-full justify-center text-lg py-3 animate-scale-press">
                Start Training
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && currentWord && (
          <QuizCard
            word={currentWord}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        )}

        {gameState === "results" && (
          <QuizResults
            score={score}
            total={questions.length}
            questions={questions}
            userAnswers={userAnswers}
            onRestart={startGame}
          />
        )}

        {/* Pattern Reference */}
        {gameState === "intro" && (
          <section className="mt-12 animate-soft-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="font-mono text-sm text-ink-black/50 uppercase tracking-wide">
                Pattern Reference
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="riso-card-outline p-4 hover:-translate-y-1 transition-cozy">
                <div className="font-display font-bold text-ink-black">
                  平板 <span className="text-sm font-normal text-ink-black/60">Heiban</span>
                </div>
                <p className="text-sm text-ink-black/60 mt-1">Flat - Low start, stays high</p>
                <div className="mt-2 flex items-end gap-1 h-8">
                  <div className="w-4 h-3 bg-secondary-500 rounded-sm" />
                  <div className="w-4 h-6 bg-secondary-500 rounded-sm" />
                  <div className="w-4 h-6 bg-secondary-500 rounded-sm" />
                </div>
              </div>
              <div className="riso-card-outline p-4 hover:-translate-y-1 transition-cozy">
                <div className="font-display font-bold text-ink-black">
                  頭高 <span className="text-sm font-normal text-ink-black/60">Atamadaka</span>
                </div>
                <p className="text-sm text-ink-black/60 mt-1">Head-high - Drops after first mora</p>
                <div className="mt-2 flex items-end gap-1 h-8">
                  <div className="w-4 h-6 bg-accent-500 rounded-sm" />
                  <div className="w-4 h-3 bg-accent-500 rounded-sm" />
                  <div className="w-4 h-3 bg-accent-500 rounded-sm" />
                </div>
              </div>
              <div className="riso-card-outline p-4 hover:-translate-y-1 transition-cozy">
                <div className="font-display font-bold text-ink-black">
                  中高 <span className="text-sm font-normal text-ink-black/60">Nakadaka</span>
                </div>
                <p className="text-sm text-ink-black/60 mt-1">Middle-high - Drops in the middle</p>
                <div className="mt-2 flex items-end gap-1 h-8">
                  <div className="w-4 h-3 bg-primary-500 rounded-sm" />
                  <div className="w-4 h-6 bg-primary-500 rounded-sm" />
                  <div className="w-4 h-3 bg-primary-500 rounded-sm" />
                </div>
              </div>
              <div className="riso-card-outline p-4 hover:-translate-y-1 transition-cozy">
                <div className="font-display font-bold text-ink-black">
                  尾高 <span className="text-sm font-normal text-ink-black/60">Odaka</span>
                </div>
                <p className="text-sm text-ink-black/60 mt-1">Tail-high - Drops after the word</p>
                <div className="mt-2 flex items-end gap-1 h-8">
                  <div className="w-4 h-3 bg-energy-500 rounded-sm" />
                  <div className="w-4 h-6 bg-energy-500 rounded-sm" />
                  <div className="w-4 h-6 bg-energy-500 rounded-sm opacity-50" />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
