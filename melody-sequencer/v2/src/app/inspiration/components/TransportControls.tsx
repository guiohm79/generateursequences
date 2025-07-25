'use client';

import React from 'react';
import { SequencerPreset } from '../../../types';
import { MidiOutputPanel } from '../../../components/MidiOutputPanel';

interface TransportControlsProps {
  // === TRANSPORT STATE ===
  isPlaying: boolean;
  isInitialized: boolean;
  currentStep: number;
  
  // === PATTERN INFO ===
  stepCount: number;
  patternLength: number;
  activeNotesCount: number;
  selectedNotesCount: number;
  
  // === AUDIO SETTINGS ===
  tempo: number;
  noteSpeed: '8n' | '16n' | '32n';
  
  // === STATUS MESSAGES ===
  exportStatus: string;
  midiImportStatus: string;
  isDragOver: boolean;
  
  // === PRESETS STATE ===
  presets: SequencerPreset[];
  showPresetDialog: boolean;
  showLoadDialog: boolean;
  presetName: string;
  
  // === UNDO/REDO STATE ===
  historyInfo: {
    canUndo: boolean;
    canRedo: boolean;
    currentIndex: number;
    historySize: number;
    undoAction?: string;
    redoAction?: string;
  };
  
  // === TRANSPORT ACTIONS ===
  start: () => void;
  stop: () => void;
  onStepCountChange: (newStepCount: number) => void;
  setTempo: (tempo: number) => void;
  setNoteSpeed: (speed: '8n' | '16n' | '32n') => void;
  
  // === MIDI ACTIONS ===
  handleExportMidi: () => Promise<void>;
  handleMidiFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  
  // === MIDI OUTPUT ===
  showMidiOutputDialog: boolean;
  setShowMidiOutputDialog: (show: boolean) => void;
  onMidiCallback?: (callback: any) => void;
  
  // === PRESET ACTIONS ===
  setShowPresetDialog: (show: boolean) => void;
  setShowLoadDialog: (show: boolean) => void;
  setPresetName: (name: string) => void;
  handleSavePreset: () => void;
  handleImportPresetFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  
  // === PATTERN ACTIONS ===
  handleClearPattern: () => void;
  
  // === UNDO/REDO ACTIONS ===
  handleUndo: () => void;
  handleRedo: () => void;
  
  // === SELECTION ACTIONS ===
  handleCopySelectedNotes?: () => void;
  handlePasteNotes?: () => void;
  handleSelectAllNotes?: () => void;
  handleDeselectAllNotes?: () => void;
  handleDeleteSelectedNotes?: () => void;
  
  // === OPTIONS ===
  stepOptions: number[];
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  // Transport state
  isPlaying,
  isInitialized,
  currentStep,
  
  // Pattern info  
  stepCount,
  patternLength,
  activeNotesCount,
  selectedNotesCount,
  
  // Audio settings
  tempo,
  noteSpeed,
  
  // Status messages
  exportStatus,
  midiImportStatus,
  isDragOver,
  
  // Presets state
  presets,
  showPresetDialog,
  showLoadDialog,
  presetName,
  
  // Undo/Redo state
  historyInfo,
  
