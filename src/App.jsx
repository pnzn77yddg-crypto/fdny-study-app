import { useState } from "react";
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
} from "lucide-react";

const BOOKS = [
  {
    id: "engine-co",
    code: "FDNY-EC",
    title: "Engine Company Operations",
    icon: Flame,
    cards: [
      { q: "What is the first hoseline priority on arrival at a reported fire in a multiple dwelling?", a: "Stretch to the fire floor, protecting the interior stairs and any occupants above the fire before extending further." },
      { q: "What's the standard operating pressure for a 1¾\" handline with a smooth bore tip?", a: "50 psi at the tip, adjusted for hose length and elevation." },
      { q: "Why does the engine company avoid shutting down a line once water is flowing on a body of fire?", a: "Interrupting flow lets heat and fire regain ground and can result in a steam burn hazard to interior crews." },
      { q: "What determines whether to stretch to the floor below vs. the fire floor?", a: "Uncertainty about fire location, heavy smoke conditions, or an untenable stairwell — stretch to the floor below and work up." },
      { q: "What's the purpose of a second hoseline at a working fire?", a: "Backup protection for the attack line and crew, and coverage for extension or exposure protection." },
      { q: "What does 'water on the fire' as a radio transmission confirm?", a: "That the attack line is operating and has reached the seat of the fire — a key benchmark for command." },
    ],
    questions: [
      { q: "On arrival at a reported fire in a multiple dwelling, what's the first hoseline priority?", options: ["Stretch to the floor above the fire", "Stretch to the fire floor, protecting the interior stairs", "Stretch to the exterior for a defensive position", "Wait for the second-due engine before stretching"], correct: 1 },
      { q: "What's the standard operating pressure for a 1¾\" handline with a smooth bore tip?", options: ["25 psi at the tip", "50 psi at the tip", "80 psi at the tip", "100 psi at the tip"], correct: 1 },
      { q: "Why does an engine company avoid shutting down a line once water is flowing on a body of fire?", options: ["It wastes water pressure", "It can cause nozzle damage", "Interrupting flow can let fire regain ground and create a steam burn hazard", "Department policy requires continuous flow only"], correct: 2 },
      { q: "What determines whether to stretch to the floor below vs. the fire floor?", options: ["The size of the building", "Time of day", "Uncertainty about fire location or an untenable stairwell", "Number of personnel on scene"], correct: 2 },
      { q: "What does 'water on the fire' confirm over the radio?", options: ["The hydrant is supplying water", "The attack line is operating and has reached the seat of the fire", "The fire is fully extinguished", "A second line has been stretched"], correct: 1 },
    ],
  },
  {
    id: "truck-co",
    code: "FDNY-TC",
    title: "Truck Company Operations",
    icon: Shield,
    cards: [
      { q: "What are the four basic truck company functions on the fireground?", a: "Forcible entry, search, ventilation, and ladders." },
      { q: "When is vent-enter-search (VES) an appropriate tactic?", a: "When there's a known or likely victim in a room with exterior access and the fire isn't between the crew and the escape route." },
      { q: "What's the danger of venting a window before the attack line is in position?", a: "It can accelerate fire growth by feeding oxygen to the fire before there's water to control it." },
      { q: "What's the primary search priority in a residential structure?", a: "Areas closest to the fire and areas where occupants are most likely to be — bedrooms, especially at night." },
      { q: "Why does the outside vent (OV) position check the rear and exposures before going to the front?", a: "To identify fire location, victims, and secondary means of egress command may not see from the street." },
    ],
    questions: [
      { q: "What are the four basic truck company functions on the fireground?", options: ["Pumping, hydrants, hose, nozzles", "Forcible entry, search, ventilation, ladders", "Command, control, communication, coordination", "Overhaul, salvage, ventilation, rehab"], correct: 1 },
      { q: "When is vent-enter-search (VES) an appropriate tactic?", options: ["Whenever a window is accessible", "Only after the fire is fully knocked down", "When there's a likely victim in a room with exterior access and fire isn't between crew and escape route", "Only on single-family homes"], correct: 2 },
      { q: "What's the danger of venting a window before the attack line is in position?", options: ["It can accelerate fire growth by feeding oxygen before there's water to control it", "It reduces visibility for search crews", "It voids the department's SOP", "It has no significant fireground effect"], correct: 0 },
      { q: "What's the primary search priority in a residential structure?", options: ["Basements first", "Areas closest to the fire and where occupants are most likely to be", "The attic", "Exterior perimeter"], correct: 1 },
    ],
  },
  {
    id: "building-con",
    code: "FDNY-BC",
    title: "Building Construction",
    icon: Layers,
    cards: [
      { q: "Why is lightweight wood truss construction considered high-risk for early collapse?", a: "Gusset-plate connections fail quickly under fire exposure, and the whole truss system can fail as a unit with little warning." },
      { q: "What's the main structural concern with Type II (noncombustible) construction during a fire?", a: "Unprotected steel loses strength rapidly under heat and can warp or collapse without the fire load of combustible construction." },
      { q: "What is a cockloft, and why does it matter for fire spread?", a: "The concealed space between the top-floor ceiling and the roof — fire can travel through it undetected across an entire building." },
      { q: "Why do older Type III (ordinary) buildings pose an extension risk between buildings?", a: "Shared or close exterior walls and common cocklofts let fire travel laterally between adjoining structures." },
      { q: "What is a key sign of potential floor collapse a firefighter should check for on arrival?", a: "Soft, spongy, or sagging flooring, along with visible fire showing from lower floors or basement." },
    ],
    questions: [
      { q: "Why is lightweight wood truss construction considered high-risk for early collapse?", options: ["It's more expensive to inspect", "Gusset-plate connections fail quickly under fire and the truss system can fail as a unit", "It's more prone to water damage", "It requires special ladders"], correct: 1 },
      { q: "What's the main structural concern with Type II (noncombustible) construction during a fire?", options: ["It burns faster than wood", "Unprotected steel loses strength rapidly under heat and can collapse with little fire load", "It has no roof access", "It always includes a basement"], correct: 1 },
      { q: "What is a cockloft, and why does it matter for fire spread?", options: ["A rooftop mechanical room; irrelevant to fire spread", "The concealed space between the top-floor ceiling and roof, where fire can travel undetected", "A type of exterior stairwell", "A storage area found only in commercial buildings"], correct: 1 },
      { q: "What's a key sign of potential floor collapse on arrival?", options: ["Closed windows", "Soft, spongy, or sagging flooring with fire showing from lower floors", "Smoke color alone", "A locked front door"], correct: 1 },
    ],
  },
  {
    id: "ics",
    code: "FDNY-ICS",
    title: "Incident Command System",
    icon: BookOpen,
    cards: [
      { q: "Who has overall authority for an incident once command is established?", a: "The Incident Commander, until command is formally transferred." },
      { q: "What's the purpose of a formal command transfer over the radio?", a: "It ensures continuity of strategy and accountability — the incoming IC must be briefed before transfer is confirmed." },
      { q: "What is a division used for at a high-rise incident?", a: "Geographic organization of resources, typically assigned by floor or floor group." },
      { q: "When would command declare a defensive strategy?", a: "When interior conditions are untenable or structural collapse risk outweighs the benefit of an interior attack." },
      { q: "What's the function of a staging area at a working incident?", a: "It holds uncommitted resources close to the scene until command assigns them, preventing freelancing and resource gaps." },
    ],
    questions: [
      { q: "Who has overall authority for an incident once command is established?", options: ["The first-arriving officer, permanently", "The Incident Commander, until command is formally transferred", "Dispatch", "The highest-ranking chief regardless of arrival order"], correct: 1 },
      { q: "What's the purpose of a formal command transfer over the radio?", options: ["It's a courtesy with no operational effect", "It ensures continuity of strategy — incoming IC must be briefed before transfer is confirmed", "It reassigns all units automatically", "It ends the incident report"], correct: 1 },
      { q: "What is a division used for at a high-rise incident?", options: ["Tracking apparatus fuel levels", "Geographic organization of resources, typically by floor or floor group", "Assigning press liaisons", "Naming the incident for records"], correct: 1 },
      { q: "What's the function of a staging area at a working incident?", options: ["Holds uncommitted resources near the scene until command assigns them, preventing freelancing", "Where command posts are always located", "A rehab zone exclusively for EMS", "The area where press is briefed"], correct: 0 },
    ],
  },
];

