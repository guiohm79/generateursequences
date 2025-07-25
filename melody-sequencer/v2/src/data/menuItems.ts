/**
 * Configuration du menu - Facilement extensible
 */

import { MenuItem, MenuCategory } from '../types/menu';

export const MENU_ITEMS: MenuItem[] = [
  // === DEBUG & TESTS ===
  {
    id: 'pianoroll-base',
    title: '🎹 Piano Roll Base - Architecture Modulaire',
    description: '✅ DÉVELOPPEMENT - Version modulaire avec tous composants (TransportControls + OctaveNavigation + PianoGridComplete + etc.)',
    href: '/pianorollBase',
    status: 'stable',
    category: 'debug',
    priority: 1
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
    id: 'inspiration',
    title: '🎨 Inspiration - Générateur de Séquences',
    description: '✅ NOUVEAU - Piano Roll + moteur de génération automatique basé sur randomEngine V1',
    href: '/inspiration',
    status: 'stable',
    category: 'modes',
    priority: 1
  },
  

  // === MIDI ===
  {
    id: 'midi-tools',
    title: '🎼 Outils MIDI',
    description: 'Tests et outils pour l\'export/import MIDI',
    href: '/midi',
    status: 'stable',
    category: 'tools',
    priority: 1
  },

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