  // Actions
  start,
  stop,
  onStepCountChange,
  setTempo,
  setNoteSpeed,
  handleExportMidi,
  handleMidiFileSelect,
  showMidiOutputDialog,
  setShowMidiOutputDialog,
  onMidiCallback,
  setShowPresetDialog,
  setShowLoadDialog,
  setPresetName,
  handleSavePreset,
  handleImportPresetFile,
  handleClearPattern,
  handleUndo,
  handleRedo,
  handleCopySelectedNotes,
  handlePasteNotes,
  handleSelectAllNotes,
  handleDeselectAllNotes,
  handleDeleteSelectedNotes,
  stepOptions
}) => {
  return (
    <div className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-2xl">
      {/* Mobile Layout - Stack vertical */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6">
        <button
          onClick={() => {
            if (isPlaying) {
              stop();
            } else {
              start();
            }
          }}
          disabled={!isInitialized}
          className={`w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg sm:text-base ${
            isPlaying 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30' 
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/30'
          }`}
        >
          {!isInitialized ? '🔄 Initializing...' : (isPlaying ? '⏹ Stop' : '▶ Play')}
        </button>
        
        {/* Stats - Grid on mobile, flex on desktop */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600 text-center sm:text-left">
            <span className="text-slate-300 text-xs sm:text-sm block sm:inline">Step:</span>
            <span className={`text-white font-mono ml-0 sm:ml-2 block sm:inline text-sm sm:text-base ${isPlaying ? 'animate-pulse' : ''}`}>
              {currentStep + 1} / {stepCount}
            </span>
          </div>
          
          <div className="px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600 text-center sm:text-left">
            <span className="text-slate-300 text-xs sm:text-sm block sm:inline">Notes:</span>
            <span className="text-blue-400 font-mono ml-0 sm:ml-2 block sm:inline text-sm sm:text-base">{activeNotesCount}</span>
          </div>

          {selectedNotesCount > 0 && (
            <div className="px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-yellow-500/50 text-center sm:text-left">
              <span className="text-slate-300 text-xs sm:text-sm block sm:inline">Sélectionnées:</span>
              <span className="text-yellow-400 font-mono ml-0 sm:ml-2 block sm:inline text-sm sm:text-base">{selectedNotesCount}</span>
            </div>
          )}
          
          {/* Tempo - Full width on mobile */}
          <div className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between sm:justify-start">
              <span className="text-slate-300 text-xs sm:text-sm">Tempo:</span>
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="w-16 sm:w-20 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  aria-label="Tempo control"
                  title={`Tempo: ${tempo} BPM`}
                />
                <span className="text-emerald-400 font-mono text-sm">{tempo}</span>
              </div>
            </div>
          </div>

          {/* Vitesse de lecture */}
          <div className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between sm:justify-start">
              <span className="text-slate-300 text-xs sm:text-sm">Vitesse:</span>
              <div className="flex items-center gap-1 ml-2">
                {(['8n', '16n', '32n'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setNoteSpeed(speed)}
                    className={`
                      px-2 py-1 rounded text-xs font-mono transition-colors
                      ${noteSpeed === speed 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }
                    `}
                    title={`Vitesse: ${speed === '8n' ? '1/8 (lent)' : speed === '16n' ? '1/16 (normal)' : '1/32 (rapide)'}`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Steps selector */}
          <div className="px-3 sm:px-4 py-2 bg-slate-700/70 rounded-lg border border-slate-600 text-center sm:text-left">
            <span className="text-slate-300 text-xs sm:text-sm block sm:inline">Steps:</span>
            <select
              value={stepCount}
              onChange={(e) => onStepCountChange(parseInt(e.target.value))}
              className="text-purple-400 font-mono ml-0 sm:ml-2 block sm:inline text-sm sm:text-base bg-transparent border-none outline-none cursor-pointer"
            >
              {stepOptions.map(steps => (
                <option key={steps} value={steps} className="bg-slate-800 text-purple-400">
                  {steps}
                </option>
              ))}
            </select>
          </div>
          
          <div className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-lg text-xs font-semibold text-center ${
            isInitialized 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {isInitialized ? '🟢 Ready' : '🟡 Loading'}
          </div>
        </div>
      </div>

      {/* Section Export MIDI & Presets */}
      <div className="mt-4 sm:mt-6 space-y-4">
        
        {/* Export MIDI & MIDI Output */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleExportMidi}
            disabled={activeNotesCount === 0}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              flex items-center gap-2 shadow-lg
              ${activeNotesCount === 0 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-xl'
              }
            `}
            title={activeNotesCount === 0 ? 'Créez d\'abord des notes' : 'Exporter le pattern vers un fichier MIDI'}
          >
            🎼 Export MIDI
          </button>

          <button
            onClick={() => setShowMidiOutputDialog(true)}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:shadow-xl"
            title="Configurer MIDI Output en temps réel vers devices externes"
          >
            🎛️ MIDI Out
          </button>
          
          {exportStatus && (
            <div className={`
              px-3 py-2 rounded-lg text-sm font-medium max-w-sm
              ${exportStatus.includes('✅') 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }
            `}>
              {exportStatus}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setShowPresetDialog(true)}
            disabled={activeNotesCount === 0}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              flex items-center gap-2 shadow-lg
              ${activeNotesCount === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-xl'
              }
            `}
            title={activeNotesCount === 0 ? 'Créez d\'abord des notes' : 'Sauvegarder le pattern actuel'}
          >
            💾 Sauvegarder
          </button>

          <button
            onClick={() => setShowLoadDialog(true)}
            disabled={presets.length === 0}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              flex items-center gap-2 shadow-lg
              ${presets.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:shadow-xl'
              }
            `}
            title={presets.length === 0 ? 'Aucun preset sauvegardé' : 'Charger un preset existant'}
          >
            📁 Charger ({presets.length})
          </button>

          <label className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:shadow-xl cursor-pointer">
            📤 Importer Preset
            <input
              type="file"
              accept=".json"
              onChange={handleImportPresetFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Import MIDI & Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white hover:shadow-xl cursor-pointer">
            🎼 Importer MIDI
            <input
              type="file"
              accept=".mid,.midi"
              onChange={handleMidiFileSelect}
              className="hidden"
            />
          </label>

          <button
            onClick={handleClearPattern}
            disabled={activeNotesCount === 0}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              flex items-center gap-2 shadow-lg
              ${activeNotesCount === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white hover:shadow-xl'
              }
            `}
            title={activeNotesCount === 0 ? 'Aucune note à effacer' : 'Vider la grille - Efface toutes les notes (raccourci: N)'}
          >
            🗑️ Vider Grille
          </button>
          
          <div className="text-xs text-slate-400 max-w-xs text-center">
            Ou glissez-déposez un fichier .mid sur l'interface
          </div>
          
          {midiImportStatus && (
            <div className={`
              px-3 py-2 rounded-lg text-sm font-medium max-w-md
              ${midiImportStatus.includes('✅') 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }
            `}>
              {midiImportStatus}
            </div>
          )}
        </div>

        {/* Undo/Redo */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={!historyInfo.canUndo}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              flex items-center gap-2 shadow-lg
              ${!historyInfo.canUndo
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white hover:shadow-xl'
              }
            `}
            title={!historyInfo.canUndo ? 'Aucune action à annuler' : `Annuler: ${historyInfo.undoAction || 'Action précédente'} (Ctrl+Z)`}
          >
            ↶ Undo
          </button>

          <button
            onClick={handleRedo}
            disabled={!historyInfo.canRedo}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              flex items-center gap-2 shadow-lg
              ${!historyInfo.canRedo
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white hover:shadow-xl'
              }
            `}
            title={!historyInfo.canRedo ? 'Aucune action à refaire' : `Refaire: ${historyInfo.redoAction || 'Action suivante'} (Ctrl+Y)`}
          >
            ↷ Redo
          </button>

          <div className="px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50 text-xs text-slate-300">
            Historique: {historyInfo.currentIndex + 1}/{historyInfo.historySize}
          </div>
        </div>
      </div>

      {/* MIDI Output Panel */}
      <MidiOutputPanel
        isOpen={showMidiOutputDialog}
        onClose={() => setShowMidiOutputDialog(false)}
        onMidiCallback={onMidiCallback}
      />
    </div>
  );
};