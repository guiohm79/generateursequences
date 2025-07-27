/**
 * MidiStatusBar - Barre de status MIDI simplifiée pour les modes
 */

import React from 'react';
import { useMidiInputForMode } from '../hooks/useGlobalMidiConfig';

interface MidiStatusBarProps {
  className?: string;
  showRecording?: boolean;
  onConfigClick?: () => void;
}

export function MidiStatusBar({ 
  className = '', 
  showRecording = true,
  onConfigClick 
}: MidiStatusBarProps) {
  const {
    isConnected,
    deviceName,
    isRecording,
    activeNotesCount,
    playthroughEnabled,
    recordEnabled,
    startRecording,
    stopRecording,
    panic,
  } = useMidiInputForMode();

  return (
    <div className={`bg-gray-900 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Status MIDI */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`} />
            <span className="text-gray-300">MIDI Input:</span>
            <span className={isConnected ? 'text-green-400' : 'text-gray-400'}>
              {isConnected ? deviceName : 'Déconnecté'}
            </span>
          </div>

          {isConnected && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-gray-300">Playthrough:</span>
                <span className={playthroughEnabled ? 'text-green-400' : 'text-gray-400'}>
                  {playthroughEnabled ? '🔊' : '🔇'}
                </span>
              </div>

              {showRecording && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">Recording:</span>
                  <span className={recordEnabled ? 'text-orange-400' : 'text-gray-400'}>
                    {recordEnabled ? (isRecording ? '🔴' : '⚪') : '⭕'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-300">Notes:</span>
                <span className="text-white font-mono">
                  {activeNotesCount}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-2">
          {isConnected && showRecording && recordEnabled && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? '⏹️ Stop' : '⏺️ Rec'}
            </button>
          )}

          {isConnected && (
            <button
              onClick={panic}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
            >
              🛑
            </button>
          )}

          {onConfigClick && (
            <button
              onClick={onConfigClick}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}