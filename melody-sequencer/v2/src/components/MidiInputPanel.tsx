/**
 * MidiInputPanel - Interface pour configurer MIDI Input
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useMidiInput } from '../hooks/useMidiInput';
import { MidiInputDevice } from '../lib/MidiInputEngine';

interface MidiInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMidiCallback?: (callback: any) => void;
  onNotesRecorded?: (notes: any[]) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function MidiInputPanel({ isOpen, onClose, onMidiCallback, onNotesRecorded, onConnectionChange }: MidiInputPanelProps) {
  const {
    isInitialized,
    selectedDevice,
    availableDevices,
    config,
    activeNotesCount,
    recordedNotesCount,
    isRecording,
    initialize,
    selectDevice,
    updateConfig,
    startRecording,
    stopRecording,
    convertToNoteEvents,
    setCallbacks,
    panic,
    refreshDevices,
    setChannel,
    setOctaveTranspose,
    setVelocityScale,
    setRecordEnabled,
    setPlaythroughEnabled
  } = useMidiInput();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialiser automatiquement
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Configurer les callbacks pour le playthrough et l'enregistrement
  useEffect(() => {
    setCallbacks({
      onNoteRecorded: (note) => {
        console.log('[MidiInputPanel] Note recorded:', note);
      },
      onPlaythrough: (note, velocity, isNoteOn) => {
        console.log('[MidiInputPanel] Playthrough:', note, velocity, isNoteOn);
        // Appeler le callback parent pour le playthrough audio
        if (onMidiCallback) {
          if (isNoteOn) {
            onMidiCallback.onNoteOn?.(note, velocity);
          } else {
            onMidiCallback.onNoteOff?.(note);
          }
        }
      }
    });
  }, [setCallbacks, onMidiCallback]);

  // Notifier la connexion au parent
  useEffect(() => {
    const isConnected = !!(selectedDevice && config.playthroughEnabled);
    onConnectionChange?.(isConnected);
  }, [selectedDevice, config.playthroughEnabled, onConnectionChange]);

  // Gestion de la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = () => {
    const recordedNotes = stopRecording();
    if (onNotesRecorded) {
      // Convertir en NoteEvents pour le piano roll
      const noteEvents = convertToNoteEvents(64, 120); // Assume 64 steps, 120 BPM
      onNotesRecorded(noteEvents);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-900 z-10 pb-2 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">🎹 MIDI Input</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full flex-shrink-0"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* État de l'initialisation */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isInitialized ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-300">
              {isInitialized ? 'Web MIDI initialisé' : 'Web MIDI non disponible'}
            </span>
          </div>

          {isInitialized && (
            <>
              {/* Liste des devices */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Device MIDI Input :
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedDevice?.id || ''}
                    onChange={(e) => selectDevice(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="">Sélectionner un device...</option>
                    {availableDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={refreshDevices}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    title="Actualiser la liste"
                  >
                    🔄
                  </button>
                </div>
                {availableDevices.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Aucun device MIDI Input détecté. Connectez un clavier MIDI ou utilisez un logiciel virtual MIDI.
                  </p>
                )}
              </div>

              {selectedDevice && (
                <>
                  {/* Contrôles principaux */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="playthrough-enabled"
                        checked={config.playthroughEnabled}
                        onChange={(e) => setPlaythroughEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="playthrough-enabled" className="text-sm text-gray-300">
                        🔊 Playthrough audio (entendre ce qu'on joue)
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="record-enabled"
                        checked={config.recordEnabled}
                        onChange={(e) => setRecordEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="record-enabled" className="text-sm text-gray-300">
                        🎥 Enregistrement vers piano roll
                      </label>
                    </div>
                  </div>

                  {/* Contrôles d'enregistrement */}
                  {config.recordEnabled && (
                    <div className="bg-gray-800 rounded p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Enregistrement :</span>
                        <div className="flex gap-2">
                          {!isRecording ? (
                            <button
                              onClick={handleStartRecording}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            >
                              ⏺️ Démarrer
                            </button>
                          ) : (
                            <button
                              onClick={handleStopRecording}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                            >
                              ⏹️ Arrêter
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Notes enregistrées :</span>
                        <span>{recordedNotesCount}</span>
                      </div>
                      
                      {isRecording && (
                        <div className="text-xs text-red-400 flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          Enregistrement en cours...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuration avancée */}
                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {showAdvanced ? '▼' : '▶'} Configuration avancée
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-3 space-y-3 bg-gray-800 rounded p-3">
                        {/* Canal MIDI */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Canal MIDI (-1 = tous) :
                          </label>
                          <select
                            value={config.channel}
                            onChange={(e) => setChannel(parseInt(e.target.value))}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                          >
                            <option value={-1}>Tous les canaux</option>
                            {Array.from({ length: 16 }, (_, i) => (
                              <option key={i} value={i}>Canal {i + 1}</option>
                            ))}
                          </select>
                        </div>

                        {/* Transposition d'octave */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Transposition d'octave : {config.octaveTranspose > 0 ? '+' : ''}{config.octaveTranspose}
                          </label>
                          <input
                            type="range"
                            min={-3}
                            max={3}
                            step={1}
                            value={config.octaveTranspose}
                            onChange={(e) => setOctaveTranspose(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        {/* Scaling de vélocité */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Multiplicateur de vélocité : {config.velocityScale.toFixed(1)}x
                          </label>
                          <input
                            type="range"
                            min={0.1}
                            max={2.0}
                            step={0.1}
                            value={config.velocityScale}
                            onChange={(e) => setVelocityScale(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status et contrôles */}
                  <div className="bg-gray-800 rounded p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Device :</span>
                      <span className="text-white">{selectedDevice.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Playthrough :</span>
                      <span className={config.playthroughEnabled ? 'text-green-400' : 'text-gray-400'}>
                        {config.playthroughEnabled ? '🟢 Actif' : '⭕ Inactif'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Enregistrement :</span>
                      <span className={config.recordEnabled ? 'text-green-400' : 'text-gray-400'}>
                        {config.recordEnabled ? '🟢 Actif' : '⭕ Inactif'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Notes actives :</span>
                      <span className="text-white">{activeNotesCount}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-700">
                      <button
                        onClick={panic}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        🛑 Panic (effacer notes actives)
                      </button>
                    </div>
                  </div>

                  {/* Aide */}
                  <div className="bg-blue-900/30 border border-blue-700/50 rounded p-3">
                    <h4 className="text-sm font-medium text-blue-300 mb-1">💡 Instructions :</h4>
                    <ul className="text-xs text-blue-200 space-y-1">
                      <li>• Connectez un clavier MIDI ou lancez un logiciel virtual MIDI</li>
                      <li>• Activez Playthrough pour entendre ce que vous jouez</li>
                      <li>• Activez Enregistrement puis cliquez ⏺️ pour capturer vos notes</li>
                      <li>• Les notes s'ajoutent directement au piano roll en temps réel</li>
                      <li>• Utilisez la transposition pour ajuster l'octave</li>
                      <li>• Le multiplicateur de vélocité ajuste la force des notes</li>
                    </ul>
                  </div>
                </>
              )}
            </>
          )}

          {/* Bouton fermer en bas */}
          <div className="pt-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}