/**
 * Configuration du menu - Facilement extensible
 */

import { MenuItem, MenuCategory } from '../types/menu';

export const MENU_ITEMS: MenuItem[] = [
  // === DEBUG & TESTS ===
  {
    id: 'test-modular-complete',
    title: '🎹 Test Modulaire Complet',
    description: 'Test de tous les composants modulaires Phase 3.3 - TransportControls + Navigation + PianoGrid',
    href: '/test-complete',
    status: 'testing',
    category: 'debug',
    priority: 0
  },
  {
    id: 'pianoroll-base',
    title: '🧪 Piano Roll Base (Expérimentation)',
    description: 'Version copie du Piano Roll pour refactorisation sécurisée',
    href: '/pianorollBase',
    status: 'testing',
    category: 'debug',
    priority: 1
  },
  {
    id: 'test-react',
    title: 'Test Base React',
    description: 'Vérifier que React/Next.js fonctionne correctement',
    href: '/debug/test',
    status: 'stable',
    category: 'debug',
    priority: 1
  },
  {
    id: 'test-tone',
    title: 'Test Tone.js',
    description: 'Vérifier que Tone.js peut être chargé et utilisé sans plantage',
    href: '/debug/test-tone',
    status: 'stable',
    category: 'debug',
    priority: 2
  },
  {
    id: 'test-audio',
    title: 'Test Audio Simple',
    description: 'Version ultra-simple et robuste de l\'audio engine',
    href: '/debug/test-simple-audio',
    status: 'stable',
    category: 'debug',
    priority: 3
  },

  // === CORE FEATURES ===
  {
    id: 'piano-roll',
    title: '🎹 Piano Roll Professionnel',
    description: '✅ COMPLET - Vélocité, notes longues, sélection multiple, export MIDI, vitesses lecture',
    href: '/piano-roll',
    status: 'stable',
    category: 'core',
    priority: 1
  },
  
  // === MODES PIANO ROLL ===
  {
    id: 'mode-edition',
    title: '🎹 Mode Édition',
    description: 'Piano Roll classique avec toutes les fonctionnalités',
    href: '/modes/edition',
    status: 'stable',
    category: 'modes',
    priority: 1
  },
  {
    id: 'mode-test',
    title: '🧪 Mode Test',
    description: 'Zone d\'expérimentation pour la refactorisation Piano Roll',
    href: '/modes/test',
    status: 'testing',
    category: 'modes',
    priority: 2
  },
  {
    id: 'mode-inspiration',
    title: '✨ Mode Inspiration',
    description: 'Assistant IA pour génération de mélodies (Magenta.js)',
    href: '/modes/inspiration',
    status: 'planned',
    category: 'modes',
    priority: 3
  },
  {
    id: 'mode-arrangement',
    title: '🎼 Mode Arrangement',
    description: 'Gestion multi-patterns et structure de composition',
    href: '/modes/arrangement',
    status: 'planned',
    category: 'modes',
    priority: 4
  },
  {
    id: 'mode-scales',
    title: '🎵 Mode Gammes',
    description: 'Assistant gammes et accords musicaux',
    href: '/modes/scales',
    status: 'planned',
    category: 'modes',
    priority: 5
  },
  {
    id: 'sequencer-main',
    title: 'Séquenceur Principal',
    description: 'Interface principale du séquenceur basée sur l\'architecture simple',
    href: '/sequencer',
    status: 'planned',
    category: 'core',
    priority: 2
  },
  {
    id: 'transport',
    title: 'Contrôles Transport',
    description: 'Play/Stop/Tempo/Speed avec la nouvelle architecture',
    href: '/transport',
    status: 'planned',
    category: 'core',
    priority: 3
  },

  // === FEATURES AVANCÉES ===
  {
    id: 'velocity-editor',
    title: '✅ Éditeur Vélocité',
    description: 'IMPLÉMENTÉ - Couleurs vert→rouge, drag vertical temps réel',
    href: '/piano-roll',
    status: 'stable',
    category: 'features',
    priority: 1
  },
  {
    id: 'note-length',
    title: '✅ Notes Longues',
    description: 'IMPLÉMENTÉ - Durée variable, redimensionnement horizontal',
    href: '/piano-roll',
    status: 'stable',
    category: 'features',
    priority: 2
  },
  {
    id: 'multi-selection',
    title: '✅ Sélection Multiple',
    description: 'IMPLÉMENTÉ - Rectangle, Ctrl+clic, copier/coller, flèches',
    href: '/piano-roll',
    status: 'stable',
    category: 'features',
    priority: 3
  },
  {
    id: 'midi-export',
    title: '✅ Export/Import MIDI',
    description: 'IMPLÉMENTÉ - Export .mid professionnel, timing parfait, module réutilisable',
    href: '/midi',
    status: 'stable',
    category: 'features',
    priority: 4
  },
  {
    id: 'reading-speeds',
    title: '✅ Vitesses de Lecture',
    description: 'IMPLÉMENTÉ - 1/8, 1/16, 1/32 (audio seulement, MIDI toujours cohérent)',
    href: '/piano-roll',
    status: 'stable',
    category: 'features',
    priority: 5
  },
  {
    id: 'presets',
    title: '💾 Système Presets',
    description: '✅ IMPLÉMENTÉ - Sauvegarde/chargement localStorage + export/import JSON',
    href: '/presets',
    status: 'stable',
    category: 'features',
    priority: 6
  },
  {
    id: 'midi-import',
    title: '🎼 Import MIDI',
    description: '✅ IMPLÉMENTÉ - Drag & drop + sélecteur fichier, limitation 64 steps automatique',
    href: '/piano-roll',
    status: 'stable',
    category: 'features',
    priority: 7
  },
  {
    id: 'undo-redo',
    title: '↶↷ Undo/Redo',
    description: '✅ IMPLÉMENTÉ - Historique 50 actions + interface complète + Ctrl+Z/Y',
    href: '/piano-roll',
    status: 'stable',
    category: 'features',
    priority: 8
  },
  {
    id: 'keyboard-shortcuts',
    title: '⌨️ Raccourcis Clavier Globaux',
    description: '✅ IMPLÉMENTÉ - 20+ raccourcis pro (Espace=Play, Ctrl+S/O/E, navigation)',
    href: '/piano-roll',
    status: 'stable',
    category: 'features',
    priority: 9
  },
  {
    id: 'quantization',
    title: 'Quantization',
    description: 'Alignement automatique des notes sur la grille',
    href: '/quantization',
    status: 'planned',
    category: 'features',
    priority: 9
  },
  {
    id: 'scale-helper',
    title: 'Assistant Gammes',
    description: 'Helper pour gammes et accords musicaux',
    href: '/scale-helper',
    status: 'planned',
    category: 'features',
    priority: 10
  },

  // === OUTILS ===
  {
    id: 'pattern-analyzer',
    title: 'Analyseur de Patterns',
    description: 'Analyser et visualiser les patterns musicaux',
    href: '/pattern-analyzer',
    status: 'planned',
    category: 'tools',
    priority: 1
  },
  {
    id: 'performance-monitor',
    title: 'Moniteur Performance',
    description: 'Surveiller les performances audio et CPU',
    href: '/performance',
    status: 'planned',
    category: 'tools',
    priority: 2
  },

  // === EXPÉRIMENTAL ===
  {
    id: 'ai-generation',
    title: 'Génération IA',
    description: 'Génération de patterns avec Magenta.js ou autres IA',
    href: '/ai-generation',
    status: 'planned',
    category: 'experimental',
    priority: 1
  },
  {
    id: 'collaborative',
    title: 'Mode Collaboratif',
    description: 'Édition collaborative en temps réel',
    href: '/collaborative',
    status: 'planned',
    category: 'experimental',
    priority: 2
  }
];

