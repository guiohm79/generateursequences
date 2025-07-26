/**
 * ScalePanel.tsx - Panel principal de l'Assistant de Gammes
 * 
 * Ce composant fournit l'interface principale pour :
 * - Sélection de gamme et tonalité
 * - Affichage des informations théoriques
 * - Contrôles d'assistance (snap-to-scale, chord mode, etc.)
 * - Analyse en temps réel de la séquence
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ScaleHelper, Scale } from '../lib/ScaleHelper';
import { ChordSuggestions } from '../lib/ChordSuggestions';
import { MusicalTheory, MusicalAnalysis } from '../lib/MusicalTheory';

export interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  duration: number;
  isActive: boolean;
}

export interface ScalePanelProps {
  // Pattern actuel pour l'analyse
  pattern: NoteEvent[];
  
  // Callbacks pour modifier le pattern
  onPatternChange?: (pattern: NoteEvent[]) => void;
  
  // Paramètres d'assistance
  snapToScale: boolean;
  onSnapToScaleChange: (enabled: boolean) => void;
  
  chordMode: boolean;
  onChordModeChange: (enabled: boolean) => void;
  
  // Callbacks pour les actions
  onNoteCorrection?: (originalNote: string, correctedNote: string) => void;
  onChordInsert?: (chord: string[], step: number) => void;
  
  // Style et affichage
  isMinimized?: boolean;
  className?: string;
}

export const ScalePanel: React.FC<ScalePanelProps> = ({
  pattern = [],
  onPatternChange,
  snapToScale = false,
  onSnapToScaleChange,
  chordMode = false,
  onChordModeChange,
  onNoteCorrection,
  onChordInsert,
  isMinimized = false,
  className = ''
}) => {
  // États internes
  const [currentRoot, setCurrentRoot] = useState<string>('C');
  const [currentScaleId, setCurrentScaleId] = useState<string>('major');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<MusicalAnalysis | null>(null);
  
  // Helpers musicaux
  const [scaleHelper] = useState(() => new ScaleHelper(currentScaleId, currentRoot));
  const [chordSuggestions] = useState(() => new ChordSuggestions(scaleHelper));
  const [musicalTheory] = useState(() => new MusicalTheory(scaleHelper));

  // Mettre à jour les helpers quand la gamme change
  useEffect(() => {
    scaleHelper.setScale(currentScaleId);
    scaleHelper.setRoot(currentRoot);
  }, [currentScaleId, currentRoot, scaleHelper]);

  // Analyser le pattern en temps réel
  useEffect(() => {
    if (pattern.length > 0) {
      const newAnalysis = musicalTheory.analyzeSequence(pattern);
      setAnalysis(newAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [pattern, musicalTheory]);

  // Suggestions de gamme basées sur l'analyse
  useEffect(() => {
    if (analysis && analysis.confidence > 80) {
      // Auto-suggérer la gamme détectée si confiance élevée
      if (analysis.key !== currentRoot || analysis.scale !== currentScaleId) {
        // Optionnel : proposer automatiquement la nouvelle gamme
        console.log(`Gamme suggérée: ${analysis.key} ${analysis.scale} (${analysis.confidence}% confiance)`);
      }
    }
  }, [analysis, currentRoot, currentScaleId]);

  // === HANDLERS ===

  const handleRootChange = (newRoot: string) => {
    setCurrentRoot(newRoot);
  };

  const handleScaleChange = (newScaleId: string) => {
    setCurrentScaleId(newScaleId);
  };

  const handleCorrectAllNotes = () => {
    if (!onPatternChange) return;

    const correctedPattern = pattern.map(note => {
      const noteName = ScaleHelper.extractNoteName(note.note);
      const correctedNote = scaleHelper.getClosestScaleNote(noteName);
      
      if (correctedNote !== noteName) {
        const octave = note.note.replace(noteName, '');
        const correctedNoteWithOctave = correctedNote + octave;
        
        if (onNoteCorrection) {
          onNoteCorrection(note.note, correctedNoteWithOctave);
        }
        
        return { ...note, note: correctedNoteWithOctave };
      }
      
      return note;
    });

    onPatternChange(correctedPattern);
  };

  const handleInsertChord = (chordNotes: string[], targetStep: number = 0) => {
    if (!onPatternChange || !onChordInsert) return;

    const chordEvents: NoteEvent[] = chordNotes.map((note, index) => ({
      step: targetStep,
      note: note + '4', // Octave par défaut
      velocity: 100 - (index * 10), // Vélocités décroissantes
      duration: 4, // Notes longues pour les accords
      isActive: true
    }));

    const newPattern = [...pattern, ...chordEvents];
    onPatternChange(newPattern);
    onChordInsert(chordNotes, targetStep);
  };

  // === DONNÉES POUR L'AFFICHAGE ===

  const availableScales = ScaleHelper.getAvailableScales();
  const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const scaleNotes = scaleHelper.getScaleNotes();
  const scaleDegrees = scaleHelper.getScaleDegrees();
  const basicChords = scaleHelper.getChordSuggestions();
  const popularProgressions = scaleHelper.getPopularProgressions();

  // Statistiques du pattern
  const totalNotes = pattern.length;
  const notesInScale = pattern.filter(note => 
    scaleHelper.isNoteInScale(ScaleHelper.extractNoteName(note.note))
  ).length;
  const scaleMatch = totalNotes > 0 ? Math.round((notesInScale / totalNotes) * 100) : 0;

  if (isMinimized) {
    return (
      <div className={`bg-emerald-900/50 border border-emerald-600/50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-emerald-400 font-semibold">🎼 Scale Helper</span>
            <span className="text-sm text-slate-300">
              {currentRoot} {availableScales.find(s => s.id === currentScaleId)?.name}
            </span>
            {analysis && (
              <span className={`text-xs px-2 py-1 rounded ${
                scaleMatch >= 80 ? 'bg-green-600' : 
                scaleMatch >= 60 ? 'bg-yellow-600' : 'bg-red-600'
              }`}>
                {scaleMatch}% match
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSnapToScaleChange(!snapToScale)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                snapToScale 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              Snap
            </button>
            <button
              onClick={() => onChordModeChange(!chordMode)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                chordMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              Chord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-b from-emerald-900/50 to-teal-800/50 border border-emerald-600/50 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-emerald-400 flex items-center">
          🎼 Assistant de Gammes
        </h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-1 text-sm bg-emerald-700/50 hover:bg-emerald-600/50 text-emerald-300 rounded-lg transition-colors"
        >
          {showAdvanced ? 'Simple' : 'Avancé'}
        </button>
      </div>

      {/* Sélection de gamme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-emerald-300 mb-2">
            Tonique
          </label>
          <select
            value={currentRoot}
            onChange={(e) => handleRootChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-emerald-600/50 focus:border-emerald-500 focus:outline-none"
          >
            {chromaticNotes.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-emerald-300 mb-2">
            Gamme
          </label>
          <select
            value={currentScaleId}
            onChange={(e) => handleScaleChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-emerald-600/50 focus:border-emerald-500 focus:outline-none"
          >
            {availableScales.map(scale => (
              <option key={scale.id} value={scale.id}>
                {scale.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Informations sur la gamme */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
        <h3 className="text-emerald-300 font-medium mb-3">Notes de la gamme</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {scaleNotes.map((note, index) => (
            <div
              key={note}
              className="px-3 py-1 bg-emerald-600/30 text-emerald-200 rounded-lg text-sm font-medium"
            >
              {note}
              {showAdvanced && (
                <span className="ml-1 text-emerald-400 text-xs">
                  ({scaleDegrees[index]?.romanNumeral})
                </span>
              )}
            </div>
          ))}
        </div>
        
        {showAdvanced && (
          <div className="text-xs text-slate-400">
            {availableScales.find(s => s.id === currentScaleId)?.description}
          </div>
        )}
      </div>

      {/* Contrôles d'assistance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <h3 className="text-emerald-300 font-medium">Mode d'assistance</h3>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={snapToScale}
              onChange={(e) => onSnapToScaleChange(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-slate-800 border-slate-600 rounded focus:ring-emerald-500"
            />
            <span className="text-slate-300">
              Snap to Scale
              {showAdvanced && <span className="text-xs text-slate-500 block">Corriger automatiquement les notes hors gamme</span>}
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={chordMode}
              onChange={(e) => onChordModeChange(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-slate-800 border-slate-600 rounded focus:ring-emerald-500"
            />
            <span className="text-slate-300">
              Mode Accords
              {showAdvanced && <span className="text-xs text-slate-500 block">Placer des accords complets d'un clic</span>}
            </span>
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="text-emerald-300 font-medium">Actions rapides</h3>
          
          <button
            onClick={handleCorrectAllNotes}
            disabled={totalNotes === 0}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
          >
            🔧 Corriger toutes les notes
          </button>

          {chordMode && (
            <div className="grid grid-cols-2 gap-2">
              {basicChords.slice(0, 4).map(chord => (
                <button
                  key={chord.name}
                  onClick={() => handleInsertChord(chord.notes, 0)}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                  title={`Insérer l'accord ${chord.name} (${chord.function})`}
                >
                  {chord.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analyse du pattern */}
      {analysis && (
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-emerald-300 font-medium mb-3 flex items-center justify-between">
            Analyse du pattern
            <span className={`px-2 py-1 rounded text-xs ${
              scaleMatch >= 80 ? 'bg-green-600' : 
              scaleMatch >= 60 ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
              {scaleMatch}% dans la gamme
            </span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-400">Tonalité détectée</div>
              <div className="text-white font-medium">
                {analysis.key} {analysis.scale}
              </div>
              <div className="text-xs text-slate-500">
                {analysis.confidence}% confiance
              </div>
            </div>
            
            <div>
              <div className="text-slate-400">Complexité</div>
              <div className={`font-medium ${
                analysis.complexity === 'beginner' ? 'text-green-400' :
                analysis.complexity === 'intermediate' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {analysis.complexity === 'beginner' ? 'Débutant' :
                 analysis.complexity === 'intermediate' ? 'Intermédiaire' :
                 'Avancé'}
              </div>
            </div>
            
            <div>
              <div className="text-slate-400">Humeur</div>
              <div className="text-white font-medium">
                {analysis.mood}
              </div>
            </div>
            
            <div>
              <div className="text-slate-400">Notes</div>
              <div className="text-white font-medium">
                {totalNotes} total
              </div>
              <div className="text-xs text-slate-500">
                {notesInScale} dans la gamme
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-emerald-400 mb-2">💡 Suggestions</h4>
              <ul className="space-y-1">
                {analysis.suggestions.slice(0, 2).map((suggestion, index) => (
                  <li key={index} className="text-xs text-slate-300 flex items-start">
                    <span className="text-emerald-400 mr-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avertissements */}
          {analysis.warnings.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-yellow-400 mb-2">⚠️ Avertissements</h4>
              <ul className="space-y-1">
                {analysis.warnings.map((warning, index) => (
                  <li key={index} className="text-xs text-yellow-300 flex items-start">
                    <span className="text-yellow-400 mr-1">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Progressions populaires */}
      {showAdvanced && (
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-emerald-300 font-medium mb-3">Progressions populaires</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {popularProgressions.slice(0, 4).map((progression, index) => (
              <div
                key={index}
                className="bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-600/50 transition-colors"
                onClick={() => {
                  // TODO: Implémenter l'insertion de progression
                  console.log(`Insérer progression: ${progression.name}`);
                }}
              >
                <div className="font-medium text-white text-sm">
                  {progression.name}
                </div>
                <div className="text-xs text-slate-400">
                  {progression.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScalePanel;