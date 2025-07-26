/**
 * ChordGrid.tsx - Grille de suggestions d'accords intelligente
 * 
 * Ce composant affiche et permet d'interagir avec :
 * - Grille d'accords basés sur la gamme courante
 * - Suggestions contextuelles basées sur l'historique
 * - Extensions d'accords (7, 9, sus, add, etc.)
 * - Voice leading optimisé
 * - Preview audio des accords
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ScaleHelper } from '../lib/ScaleHelper';
import { ChordSuggestions, ExtendedChord } from '../lib/ChordSuggestions';

export interface ChordGridProps {
  // Système musical
  scaleHelper: ScaleHelper;
  
  // Historique des accords pour suggestions contextuelles
  chordHistory?: ExtendedChord[];
  
  // Callbacks
  onChordSelect: (chord: ExtendedChord) => void;
  onChordPreview?: (chord: ExtendedChord) => void;
  onChordInsert?: (chord: ExtendedChord, step: number) => void;
  
  // Audio preview
  audioEngine?: {
    playChord: (notes: string[], duration?: number) => void;
    stopAll: () => void;
  };
  
  // Options d'affichage
  showExtensions?: boolean;
  showVoiceLeading?: boolean;
  maxSuggestions?: number;
  
  // Style
  className?: string;
  compactMode?: boolean;
}

interface ChordCategory {
  name: string;
  chords: ExtendedChord[];
  color: string;
  description: string;
}

export const ChordGrid: React.FC<ChordGridProps> = ({
  scaleHelper,
  chordHistory = [],
  onChordSelect,
  onChordPreview,
  onChordInsert,
  audioEngine,
  showExtensions = true,
  showVoiceLeading = false,
  maxSuggestions = 12,
  className = '',
  compactMode = false
}) => {
  // États
  const [selectedCategory, setSelectedCategory] = useState<string>('basic');
  const [hoveredChord, setHoveredChord] = useState<ExtendedChord | null>(null);
  const [showContextual, setShowContextual] = useState<boolean>(true);
  
  // Système de suggestions
  const [chordSuggestions] = useState(() => new ChordSuggestions(scaleHelper));

  // Mettre à jour l'historique des accords
  useEffect(() => {
    chordSuggestions.clearHistory();
    chordHistory.forEach(chord => {
      chordSuggestions.addChordToHistory(chord);
    });
  }, [chordHistory, chordSuggestions]);

  // Générer toutes les suggestions d'accords
  const allChordSuggestions = useMemo(() => {
    const basicChords = scaleHelper.getChordSuggestions();
    const extendedChords = basicChords.flatMap(chord => 
      chordSuggestions.generateChordExtensions(chord)
    );
    
    return extendedChords;
  }, [scaleHelper, chordSuggestions]);

  // Suggestions contextuelles basées sur l'historique
  const contextualSuggestions = useMemo(() => {
    if (chordHistory.length === 0) return [];
    return chordSuggestions.suggestNextChord().slice(0, maxSuggestions);
  }, [chordHistory, chordSuggestions, maxSuggestions]);

  // Catégoriser les accords
  const chordCategories: ChordCategory[] = useMemo(() => {
    const categories: ChordCategory[] = [
      {
        name: 'basic',
        chords: allChordSuggestions.filter(c => c.complexity === 'basic'),
        color: 'bg-green-600',
        description: 'Accords de base (triades)'
      },
      {
        name: 'seventh',
        chords: allChordSuggestions.filter(c => c.extensions.includes('7')),
        color: 'bg-blue-600',
        description: 'Accords de septième'
      },
      {
        name: 'extended',
        chords: allChordSuggestions.filter(c => 
          c.extensions.some(ext => ['9', '11', '13', 'add9'].includes(ext))
        ),
        color: 'bg-purple-600',
        description: 'Accords étendus (9, 11, 13)'
      },
      {
        name: 'suspended',
        chords: allChordSuggestions.filter(c => 
          c.extensions.some(ext => ['sus2', 'sus4'].includes(ext))
        ),
        color: 'bg-orange-600',
        description: 'Accords suspendus'
      },
      {
        name: 'contextual',
        chords: contextualSuggestions,
        color: 'bg-emerald-600',
        description: 'Suggestions contextuelles'
      }
    ];

    return categories.filter(cat => cat.chords.length > 0);
  }, [allChordSuggestions, contextualSuggestions]);

  // Obtenir la catégorie sélectionnée
  const currentCategory = chordCategories.find(cat => cat.name === selectedCategory) 
    || chordCategories[0];

  // === HANDLERS ===

  const handleChordClick = (chord: ExtendedChord) => {
    onChordSelect(chord);
  };

  const handleChordHover = (chord: ExtendedChord | null) => {
    setHoveredChord(chord);
    if (chord && onChordPreview) {
      onChordPreview(chord);
    }
  };

  const handleChordPreview = (chord: ExtendedChord) => {
    if (audioEngine) {
      // Créer les notes avec octave pour l'aperçu
      const chordNotes = chord.notes.map(note => note + '4');
      audioEngine.playChord(chordNotes, 1000); // 1 seconde
    }
    
    // Feedback visuel
    setHoveredChord(chord);
    
    // Callback personnalisé
    if (onChordPreview) {
      onChordPreview(chord);
    }
  };

  const handleChordInsert = (chord: ExtendedChord, step: number = 0) => {
    if (onChordInsert) {
      onChordInsert(chord, step);
    }
  };

  // === UTILITAIRES D'AFFICHAGE ===

  const getChordDisplayName = (chord: ExtendedChord): string => {
    if (compactMode) {
      return chord.name;
    }
    
    let display = chord.name;
    if (chord.bassNote) {
      display += `/${chord.bassNote}`;
    }
    return display;
  };

  const getChordDescription = (chord: ExtendedChord): string => {
    const functionNames: Record<string, string> = {
      'tonic': 'Tonique',
      'subdominant': 'Sous-dominante', 
      'dominant': 'Dominante',
      'mediant': 'Médiante',
      'submediant': 'Sus-dominante',
      'leading': 'Sensible',
      'supertonic': 'Sus-tonique'
    };

    return functionNames[chord.function] || chord.function;
  };

  const getVoiceLeadingQuality = (chord: ExtendedChord): number => {
    // Simplification : utiliser un score basé sur la complexité
    const complexityScore = {
      'basic': 90,
      'intermediate': 75,
      'advanced': 60
    };
    
    return complexityScore[chord.complexity] || 70;
  };

  // Mode compact pour intégration dans d'autres composants
  if (compactMode) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Accords suggérés</h3>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600"
          >
            {chordCategories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.description}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {currentCategory?.chords.slice(0, 6).map((chord, index) => (
            <button
              key={`${chord.name}-${index}`}
              onClick={() => handleChordClick(chord)}
              onMouseEnter={() => handleChordHover(chord)}
              onMouseLeave={() => handleChordHover(null)}
              className={`p-2 rounded text-xs font-medium transition-all ${currentCategory.color} hover:brightness-110 text-white`}
              title={`${getChordDescription(chord)} - ${chord.notes.join(', ')}`}
            >
              {getChordDisplayName(chord)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Mode complet
  return (
    <div className={`bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-600/50 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-200 flex items-center">
          🎹 Grille d'Accords
        </h2>
        
        <div className="flex items-center space-x-3">
          {showVoiceLeading && (
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showContextual}
                onChange={(e) => setShowContextual(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
              />
              <span className="text-slate-300">Voice Leading</span>
            </label>
          )}
        </div>
      </div>

      {/* Onglets de catégories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {chordCategories.map(category => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === category.name
                ? `${category.color} text-white shadow-lg`
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {category.description}
            <span className="ml-2 text-xs opacity-75">
              ({category.chords.length})
            </span>
          </button>
        ))}
      </div>

      {/* Grille d'accords */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {currentCategory?.chords.map((chord, index) => (
          <div
            key={`${chord.name}-${index}`}
            className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-600/50 transition-all cursor-pointer group"
            onClick={() => handleChordClick(chord)}
            onMouseEnter={() => handleChordHover(chord)}
            onMouseLeave={() => handleChordHover(null)}
          >
            {/* Nom de l'accord */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-lg">
                {getChordDisplayName(chord)}
              </h3>
              <div className={`w-3 h-3 rounded-full ${currentCategory.color}`} />
            </div>

            {/* Fonction harmonique */}
            <div className="text-sm text-slate-400 mb-2">
              {getChordDescription(chord)}
              <span className="ml-2 text-slate-500">
                ({chord.degree}{chord.quality === 'minor' ? 'm' : chord.quality === 'diminished' ? '°' : ''})
              </span>
            </div>

            {/* Notes de l'accord */}
            <div className="flex flex-wrap gap-1 mb-3">
              {chord.notes.map((note, noteIndex) => {
                const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const noteNumber = chromaticNotes.indexOf(note);
                return (
                  <span
                    key={noteIndex}
                    className={`px-2 py-1 text-xs rounded ${
                      noteIndex === 0 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-600 text-slate-300'
                    }`}
                    title={`${note} = ${noteNumber}`}
                  >
                    {note}
                    <span className="ml-1 opacity-75">
                      {noteNumber}
                    </span>
                  </span>
                );
              })}
            </div>

            {/* Extensions et qualité */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex flex-wrap gap-1">
                {chord.extensions.map((ext, extIndex) => (
                  <span
                    key={extIndex}
                    className="px-1 py-0.5 bg-blue-600/30 text-blue-300 rounded"
                  >
                    {ext}
                  </span>
                ))}
              </div>
              
              {showVoiceLeading && (
                <div className="text-slate-500">
                  VL: {getVoiceLeadingQuality(chord)}%
                </div>
              )}
            </div>

            {/* Genres appropriés */}
            {showExtensions && chord.genre.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                {chord.genre.slice(0, 2).join(', ')}
              </div>
            )}

            {/* Actions au hover */}
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChordInsert(chord, 0);
                  }}
                  className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                >
                  Insérer
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChordPreview(chord);
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  title={`Aperçu audio de ${chord.name}`}
                >
                  🔊
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informations sur l'accord survolé */}
      {hoveredChord && !compactMode && (
        <div className="bg-slate-800/80 border border-slate-600/50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                {hoveredChord.name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Fonction</div>
                  <div className="text-white">{getChordDescription(hoveredChord)}</div>
                </div>
                
                <div>
                  <div className="text-slate-400">Complexité</div>
                  <div className={`${
                    hoveredChord.complexity === 'basic' ? 'text-green-400' :
                    hoveredChord.complexity === 'intermediate' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {hoveredChord.complexity === 'basic' ? 'Basique' :
                     hoveredChord.complexity === 'intermediate' ? 'Intermédiaire' :
                     'Avancé'}
                  </div>
                </div>
                
                <div>
                  <div className="text-slate-400">Voicing</div>
                  <div className="text-white capitalize">{hoveredChord.voicing}</div>
                </div>
              </div>

              {hoveredChord.substitutions.length > 0 && (
                <div className="mt-3">
                  <div className="text-slate-400 text-sm">Substitutions possibles</div>
                  <div className="text-slate-300 text-sm">
                    {hoveredChord.substitutions.join(', ')}
                  </div>
                </div>
              )}
            </div>
            
            <div className="ml-4 text-right">
              <div className="text-slate-400 text-sm">Notes</div>
              <div className="text-white font-mono">
                {hoveredChord.notes.join(' - ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message si aucun accord */}
      {(!currentCategory || currentCategory.chords.length === 0) && (
        <div className="text-center py-8 text-slate-400">
          <div className="text-lg mb-2">🎼</div>
          <div>Aucun accord disponible dans cette catégorie</div>
          <div className="text-sm mt-1">
            Sélectionnez une autre catégorie ou changez de gamme
          </div>
        </div>
      )}
    </div>
  );
};

export default ChordGrid;