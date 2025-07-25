/**
 * Constantes partagées pour le Piano Roll Base
 */

// Configuration du piano roll - dynamique
export const STEP_OPTIONS = [8, 16, 32, 64];
export const DEFAULT_STEPS = 16;

// Configuration de la grille
export const CELL_WIDTH = 40;
export const CELL_HEIGHT = 32;
export const PIANO_WIDTH = 80;

// Configuration des vélocités
export const DEFAULT_VELOCITY = 64;
export const MIN_VELOCITY = 1;
export const MAX_VELOCITY = 127;

// Configuration des notes longues
export const MIN_DURATION = 1;
export const MAX_DURATION = 16;

// Génération des notes par octave
export const generateNotesForOctave = (octave: number): string[] => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames.reverse().map(note => `${note}${octave}`); // Inversé pour affichage top-to-bottom
};

// Gamme étendue C1 à C7
export const ALL_OCTAVES = [7, 6, 5, 4, 3, 2, 1];
export const ALL_NOTES = ALL_OCTAVES.flatMap(octave => generateNotesForOctave(octave));

// Configuration des modes
export const MODE_CONFIGS = {
  edition: {
    id: 'edition' as const,
    title: '🎹 Édition',
    description: 'Piano Roll classique avec toutes les fonctionnalités',
    icon: '🎹',
    color: 'bg-blue-600',
    status: 'stable' as const
  },
  inspiration: {
    id: 'inspiration' as const,
    title: '✨ Inspiration',
    description: 'Assistant IA pour génération de mélodies',
    icon: '✨',
    color: 'bg-purple-600',
    status: 'planned' as const
  },
  arrangement: {
    id: 'arrangement' as const,
    title: '🎼 Arrangement',
    description: 'Gestion multi-patterns et structure',
    icon: '🎼',
    color: 'bg-green-600',
    status: 'planned' as const
  },
  scales: {
    id: 'scales' as const,
    title: '🎵 Gammes',
    description: 'Assistant gammes et accords musicaux',
    icon: '🎵',
    color: 'bg-yellow-600',
    status: 'planned' as const
  },
  test: {
    id: 'test' as const,
    title: '🧪 Test',
    description: 'Mode test pour expérimentation',
    icon: '🧪',
    color: 'bg-red-600',
    status: 'experimental' as const
  }
} as const;