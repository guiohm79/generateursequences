/**
 * Page MIDI Input - Version simplifiée fonctionnelle
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { MidiInputPanel } from '../../components/MidiInputPanel';
import { MidiOutputPanel } from '../../components/MidiOutputPanel';

// Types basiques
interface NoteEvent {
  step: number;
  note: number;
  velocity: number;
  duration: number;
  isActive: boolean;
}

export default function MidiInputPage() {
  // États de base
  const [pattern, setPattern] = useState<NoteEvent[]>([]);
  const [stepCount, setStepCount] = useState<number>(16);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [currentOctave, setCurrentOctave] = useState<number>(3);

  // États MIDI
  const [showMidiInput, setShowMidiInput] = useState(false);
  const [showMidiOutput, setShowMidiOutput] = useState(false);
  const [midiInputCallback, setMidiInputCallback] = useState<any>(null);
  const [midiOutputCallback, setMidiOutputCallback] = useState<any>(null);
  const [isMidiInputConnected, setIsMidiInputConnected] = useState(false);

  // Audio engine
  const {
    isInitialized: isAudioReady,
    isAudioEnabled,
    setAudioEnabled,
    playNote,
    stopNote,
    stopAllNotes,
    initialize: initializeAudio,
    start: startAudio,
    stop: stopAudio
  } = useSimpleAudio();

  // Configurer le playthrough MIDI Input avec l'audio
  const handleMidiInputCallback = (callback: any) => {
    console.log('[MidiInput] Callback received:', callback);
    setMidiInputCallback(callback);
  };

  // Initialiser l'audio automatiquement
  useEffect(() => {
    if (!isAudioReady) {
      console.log('[MidiInput] Initializing audio...');
      initializeAudio().then(success => {
        console.log('[MidiInput] Audio initialized:', success);
      });
    }
  }, [isAudioReady, initializeAudio]);

  // Créer l'objet callback avec les fonctions audio
  const audioCallbacks = {
    onNoteOn: (note: string, velocity: number) => {
      console.log('[MidiInput] Playing note:', note, velocity, 'AudioReady:', isAudioReady, 'AudioEnabled:', isAudioEnabled);
      if (isAudioReady && isAudioEnabled) {
        playNote(note, velocity / 127);
      }
    },
    onNoteOff: (note: string) => {
      console.log('[MidiInput] Stopping note:', note);
      if (isAudioReady && isAudioEnabled) {
        stopNote(note);
      }
    }
  };

  // Fonction de test audio
  const testAudio = async () => {
    console.log('[MidiInput] Testing audio...');
    console.log('isAudioReady:', isAudioReady);
    console.log('isAudioEnabled:', isAudioEnabled);
    
    if (!isAudioReady) {
      console.log('Initializing audio...');
      const success = await initializeAudio();
      console.log('Audio init result:', success);
    }
    
    if (isAudioReady && isAudioEnabled) {
      console.log('Playing test note...');
      playNote('C4', 0.7);
      setTimeout(() => {
        stopNote('C4');
      }, 500);
    } else {
      console.log('Cannot play: audio not ready or disabled');
    }
  };

  // Gérer les notes enregistrées depuis MIDI Input
  const handleNotesRecorded = (recordedNotes: NoteEvent[]) => {
    if (recordedNotes.length === 0) return;

    // Ajouter les notes enregistrées au pattern existant
    const newPattern = [...pattern];
    recordedNotes.forEach(recordedNote => {
      // Vérifier qu'il n'y a pas déjà une note au même endroit
      const existingIndex = newPattern.findIndex(
        n => n.step === recordedNote.step && n.note === recordedNote.note && n.isActive
      );

      if (existingIndex >= 0) {
        // Remplacer la note existante
        newPattern[existingIndex] = recordedNote;
      } else {
        // Ajouter la nouvelle note
        newPattern.push(recordedNote);
      }
    });

    setPattern(newPattern);
    console.log(`[MidiInput] ${recordedNotes.length} notes ajoutées au pattern`);
  };

  // Raccourcis clavier basiques
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'Escape':
          // Clear selection si on en avait un
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Grille de piano basique (simplifiée)
  const renderPianoGrid = () => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octaveNotes = [];
    
    // Générer notes pour l'octave courante
    for (let i = 0; i < 12; i++) {
      octaveNotes.push(`${notes[i]}${currentOctave}`);
    }

    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
        <div className="flex gap-1 mb-4">
          {/* Espace pour aligner avec les labels de notes */}
          <div className="w-12"></div>
          {/* En-têtes des steps */}
          {Array.from({ length: stepCount }, (_, step) => (
            <div
              key={step}
              className={`w-8 text-center text-xs py-1 ${
                step === currentStep ? 'bg-blue-600 text-white' : 
                step % 4 === 0 ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        {/* Grille de notes */}
        {octaveNotes.reverse().map((noteName, noteIndex) => (
          <div key={noteName} className="flex gap-1 mb-1">
            {/* Label de la note */}
            <div className="w-12 text-xs text-gray-300 flex items-center justify-center bg-gray-800">
              {noteName}
            </div>
            
            {/* Cellules pour chaque step */}
            {Array.from({ length: stepCount }, (_, step) => {
              const hasNote = pattern.some(
                n => n.step === step && n.note === noteIndex && n.isActive
              );
              
              return (
                <div
                  key={step}
                  className={`w-8 h-6 border border-gray-600 cursor-pointer transition-colors ${
                    hasNote 
                      ? 'bg-green-500 hover:bg-green-400' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    if (hasNote) {
                      // Retirer la note
                      setPattern(prev => prev.filter(
                        n => !(n.step === step && n.note === noteIndex)
                      ));
                    } else {
                      // Ajouter la note
                      setPattern(prev => [...prev, {
                        step,
                        note: noteIndex,
                        velocity: 80,
                        duration: 1,
                        isActive: true
                      }]);
                    }
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🎹 MIDI Input + Piano Roll</h1>
          <p className="text-gray-400">
            Contrôlez le piano roll avec votre clavier MIDI maître
          </p>
        </div>

        {/* Contrôles principaux */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setShowMidiInput(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            🎹 MIDI Input
          </button>
          <button
            onClick={() => setShowMidiOutput(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            🎛️ MIDI Output
          </button>
          <button
            onClick={async () => {
              if (isPlaying) {
                stopAudio();
                setIsPlaying(false);
              } else {
                // Créer un pattern simple pour test si vide
                const testPattern = pattern.length > 0 ? pattern : [
                  { step: 0, note: 0, velocity: 80, duration: 1, isActive: true }, // C4
                  { step: 4, note: 2, velocity: 80, duration: 1, isActive: true }  // D4
                ];
                
                if (isAudioReady) {
                  const success = await startAudio();
                  setIsPlaying(success);
                } else {
                  console.log('Audio not ready, initializing...');
                  await initializeAudio();
                }
              }
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isPlaying ? '⏹️ Stop' : '▶️ Play'}
          </button>
          <button
            onClick={testAudio}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            🔊 Test Audio
          </button>
          <button
            onClick={() => initializeAudio()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            🎵 Init Audio
          </button>
        </div>

        {/* Contrôles octave et steps */}
        <div className="flex justify-center gap-4 items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentOctave(Math.max(1, currentOctave - 1))}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Oct -
            </button>
            <span className="text-white">Octave {currentOctave}</span>
            <button
              onClick={() => setCurrentOctave(Math.min(6, currentOctave + 1))}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Oct +
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Steps:</span>
            <select
              value={stepCount}
              onChange={(e) => setStepCount(parseInt(e.target.value))}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
            </select>
          </div>
        </div>

        {/* Piano Roll simplifié */}
        {renderPianoGrid()}

        {/* Informations MIDI */}
        <div className="bg-gray-900 rounded-lg p-4 space-y-2">
          <h3 className="text-lg font-semibold">📊 Status MIDI & Audio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">MIDI Input:</span>
              <span className="ml-2 text-white">
                {isMidiInputConnected ? '🟢 Connecté' : '⭕ Déconnecté'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">MIDI Output:</span>
              <span className="ml-2 text-white">
                {midiOutputCallback ? '🟢 Connecté' : '⭕ Déconnecté'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Audio Engine:</span>
              <span className="ml-2 text-white">
                {isAudioReady ? '🟢 Initialisé' : '🔄 Initialisation...'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Audio interne:</span>
              <span className="ml-2 text-white">
                {isAudioEnabled ? '🟢 Actif' : '⭕ Inactif'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Séquenceur:</span>
              <span className="ml-2 text-white">
                {isPlaying ? '▶️ Lecture' : '⏹️ Arrêté'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Notes pattern:</span>
              <span className="ml-2 text-white">
                {pattern.filter(n => n.isActive).length} / {pattern.length}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">💡 Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
            <div>
              <h4 className="font-medium mb-1">MIDI Input :</h4>
              <ul className="space-y-1">
                <li>• Connectez votre clavier MIDI</li>
                <li>• Activez Playthrough pour entendre</li>
                <li>• Activez Recording pour capturer</li>
                <li>• Les notes s'ajoutent au piano roll</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Piano Roll :</h4>
              <ul className="space-y-1">
                <li>• Cliquez pour ajouter/retirer des notes</li>
                <li>• Utilisez Espace pour jouer/arrêter</li>
                <li>• Oct +/- pour changer d'octave</li>
                <li>• Sélectionnez le nombre de steps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs MIDI */}
      {showMidiInput && (
        <MidiInputPanel
          isOpen={showMidiInput}
          onClose={() => setShowMidiInput(false)}
          onMidiCallback={audioCallbacks}
          onNotesRecorded={handleNotesRecorded}
          onConnectionChange={setIsMidiInputConnected}
        />
      )}

      {showMidiOutput && (
        <MidiOutputPanel
          isOpen={showMidiOutput}
          onClose={() => setShowMidiOutput(false)}
          onMidiCallback={setMidiOutputCallback}
          isAudioEnabled={isAudioEnabled}
          onAudioEnabledChange={setAudioEnabled}
        />
      )}
    </div>
  );
}