export default function App() {
  const [screen, setScreen] = useState("select-book"); // select-book | select-mode | generating | study | quiz | complete
  const [activeBook, setActiveBook] = useState(null);
  const [mode, setMode] = useState(null); // "flashcards" | "quiz"

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

  function chooseBook(book) {
    setActiveBook(book);
    setScreen("select-mode");
  }

  function chooseMode(selectedMode) {
    setMode(selectedMode);
    setScreen("generating");
    setTimeout(() => {
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
    }, 1100);
  }

  function markCard(gotIt) {
    if (gotIt) setKnown((k) => k + 1);
    else setReview((r) => r + 1);
    const next = cardIndex + 1;
    if (next >= activeBook.cards.length) {
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
    if (i === activeBook.questions[qIndex].correct) {
      setCorrectCount((c) => c + 1);
    }
  }

  function nextQuestion() {
    const next = qIndex + 1;
    if (next >= activeBook.questions.length) {
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
    setScreen("select-book");
    setActiveBook(null);
    setMode(null);
  }

  const q = activeBook && mode === "quiz" ? activeBook.questions[qIndex] : null;

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
        {screen === "select-mode" || screen === "study" || screen === "quiz" || screen === "complete" ? (
          <button
            onClick={screen === "select-mode" ? resetAll : backToModes}
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
            {mode === "quiz" && (screen === "quiz" || screen === "complete") ? "Quiz" :
             mode === "flashcards" && (screen === "study" || screen === "complete") ? "Flashcards" :
             "Study"}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 flex flex-col">
        {screen === "select-book" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#8B857A] mb-1">
              Pick a manual. Flashcards and quizzes are both generated from that book's material.
            </p>
            {BOOKS.map((book) => {
              const Icon = book.icon;
              return (
                <button
                  key={book.id}
                  onClick={() => chooseBook(book)}
                  className="group flex items-center gap-4 bg-[#24221F] border border-[#3A362F] rounded-md px-4 py-4 text-left hover:border-[#C9A227] active:scale-[0.98] transition"
                >
                  <div className="shrink-0 w-11 h-11 rounded-sm bg-[#1B1A18] border border-[#3A362F] flex items-center justify-center group-hover:border-[#C9A227] transition">
                    <Icon className="w-5 h-5 text-[#C8352E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[0.2em] text-[#C9A227] font-bold uppercase">
                      {book.code}
                    </div>
                    <div className="font-bold leading-snug">{book.title}</div>
                    <div className="text-xs text-[#8B857A] mt-0.5">
                      {book.cards.length} flashcards · {book.questions.length} quiz questions
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {screen === "select-mode" && activeBook && (
          <div className="flex-1 flex flex-col">
            <div className="mb-5">
              <div className="text-[10px] tracking-[0.2em] text-[#C9A227] font-bold uppercase">
                {activeBook.code}
              </div>
              <div className="font-bold text-lg leading-snug">{activeBook.title}</div>
            </div>
            <p className="text-sm text-[#8B857A] mb-4">Choose how you want to study this book.</p>
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
                    Flip through {activeBook.cards.length} cards at your own pace
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
                  <div className="text-xs text-[#8B857A] mt-0.5">
                    {activeBook.questions.length} multiple-choice questions
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8B857A] group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            </div>
          </div>
        )}

        {screen === "generating" && activeBook && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#3A362F] border-t-[#C9A227] animate-spin" />
            <div>
              <div className="font-bold uppercase tracking-wide text-sm">
                Generating {mode === "quiz" ? "quiz" : "flashcards"} from {activeBook.title}
              </div>
              <div className="text-xs text-[#8B857A] mt-1">Pulling key material and building your set</div>
            </div>
          </div>
        )}

        {screen === "study" && activeBook && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {activeBook.code}-{String(cardIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {cardIndex + 1} / {activeBook.cards.length}
              </span>
            </div>
            <div className="w-full h-1 bg-[#3A362F] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#C8352E] transition-all duration-300"
                style={{ width: `${(cardIndex / activeBook.cards.length) * 100}%` }}
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
                {flipped ? activeBook.cards[cardIndex].a : activeBook.cards[cardIndex].q}
              </p>
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

        {screen === "quiz" && q && activeBook && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {activeBook.code}-Q{String(qIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#8B857A] font-bold uppercase">
                {qIndex + 1} / {activeBook.questions.length}
              </span>
            </div>
            <div className="w-full h-1 bg-[#3A362F] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#C8352E] transition-all duration-300"
                style={{ width: `${(qIndex / activeBook.questions.length) * 100}%` }}
              />
            </div>

            <div className="bg-[#24221F] border-2 border-[#3A362F] rounded-lg p-5 mb-4">
              <p className="text-base leading-relaxed font-medium">{q.q}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correct;
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

            {answered && (
              <button
                onClick={nextQuestion}
                className="mt-5 py-3 rounded-md bg-[#C9A227] text-[#1B1A18] font-bold text-sm uppercase tracking-wide active:scale-[0.97] transition"
              >
                {qIndex + 1 >= activeBook.questions.length ? "See results" : "Next question"}
              </button>
            )}
          </div>
        )}

        {screen === "complete" && activeBook && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
            <div className="w-14 h-14 rounded-sm border-2 border-[#C9A227] flex items-center justify-center">
              <Check className="w-7 h-7 text-[#C9A227]" />
            </div>
            <div>
              <div className="font-black uppercase tracking-wide text-lg">
                {mode === "quiz" ? "Quiz complete" : "Deck complete"}
              </div>
              <div className="text-sm text-[#8B857A] mt-1">{activeBook.title}</div>
            </div>

            {mode === "quiz" ? (
              <div>
                <div className="text-3xl font-black text-[#C9A227]">
                  {correctCount} / {activeBook.questions.length}
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
                onClick={resetAll}
                className="py-3 rounded-md border border-[#3A362F] font-bold text-sm uppercase tracking-wide hover:border-[#C9A227] active:scale-[0.97] transition"
              >
                Choose another book
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
