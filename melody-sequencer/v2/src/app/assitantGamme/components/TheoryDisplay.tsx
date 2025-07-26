/**
 * TheoryDisplay.tsx - Affichage des informations théoriques musicales
 * 
 * Ce composant affiche et explique :
 * - Analyse harmonique en temps réel
 * - Informations pédagogiques
 * - Progressions d'accords détectées
 * - Conseils de composition
 * - Visualisations théoriques (cercle des quintes, etc.)
 */

'use client';

import React, { useState, useMemo } from 'react';
import { MusicalTheory, MusicalAnalysis, HarmonicAnalysis, MelodicAnalysis, PedagogicalTip } from '../lib/MusicalTheory';
import { ScaleHelper } from '../lib/ScaleHelper';

export interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  duration: number;
  isActive: boolean;
}

export interface TheoryDisplayProps {
  // Données musicales
  pattern: NoteEvent[];
  scaleHelper: ScaleHelper;
  musicalTheory: MusicalTheory;
  
  // Options d'affichage
  showHarmony?: boolean;
  showMelody?: boolean;
  showPedagogy?: boolean;
  showVisualization?: boolean;
  
  // Mode d'affichage
  displayMode?: 'full' | 'compact' | 'minimal';
  
  // Style
  className?: string;
}

interface AnalysisSection {
  id: string;
  title: string;
  icon: string;
  component: React.ReactNode;
  enabled: boolean;
}

