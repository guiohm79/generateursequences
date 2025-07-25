'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { SimplePattern, SimpleStep } from '../../lib/SimpleAudioEngine';
import { midiEngine, MidiNote } from '../../lib/MidiEngine';
import { PresetManager } from '../../lib/PresetManager';
import { SequencerPreset } from '../../types';
import { MidiParser } from '../../lib/MidiParser';
import { UndoRedoManager } from '../../lib/UndoRedoManager';

// Import du nouveau composant TransportControls
import { TransportControls } from './components/TransportControls';

// Import des types locaux
import { NoteEvent, NoteId, SelectionRectangle, ClipboardData } from './types';

// Import des utilitaires
import { 
  STEP_OPTIONS, 
  DEFAULT_STEPS, 
  ALL_NOTES, 
  ALL_OCTAVES,
  CELL_WIDTH,
  CELL_HEIGHT,
  PIANO_WIDTH,
  DEFAULT_VELOCITY
} from './utils/constants';

import {
  isBlackKey,
  getNoteDisplayName,
  getOctaveNumber,
  generateNotesForOctave,
  getVelocityColorClass,
  createNoteId
} from './utils/noteHelpers';

import {
  findNoteInPattern,
  getNotesAtStep,
  noteExistsInPattern,
  addOrUpdateNoteInPattern,
  removeNoteFromPattern,
  cleanupInactiveNotes,
  convertPatternToAudioFormat
} from './utils/patternHelpers';

import {
  isNoteInSelectionRectangle,
  getSelectedNotes,
  createClipboardData,
  pasteNotesFromClipboard,
  moveSelectedNotes,
  selectAllNotes
} from './utils/selectionHelpers';

