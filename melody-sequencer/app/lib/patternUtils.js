// Fonctions utilitaires pour la manipulation des patterns et notes

/**
 * Génère toutes les notes disponibles dans une plage d'octaves donnée
 * @param {number} minOct - Octave minimum
 * @param {number} maxOct - Octave maximum
 * @returns {string[]} Array des noms de notes (ex: ["C2", "C#2", "D2", ...])
 */
export function getAllNotes(minOct, maxOct) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const all = [];
  for (let octave = minOct; octave <= maxOct; octave++) {
    notes.forEach(note => all.push(note + octave));
  }
  return all;
}

/**
 * Construit un pattern complet avec toutes les notes de la plage d'octaves
 * @param {Object} pattern - Pattern existant (optionnel)
 * @param {number} steps - Nombre de pas du séquenceur
 * @param {number} minOct - Octave minimum
 * @param {number} maxOct - Octave maximum
 * @returns {Object} Pattern avec toutes les notes initialisées
 */
export function buildPattern(pattern, steps, minOct, maxOct) {
  const allNotes = getAllNotes(minOct, maxOct);
  const next = {};
  allNotes.forEach(note => {
    let arr = Array.isArray(pattern?.[note]) ? pattern[note].slice(0, steps) : [];
    if (arr.length < steps) arr = arr.concat(Array(steps - arr.length).fill(0));
    next[note] = arr;
  });
  return next;
}