export function getMenuCategories(): MenuCategory[] {
  const categories: { [key: string]: MenuCategory } = {
    debug: {
      id: 'debug',
      title: '🔧 Debug & Tests',
      description: 'Outils de diagnostic et tests de base',
      color: 'bg-yellow-900 border-yellow-600',
      items: []
    },
    core: {
      id: 'core',
      title: '🎵 Fonctionnalités Core',
      description: 'Fonctionnalités principales du séquenceur',
      color: 'bg-green-900 border-green-600',
      items: []
    },
    modes: {
      id: 'modes',
      title: '🎛️ Modes Piano Roll',
      description: 'Différents modes du Piano Roll (Édition, Inspiration, Arrangement, etc.)',
      color: 'bg-indigo-900 border-indigo-600',
      items: []
    },
    features: {
      id: 'features',
      title: '✨ Features Avancées',
      description: 'Fonctionnalités avancées et améliorations',
      color: 'bg-blue-900 border-blue-600',
      items: []
    },
    tools: {
      id: 'tools',
      title: '🛠️ Outils',
      description: 'Outils de développement et d\'analyse',
      color: 'bg-purple-900 border-purple-600',
      items: []
    },
    experimental: {
      id: 'experimental',
      title: '🧪 Expérimental',
      description: 'Fonctionnalités expérimentales et R&D',
      color: 'bg-red-900 border-red-600',
      items: []
    }
  };

  // Regrouper les items par catégorie
  MENU_ITEMS.forEach(item => {
    if (categories[item.category]) {
      categories[item.category].items.push(item);
    }
  });

  // Trier les items dans chaque catégorie par priorité
  Object.values(categories).forEach(category => {
    category.items.sort((a, b) => a.priority - b.priority);
  });

  // Retourner les catégories dans l'ordre souhaité
  return [
    categories.debug,
    categories.core,
    categories.modes,
    categories.features,
    categories.tools,
    categories.experimental
  ].filter(cat => cat.items.length > 0);
}