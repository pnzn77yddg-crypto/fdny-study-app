import { useState, useEffect, useMemo } from "react";
import {
  Flame,
  Shield,
  Layers,
  BookOpen,
  ChevronLeft,
  RotateCw,
  Check,
  X,
  ArrowRight,
  Layers3,
  ListChecks,
  AlertTriangle,
} from "lucide-react";
import { fetchLibrary, fetchSectionContent } from "./lib/supabase";
 
const CHAPTER_ICONS = [Flame, Shield, Layers, BookOpen];
 
export default function App() {
  // library state
  const [library, setLibrary] = useState(null); // chapters w/ sections, from Supabase
  const [libraryError, setLibraryError] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(true);
 
  // navigation
  const [screen, setScreen] = useState("select-chapter");
  // select-chapter | select-section | select-mode | generating | study | quiz | complete
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [mode, setMode] = useState(null); // "flashcards" | "quiz"
 
  // active section content (flashcards/quiz), fetched on demand
  const [content, setContent] = useState(null);
  const [contentError, setContentError] = useState(null);
 
  // flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [review, setReview] = useState(0);
 
  // quiz state
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
 
  useEffect(() => {
    let cancelled = false;
    fetchLibrary()
      .then((data) => {
        if (!cancelled) {
          setLibrary(data);
          setLibraryLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLibraryError(err.message || "Failed to load the library.");
          setLibraryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
 
  const cards = content?.flashcards || [];
  const questions = content?.quiz_questions || [];
 
  function chooseChapter(chapter) {
    setActiveChapter(chapter);
    setScreen("select-section");
  }
 
  function chooseSection(section) {
    setActiveSection(section);
    setScreen("select-mode");
  }
 
  function chooseMode(selectedMode) {
    setMode(selectedMode);
    setScreen("generating");
    setContentError(null);
    fetchSectionContent(activeSection.id)
      .then((data) => {
        setContent(data);
        if (selectedMode === "flashcards") {
          setCardIndex(0);
          setFlipped(false);
          setKnown(0);
          setReview(0);
          setScreen("study");
        } else {
          setQIndex(0);
          setSelected(null);
          setAnswered(false);
          setCorrectCount(0);
          setScreen("quiz");
        }
      })
      .catch((err) => {
        setContentError(err.message || "Failed to load this section's content.");
        setScreen("select-mode");
      });
  }
 
  function markCard(gotIt) {
    if (gotIt) setKnown((k) => k + 1);
    else setReview((r) => r + 1);
    const next = cardIndex + 1;
    if (next >= cards.length) {
      setScreen("complete");
    } else {
      setCardIndex(next);
      setFlipped(false);
    }
  }
 
  function pick(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === questions[qIndex].correct_index) {
      setCorrectCount((c) => c + 1);
    }
  }
 
  function nextQuestion() {
    const next = qIndex + 1;
    if (next >= questions.length) {
      setScreen("complete");
    } else {
      setQIndex(next);
      setSelected(null);
      setAnswered(false);
    }
  }
 
  function backToModes() {
    setScreen("select-mode");
  }
 
  function backToSections() {
    setActiveSection(null);
    setScreen("select-section");
  }
 
  function resetAll() {
    setScreen("select-chapter");
    setActiveChapter(null);
    setActiveSection(null);
    setMode(null);
    setContent(null);
  }
 
  const q = mode === "quiz" ? questions[qIndex] : null;
 
  const headerTitle = useMemo(() => {
    if (mode === "quiz" && (screen === "quiz" || screen === "complete")) return "Quiz";
    if (mode === "flashcards" && (screen === "study" || screen === "complete")) return "Flashcards";
    if (screen === "select-section") return "Sections";
    return "Study";
  }, [mode, screen]);
 
  return (
    <div className="min-h-screen bg-[#1B1A18] text-[#EDE8DE] flex flex-col">
      <div
        className="h-2 w-full shrink-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #C9A227 0px, #C9A227 14px, #1B1A18 14px, #1B1A18 28px)",
        }}
      />
 
      <header className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-[#3A362F]">
        {screen === "select-section" ? (
          <button
            onClick={resetAll}
            className="p-1.5 -ml-1.5 rounded hover:bg-white/5 active:scale-95 transition"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#C9A227]" />
          </button>
        ) : screen === "select-mode" ? (
          <button
            onClick={backToSections}
            className="p-1.5 -ml-1.5 rounded hover:bg-white/5 active:scale-95 transition"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#C9A227]" />
          </button>
        ) : screen === "study" || screen === "quiz" || screen === "complete" ? (
          <button
            onClick={backToModes}
            className="p-1.5 -ml-1.5 rounded hover:bg-white/5 active:scale-95 transition"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#C9A227]" />
          </button>
        ) : (
          <Flame className="w-5 h-5 text-[#C8352E]" />
        )}
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#8B857A] font-bold uppercase">
            FDNY · Proof of Concept
          </div>
          <h1 className="text-lg font-black uppercase tracking-wide leading-tight">
            {headerTitle}
          </h1>
        </div>
      </header>
 
      <main className="flex-1 px-5 py-5 flex flex-col">
        {screen === "select-chapter" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#8B857A] mb-1">
              Pick a chapter. Flashcards and quizzes are generated from that material, section by section.
            </p>
 
            {libraryLoading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#3A362F] border-t-[#C9A227] animate-spin" />
                <div className="text-xs text-[#8B857A] uppercase tracking-wide">Loading library</div>
              </div>
            )}
 
            {libraryError && (
              <div className="flex items-start gap-3 bg-[#2A1E1C] border border-[#C8352E] rounded-md px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-[#C8352E] shrink-0 mt-0.5" />
                <div className="text-sm text-[#EDE8DE]">
                  Couldn't load the library: {libraryError}
                </div>
              </div>
            )}
 
            {library &&
              library.map((chapter, idx) => {
                const Icon = CHAPTER_ICONS[idx % CHAPTER_ICONS.length];
                const sectionCount = chapter.sections.length;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => chooseChapter(chapter)}
                    disabled={sectionCount === 0}
                    className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-4 text-left hover:border-[#C9A227] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#3A362F] flex items-center justify-center group-hover:border-[#C9A227] transition">
                      <Icon className="w-5 h-5 text-[#C8352E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] tracking-[0.2em] text-[#C9A227] font-bold uppercase">
                        {chapter.chapter_key}
                      </div>
                      <div className="font-bold leading-snug">{chapter.chapter_name}</div>
                      <div className="text-xs text-[#8B857A] mt-0.5">
                        {sectionCount} section{sectionCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                );
              })}
          </div>
        )}
 
        {screen === "select-section" && activeChapter && (
          <div className="flex-1 flex flex-col">
            <div className="mb-5">
              <div className="text-[10px] tracking-[0.2em] text-[#C9A227] font-bold uppercase">
                {activeChapter.chapter_key}
              </div>
              <div className="font-bold text-lg leading-snug">{activeChapter.chapter_name}</div>
            </div>
            <p className="text-sm text-[#8B857A] mb-4">Choose a section to study.</p>
            <div className="flex flex-col gap-2.5 overflow-y-auto">
              {activeChapter.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => chooseSection(section)}
                  className="group flex items-center gap-3 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-3.5 text-left hover:border-[#C9A227] active:scale-[0.98] transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                      §{section.section_number}
                    </div>
                    <div className="font-bold text-sm leading-snug">{section.section_title}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
 
        {screen === "select-mode" && activeSection && (
          <div className="flex-1 flex flex-col">
            <div className="mb-5">
              <div className="text-[10px] tracking-[0.2em] text-[#C9A227] font-bold uppercase">
                §{activeSection.section_number}
              </div>
              <div className="font-bold text-lg leading-snug">{activeSection.section_title}</div>
            </div>
            <p className="text-sm text-[#8B857A] mb-4">Choose how you want to study this section.</p>
 
            {contentError && (
              <div className="flex items-start gap-3 bg-[#2A1E1C] border border-[#C8352E] rounded-md px-4 py-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-[#C8352E] shrink-0 mt-0.5" />
                <div className="text-sm text-[#EDE8DE]">{contentError}</div>
              </div>
            )}
 
            <div className="flex flex-col gap-3">
              <button
                onClick={() => chooseMode("flashcards")}
                className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-5 text-left hover:border-[#C9A227] active:scale-[0.98] transition"
              >
                <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#3A362F] flex items-center justify-center group-hover:border-[#C9A227] transition">
                  <Layers3 className="w-5 h-5 text-[#C8352E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-snug">Flashcards</div>
                  <div className="text-xs text-[#8B857A] mt-0.5">
                    Flip through this section's flashcards at your own pace
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition shrink-0" />
              </button>
              <button
                onClick={() => chooseMode("quiz")}
                className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-5 text-left hover:border-[#C9A227] active:scale-[0.98] transition"
              >
                <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#3A362F] flex items-center justify-center group-hover:border-[#C9A227] transition">
                  <ListChecks className="w-5 h-5 text-[#C8352E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-snug">Quiz</div>
                  <div className="text-xs text-[#8B857A] mt-0.5">Multiple-choice questions from this section</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            </div>
          </div>
        )}
 
        {screen === "generating" && activeSection && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#3A362F] border-t-[#C9A227] animate-spin" />
            <div>
              <div className="font-bold uppercase tracking-wide text-sm">
                Loading {mode === "quiz" ? "quiz" : "flashcards"} for {activeSection.section_title}
              </div>
              <div className="text-xs text-[#8B857A] mt-1">Pulling your study set</div>
            </div>
          </div>
        )}
 
        {screen === "study" && activeSection && cards.length > 0 && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                §{activeSection.section_number}-{String(cardIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {cardIndex + 1} / {cards.length}
              </span>
            </div>
            <div className="w-full h-1 bg-[#3A362F] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#C8352E] transition-all duration-300"
                style={{ width: `${(cardIndex / cards.length) * 100}%` }}
              />
            </div>
 
            <button
              onClick={() => setFlipped((f) => !f)}
              className="flex-1 min-h-[280px] bg-[#24221F] border-2 border-[#3A362F] rounded-lg p-6 flex flex-col justify-center items-center text-center relative active:scale-[0.99] transition"
            >
              <span className="absolute top-3 left-3 text-[9px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {flipped ? "Answer" : "Question"}
              </span>
              <RotateCw className="absolute top-3 right-3 w-3.5 h-3.5 text-[#8B857A]" />
              <p className="text-base leading-relaxed font-medium px-2">
                {flipped ? cards[cardIndex].back : cards[cardIndex].front}
              </p>
              {flipped && cards[cardIndex].citation && (
                <span className="text-[10px] text-[#8B857A] mt-3 tracking-wide">
                  {cards[cardIndex].citation}
                </span>
              )}
              {!flipped && <span className="text-xs text-[#8B857A] mt-5">Tap to reveal answer</span>}
            </button>
 
            {flipped && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => markCard(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-md border border-[#3A362F] bg-[#24221F] font-bold text-sm uppercase tracking-wide hover:border-[#C8352E] active:scale-[0.97] transition"
                >
                  <X className="w-4 h-4 text-[#C8352E]" /> Review again
                </button>
                <button
                  onClick={() => markCard(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-md border border-[#C9A227] bg-[#C9A227]/10 font-bold text-sm uppercase tracking-wide hover:bg-[#C9A227]/20 active:scale-[0.97] transition"
                >
                  <Check className="w-4 h-4 text-[#C9A227]" /> Got it
                </button>
              </div>
            )}
          </div>
        )}
 
        {screen === "quiz" && q && activeSection && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                §{activeSection.section_number}-Q{String(qIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {qIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="w-full h-1 bg-[#3A362F] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#C8352E] transition-all duration-300"
                style={{ width: `${(qIndex / questions.length) * 100}%` }}
              />
            </div>
 
            <div className="bg-[#24221F] border-2 border-[#3A362F] rounded-lg p-5 mb-4">
              <p className="text-base leading-relaxed font-medium">{q.question}</p>
            </div>
 
            <div className="flex flex-col gap-2.5">
              {q.choices.map((opt, i) => {
                const isCorrect = i === q.correct_index;
                const isSelected = i === selected;
                let stateClasses = "border-[#3A362F] bg-[#24221F] hover:border-[#8B857A]";
                if (answered && isCorrect) stateClasses = "border-[#C9A227] bg-[#C9A227]/10";
                else if (answered && isSelected && !isCorrect) stateClasses = "border-[#C8352E] bg-[#C8352E]/10";
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={answered}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left text-sm font-medium transition active:scale-[0.98] ${stateClasses}`}
                  >
                    <span>{opt}</span>
                    {answered && isCorrect && <Check className="w-4 h-4 text-[#C9A227] shrink-0" />}
                    {answered && isSelected && !isCorrect && <X className="w-4 h-4 text-[#C8352E] shrink-0" />}
                  </button>
                );
              })}
            </div>
 
            {answered && q.explanation && (
              <div className="mt-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-3 text-sm text-[#8B857A] leading-relaxed">
                {q.explanation}
              </div>
            )}
 
            {answered && (
              <button
                onClick={nextQuestion}
                className="mt-5 py-3 rounded-md bg-[#C9A227] text-[#1B1A18] font-bold text-sm uppercase tracking-wide active:scale-[0.97] transition"
              >
                {qIndex + 1 >= questions.length ? "See results" : "Next question"}
              </button>
            )}
          </div>
        )}
 
        {screen === "complete" && activeSection && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
            <div className="w-14 h-14 rounded-sm border-2 border-[#C9A227] flex items-center justify-center">
              <Check className="w-7 h-7 text-[#C9A227]" />
            </div>
            <div>
              <div className="font-black uppercase tracking-wide text-lg">
                {mode === "quiz" ? "Quiz complete" : "Deck complete"}
              </div>
              <div className="text-sm text-[#8B857A] mt-1">{activeSection.section_title}</div>
            </div>
 
            {mode === "quiz" ? (
              <div>
                <div className="text-3xl font-black text-[#C9A227]">
                  {correctCount} / {questions.length}
                </div>
                <div className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase mt-1">
                  Correct
                </div>
              </div>
            ) : (
              <div className="flex gap-6">
                <div>
                  <div className="text-2xl font-black text-[#C9A227]">{known}</div>
                  <div className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase mt-0.5">
                    Got it
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#C8352E]">{review}</div>
                  <div className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase mt-0.5">
                    To review
                  </div>
                </div>
              </div>
            )}
 
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              <button
                onClick={() => chooseMode(mode)}
                className="py-3 rounded-md bg-[#C9A227] text-[#1B1A18] font-bold text-sm uppercase tracking-wide active:scale-[0.97] transition"
              >
                {mode === "quiz" ? "Retake quiz" : "Study again"}
              </button>
              <button
                onClick={backToModes}
                className="py-3 rounded-md border border-[#3A362F] font-bold text-sm uppercase tracking-wide hover:border-[#C9A227] active:scale-[0.97] transition"
              >
                Switch mode
              </button>
              <button
                onClick={backToSections}
                className="py-3 rounded-md border border-[#3A362F] font-bold text-sm uppercase tracking-wide hover:border-[#C9A227] active:scale-[0.97] transition"
              >
                Choose another section
              </button>
              <button
                onClick={resetAll}
                className="py-3 rounded-md border border-[#3A362F] font-bold text-sm uppercase tracking-wide hover:border-[#C9A227] active:scale-[0.97] transition"
              >
                Choose another chapter
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
 
