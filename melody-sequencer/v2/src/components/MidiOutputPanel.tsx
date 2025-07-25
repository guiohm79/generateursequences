/**
 * MidiOutputPanel - Interface pour configurer MIDI Output
 */

'use client';

import React, { useEffect } from 'react';
import { useMidiOutput } from '../hooks/useMidiOutput';
import { MidiOutputDevice } from '../lib/MidiOutputEngine';

interface MidiOutputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMidiCallback?: (callback: any) => void;
  isAudioEnabled?: boolean;
  onAudioEnabledChange?: (enabled: boolean) => void;
}

export function MidiOutputPanel({ isOpen, onClose, onMidiCallback, isAudioEnabled = true, onAudioEnabledChange }: MidiOutputPanelProps) {
  const {
    isInitialized,
    isEnabled,
    selectedDevice,
    availableDevices,
    activeNotesCount,
    initialize,
    selectDevice,
    setEnabled,
    sendNoteOn,
    sendNoteOff,
    stopAllNotes,
    refreshDevices
  } = useMidiOutput();

  // Initialiser automatiquement
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Configurer le callback MIDI quand l'état change
  useEffect(() => {
    if (onMidiCallback) {
      if (isEnabled && selectedDevice) {
        onMidiCallback({
          onNoteOn: sendNoteOn,
          onNoteOff: sendNoteOff
        });
      } else {
        onMidiCallback(null);
      }
    }
  }, [isEnabled, selectedDevice, onMidiCallback, sendNoteOn, sendNoteOff]);

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
          <h3 className="text-lg font-semibold text-white">🎛️ MIDI Output</h3>
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
                  Device MIDI :
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
                    Aucun device MIDI détecté. Connectez un device ou utilisez un logiciel virtual MIDI.
                  </p>
                )}
              </div>

              {/* Activation MIDI Output */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="midi-enabled"
                  checked={isEnabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  disabled={!selectedDevice}
                  className="w-4 h-4"
                />
                <label htmlFor="midi-enabled" className="text-sm text-gray-300">
                  Activer MIDI Output en temps réel
                </label>
              </div>

              {/* Contrôle Audio Interne */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="audio-enabled"
                  checked={isAudioEnabled}
                  onChange={(e) => onAudioEnabledChange?.(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="audio-enabled" className="text-sm text-gray-300">
                  Synthé interne activé
                </label>
              </div>

              {/* Information sur l'exclusion mutuelle */}
              {isEnabled && isAudioEnabled && (
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-2">
                  <p className="text-xs text-yellow-200">
                    ⚠️ <strong>Attention :</strong> MIDI Output ET synthé interne sont activés. 
                    Vous entendrez les deux sources audio simultanément.
                  </p>
                </div>
              )}

              {/* Status et contrôles */}
              {selectedDevice && (
                <div className="bg-gray-800 rounded p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Device :</span>
                    <span className="text-white">{selectedDevice.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">MIDI Output :</span>
                    <span className={isEnabled ? 'text-green-400' : 'text-gray-400'}>
                      {isEnabled ? '🟢 Actif' : '⭕ Inactif'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Synthé interne :</span>
                    <span className={isAudioEnabled ? 'text-green-400' : 'text-gray-400'}>
                      {isAudioEnabled ? '🟢 Actif' : '⭕ Inactif'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Notes actives :</span>
                    <span className="text-white">{activeNotesCount}</span>
                  </div>
                  
                  {isEnabled && (
                    <div className="pt-2 border-t border-gray-700">
                      <button
                        onClick={stopAllNotes}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        🛑 Arrêter toutes les notes (Panic)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Aide */}
              <div className="bg-blue-900/30 border border-blue-700/50 rounded p-3">
                <h4 className="text-sm font-medium text-blue-300 mb-1">💡 Instructions :</h4>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Connectez un device MIDI ou lancez un logiciel virtual MIDI</li>
                  <li>• Sélectionnez le device dans la liste</li>
                  <li>• Activez MIDI Output pour envoyer des notes pendant la lecture</li>
                  <li>• Le synthé interne est automatiquement désactivé avec MIDI Output</li>
                  <li>• Vous pouvez contrôler les deux sources indépendamment</li>
                  <li>• Les messages MIDI suivent la vitesse de lecture audio</li>
                </ul>
              </div>
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