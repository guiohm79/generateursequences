/**
 * Composant de section pour organiser le menu par catégories
 * Supporte maintenant les cartes interactives
 */

'use client';

import { MenuCategory } from '../types/menu';
import { MenuCard } from './MenuCard';
import { InteractiveMenuCard } from './InteractiveMenuCard';

interface MenuSectionProps {
  category: MenuCategory;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  useInteractiveCards?: boolean;
  onUpdate?: () => void;
}

export function MenuSection({ 
  category, 
  isCollapsible = false, 
  defaultExpanded = true,
  useInteractiveCards = false,
  onUpdate
}: MenuSectionProps) {
  const availableItems = category.items.filter(item => 
    item.status !== 'planned' || process.env.NODE_ENV === 'development'
  );
  
  const plannedCount = category.items.filter(item => item.status === 'planned').length;
  
  return (
    <div className="mb-8">
      {/* En-tête de section */}
      <div className={`${category.color} p-4 rounded-lg mb-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              {category.title}
            </h2>
            <p className="text-sm text-gray-300">
              {category.description}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-white font-bold text-lg">
              {availableItems.length}
            </div>
            <div className="text-xs text-gray-300">
              {availableItems.length === 1 ? 'item' : 'items'}
            </div>
            {plannedCount > 0 && (
              <div className="text-xs text-purple-300 mt-1">
                +{plannedCount} planifié{plannedCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Grille des items */}
      {availableItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableItems.map(item => 
            useInteractiveCards ? (
              <InteractiveMenuCard 
                key={item.id} 
                item={item}
                onUpdate={onUpdate}
              />
            ) : (
              <MenuCard 
                key={item.id} 
                item={item}
              />
            )
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🚧</div>
          <p>Cette section est en cours de développement</p>
        </div>
      )}
      
      {/* Items planifiés (en mode dev) */}
      {process.env.NODE_ENV === 'development' && plannedCount > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-purple-400 font-medium mb-3">
            Voir les {plannedCount} item{plannedCount > 1 ? 's' : ''} planifié{plannedCount > 1 ? 's' : ''} →
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items
              .filter(item => item.status === 'planned')
              .map(item => 
                useInteractiveCards ? (
                  <InteractiveMenuCard 
                    key={item.id} 
                    item={item}
                    onUpdate={onUpdate}
                  />
                ) : (
                  <MenuCard key={item.id} item={item} />
                )
              )
            }
          </div>
        </details>
      )}
    </div>
  );
}