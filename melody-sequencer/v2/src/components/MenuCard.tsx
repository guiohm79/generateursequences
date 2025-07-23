/**
 * Composant de carte pour le menu - Réutilisable et extensible
 */

'use client';

import Link from 'next/link';
import { MenuItem, MENU_STATUS_COLORS, MENU_STATUS_LABELS } from '../types/menu';

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const statusColor = MENU_STATUS_COLORS[item.status];
  const statusLabel = MENU_STATUS_LABELS[item.status];
  
  const isDisabled = item.status === 'planned' || item.status === 'broken';
  
  const cardContent = (
    <div className={`
      bg-gray-800 p-6 rounded-lg transition-all duration-200
      ${isDisabled 
        ? 'opacity-60 cursor-not-allowed' 
        : 'hover:bg-gray-700 hover:shadow-lg hover:scale-105 cursor-pointer'
      }
      ${item.status === 'new' ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
    `}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
        <div className={`text-sm font-medium ${statusColor}`}>
          {statusLabel}
        </div>
      </div>
      
      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
        {item.description}
      </p>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {item.category}
        </div>
        
        {!isDisabled && (
          <div className="text-blue-400 text-sm font-medium">
            Ouvrir →
          </div>
        )}
        
        {item.status === 'planned' && (
          <div className="text-purple-400 text-sm font-medium">
            Bientôt disponible
          </div>
        )}
      </div>
    </div>
  );
  
  if (isDisabled) {
    return cardContent;
  }
  
  return (
    <Link href={item.href}>
      {cardContent}
    </Link>
  );
}