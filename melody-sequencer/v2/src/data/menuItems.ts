/**
 * Configuration du menu - Facilement extensible
 */

import { MenuItem, MenuCategory } from '../types/menu';

export const MENU_ITEMS: MenuItem[] = [
  // === DEBUG & TESTS ===
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

  // === CORE FEATURES (à venir) ===
  {
    id: 'sequencer-main',
    title: 'Séquenceur Principal',
    description: 'Interface principale du séquenceur basée sur l\'architecture simple',
    href: '/sequencer',
    status: 'planned',
    category: 'core',
    priority: 1
  },
  {
    id: 'piano-roll',
    title: 'Piano Roll',
    description: 'Éditeur de patterns interactif style DAW (16 pas, gamme C)',
    href: '/piano-roll',
    status: 'stable',
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

  // === FEATURES AVANCÉES (futur) ===
  {
    id: 'midi-export',
    title: 'Export MIDI',
    description: 'Exporter les patterns en fichiers MIDI',
    href: '/midi-export',
    status: 'planned',
    category: 'features',
    priority: 1
  },
  {
    id: 'presets',
    title: 'Gestion Presets',
    description: 'Sauvegarder et charger des presets de synthé',
    href: '/presets',
    status: 'planned',
    category: 'features',
    priority: 2
  },
  {
    id: 'effects',
    title: 'Effets Audio',
    description: 'Reverb, delay, filters pour le synthétiseur',
    href: '/effects',
    status: 'planned',
    category: 'features',
    priority: 3
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
    categories.features,
    categories.tools,
    categories.experimental
  ].filter(cat => cat.items.length > 0);
}