export const TheoryDisplay: React.FC<TheoryDisplayProps> = ({
  pattern,
  scaleHelper,
  musicalTheory,
  showHarmony = true,
  showMelody = true,
  showPedagogy = true,
  showVisualization = false,
  displayMode = 'full',
  className = ''
}) => {
  // États
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());

  // Analyses calculées
  const analysis = useMemo(() => {
    if (pattern.length === 0) return null;
    return musicalTheory.analyzeSequence(pattern);
  }, [pattern, musicalTheory]);

  const harmonicAnalysis = useMemo(() => {
    if (pattern.length === 0) return null;
    return musicalTheory.analyzeHarmony(pattern);
  }, [pattern, musicalTheory]);

  const melodicAnalysis = useMemo(() => {
    if (pattern.length === 0) return null;
    return musicalTheory.analyzeMelody(pattern);
  }, [pattern, musicalTheory]);

  const pedagogicalTips = useMemo(() => {
    if (!analysis) return [];
    return musicalTheory.getPedagogicalTips(analysis);
  }, [analysis, musicalTheory]);

  // === COMPOSANTS D'AFFICHAGE ===

  const OverviewSection = () => {
    if (!analysis) {
      return (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-4">🎼</div>
          <div className="text-lg mb-2">Aucune analyse disponible</div>
          <div className="text-sm">Ajoutez des notes pour commencer l'analyse théorique</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Tonalité détectée */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-200 mb-3 flex items-center">
            🎯 Analyse Tonale
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-400 text-sm">Tonalité détectée</div>
              <div className="text-xl font-bold text-white">
                {analysis.key} {analysis.scale}
              </div>
              <div className={`text-sm mt-1 ${
                analysis.confidence >= 80 ? 'text-green-400' :
                analysis.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                Confiance: {analysis.confidence}%
              </div>
            </div>
            
            <div>
              <div className="text-slate-400 text-sm">Complexité</div>
              <div className={`text-lg font-medium ${
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
              <div className="text-slate-400 text-sm">Caractère</div>
              <div className="text-lg font-medium text-white capitalize">
                {analysis.mood}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{pattern.length}</div>
            <div className="text-sm text-slate-400">Notes totales</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {pattern.filter(n => scaleHelper.isNoteInScale(ScaleHelper.extractNoteName(n.note))).length}
            </div>
            <div className="text-sm text-slate-400">Dans la gamme</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {new Set(pattern.map(n => ScaleHelper.extractNoteName(n.note))).size}
            </div>
            <div className="text-sm text-slate-400">Notes uniques</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {pattern.reduce((sum, n) => sum + n.duration, 0)}
            </div>
            <div className="text-sm text-slate-400">Durée totale</div>
          </div>
        </div>

        {/* Suggestions et avertissements */}
        {(analysis.suggestions.length > 0 || analysis.warnings.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.suggestions.length > 0 && (
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-3 flex items-center">
                  💡 Suggestions
                </h4>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-100 flex items-start">
                      <span className="text-blue-400 mr-2 flex-shrink-0">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.warnings.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
                <h4 className="text-yellow-400 font-medium mb-3 flex items-center">
                  ⚠️ Avertissements
                </h4>
                <ul className="space-y-2">
                  {analysis.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-100 flex items-start">
                      <span className="text-yellow-400 mr-2 flex-shrink-0">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const HarmonySection = () => {
    if (!harmonicAnalysis) return <div>Pas d'analyse harmonique disponible</div>;

    return (
      <div className="space-y-6">
        {/* Force de la tonalité */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-200 mb-3">🎭 Analyse Harmonique</h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Force de la tonalité</span>
              <span>{harmonicAnalysis.tonicality}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  harmonicAnalysis.tonicality >= 80 ? 'bg-green-500' :
                  harmonicAnalysis.tonicality >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${harmonicAnalysis.tonicality}%` }}
              />
            </div>
          </div>
        </div>

        {/* Progressions détectées */}
        {harmonicAnalysis.chordProgressions.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-200 mb-3">🔗 Progressions d'Accords</h4>
            <div className="space-y-3">
              {harmonicAnalysis.chordProgressions.map((progression, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white">
                      {progression.chords.join(' → ')}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      progression.strength >= 80 ? 'bg-green-600' :
                      progression.strength >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {progression.strength}%
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    {progression.analysis}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modulations */}
        {harmonicAnalysis.modulations.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-200 mb-3">🔄 Modulations</h4>
            <div className="space-y-2">
              {harmonicAnalysis.modulations.map((modulation, index) => (
                <div key={index} className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-3">
                  <div className="text-white font-medium">
                    {modulation.fromKey} → {modulation.toKey}
                  </div>
                  <div className="text-sm text-slate-300">
                    Position: {modulation.position} • Type: {modulation.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tensions harmoniques */}
        {harmonicAnalysis.tensions.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-200 mb-3">⚡ Tensions</h4>
            <div className="space-y-2">
              {harmonicAnalysis.tensions.map((tension, index) => (
                <div key={index} className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-3">
                  <div className="text-sm">
                    <span className="text-orange-400">Position {tension.position}</span>
                    <span className="text-slate-300 ml-2">
                      Résolution: {tension.resolution}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const MelodySection = () => {
    if (!melodicAnalysis) return <div>Pas d'analyse mélodique disponible</div>;

    return (
      <div className="space-y-6">
        {/* Contour mélodique */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-200 mb-3">🎶 Analyse Mélodique</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-400 text-sm">Contour</div>
              <div className="text-white font-medium capitalize">
                {melodicAnalysis.contour === 'ascending' ? 'Ascendant' :
                 melodicAnalysis.contour === 'descending' ? 'Descendant' :
                 melodicAnalysis.contour === 'arch' ? 'En arc' :
                 melodicAnalysis.contour === 'inverted_arch' ? 'Arc inversé' :
                 'Statique'}
              </div>
            </div>
            
            <div>
              <div className="text-slate-400 text-sm">Étendue</div>
              <div className="text-white font-medium">
                {melodicAnalysis.range} demi-tons
              </div>
            </div>
            
            <div>
              <div className="text-slate-400 text-sm">Mouvement conjoint</div>
              <div className="text-white font-medium">
                {melodicAnalysis.stepwiseMotion}%
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-slate-400 text-sm">Intervalle moyen</div>
            <div className="text-white font-medium">
              {melodicAnalysis.averageInterval.toFixed(1)} demi-tons
            </div>
          </div>
        </div>

        {/* Climax mélodique */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="font-medium text-slate-200 mb-3">🎯 Point Culminant</h4>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-white font-medium">
              Note la plus haute: {melodicAnalysis.climax.note}
            </div>
            <div className="text-sm text-slate-300">
              Position: step {melodicAnalysis.climax.position}
            </div>
          </div>
        </div>

        {/* Sauts mélodiques */}
        {melodicAnalysis.leaps.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-200 mb-3">🦘 Sauts Mélodiques</h4>
            <div className="space-y-2">
              {melodicAnalysis.leaps.map((leap, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-white">
                    {leap.from} → {leap.to}
                  </div>
                  <div className="text-sm text-slate-300">
                    Intervalle: {leap.interval} demi-tons • Position: {leap.position}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séquences mélodiques */}
        {melodicAnalysis.sequences.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-medium text-slate-200 mb-3">🔄 Séquences</h4>
            <div className="space-y-2">
              {melodicAnalysis.sequences.map((sequence, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-white">
                    Pattern: {sequence.pattern.join('-')}
                  </div>
                  <div className="text-sm text-slate-300">
                    Répétitions: {sequence.repetitions} • Transposition: {sequence.transposition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const PedagogySection = () => {
    const handleToggleTip = (index: number) => {
      setExpandedTips(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-200 mb-3">🎓 Conseils Pédagogiques</h3>
          
          {pedagogicalTips.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">📚</div>
              <div>Aucun conseil disponible</div>
              <div className="text-sm">Analysez votre séquence pour obtenir des conseils personnalisés</div>
            </div>
          ) : (
            <div className="space-y-4">
              {pedagogicalTips.map((tip, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleTip(index)}
                    className="w-full p-4 text-left hover:bg-slate-600/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tip.category === 'harmony' ? 'bg-blue-600' :
                          tip.category === 'melody' ? 'bg-green-600' :
                          tip.category === 'rhythm' ? 'bg-purple-600' :
                          'bg-amber-600'
                        }`}>
                          {tip.category === 'harmony' ? 'Harmonie' :
                           tip.category === 'melody' ? 'Mélodie' :
                           tip.category === 'rhythm' ? 'Rythme' :
                           'Théorie'}
                        </span>
                        <div className="text-white font-medium">{tip.topic}</div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          tip.difficulty === 'beginner' ? 'bg-green-600' :
                          tip.difficulty === 'intermediate' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}>
                          {tip.difficulty === 'beginner' ? 'Débutant' :
                           tip.difficulty === 'intermediate' ? 'Intermédiaire' :
                           'Avancé'}
                        </span>
                      </div>
                      <div className={`transform transition-transform ${
                        expandedTips.has(index) ? 'rotate-180' : ''
                      }`}>
                        ▼
                      </div>
                    </div>
                  </button>
                  
                  {expandedTips.has(index) && (
                    <div className="px-4 pb-4">
                      <div className="text-slate-300 mb-3">
                        {tip.explanation}
                      </div>
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-slate-400 text-sm mb-1">Exemple :</div>
                        <div className="text-slate-200 font-mono text-sm">
                          {tip.example}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // === SECTIONS DE NAVIGATION ===

  const sections: AnalysisSection[] = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      icon: '📊',
      component: <OverviewSection />,
      enabled: true
    },
    {
      id: 'harmony',
      title: 'Harmonie',
      icon: '🎭',
      component: <HarmonySection />,
      enabled: showHarmony
    },
    {
      id: 'melody',
      title: 'Mélodie',
      icon: '🎶',
      component: <MelodySection />,
      enabled: showMelody
    },
    {
      id: 'pedagogy',
      title: 'Pédagogie',
      icon: '🎓',
      component: <PedagogySection />,
      enabled: showPedagogy
    }
  ];

  const enabledSections = sections.filter(section => section.enabled);

  // Mode minimal
  if (displayMode === 'minimal') {
    if (!analysis) return null;
    
    return (
      <div className={`bg-slate-800/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">
            {analysis.key} {analysis.scale}
          </span>
          <span className={`${
            analysis.confidence >= 80 ? 'text-green-400' :
            analysis.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {analysis.confidence}%
          </span>
        </div>
      </div>
    );
  }

  // Mode compact
  if (displayMode === 'compact') {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-medium text-slate-200 mb-3">🎼 Analyse Théorique</h3>
        <OverviewSection />
      </div>
    );
  }

  // Mode complet
  return (
    <div className={`bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-600/50 rounded-2xl p-6 ${className}`}>
      {/* Header avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-200">🎼 Analyse Théorique</h2>
      </div>

      {/* Navigation par onglets */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-600/50 pb-4">
        {enabledSections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === section.id
                ? 'bg-slate-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            {section.icon} {section.title}
          </button>
        ))}
      </div>

      {/* Contenu de la section active */}
      <div className="min-h-[400px]">
        {enabledSections.find(section => section.id === activeSection)?.component}
      </div>
    </div>
  );
};

export default TheoryDisplay;