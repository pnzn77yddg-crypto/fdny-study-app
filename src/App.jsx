import { useState, useEffect, useRef } from "react";
import {
  Flame,
  ChevronLeft,
  ChevronDown,
  RotateCw,
  Check,
  X,
  ArrowRight,
  Layers3,
  ListChecks,
  AlertTriangle,
  BookOpen,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from "lucide-react";
import {
  fetchLibrary,
  fetchChapterContent,
  fetchBookContent,
  sampleRandom,
  sizeOptions,
} from "./lib/supabase";

const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;
const DELAY_OPTIONS = [3, 5, 8, 10, 15];

// Speaks `text` and resolves when speech finishes (or immediately if TTS
// isn't available). Resolves on error too, so a bad utterance never stalls
// the sequence.
function speakAsync(text) {
  return new Promise((resolve) => {
    if (!ttsSupported || !text) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = resolve;
    utter.onerror = resolve;
    window.speechSynthesis.speak(utter);
  });
}

// Counts down from `seconds`, calling onTick each second, and resolves at 0.
function countdownAsync(seconds, onTick) {
  return new Promise((resolve) => {
    let remaining = seconds;
    onTick(remaining);
    if (remaining <= 0) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      remaining -= 1;
      onTick(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

export default function App() {
  // library state
  const [library, setLibrary] = useState(null); // { bookTitle, chapters, totalCards, totalQuiz }
  const [libraryError, setLibraryError] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(true);

  // navigation
  const [screen, setScreen] = useState("select-chapter");
  // select-chapter | select-mode | generating | study | quiz | complete
  const [activeTarget, setActiveTarget] = useState(null); // { id, name, cardCount, quizCount }
  const [mode, setMode] = useState(null); // "flashcards" | "quiz"
  const [size, setSize] = useState(null);

  // active pool (all content for activeTarget) + the sampled set in play
  const [pool, setPool] = useState(null); // { id, flashcards, quiz_questions }
  const [poolError, setPoolError] = useState(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [questions, setQuestions] = useState([]);

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

  // audio flashcard state
  const [answerDelay, setAnswerDelay] = useState(5);
  const [audioIndex, setAudioIndex] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(true);
  const [audioPhase, setAudioPhase] = useState("question"); // question | delay | answer | pause
  const [countdown, setCountdown] = useState(0);
  const audioRunRef = useRef(0);

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

  function chooseTarget(target) {
    setActiveTarget(target);
    const maxCount = Math.max(target.cardCount, target.quizCount);
    const opts = sizeOptions(maxCount);
    setSize(opts[0] || maxCount);
    setPool(null);
    setPoolError(null);
    setScreen("select-mode");
  }

  async function ensurePool(target) {
    if (pool && pool.id === target.id) return pool;
    setPoolLoading(true);
    setPoolError(null);
    try {
      const data =
        target.id === "book" ? await fetchBookContent() : await fetchChapterContent(target.id);
      const loaded = { id: target.id, ...data };
      setPool(loaded);
      return loaded;
    } finally {
      setPoolLoading(false);
    }
  }

  function chooseMode(selectedMode) {
    setMode(selectedMode);
    setScreen("generating");
    ensurePool(activeTarget)
      .then((loaded) => {
        if (selectedMode === "flashcards") {
          setCards(sampleRandom(loaded.flashcards, size));
          setCardIndex(0);
          setFlipped(false);
          setKnown(0);
          setReview(0);
          setScreen("study");
        } else {
          setQuestions(sampleRandom(loaded.quiz_questions, size));
          setQIndex(0);
          setSelected(null);
          setAnswered(false);
          setCorrectCount(0);
          setScreen("quiz");
        }
      })
      .catch((err) => {
        setPoolError(err.message || "Failed to load this content.");
        setScreen("select-mode");
      });
  }

  function chooseAudioMode() {
    setMode("audio");
    setScreen("generating");
    ensurePool(activeTarget)
      .then((loaded) => {
        setCards(sampleRandom(loaded.flashcards, size));
        setAudioIndex(0);
        setAudioPlaying(true);
        setAudioPhase("question");
        setCountdown(answerDelay);
        setScreen("audio-study");
      })
      .catch((err) => {
        setPoolError(err.message || "Failed to load this content.");
        setScreen("select-mode");
      });
  }

  // Drives one card's full audio sequence: question -> delay countdown ->
  // answer -> short pause -> advance. Re-runs whenever the current card,
  // play state, or screen changes; the cleanup function cancels speech and
  // invalidates the run so a paused/skipped/exited sequence never "finishes"
  // into the wrong state.
  useEffect(() => {
    if (screen !== "audio-study" || !audioPlaying) return;
    const card = cards[audioIndex];
    if (!card) return;

    const myRun = ++audioRunRef.current;
    const isCurrent = () => audioRunRef.current === myRun;

    (async () => {
      setAudioPhase("question");
      await speakAsync(card.front);
      if (!isCurrent()) return;

      setAudioPhase("delay");
      await countdownAsync(answerDelay, (n) => isCurrent() && setCountdown(n));
      if (!isCurrent()) return;

      setAudioPhase("answer");
      await speakAsync(card.back);
      if (!isCurrent()) return;

      setAudioPhase("pause");
      await countdownAsync(1, () => {});
      if (!isCurrent()) return;

      if (audioIndex + 1 >= cards.length) {
        setScreen("complete");
      } else {
        setAudioIndex((i) => i + 1);
      }
    })();

    return () => {
      audioRunRef.current++;
      if (ttsSupported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, audioIndex, audioPlaying, answerDelay]);

  function audioSkip(dir) {
    setAudioIndex((i) => Math.min(Math.max(i + dir, 0), cards.length - 1));
    setAudioPlaying(true);
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

  function resetAll() {
    setScreen("select-chapter");
    setActiveTarget(null);
    setMode(null);
    setPool(null);
  }

  const q = mode === "quiz" ? questions[qIndex] : null;
  const audioCard = mode === "audio" ? cards[audioIndex] : null;

  const headerTitle =
    mode === "quiz" && (screen === "quiz" || screen === "complete")
      ? "Quiz"
      : mode === "flashcards" && (screen === "study" || screen === "complete")
      ? "Flashcards"
      : mode === "audio" && (screen === "audio-study" || screen === "complete")
      ? "Audio Flashcards"
      : screen === "select-mode"
      ? "Choose set"
      : "Study";

  return (
    <div className="min-h-screen bg-[#1B1A18] text-[#EDE8DE] flex flex-col overflow-x-hidden">
      <div
        className="h-2 w-full shrink-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #C9A227 0px, #C9A227 14px, #1B1A18 14px, #1B1A18 28px)",
        }}
      />

      <header className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-[#3A362F] min-w-0">
        {screen === "select-mode" ? (
          <button
            onClick={resetAll}
            className="p-1.5 -ml-1.5 rounded hover:bg-white/5 active:scale-95 transition shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#C9A227]" />
          </button>
        ) : screen === "study" || screen === "quiz" || screen === "audio-study" || screen === "complete" ? (
          <button
            onClick={backToModes}
            className="p-1.5 -ml-1.5 rounded hover:bg-white/5 active:scale-95 transition shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#C9A227]" />
          </button>
        ) : (
          <Flame className="w-5 h-5 text-[#C8352E] shrink-0" />
        )}
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.25em] text-[#8B857A] font-bold uppercase truncate">
            FDNY · Proof of Concept
          </div>
          <h1 className="text-lg font-black uppercase tracking-wide leading-tight truncate">
            {headerTitle}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 flex flex-col min-w-0">
        {screen === "select-chapter" && (
          <div className="flex flex-col gap-3 min-w-0">
            <p className="text-sm text-[#8B857A] mb-1 break-words">
              Study a chapter at a time, or pull a random set from the whole book.
            </p>

            {libraryLoading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#3A362F] border-t-[#C9A227] animate-spin" />
                <div className="text-xs text-[#8B857A] uppercase tracking-wide">Loading library</div>
              </div>
            )}

            {libraryError && (
              <div className="flex items-start gap-3 bg-[#2A1E1C] border border-[#C8352E] rounded-md px-4 py-3 min-w-0">
                <AlertTriangle className="w-4 h-4 text-[#C8352E] shrink-0 mt-0.5" />
                <div className="text-sm text-[#EDE8DE] break-words min-w-0">
                  Couldn't load the library: {libraryError}
                </div>
              </div>
            )}

            {library && (
              <button
                onClick={() =>
                  chooseTarget({
                    id: "book",
                    name: library.bookTitle || "Entire Book",
                    cardCount: library.totalCards,
                    quizCount: library.totalQuiz,
                  })
                }
                className="group flex items-center gap-4 bg-[#24221F] border-2 border-[#C9A227] rounded-md px-4 py-4 text-left hover:bg-[#C9A227]/10 active:scale-[0.98] transition min-w-0"
              >
                <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#C9A227] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#C9A227]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] tracking-[0.2em] text-[#C9A227] font-bold uppercase truncate">
                    Whole Book
                  </div>
                  <div className="font-bold leading-snug break-words">{library.bookTitle}</div>
                  <div className="text-xs text-[#8B857A] mt-0.5 truncate">
                    {library.totalCards} flashcards · {library.totalQuiz} quiz questions
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C9A227] shrink-0" />
              </button>
            )}

            {library &&
              library.chapters.map((chapter) => (
                <div key={chapter.id} className="flex flex-col gap-1.5 min-w-0">
                  <button
                    onClick={() =>
                      chooseTarget({
                        id: chapter.id,
                        name: chapter.name,
                        cardCount: chapter.cardCount,
                        quizCount: chapter.quizCount,
                      })
                    }
                    disabled={chapter.cardCount === 0 && chapter.quizCount === 0}
                    className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-4 text-left hover:border-[#C9A227] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold leading-snug break-words">{chapter.name}</div>
                      <div className="text-xs text-[#8B857A] mt-0.5 truncate">
                        {chapter.cardCount} flashcards · {chapter.quizCount} quiz questions
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] shrink-0" />
                  </button>

                  {chapter.addenda.length > 0 && (
                    <div className="pl-4 flex flex-col gap-1.5">
                      {chapter.addenda.map((add) => (
                        <button
                          key={add.id}
                          onClick={() =>
                            chooseTarget({
                              id: add.id,
                              name: add.name,
                              cardCount: add.cardCount,
                              quizCount: add.quizCount,
                            })
                          }
                          disabled={add.cardCount === 0 && add.quizCount === 0}
                          className="group flex items-center gap-3 bg-[#1F1D1A] border border-[#3A362F] rounded-md px-3.5 py-2.5 text-left hover:border-[#C9A227] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none min-w-0"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold leading-snug break-words">
                              {add.name}
                            </div>
                            <div className="text-[11px] text-[#8B857A] mt-0.5 truncate">
                              {add.cardCount} flashcards · {add.quizCount} quiz
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#8B857A] group-hover:text-[#C9A227] shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {screen === "select-mode" && activeTarget && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-5 min-w-0">
              <div className="text-[10px] tracking-[0.2em] text-[#C9A227] font-bold uppercase truncate">
                {activeTarget.id === "book" ? "Whole Book" : "Chapter"}
              </div>
              <div className="font-bold text-lg leading-snug break-words">{activeTarget.name}</div>
            </div>

            {poolError && (
              <div className="flex items-start gap-3 bg-[#2A1E1C] border border-[#C8352E] rounded-md px-4 py-3 mb-4 min-w-0">
                <AlertTriangle className="w-4 h-4 text-[#C8352E] shrink-0 mt-0.5" />
                <div className="text-sm text-[#EDE8DE] break-words min-w-0">{poolError}</div>
              </div>
            )}

            <label className="text-xs text-[#8B857A] uppercase tracking-wide font-bold mb-2">
              How many questions/cards
            </label>
            <div className="relative mb-5">
              <select
                value={size ?? ""}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full appearance-none bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#C9A227]"
              >
                {sizeOptions(Math.max(activeTarget.cardCount, activeTarget.quizCount)).map(
                  (n) => {
                    const isAll = n === Math.max(activeTarget.cardCount, activeTarget.quizCount);
                    return (
                      <option key={n} value={n}>
                        {isAll ? `All (${n})` : n}
                      </option>
                    );
                  }
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8B857A] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => chooseMode("flashcards")}
                disabled={activeTarget.cardCount === 0}
                className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-5 text-left hover:border-[#C9A227] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none min-w-0"
              >
                <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#3A362F] flex items-center justify-center group-hover:border-[#C9A227] transition">
                  <Layers3 className="w-5 h-5 text-[#C8352E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-snug">Flashcards</div>
                  <div className="text-xs text-[#8B857A] mt-0.5 truncate">
                    {Math.min(size || 0, activeTarget.cardCount)} of {activeTarget.cardCount} cards
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] shrink-0" />
              </button>
              <button
                onClick={() => chooseMode("quiz")}
                disabled={activeTarget.quizCount === 0}
                className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-5 text-left hover:border-[#C9A227] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none min-w-0"
              >
                <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#3A362F] flex items-center justify-center group-hover:border-[#C9A227] transition">
                  <ListChecks className="w-5 h-5 text-[#C8352E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-snug">Quiz</div>
                  <div className="text-xs text-[#8B857A] mt-0.5 truncate">
                    {Math.min(size || 0, activeTarget.quizCount)} of {activeTarget.quizCount} questions
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] shrink-0" />
              </button>

              <button
                onClick={chooseAudioMode}
                disabled={activeTarget.cardCount === 0 || !ttsSupported}
                className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-5 text-left hover:border-[#C9A227] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none min-w-0"
              >
                <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#3A362F] flex items-center justify-center group-hover:border-[#C9A227] transition">
                  <Volume2 className="w-5 h-5 text-[#C8352E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-snug">Audio Flashcards</div>
                  <div className="text-xs text-[#8B857A] mt-0.5 truncate">
                    {ttsSupported
                      ? `Hands-free · reads aloud, ${answerDelay}s pause before the answer`
                      : "Not supported on this browser"}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] shrink-0" />
              </button>
            </div>

            {ttsSupported && (
              <div className="mt-5">
                <label className="text-xs text-[#8B857A] uppercase tracking-wide font-bold mb-2 block">
                  Audio answer delay
                </label>
                <div className="relative">
                  <select
                    value={answerDelay}
                    onChange={(e) => setAnswerDelay(Number(e.target.value))}
                    className="w-full appearance-none bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#C9A227]"
                  >
                    {DELAY_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} seconds
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#8B857A] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "generating" && activeTarget && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#3A362F] border-t-[#C9A227] animate-spin" />
            <div className="min-w-0">
              <div className="font-bold uppercase tracking-wide text-sm break-words">
                {poolLoading ? "Loading" : "Building"}{" "}
                {mode === "quiz" ? "quiz" : mode === "audio" ? "audio flashcards" : "flashcards"}{" "}
                for {activeTarget.name}
              </div>
              <div className="text-xs text-[#8B857A] mt-1">Pulling your random {size}-item set</div>
            </div>
          </div>
        )}

        {screen === "study" && cards.length > 0 && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase truncate">
                {String(cardIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase shrink-0">
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
              className="flex-1 min-h-[280px] bg-[#24221F] border-2 border-[#3A362F] rounded-lg p-6 flex flex-col justify-center items-center text-center relative active:scale-[0.99] transition min-w-0"
            >
              <span className="absolute top-3 left-3 text-[9px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {flipped ? "Answer" : "Question"}
              </span>
              <RotateCw className="absolute top-3 right-3 w-3.5 h-3.5 text-[#8B857A]" />
              <p className="text-base leading-relaxed font-medium px-2 break-words min-w-0">
                {flipped ? cards[cardIndex].back : cards[cardIndex].front}
              </p>
              {flipped && cards[cardIndex].citation && (
                <span className="text-[10px] text-[#8B857A] mt-3 tracking-wide break-words px-2">
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

        {screen === "quiz" && q && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase truncate">
                Q{String(qIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase shrink-0">
                {qIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="w-full h-1 bg-[#3A362F] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#C8352E] transition-all duration-300"
                style={{ width: `${(qIndex / questions.length) * 100}%` }}
              />
            </div>

            <div className="bg-[#24221F] border-2 border-[#3A362F] rounded-lg p-5 mb-4 min-w-0">
              <p className="text-base leading-relaxed font-medium break-words">{q.question}</p>
            </div>

            <div className="flex flex-col gap-2.5 min-w-0">
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
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left text-sm font-medium transition active:scale-[0.98] min-w-0 ${stateClasses}`}
                  >
                    <span className="break-words min-w-0">{opt}</span>
                    {answered && isCorrect && <Check className="w-4 h-4 text-[#C9A227] shrink-0" />}
                    {answered && isSelected && !isCorrect && <X className="w-4 h-4 text-[#C8352E] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {answered && q.explanation && (
              <div className="mt-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-3 text-sm text-[#8B857A] leading-relaxed break-words min-w-0">
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

        {screen === "audio-study" && audioCard && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase truncate">
                {String(audioIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase shrink-0">
                {audioIndex + 1} / {cards.length}
              </span>
            </div>
            <div className="w-full h-1 bg-[#3A362F] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#C8352E] transition-all duration-300"
                style={{ width: `${(audioIndex / cards.length) * 100}%` }}
              />
            </div>

            <div className="flex-1 min-h-[280px] bg-[#24221F] border-2 border-[#3A362F] rounded-lg p-6 flex flex-col justify-center items-center text-center relative min-w-0">
              <span className="absolute top-3 left-3 text-[9px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {audioPhase === "answer" || audioPhase === "pause" ? "Answer" : "Question"}
              </span>
              <Volume2
                className={`absolute top-3 right-3 w-3.5 h-3.5 ${
                  audioPhase === "question" || audioPhase === "answer"
                    ? "text-[#C9A227] animate-pulse"
                    : "text-[#8B857A]"
                }`}
              />
              <p className="text-base leading-relaxed font-medium px-2 break-words min-w-0">
                {audioPhase === "answer" || audioPhase === "pause" ? audioCard.back : audioCard.front}
              </p>

              {audioPhase === "delay" && (
                <div className="mt-6 flex flex-col items-center gap-1">
                  <div className="text-3xl font-black text-[#C9A227]">{countdown}</div>
                  <div className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                    Answer in...
                  </div>
                </div>
              )}
              {!audioPlaying && (
                <div className="mt-6 text-xs text-[#8B857A] uppercase tracking-wide font-bold">
                  Paused
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                onClick={() => audioSkip(-1)}
                disabled={audioIndex === 0}
                className="p-3 rounded-full border border-[#3A362F] bg-[#24221F] hover:border-[#C9A227] active:scale-95 transition disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Previous card"
              >
                <SkipBack className="w-5 h-5 text-[#EDE8DE]" />
              </button>
              <button
                onClick={() => setAudioPlaying((p) => !p)}
                className="p-5 rounded-full bg-[#C9A227] hover:bg-[#C9A227]/90 active:scale-95 transition"
                aria-label={audioPlaying ? "Pause" : "Play"}
              >
                {audioPlaying ? (
                  <Pause className="w-6 h-6 text-[#1B1A18]" fill="#1B1A18" />
                ) : (
                  <Play className="w-6 h-6 text-[#1B1A18]" fill="#1B1A18" />
                )}
              </button>
              <button
                onClick={() => audioSkip(1)}
                disabled={audioIndex >= cards.length - 1}
                className="p-3 rounded-full border border-[#3A362F] bg-[#24221F] hover:border-[#C9A227] active:scale-95 transition disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Next card"
              >
                <SkipForward className="w-5 h-5 text-[#EDE8DE]" />
              </button>
            </div>
          </div>
        )}

        {screen === "complete" && activeTarget && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-2 min-w-0">
            <div className="w-14 h-14 rounded-sm border-2 border-[#C9A227] flex items-center justify-center shrink-0">
              <Check className="w-7 h-7 text-[#C9A227]" />
            </div>
            <div className="min-w-0">
              <div className="font-black uppercase tracking-wide text-lg">
                {mode === "quiz" ? "Quiz complete" : mode === "audio" ? "Audio session complete" : "Deck complete"}
              </div>
              <div className="text-sm text-[#8B857A] mt-1 break-words">{activeTarget.name}</div>
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
            ) : mode === "audio" ? (
              <div className="text-sm text-[#8B857A]">
                {cards.length} card{cards.length === 1 ? "" : "s"} read aloud
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
                onClick={() => (mode === "audio" ? chooseAudioMode() : chooseMode(mode))}
                className="py-3 rounded-md bg-[#C9A227] text-[#1B1A18] font-bold text-sm uppercase tracking-wide active:scale-[0.97] transition"
              >
                {mode === "quiz" ? "New random quiz" : mode === "audio" ? "New random audio set" : "New random set"}
              </button>
              <button
                onClick={backToModes}
                className="py-3 rounded-md border border-[#3A362F] font-bold text-sm uppercase tracking-wide hover:border-[#C9A227] active:scale-[0.97] transition"
              >
                Switch mode / size
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
