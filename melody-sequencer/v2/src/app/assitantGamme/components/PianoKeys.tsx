'use client';

import React from 'react';
import { isBlackKey, getOctaveNumber } from '../utils/noteHelpers';
import { scaleColoringHelper, ColoringMode } from '../utils/scaleColoring';

interface PianoKeysProps {
  visibleNotes: string[];
  coloringMode?: ColoringMode;
}

export const PianoKeys: React.FC<PianoKeysProps> = ({
  visibleNotes,
  coloringMode = 'standard'
}) => {
  return (
    <div className="flex-shrink-0 w-24 sm:w-28 bg-gradient-to-r from-slate-700/80 to-slate-800/80 border-r border-slate-600 sticky left-0 z-10">
      {visibleNotes.map((note, noteIndex) => {
        const isBlack = isBlackKey(note);
        const octave = getOctaveNumber(note);
        const noteName = note.replace(/[0-9]/g, '');
        const isOctaveStart = noteName === 'C'; // C marque le début d'une octave
        
        // Obtenir les informations de couleur selon le mode
        const colorInfo = scaleColoringHelper.getNoteColorInfo(note);
        const tooltip = scaleColoringHelper.getNoteTooltip(note);
        
        // Classes de base
        const baseClasses = "h-10 sm:h-8 border-b flex items-center justify-between px-2 sm:px-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer touch-manipulation";
        
        // Bordure d'octave (prioritaire)
        const borderClasses = isOctaveStart 
          ? 'border-amber-500/50 border-b-2' 
          : 'border-slate-600/50';
        
        // Couleurs selon le mode de coloration
        let colorClasses = '';
        let textClasses = '';
        
        if (coloringMode === 'standard') {
          // Mode standard : couleurs classiques piano
          colorClasses = isBlack 
            ? 'bg-gradient-to-r from-slate-900/90 to-slate-800/90 shadow-inner' 
            : 'bg-gradient-to-r from-slate-100 to-slate-200 shadow-sm';
          textClasses = isBlack ? 'text-slate-300' : 'text-slate-800';
        } else {
          // Mode intelligent : utiliser les couleurs de la gamme
          colorClasses = `${colorInfo.bgColor} shadow-sm`;
          textClasses = colorInfo.textColor;
          
          // Ajouter un effet de brillance pour les notes importantes
          if (colorInfo.isTonic || colorInfo.isDominant) {
            colorClasses += ' shadow-lg ring-1 ring-white/20';
          }
        }
        
        return (
          <div
            key={note}
            className={`${baseClasses} ${borderClasses} ${colorClasses} ${textClasses}`}
            title={tooltip}
          >
            <span className={`font-bold tracking-wide relative ${isOctaveStart ? 'text-amber-400' : ''}`}>
              {noteName}
              {/* Indicateur visuel pour notes importantes en mode gamme */}
              {coloringMode !== 'standard' && colorInfo.isTonic && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 rounded-full border border-white"></span>
              )}
              {coloringMode !== 'standard' && colorInfo.isDominant && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border border-white"></span>
              )}
            </span>
            <span className={`text-xs font-mono ${
              isOctaveStart 
                ? 'text-amber-500 font-bold' 
                : ''
            }`}>
              {octave}
              {/* Affichage degré en mode degrés */}
              {coloringMode === 'degrees' && colorInfo.scaledegree && (
                <div className="text-[10px] opacity-75">
                  {colorInfo.scaledegree}
                </div>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};