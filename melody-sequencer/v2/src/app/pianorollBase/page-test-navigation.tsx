'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';

// Import des nouveaux composants
import { OctaveNavigation } from './components/OctaveNavigation';
import { PianoKeys } from './components/PianoKeys';
import { StepHeader } from './components/StepHeader';

// Import des utilitaires
import { 
  STEP_OPTIONS, 
  DEFAULT_STEPS, 
  ALL_NOTES, 
  ALL_OCTAVES
} from './utils/constants';

import {
  isBlackKey,
  getNoteDisplayName,
  getOctaveNumber,
  generateNotesForOctave,
  getVelocityColorClass,
  createNoteId
} from './utils/noteHelpers';

const PianoRollTestNavigationPage: React.FC = () => {
  // === ÉTATS POUR LES COMPOSANTS DE NAVIGATION ===
  const [stepCount, setStepCount] = useState<number>(DEFAULT_STEPS);
  const [visibleOctaveStart, setVisibleOctaveStart] = useState<number>(3);
  const [visibleOctaveCount] = useState<number>(3);

  // Audio engine pour le test
  const { 
    isPlaying, 
    isInitialized, 
    currentStep, 
    start, 
    stop 
  } = useSimpleAudio();

  // === CALCUL DES NOTES VISIBLES ===
  const getVisibleNotes = (): string[] => {
    const visibleOctaves = [];
    for (let i = 0; i < visibleOctaveCount; i++) {
      const octave = visibleOctaveStart + visibleOctaveCount - 1 - i; // Top to bottom
      if (octave >= 1 && octave <= 7) {
        visibleOctaves.push(octave);
      }
    }
    return visibleOctaves.flatMap(octave => generateNotesForOctave(octave));
  };

  const visibleNotes = getVisibleNotes();

  // === CALCUL DE LA LARGEUR DES CELLULES ===
  const getCellWidth = (steps: number): string => {
    if (steps <= 16) return 'w-12 sm:w-14';
    if (steps <= 32) return 'w-8 sm:w-10';
    return 'w-6 sm:w-8';
  };

  const cellWidth = getCellWidth(stepCount);

  // === CALCUL DES STEPS D'ACCENTS ===
  const getAccentSteps = (totalSteps: number): number[] => {
    if (totalSteps <= 16) {
      return [1, 5, 9, 13].filter(step => step <= totalSteps);
    } else if (totalSteps <= 32) {
      return [1, 5, 9, 13, 17, 21, 25, 29].filter(step => step <= totalSteps);
    } else {
      const accents = [];
      for (let i = 1; i <= totalSteps; i += 4) {
        accents.push(i);
      }
      return accents;
    }
  };

  const accentSteps = getAccentSteps(stepCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎹 Piano Roll - Test Navigation Components
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">Test des composants OctaveNavigation, PianoKeys et StepHeader</p>
        </div>

        {/* Contrôles de test */}
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => {
                if (isPlaying) {
                  stop();
                } else {
                  start();
                }
              }}
              disabled={!isInitialized}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isPlaying 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
              }`}
            >
              {!isInitialized ? '🔄 Initializing...' : (isPlaying ? '⏹ Stop' : '▶ Play')}
            </button>

            <div className="flex items-center gap-4">
              <label className="text-slate-300 font-semibold">Steps:</label>
              <select
                value={stepCount}
                onChange={(e) => setStepCount(parseInt(e.target.value))}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                {STEP_OPTIONS.map(steps => (
                  <option key={steps} value={steps}>
                    {steps}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Step:</span>
              <span className={`font-mono ${isPlaying ? 'animate-pulse text-yellow-400' : ''}`}>
                {currentStep + 1} / {stepCount}
              </span>
            </div>
          </div>
        </div>

        {/* Message de test */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm rounded-2xl border border-green-600/50">
          <h2 className="text-lg font-bold mb-3 text-green-400">✅ Test Navigation Components</h2>
          <div className="space-y-2 text-sm text-green-300">
            <p>• <strong>OctaveNavigation</strong> : Boutons +/- et navigation molette</p>
            <p>• <strong>PianoKeys</strong> : Affichage touches noires/blanches responsive</p>
            <p>• <strong>StepHeader</strong> : Numérotation avec accents et step courant</p>
            <p>• <strong>Scroll wheel</strong> : Utilisez la molette sur la zone piano roll pour naviguer</p>
          </div>
        </div>

        {/* COMPOSANTS TESTÉS */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-xl overflow-hidden">
          
          {/* COMPOSANT OCTAVE NAVIGATION */}
          <OctaveNavigation
            visibleOctaveStart={visibleOctaveStart}
            visibleOctaveCount={visibleOctaveCount}
            visibleNotesLength={visibleNotes.length}
            setVisibleOctaveStart={setVisibleOctaveStart}
            maxOctave={7}
            minOctave={1}
            containerClassName="piano-roll-container"
          />
          
          {/* Container avec scroll unique */}
          <div className="flex flex-col overflow-x-auto piano-roll-container">
            
            {/* COMPOSANT STEP HEADER */}
            <StepHeader
              stepCount={stepCount}
              accentSteps={accentSteps}
              cellWidth={cellWidth}
              showCurrentStep={true}
              currentStep={currentStep}
              isPlaying={isPlaying}
            />
            
            {/* Piano Roll Grid */}
            <div className="flex">
              
              {/* COMPOSANT PIANO KEYS */}
              <PianoKeys visibleNotes={visibleNotes} />

              {/* Grid de démo (simplifié pour le test) */}
              <div className="flex-shrink-0">
                {visibleNotes.map((note, noteIndex) => {
                  const isBlack = isBlackKey(note);
                  return (
                    <div
                      key={note}
                      className={`
                        h-10 sm:h-8 border-b border-slate-600/30 flex
                        ${isBlack ? 'bg-slate-900/30' : 'bg-slate-800/30'}
                      `}
                    >
                      {Array.from({ length: stepCount }, (_, stepIndex) => {
                        const step = stepIndex + 1;
                        const isAccentStep = accentSteps.includes(step);
                        const isCurrentStep = isPlaying && stepIndex === currentStep;
                        
                        return (
                          <div
                            key={stepIndex}
                            className={`
                              ${cellWidth} h-full border-r border-slate-600/30 cursor-pointer
                              flex items-center justify-center text-xs relative flex-shrink-0
                              transition-all duration-200 touch-manipulation
                              ${isCurrentStep ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
                              ${isAccentStep 
                                ? 'bg-slate-950/60 hover:bg-slate-900/80 active:bg-slate-800/90 border-r-2 border-amber-500/50' 
                                : (isBlack 
                                  ? 'bg-slate-900/40 hover:bg-slate-800/70 active:bg-slate-700/80' 
                                  : 'bg-slate-800/40 hover:bg-slate-700/70 active:bg-slate-600/80'
                                )
                              }
                            `}
                            title={`Step ${step}, Note ${note}${isAccentStep ? ' (accent)' : ''}${isCurrentStep ? ' (en cours)' : ''}`}
                          >
                            {/* Dot pour visualiser la grille */}
                            <div className={`
                              w-1 h-1 rounded-full opacity-20
                              ${isAccentStep ? 'bg-amber-400' : 'bg-slate-500'}
                              ${isCurrentStep ? 'animate-pulse bg-yellow-400 opacity-80' : ''}
                            `} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Informations de debug */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
          <h3 className="text-lg font-bold mb-4 text-slate-200">🔍 Debug Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-blue-400">Octave Range</div>
              <div className="font-mono">C{visibleOctaveStart} - C{Math.min(7, visibleOctaveStart + visibleOctaveCount - 1)}</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-emerald-400">Visible Notes</div>
              <div className="font-mono">{visibleNotes.length} notes</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-purple-400">Steps Count</div>
              <div className="font-mono">{stepCount} steps</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="font-semibold text-amber-400">Accent Steps</div>
              <div className="font-mono">{accentSteps.length} accents</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-slate-900/50 rounded-xl">
            <div className="font-semibold text-slate-300 mb-2">📋 Instructions de Test:</div>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• <strong>Boutons ←/→</strong> : Navigation octaves avec limites</li>
              <li>• <strong>Boutons C1-C7</strong> : Saut direct à une octave</li>
              <li>• <strong>Molette souris</strong> : Scroll sur la zone piano roll pour naviguer</li>
              <li>• <strong>Play/Stop</strong> : Voir le step courant highlighted en temps réel</li>
              <li>• <strong>Steps selector</strong> : Changer le nombre de steps (8/16/32/64)</li>
              <li>• <strong>Responsive</strong> : Tester sur mobile/desktop</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRollTestNavigationPage;