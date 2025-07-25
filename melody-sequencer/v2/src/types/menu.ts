/**
 * Types pour le système de menu extensible et interactif
 */

// Système de statuts étendu
export type MenuStatus = 
  | 'stable'      // ✅ Fonctionnel et testé
  | 'testing'     // ⚠️ En cours de test
  | 'new'         // 🔥 Nouvellement ajouté
  | 'planned'     // 📋 Planifié pour plus tard
  | 'broken'      // ❌ Cassé ou non fonctionnel
  | 'validated'   // ✅ Validé par l'utilisateur
  | 'in-progress' // 🔄 En cours de développement
  | 'idea'        // 💡 Idée à explorer
  | 'deprecated'; // 🗑️ Obsolète

// Types pour les checkboxes interactives
export interface MenuCheckbox {
  id: string;
  label: string;
  checked: boolean;
  type: 'test' | 'bug' | 'feature' | 'doc';
  createdAt: number;
  updatedAt: number;
}

// Types pour les notes développeur
export interface MenuNote {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'idea';
  createdAt: number;
  updatedAt: number;
  author?: string;
}

// Item de menu étendu avec fonctionnalités interactives
export interface MenuItem {
  id: string;
  title: string;
  description: string;
  href: string;
  status: MenuStatus;
  category: 'core' | 'debug' | 'features' | 'tools' | 'experimental' | 'modes';
  priority: number; // 1 = highest
  
  // Nouvelles fonctionnalités interactives
  checkboxes?: MenuCheckbox[];
  notes?: MenuNote[];
  lastUpdated?: number;
  estimatedTime?: string; // "2h", "1d", etc.
  dependencies?: string[]; // IDs d'autres items
}

export interface MenuCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  items: MenuItem[];
}

// Configuration des statuts étendus
export const MENU_STATUS_COLORS = {
  stable: 'text-green-400',
  testing: 'text-yellow-400',
  new: 'text-blue-400',
  planned: 'text-purple-400',
  broken: 'text-red-400',
  validated: 'text-emerald-400',
  'in-progress': 'text-amber-400',
  idea: 'text-pink-400',
  deprecated: 'text-gray-400'
} as const;

export const MENU_STATUS_LABELS = {
  stable: '✅ Stable',
  testing: '⚠️ En test',
  new: '🔥 Nouveau',
  planned: '📋 Planifié',
  broken: '❌ Cassé',
  validated: '✅ Validé',
  'in-progress': '🔄 En cours',
  idea: '💡 Idée',
  deprecated: '🗑️ Obsolète'
} as const;

// Configuration des types de checkboxes
export const CHECKBOX_TYPE_COLORS = {
  test: 'text-blue-400',
  bug: 'text-red-400',
  feature: 'text-green-400',
  doc: 'text-purple-400'
} as const;

export const CHECKBOX_TYPE_ICONS = {
  test: '🧪',
  bug: '🐛',
  feature: '✨',
  doc: '📚'
} as const;

// Configuration des types de notes
export const NOTE_TYPE_COLORS = {
  info: 'text-blue-400 bg-blue-900/20 border-blue-600/30',
  warning: 'text-yellow-400 bg-yellow-900/20 border-yellow-600/30',
  error: 'text-red-400 bg-red-900/20 border-red-600/30',
  idea: 'text-pink-400 bg-pink-900/20 border-pink-600/30'
} as const;

export const NOTE_TYPE_ICONS = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  idea: '💡'
} as const;

export const CATEGORY_COLORS = {
  core: 'bg-green-900 border-green-600',
  debug: 'bg-yellow-900 border-yellow-600',
  modes: 'bg-indigo-900 border-indigo-600',
  features: 'bg-blue-900 border-blue-600',
  tools: 'bg-purple-900 border-purple-600',
  experimental: 'bg-red-900 border-red-600'
} as const;