const PianoRollTestTransportPage: React.FC = () => {
  // === ÉTATS IDENTIQUES À LA VERSION COMPLÈTE ===
  const [pattern, setPattern] = useState<NoteEvent[]>([]);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    step: number;
    note: string;
    startY: number;
    startVelocity: number;
    currentVelocity: number;
  } | null>(null);
  
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    step: number;
    note: string;
    startX: number;
    startDuration: number;
    currentDuration: number;
  } | null>(null);
  
  const [selectedNotes, setSelectedNotes] = useState<Set<NoteId>>(new Set());
  const [selectionRect, setSelectionRect] = useState<SelectionRectangle | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [mousePosition, setMousePosition] = useState<{ step: number; note: string } | null>(null);

  // Transport et paramètres
  const [stepCount, setStepCount] = useState<number>(DEFAULT_STEPS);
  const [tempo, setTempo] = useState<number>(120);
  const [noteSpeed, setNoteSpeed] = useState<'8n' | '16n' | '32n'>('16n');
  const [visibleOctaveStart, setVisibleOctaveStart] = useState<number>(3);
  const [visibleOctaveCount] = useState<number>(3);

  // États des dialogs et messages
  const [exportStatus, setExportStatus] = useState<string>('');
  const [midiImportStatus, setMidiImportStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<SequencerPreset[]>([]);

  // Audio engine
  const { 
    isPlaying, 
    isInitialized, 
    currentStep, 
    start, 
    stop, 
    setAudioPattern, 
    setAudioTempo 
  } = useSimpleAudio();

  // Undo/Redo manager
  const [undoRedoManager] = useState(() => new UndoRedoManager<NoteEvent[]>(50));
  const [historyInfo, setHistoryInfo] = useState({
    canUndo: false,
    canRedo: false,
    undoAction: undefined as string | undefined,
    redoAction: undefined as string | undefined,
    position: 0,
    total: 1
  });

  // === FONCTIONS DE BASE (identiques à la version complète) ===
  const createNoteId = (step: number, note: string): NoteId => `${step}-${note}`;
  
  const parseNoteId = (noteId: NoteId): { step: number; note: string } => {
    const [stepStr, note] = noteId.split('-');
    return { step: parseInt(stepStr), note };
  };

  // === FONCTIONS TRANSPORT POUR LE COMPOSANT ===
  const handleClearPattern = () => {
    if (confirm('Effacer tout le pattern ?')) {
      saveToHistory('Clear pattern');
      setPattern([]);
      setSelectedNotes(new Set());
      setExportStatus('✅ Pattern effacé');
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  const convertToMidiNotes = (): MidiNote[] => {
    return pattern.filter(note => note.isActive).map(note => ({
      step: note.step,
      note: note.note,
      velocity: note.velocity,
      duration: note.duration,
      isActive: note.isActive
    }));
  };

  const handleExportMidi = async () => {
    try {
      setExportStatus('Export en cours...');
      
      const midiNotes = convertToMidiNotes();
      
      if (midiNotes.length === 0) {
        setExportStatus('❌ Aucune note active à exporter');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      const result = midiEngine.exportToMidi(midiNotes, {
        tempo: tempo,
        timeSignature: [4, 4]
      });

      if (result.success && result.data && result.filename) {
        midiEngine.downloadMidiFile(result);
        const info = midiEngine.getMidiInfo(midiNotes);
        setExportStatus(
          `✅ Export réussi! ${info.activeNotes} notes → ${result.filename}`
        );
        setTimeout(() => setExportStatus(''), 5000);
      } else {
        setExportStatus(`❌ Erreur: ${result.error}`);
        setTimeout(() => setExportStatus(''), 3000);
      }
    } catch (error) {
      setExportStatus(`❌ Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleMidiFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleMidiFileImport(file);
    }
    event.target.value = '';
  };

  const handleMidiFileImport = async (file: File) => {
    try {
      setMidiImportStatus('Import MIDI en cours...');
      
      const validation = MidiParser.validateMidiFile(file);
      if (!validation.valid) {
        setMidiImportStatus(`❌ ${validation.error}`);
        setTimeout(() => setMidiImportStatus(''), 4000);
        return;
      }

      const result = await MidiParser.parseMidiFile(file);
      
      if (!result.success) {
        setMidiImportStatus(`❌ Erreur d'import: ${result.error}`);
        setTimeout(() => setMidiImportStatus(''), 4000);
        return;
      }

      if (result.notes.length === 0) {
        setMidiImportStatus('❌ Aucune note trouvée dans le fichier MIDI');
        setTimeout(() => setMidiImportStatus(''), 4000);
        return;
      }

      setPattern(result.notes);
      setSelectedNotes(new Set());
      
      if (result.stepsUsed && result.stepsUsed > stepCount) {
        const newStepCount = result.stepsUsed <= 16 ? 16 : 
                            result.stepsUsed <= 32 ? 32 : 64;
        setStepCount(newStepCount);
      }

      saveToHistory(`Import MIDI (${result.totalNotes} notes)`);

      let successMessage = `✅ Import réussi! ${result.totalNotes} notes`;
      
      if (result.truncated) {
        successMessage += ` (limité à ${result.stepsUsed}/${result.originalLength} steps)`;
      }
      
      if (result.warnings && result.warnings.length > 0) {
        successMessage += ` - ${result.warnings.length} avertissement(s)`;
        console.warn('Avertissements MIDI import:', result.warnings);
      }
      
      setMidiImportStatus(successMessage);
      setTimeout(() => setMidiImportStatus(''), 6000);

    } catch (error) {
      console.error('Erreur import MIDI:', error);
      setMidiImportStatus(`❌ Erreur inattendue: ${error instanceof Error ? error.message : 'Inconnue'}`);
      setTimeout(() => setMidiImportStatus(''), 4000);
    }
  };

  // === FONCTIONS PRESETS ===
  const loadPresets = () => {
    const allPresets = PresetManager.getAllPresets();
    setPresets(allPresets.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Veuillez entrer un nom pour le preset');
      return;
    }

    const activeNotes = pattern.filter(note => note.isActive);
    if (activeNotes.length === 0) {
      alert('Créez d\'abord des notes avant de sauvegarder');
      return;
    }

    const preset = PresetManager.savePreset(
      presetName,
      stepCount,
      activeNotes,
      { 
        bpm: tempo,
        description: `Preset avec ${activeNotes.length} notes`
      }
    );

    setPresets(prev => [preset, ...prev]);
    setPresetName('');
    setShowPresetDialog(false);
    setExportStatus(`✅ Preset "${preset.name}" sauvegardé`);
    setTimeout(() => setExportStatus(''), 3000);
  };

  const handleImportPresetFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const importedPresets = await PresetManager.importMultiplePresets(file);
    if (importedPresets.length > 0) {
      loadPresets();
      setExportStatus(`✅ ${importedPresets.length} preset(s) importé(s)`);
      setTimeout(() => setExportStatus(''), 3000);
    } else {
      setExportStatus('❌ Erreur lors de l\'import du fichier');
      setTimeout(() => setExportStatus(''), 3000);
    }

    event.target.value = '';
  };

  // === FONCTIONS UNDO/REDO ===
  const updateHistoryInfo = () => {
    setHistoryInfo(undoRedoManager.getHistoryInfo());
  };

  const saveToHistory = (action: string) => {
    undoRedoManager.saveStateIfDifferent(pattern, stepCount, action);
    updateHistoryInfo();
  };

  const handleUndo = () => {
    const previousState = undoRedoManager.undo();
    if (previousState) {
      setPattern(previousState.pattern);
      setStepCount(previousState.stepCount);
      setSelectedNotes(new Set());
      updateHistoryInfo();
      setExportStatus(`↶ Undo: ${previousState.action || 'Action précédente'}`);
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  const handleRedo = () => {
    const nextState = undoRedoManager.redo();
    if (nextState) {
      setPattern(nextState.pattern);
      setStepCount(nextState.stepCount);
      setSelectedNotes(new Set());
      updateHistoryInfo();
      setExportStatus(`↷ Redo: ${nextState.action || 'Action suivante'}`);
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  // === EFFECTS ===
  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (pattern.length === 0) {
      undoRedoManager.saveState([], stepCount, 'État initial');
      updateHistoryInfo();
    }
  }, []);

  useEffect(() => {
    setAudioTempo(tempo);
  }, [tempo, setAudioTempo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎹 Piano Roll - Test TransportControls
          </h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">Test du composant TransportControls modulaire</p>
        </div>

        {/* NOUVEAU COMPOSANT TRANSPORT CONTROLS */}
        <TransportControls
          // Transport state
          isPlaying={isPlaying}
          isInitialized={isInitialized}
          currentStep={currentStep}
          
          // Pattern info
          stepCount={stepCount}
          patternLength={0} // Calculé dans la version complète
          activeNotesCount={pattern.filter(n => n.isActive).length}
          selectedNotesCount={selectedNotes.size}
          
          // Audio settings
          tempo={tempo}
          noteSpeed={noteSpeed}
          
          // Status messages
          exportStatus={exportStatus}
          midiImportStatus={midiImportStatus}
          isDragOver={isDragOver}
          
          // Presets state
          presets={presets}
          showPresetDialog={showPresetDialog}
          showLoadDialog={showLoadDialog}
          presetName={presetName}
          
          // Undo/Redo state
          historyInfo={historyInfo}
          
          // Actions
          start={start}
          stop={stop}
          onStepCountChange={setStepCount}
          setTempo={setTempo}
          setNoteSpeed={setNoteSpeed}
          handleExportMidi={handleExportMidi}
          handleMidiFileSelect={handleMidiFileSelect}
          setShowPresetDialog={setShowPresetDialog}
          setShowLoadDialog={setShowLoadDialog}
          setPresetName={setPresetName}
          handleSavePreset={handleSavePreset}
          handleImportPresetFile={handleImportPresetFile}
          handleClearPattern={handleClearPattern}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          stepOptions={STEP_OPTIONS}
        />

        {/* Message de test */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm rounded-2xl border border-green-600/50">
          <h2 className="text-xl font-bold mb-4 text-green-400">✅ Test TransportControls</h2>
          <div className="space-y-2 text-sm text-green-300">
            <p>• Le composant TransportControls est maintenant modulaire</p>
            <p>• Toutes les fonctionnalités sont préservées : Play/Stop, Export MIDI, Presets, Undo/Redo</p>
            <p>• Interface responsive et états complets</p>
            <p>• Prêt pour intégration dans la version finale</p>
          </div>
        </div>

        {/* Section de test simple */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
          <h3 className="text-lg font-bold mb-4 text-slate-200">🧪 Zone de Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const testNote: NoteEvent = {
                  step: 0,
                  note: 'C4',
                  velocity: 100,
                  isActive: true,
                  duration: 1
                };
                setPattern([testNote]);
                saveToHistory('Test note ajoutée');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🎵 Ajouter note test
            </button>
            
            <button
              onClick={() => {
                const testNotes: NoteEvent[] = [
                  { step: 0, note: 'C4', velocity: 100, isActive: true, duration: 1 },
                  { step: 4, note: 'E4', velocity: 80, isActive: true, duration: 1 },
                  { step: 8, note: 'G4', velocity: 90, isActive: true, duration: 1 },
                ];
                setPattern(testNotes);
                saveToHistory('Pattern test créé');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              🎼 Créer pattern test
            </button>

            <button
              onClick={() => {
                setPattern([]);
                setSelectedNotes(new Set());
                saveToHistory('Pattern vidé');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              🗑️ Vider pattern
            </button>
          </div>
        </div>

        {/* Pattern Info basique */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50">
          <h3 className="text-lg font-bold mb-4 text-slate-200">📊 Pattern Info</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-blue-400">{stepCount}</div>
              <div className="text-sm text-slate-400">Steps</div>
            </div>
            <div className="text-center p-4 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400">{pattern.length}</div>
              <div className="text-sm text-slate-400">Notes</div>
            </div>
            <div className="text-center p-4 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">{tempo}</div>
              <div className="text-sm text-slate-400">BPM</div>
            </div>
            <div className="text-center p-4 bg-slate-700/50 rounded-xl">
              <div className="text-2xl font-bold text-amber-400">{noteSpeed}</div>
              <div className="text-sm text-slate-400">Vitesse</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Sauvegarde Preset (simple version pour test) */}
      {showPresetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">💾 Sauvegarder Preset</h2>
            <input
              type="text"
              placeholder="Nom du preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-4">
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  presetName.trim()
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setShowPresetDialog(false);
                  setPresetName('');
                }}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Chargement Preset (simple version pour test) */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">📁 Charger Preset</h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {presets.length === 0 ? (
                <div className="text-center text-slate-400 py-8">Aucun preset sauvegardé</div>
              ) : (
                presets.map(preset => (
                  <div
                    key={preset.id}
                    className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{preset.name}</h3>
                      <div className="text-sm text-slate-300">
                        {preset.notes.length} notes
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Version simplifiée pour test
                        setPattern(preset.notes);
                        setStepCount(preset.steps);
                        setSelectedNotes(new Set());
                        setShowLoadDialog(false);
                        setExportStatus(`✅ Preset "${preset.name}" chargé`);
                        setTimeout(() => setExportStatus(''), 3000);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Charger
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PianoRollTestTransportPage;