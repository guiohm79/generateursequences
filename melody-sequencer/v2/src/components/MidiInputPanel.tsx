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
}

export function MidiInputPanel({ isOpen, onClose }: MidiInputPanelProps) {
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

  // ⚠️ CALLBACKS SUPPRIMÉS - Maintenant gérés dans la page principale
  // Cela résout le problème de persistance après fermeture du dialog

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
    console.log('[MidiInputPanel] Recording stopped, notes:', recordedNotes.length);
    // Les notes sont maintenant gérées directement dans la page principale
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
                  {/* Contrôles principaux style arpeggiateur */}
                  <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">
                      🎛️ Contrôles Audio & Enregistrement
                    </h4>
                    
                    {/* Playthrough avec indicateur */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-300">🔊 Playthrough</label>
                        <div className={`w-2 h-2 rounded-full ${
                          config.playthroughEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
                        }`} />
                      </div>
                      <button
                        onClick={() => setPlaythroughEnabled(!config.playthroughEnabled)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          config.playthroughEnabled 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        {config.playthroughEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Recording avec indicateur */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-300">🎥 Recording</label>
                        <div className={`w-2 h-2 rounded-full ${
                          config.recordEnabled ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
                        }`} />
                      </div>
                      <button
                        onClick={() => setRecordEnabled(!config.recordEnabled)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          config.recordEnabled 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        {config.recordEnabled ? 'ARMED' : 'OFF'}
                      </button>
                    </div>

                    {/* Status actuel */}
                    <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
                      <span>Notes actives: {activeNotesCount}</span>
                      <span>Notes enreg: {recordedNotesCount}</span>
                    </div>
                  </div>

                  {/* Contrôles d'enregistrement */}
                  {config.recordEnabled && (
                    <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-300 font-medium">🎥 Recording Session</span>
                          {isRecording && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!isRecording ? (
                            <button
                              onClick={handleStartRecording}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors font-medium flex items-center gap-1"
                            >
                              ⏺️ REC
                            </button>
                          ) : (
                            <button
                              onClick={handleStopRecording}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors font-medium flex items-center gap-1 animate-pulse"
                            >
                              ⏹️ STOP
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-mono text-white">{recordedNotesCount}</div>
                          <div className="text-xs text-gray-400">Notes captured</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-mono text-white">{activeNotesCount}</div>
                          <div className="text-xs text-gray-400">Notes playing</div>
                        </div>
                      </div>
                      
                      {isRecording && (
                        <div className="text-xs text-red-300 flex items-center justify-center gap-2 py-2 bg-red-800/30 rounded">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          Recording to Piano Roll...
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
                      <div className="mt-3 bg-gray-800 rounded-lg p-4 space-y-4">
                        <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-2">
                          ⚙️ Configuration MIDI
                        </h4>

                        {/* Canal MIDI */}
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm text-gray-300">
                            <span>Canal MIDI</span>
                            <span className="text-xs text-gray-400">
                              {config.channel === -1 ? 'Tous canaux' : `Canal ${config.channel + 1}`}
                            </span>
                          </label>
                          <select
                            value={config.channel}
                            onChange={(e) => setChannel(parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm hover:border-gray-500 transition-colors"
                          >
                            <option value={-1}>🌐 Tous les canaux</option>
                            {Array.from({ length: 16 }, (_, i) => (
                              <option key={i} value={i}>📺 Canal {i + 1}</option>
                            ))}
                          </select>
                        </div>

                        {/* Transposition d'octave */}
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm text-gray-300">
                            <span>Transposition octave</span>
                            <span className="text-xs text-gray-400 font-mono">
                              {config.octaveTranspose > 0 ? '+' : ''}{config.octaveTranspose}
                            </span>
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">-3</span>
                            <input
                              type="range"
                              min={-3}
                              max={3}
                              step={1}
                              value={config.octaveTranspose}
                              onChange={(e) => setOctaveTranspose(parseInt(e.target.value))}
                              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">+3</span>
                          </div>
                        </div>

                        {/* Scaling de vélocité */}
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm text-gray-300">
                            <span>Vélocité scale</span>
                            <span className="text-xs text-gray-400 font-mono">
                              {config.velocityScale.toFixed(1)}x
                            </span>
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">0.1</span>
                            <input
                              type="range"
                              min={0.1}
                              max={2.0}
                              step={0.1}
                              value={config.velocityScale}
                              onChange={(e) => setVelocityScale(parseFloat(e.target.value))}
                              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">2.0</span>
                          </div>
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