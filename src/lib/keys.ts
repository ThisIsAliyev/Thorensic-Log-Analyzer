export const getGeminiKey = () =>
  localStorage.getItem("thorensic.gemini") || import.meta.env.VITE_GEMINI_API_KEY || null;

export const setGeminiKey = (k: string | null) =>
  k ? localStorage.setItem("thorensic.gemini", k) : localStorage.removeItem("thorensic.gemini");

export const getVTKey = () =>
  localStorage.getItem("thorensic.vt") || import.meta.env.VITE_VIRUSTOTAL_API_KEY || null;

export const setVTKey = (k: string | null) =>
  k ? localStorage.setItem("thorensic.vt", k) : localStorage.removeItem("thorensic.vt");

