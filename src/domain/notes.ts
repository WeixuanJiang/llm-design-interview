export const NOTES_STORAGE_KEY = "ai-system-design-gym.catalogue-notes.v1";

export function loadNotes(): Record<string, string> {
  try {
    const value = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!value) return {};
    const parsed = JSON.parse(value) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveNotes(notes: Record<string, string>): void {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}
