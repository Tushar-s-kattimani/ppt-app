import { SlideData, ThemeType } from "./pptx-generator";

export interface SavedPresentation {
  id: string;
  topic: string;
  theme: ThemeType;
  date: string;
  slides: SlideData[];
}

const STORAGE_KEY = "slidecraft_presentations";

export function savePresentation(topic: string, theme: ThemeType, slides: SlideData[]) {
  if (typeof window === "undefined") return;
  
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing: SavedPresentation[] = existingStr ? JSON.parse(existingStr) : [];
    
    const newPresentation: SavedPresentation = {
      id: crypto.randomUUID(),
      topic,
      theme,
      date: new Date().toISOString(),
      slides,
    };
    
    // Save to beginning of array
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newPresentation, ...existing]));
  } catch (e) {
    console.error("Failed to save presentation to localStorage", e);
  }
}

export function getSavedPresentations(): SavedPresentation[] {
  if (typeof window === "undefined") return [];
  
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (e) {
    console.error("Failed to parse presentations from localStorage", e);
    return [];
  }
}

export function deletePresentation(id: string) {
  if (typeof window === "undefined") return;
  
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing: SavedPresentation[] = existingStr ? JSON.parse(existingStr) : [];
    const filtered = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete presentation", e);
  }
}
