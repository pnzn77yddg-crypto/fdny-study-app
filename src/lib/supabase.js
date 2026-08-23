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
 
// Full library: chapters, each with its sections (no content yet — content is
// loaded per-section on demand so we don't pull all 129 sections' flashcards
// and quiz questions up front).
export async function fetchLibrary() {
  const { data, error } = await supabase
    .from("chapters")
    .select("id, chapter_key, chapter_name, sections(id, section_number, section_title)")
    .order("chapter_key");
  if (error) throw error;
 
  // sort sections within each chapter by section_number
  return (data || []).map((chapter) => ({
    ...chapter,
    sections: [...(chapter.sections || [])].sort(
      (a, b) => a.section_number - b.section_number
    ),
  }));
}
 
// Flashcards + quiz questions for a single section.
export async function fetchSectionContent(sectionId) {
  const { data, error } = await supabase
    .from("generated_content")
    .select("flashcards, quiz_questions, card_count, quiz_count")
    .eq("section_id", sectionId)
    .single();
  if (error) throw error;
  return data;
}
 
