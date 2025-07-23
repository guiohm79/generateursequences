/**
 * Types pour le système de menu extensible
 */

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  href: string;
  status: 'stable' | 'testing' | 'new' | 'planned' | 'broken';
  category: 'core' | 'debug' | 'features' | 'tools' | 'experimental';
  priority: number; // 1 = highest
}

export interface MenuCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  items: MenuItem[];
}

export const MENU_STATUS_COLORS = {
  stable: 'text-green-400',
  testing: 'text-yellow-400',
  new: 'text-blue-400',
  planned: 'text-purple-400',
  broken: 'text-red-400'
} as const;

export const MENU_STATUS_LABELS = {
  stable: '✅ Stable',
  testing: '⚠️ En test',
  new: '🔥 Nouveau',
  planned: '📋 Planifié',
  broken: '❌ Cassé'
} as const;

export const CATEGORY_COLORS = {
  core: 'bg-green-900 border-green-600',
  debug: 'bg-yellow-900 border-yellow-600',
  features: 'bg-blue-900 border-blue-600',
  tools: 'bg-purple-900 border-purple-600',
  experimental: 'bg-red-900 border-red-600'
} as const;