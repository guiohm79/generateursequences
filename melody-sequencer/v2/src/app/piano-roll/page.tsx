'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { SimplePattern, SimpleStep } from '../../lib/SimpleAudioEngine';

// Configuration du piano roll
const STEPS = 16;
const ACCENT_STEPS = [1, 5, 9, 13]; // Steps avec couleurs marquées (base 1)
const NOTES = [
  // Octave 4 (notes principales)
  'C4', 'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3',
  // Octave 3
  'C3', 'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2', 'D#2', 'D2', 'C#2',
  // Octave 2
  'C2', 'B1', 'A#1', 'A1', 'G#1', 'G1', 'F#1', 'F1', 'E1', 'D#1', 'D1', 'C#1'
];

// Pattern data structure
interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  isActive: boolean;
}

// Helper functions
const isBlackKey = (note: string) => {
  return note.includes('#');
};

const getNoteDisplayName = (note: string) => {
  return note; // Keep full note name with octave
};

const getOctaveNumber = (note: string) => {
  const match = note.match(/[0-9]/);
  return match ? match[0] : '';
};

const PianoRollPage: React.FC = () => {
  const [pattern, setPattern] = useState<NoteEvent[]>([]);
  
  // Audio engine hook
  const { 
    isPlaying, 
    isInitialized, 
    currentStep, 
    tempo,
    initialize, 
    start, 
    stop, 
    setPattern: setAudioPattern,
    setTempo 
  } = useSimpleAudio();
  
  // Auto-initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Convert visual pattern to audio pattern
  const convertToAudioPattern = (visualPattern: NoteEvent[]): SimplePattern => {
    const audioPattern: SimplePattern = {};
    
    // Initialize all notes with empty steps
    NOTES.forEach(note => {
      audioPattern[note] = Array(STEPS).fill(null).map(() => ({ on: false, velocity: 0 }));
    });
    
    // Fill in the active notes
    visualPattern.forEach(noteEvent => {
      if (audioPattern[noteEvent.note] && audioPattern[noteEvent.note][noteEvent.step]) {
        audioPattern[noteEvent.note][noteEvent.step] = {
          on: true,
          velocity: noteEvent.velocity / 127 // Normalize to 0-1
        };
      }
    });
    
    return audioPattern;
  };
  
  // Update audio pattern when visual pattern changes
  useEffect(() => {
    const audioPattern = convertToAudioPattern(pattern);
    setAudioPattern(audioPattern);
  }, [pattern, setAudioPattern]);

  const toggleNote = (step: number, note: string) => {
    setPattern(prev => {
      const existingNote = prev.find(n => n.step === step && n.note === note);
      
      if (existingNote) {
        // Remove note
        return prev.filter(n => !(n.step === step && n.note === note));
      } else {
        // Add note
        return [...prev, {
          step,
          note,
          velocity: 100,
          isActive: true
        }];
      }
    });
  };

  const isNoteActive = (step: number, note: string) => {
    return pattern.some(n => n.step === step && n.note === note && n.isActive);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎹 Piano Roll
          </h1>
          <p className="text-slate-400 text-lg">Éditeur de patterns professionnel - 16 pas, gamme en C</p>
        </div>

        {/* Transport Controls */}
        <div className="mb-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (isPlaying) {
                  stop();
                } else {
                  start();
                }
              }}
              disabled={!isInitialized}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isPlaying 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/30'
              }`}
            >
              {!isInitialized ? '🔄 Initializing...' : (isPlaying ? '⏹ Stop' : '▶ Play')}
            </button>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600">
                <span className="text-slate-300 text-sm">Step:</span>
                <span className={`text-white font-mono ml-2 ${isPlaying ? 'animate-pulse' : ''}`}>
                  {currentStep + 1} / {STEPS}
                </span>
              </div>
              
              <div className="px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600">
                <span className="text-slate-300 text-sm">Notes:</span>
                <span className="text-blue-400 font-mono ml-2">{pattern.length}</span>
              </div>
              
              <div className="px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600">
                <span className="text-slate-300 text-sm">Tempo:</span>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="ml-2 w-20 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-emerald-400 font-mono ml-2">{tempo}</span>
              </div>
              
              <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                isInitialized 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isInitialized ? '🟢 Ready' : '🟡 Loading'}
              </div>
            </div>
          </div>
        </div>

        {/* Piano Roll Interface */}
        <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl overflow-hidden">
          <div className="flex">
            {/* Piano Keys (Left Side) */}
            <div className="flex-shrink-0 w-28 bg-gradient-to-r from-slate-700/80 to-slate-800/80 border-r border-slate-600">
              {NOTES.map((note, noteIndex) => {
                const isBlack = isBlackKey(note);
                const octave = getOctaveNumber(note);
                const noteName = note.replace(/[0-9]/g, '');
                
                return (
                  <div
                    key={note}
                    className={`
                      h-8 border-b border-slate-600/50 flex items-center justify-between px-3 text-sm font-medium
                      transition-all duration-200 hover:scale-[1.02] cursor-pointer
                      ${isBlack 
                        ? 'bg-gradient-to-r from-slate-900/90 to-slate-800/90 text-slate-300 shadow-inner' 
                        : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 shadow-sm'
                      }
                    `}
                  >
                    <span className="font-bold tracking-wide">{noteName}</span>
                    <span className={`text-xs font-mono ${isBlack ? 'text-slate-500' : 'text-slate-600'}`}>
                      {octave}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid (Right Side) */}
            <div className="flex-1 min-w-0">
              {NOTES.map((note, noteIndex) => {
                const isBlack = isBlackKey(note);
                return (
                  <div
                    key={note}
                    className={`
                      h-8 border-b border-slate-600/30 flex
                      ${isBlack ? 'bg-slate-900/30' : 'bg-slate-800/30'}
                    `}
                  >
                    {Array.from({ length: STEPS }, (_, stepIndex) => {
                      const step = stepIndex + 1;
                      const isAccentStep = ACCENT_STEPS.includes(step);
                      const hasNote = isNoteActive(stepIndex, note);
                      
                      return (
                        <div
                          key={stepIndex}
                          className={`
                            flex-1 min-w-14 h-full border-r border-slate-600/30 cursor-pointer
                            flex items-center justify-center text-xs relative
                            transition-all duration-200
                            ${stepIndex === currentStep && isPlaying ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
                            ${isAccentStep 
                              ? 'bg-slate-950/60 hover:bg-slate-900/80 border-r-2 border-amber-500/50' 
                              : (isBlack 
                                ? 'bg-slate-900/40 hover:bg-slate-800/70' 
                                : 'bg-slate-800/40 hover:bg-slate-700/70'
                              )
                            }
                            ${hasNote ? 'bg-gradient-to-br from-blue-500/90 to-blue-600/90 hover:from-blue-400/90 hover:to-blue-500/90 shadow-lg' : ''}
                          `}
                          onClick={() => toggleNote(stepIndex, note)}
                          title={`Step ${step}, Note ${note}`}
                        >
                          {hasNote && (
                            <div className={`
                              w-10 h-5 rounded-lg shadow-lg
                              ${isAccentStep 
                                ? 'bg-gradient-to-br from-cyan-300 to-blue-400 shadow-cyan-300/50' 
                                : 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-400/50'
                              }
                              ${stepIndex === currentStep && isPlaying ? 'animate-pulse ring-1 ring-yellow-300' : ''}
                            `} />
                          )}
                          
                          {/* Grid dots for empty cells */}
                          {!hasNote && (
                            <div className={`
                              w-1 h-1 rounded-full opacity-20
                              ${isAccentStep ? 'bg-amber-400' : 'bg-slate-500'}
                            `} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Numbers Header */}
          <div className="flex mt-3 border-t border-slate-600/30">
            <div className="w-28 flex-shrink-0 bg-gradient-to-r from-slate-700/50 to-slate-800/50 py-2"></div>
            <div className="flex-1 flex">
              {Array.from({ length: STEPS }, (_, stepIndex) => {
                const step = stepIndex + 1;
                const isAccentStep = ACCENT_STEPS.includes(step);
                
                return (
                  <div
                    key={stepIndex}
                    className={`
                      flex-1 min-w-14 text-center text-sm py-3 border-r border-slate-600/30
                      font-mono transition-all duration-200
                      ${isAccentStep 
                        ? 'text-amber-400 font-bold bg-slate-950/60 shadow-inner' 
                        : 'text-slate-400 hover:text-slate-300'
                      }
                    `}
                  >
                    <span className={isAccentStep ? 'text-lg' : ''}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pattern Info */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-slate-200">🎵 Pattern Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-blue-400">{STEPS}</div>
              <div className="text-sm text-slate-400">Steps</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-emerald-400">{pattern.length}</div>
              <div className="text-sm text-slate-400">Notes actives</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-purple-400">C</div>
              <div className="text-sm text-slate-400">Gamme</div>
            </div>
            <div className="text-center p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <div className="text-2xl font-bold text-amber-400">{ACCENT_STEPS.length}</div>
              <div className="text-sm text-slate-400">Accents</div>
            </div>
          </div>
          
          {pattern.length > 0 && (
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-600/30">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                🎼 Notes dans le pattern:
              </h4>
              <div className="flex flex-wrap gap-2">
                {pattern
                  .sort((a, b) => a.step - b.step)
                  .map((note, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-mono border border-blue-500/30"
                    >
                      Step {note.step + 1}: {note.note}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-slate-200">📚 Instructions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-3">🎮 Contrôles</h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <strong>Clic</strong> sur une case pour ajouter/supprimer une note
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  <strong>Play/Stop</strong> pour contrôler la lecture
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-amber-400 mb-3">🎨 Interface</h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  <strong>Steps 1, 5, 9, 13</strong> temps forts (colonnes sombres)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <strong>Touches piano</strong> noires/blanches avec octaves
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRollPage;