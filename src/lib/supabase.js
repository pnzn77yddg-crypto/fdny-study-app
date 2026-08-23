import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Chapter keys look like "010a5_Chapter_3_Addendum_5_Nozzle_Companies" or
// "003_Chapter_1_Overview". Pull out the chapter number and (if present)
// the addendum number so addenda can be nested under their real chapter
// instead of showing up as their own top-level entries.
function parseChapterKey(key) {
  const m = key.match(/Chapter_(\d+)(?:_Addendum_(\d+))?/);
  return {
    chapterNum: m ? parseInt(m[1], 10) : null,
    addendumNum: m && m[2] != null ? parseInt(m[2], 10) : null,
  };
}

// Library grouped for navigation: one row per real chapter, with that
// chapter's addenda nested underneath it. Also carries flashcard/quiz
// counts (summed from generated_content) for display, and a grand total
// across the whole book for the "study everything" option.
export async function fetchLibrary() {
  const { data, error } = await supabase
    .from("chapters")
    .select(
      "id, chapter_key, chapter_name, book_title, sections(id, generated_content(card_count, quiz_count))"
    );
  if (error) throw error;

  // generated_content may embed as an array or a single object depending on
  // how PostgREST infers the relationship's cardinality — handle both.
  const oneOf = (rel) => (Array.isArray(rel) ? rel[0] : rel);

  const withCounts = (data || []).map((c) => {
    const cardCount = (c.sections || []).reduce(
      (sum, s) => sum + (oneOf(s.generated_content)?.card_count || 0),
      0
    );
    const quizCount = (c.sections || []).reduce(
      (sum, s) => sum + (oneOf(s.generated_content)?.quiz_count || 0),
      0
    );
    const { chapterNum, addendumNum } = parseChapterKey(c.chapter_key);
    return {
      id: c.id,
      chapterKey: c.chapter_key,
      name: c.chapter_name,
      chapterNum,
      addendumNum,
      cardCount,
      quizCount,
    };
  });

  const bookTitle = data?.[0]?.book_title || "";

  const byNum = new Map();
  for (const c of withCounts) {
    if (!byNum.has(c.chapterNum)) byNum.set(c.chapterNum, { base: null, addenda: [] });
    const group = byNum.get(c.chapterNum);
    if (c.addendumNum == null) group.base = c;
    else group.addenda.push(c);
  }

  const chapters = [...byNum.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([num, group]) => {
      const base = group.base || group.addenda[0]; // fallback: no base row found
      const addenda = group.base
        ? group.addenda.sort((a, b) => a.addendumNum - b.addendumNum)
        : group.addenda.slice(1).sort((a, b) => a.addendumNum - b.addendumNum);
      return { ...base, chapterNum: num, addenda };
    });

  const totalCards = withCounts.reduce((sum, c) => sum + c.cardCount, 0);
  const totalQuiz = withCounts.reduce((sum, c) => sum + c.quizCount, 0);

  return { bookTitle, chapters, totalCards, totalQuiz };
}

// All flashcards + quiz questions for a single chapter (or addendum) id.
export async function fetchChapterContent(chapterId) {
  const { data, error } = await supabase
    .from("generated_content")
    .select("flashcards, quiz_questions, sections!inner(chapter_id)")
    .eq("sections.chapter_id", chapterId);
  if (error) throw error;
  return mergeContent(data);
}

// Every flashcard + quiz question across the entire book.
export async function fetchBookContent() {
  const { data, error } = await supabase
    .from("generated_content")
    .select("flashcards, quiz_questions");
  if (error) throw error;
  return mergeContent(data);
}

function mergeContent(rows) {
  const flashcards = [];
  const quiz_questions = [];
  for (const row of rows || []) {
    if (row.flashcards) flashcards.push(...row.flashcards);
    if (row.quiz_questions) quiz_questions.push(...row.quiz_questions);
  }
  return { flashcards, quiz_questions };
}

// Fisher-Yates partial shuffle: returns up to `count` random, non-repeating
// items from `arr` without mutating it.
export function sampleRandom(arr, count) {
  const n = Math.min(count, arr.length);
  const pool = [...arr];
  for (let i = pool.length - 1; i > pool.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(pool.length - n);
}

// Standard size options for the "how many" dropdown, filtered down to
// whatever's actually available (plus an "All" option showing the real count).
export function sizeOptions(total) {
  const steps = [10, 25, 50, 100].filter((n) => n < total);
  return [...steps, total];
}
