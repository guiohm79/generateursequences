/**
 * Page Configuration - Paramètres globaux du projet
 */

'use client';

import React, { useState } from 'react';
import { useMidiConfig } from '../../contexts/MidiConfigContext';
import { MidiConfigStorage } from '../../lib/MidiConfigStorage';

export default function ConfigurationPage() {
  const [activeSection, setActiveSection] = useState<string>('midi-input');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Configuration MIDI globale
  const { midiInput, midiOutput, audio } = useMidiConfig();

  // Wrappers pour sauvegarder automatiquement
  const handleMidiInputDeviceSelect = (deviceId: string) => {
    const result = midiInput.selectDevice(deviceId);
    if (result && deviceId) {
      // Sauvegarder la sélection
      MidiConfigStorage.updateMidiInput({
        selectedDeviceId: deviceId,
        deviceName: midiInput.selectedDevice?.name || null,
        playthroughEnabled: true // Auto-activé par le context
      });
    } else if (!deviceId) {
      // Device désélectionné
      MidiConfigStorage.updateMidiInput({
        selectedDeviceId: null,
        deviceName: null,
        playthroughEnabled: false
      });
    }
  };

  const handleMidiOutputDeviceSelect = (deviceId: string) => {
    const result = midiOutput.selectDevice(deviceId);
    MidiConfigStorage.updateMidiOutput({
      selectedDeviceId: deviceId || null,
      deviceName: deviceId ? midiOutput.selectedDevice?.name || null : null
    });
  };

  const handlePlaythroughToggle = (enabled: boolean) => {
    midiInput.setPlaythroughEnabled(enabled);
    MidiConfigStorage.updateMidiInput({ playthroughEnabled: enabled });
  };


  const handleChannelChange = (channel: number) => {
    midiInput.setChannel(channel);
    MidiConfigStorage.updateMidiInput({ channel });
  };

  const handleOctaveTransposeChange = (transpose: number) => {
    midiInput.setOctaveTranspose(transpose);
    MidiConfigStorage.updateMidiInput({ octaveTranspose: transpose });
  };

  const handleVelocityScaleChange = (scale: number) => {
    midiInput.setVelocityScale(scale);
    MidiConfigStorage.updateMidiInput({ velocityScale: scale });
  };

  const handleAudioEnabledToggle = (enabled: boolean) => {
    audio.setEnabled(enabled);
    MidiConfigStorage.updateAudio({ enabled });
  };

  const handleVolumeChange = (volume: number) => {
    audio.setVolume(volume);
    MidiConfigStorage.updateAudio({ volume });
  };

  // Sauvegarde manuelle complète
  const handleManualSave = () => {
    try {
      const currentConfig = {
        midiInput: {
          selectedDeviceId: midiInput.selectedDevice?.id || null,
          deviceName: midiInput.selectedDevice?.name || null,
          playthroughEnabled: midiInput.config.playthroughEnabled,
          recordEnabled: midiInput.config.recordEnabled,
          channel: midiInput.config.channel,
          octaveTranspose: midiInput.config.octaveTranspose,
          velocityScale: midiInput.config.velocityScale
        },
        midiOutput: {
          selectedDeviceId: midiOutput.selectedDevice?.id || null,
          deviceName: midiOutput.selectedDevice?.name || null
        },
        audio: {
          enabled: audio.isEnabled,
          volume: audio.volume
        },
        lastModified: Date.now()
      };

      MidiConfigStorage.saveConfig(currentConfig);
      setSaveMessage('✅ Configuration sauvegardée !');
      
      // Effacer le message après 3 secondes
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setSaveMessage('❌ Erreur sauvegarde');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Afficher la configuration actuelle (debug)
  const showCurrentConfig = () => {
    const stored = MidiConfigStorage.loadConfig();
    console.log('Configuration localStorage:', stored);
    alert('Configuration affichée dans la console (F12)');
  };

  const sections = [
    { id: 'midi-input', title: '🎹 MIDI Input', icon: '🎹' },
    { id: 'midi-output', title: '🎛️ MIDI Output', icon: '🎛️' },
    { id: 'audio', title: '🎵 Audio Engine', icon: '🎵' },
    { id: 'interface', title: '🎨 Interface', icon: '🎨' },
    { id: 'general', title: '⚙️ Général', icon: '⚙️' },
  ];

  const renderMidiInputSection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold text-white">🎹 Configuration MIDI Input</h3>
        <div className={`w-3 h-3 rounded-full ${
          midiInput.isInitialized ? 'bg-green-500' : 'bg-red-500'
        }`} title={midiInput.isInitialized ? 'MIDI initialisé' : 'MIDI non disponible'} />
      </div>

      {midiInput.isInitialized ? (
        <div className="space-y-6">
          {/* Sélection device */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <h4 className="text-lg font-medium text-white">Device Selection</h4>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-300 min-w-[120px]">
                Device MIDI :
              </label>
              <div className="flex gap-2 flex-1">
                <select
                  value={midiInput.selectedDevice?.id || ''}
                  onChange={(e) => handleMidiInputDeviceSelect(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:border-gray-500 transition-colors"
                >
                  <option value="">Aucun device sélectionné</option>
                  {midiInput.availableDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={midiInput.refreshDevices}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Actualiser la liste des devices"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>

          {/* Contrôles principaux */}
          {midiInput.selectedDevice && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <h4 className="text-lg font-medium text-white">Contrôles Audio & Recording</h4>
              
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-between w-full max-w-md">
                  <span className="text-sm text-gray-300">Playthrough Audio</span>
                  <button
                    onClick={() => handlePlaythroughToggle(!midiInput.config.playthroughEnabled)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      midiInput.config.playthroughEnabled 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {midiInput.config.playthroughEnabled ? '🔊 ON' : '🔇 OFF'}
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-400 mt-2">
                  💡 Le bouton d'enregistrement se trouve dans l'interface principale de chaque mode
                </p>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4 text-sm text-center pt-4 border-t border-gray-700">
                <div>
                  <div className="text-lg font-mono text-white">{midiInput.activeNotesCount}</div>
                  <div className="text-xs text-gray-400">Notes actives</div>
                </div>
                <div>
                  <div className={`text-lg font-mono ${midiInput.config.playthroughEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {midiInput.config.playthroughEnabled ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-xs text-gray-400">Playthrough</div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration avancée */}
          {midiInput.selectedDevice && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <h4 className="text-lg font-medium text-white">Configuration Avancée</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Canal MIDI */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm text-gray-300">
                    <span>Canal MIDI</span>
                    <span className="text-xs text-gray-400">
                      {midiInput.config.channel === -1 ? 'Tous canaux' : `Canal ${midiInput.config.channel + 1}`}
                    </span>
                  </label>
                  <select
                    value={midiInput.config.channel}
                    onChange={(e) => handleChannelChange(parseInt(e.target.value))}
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
                      {midiInput.config.octaveTranspose > 0 ? '+' : ''}{midiInput.config.octaveTranspose}
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">-3</span>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={1}
                      value={midiInput.config.octaveTranspose}
                      onChange={(e) => handleOctaveTransposeChange(parseInt(e.target.value))}
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
                      {midiInput.config.velocityScale.toFixed(1)}x
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">0.1</span>
                    <input
                      type="range"
                      min={0.1}
                      max={2.0}
                      step={0.1}
                      value={midiInput.config.velocityScale}
                      onChange={(e) => handleVelocityScaleChange(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">2.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6 text-center">
          <p className="text-red-300">Web MIDI API non disponible.</p>
          <p className="text-red-400 text-sm mt-2">Veuillez utiliser un navigateur compatible avec Web MIDI.</p>
        </div>
      )}

      {midiInput.availableDevices.length === 0 && midiInput.isInitialized && (
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 text-center">
          <p className="text-yellow-300">Aucun device MIDI Input détecté.</p>
          <p className="text-yellow-400 text-sm mt-1">Connectez un clavier MIDI ou utilisez un logiciel virtual MIDI.</p>
        </div>
      )}
    </div>
  );

  const renderMidiOutputSection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold text-white">🎛️ Configuration MIDI Output</h3>
        <div className={`w-3 h-3 rounded-full ${
          midiOutput.isInitialized ? 'bg-green-500' : 'bg-red-500'
        }`} title={midiOutput.isInitialized ? 'MIDI initialisé' : 'MIDI non disponible'} />
      </div>

      {midiOutput.isInitialized ? (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <h4 className="text-lg font-medium text-white">Device Output</h4>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-300 min-w-[120px]">
                Device MIDI :
              </label>
              <div className="flex gap-2 flex-1">
                <select
                  value={midiOutput.selectedDevice?.id || ''}
                  onChange={(e) => handleMidiOutputDeviceSelect(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:border-gray-500 transition-colors"
                >
                  <option value="">Audio interne seulement</option>
                  {midiOutput.availableDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={midiOutput.refreshDevices}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Actualiser la liste des devices"
                >
                  🔄
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className={`text-lg font-mono ${midiOutput.selectedDevice ? 'text-green-400' : 'text-gray-400'}`}>
                  {midiOutput.selectedDevice ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
                </div>
                <div className="text-xs text-gray-400">Status MIDI Output</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-mono ${midiOutput.selectedDevice ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {midiOutput.selectedDevice ? 'EXTERNE' : 'INTERNE'}
                </div>
                <div className="text-xs text-gray-400">Mode audio</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6 text-center">
          <p className="text-red-300">Web MIDI API non disponible.</p>
        </div>
      )}
    </div>
  );

  const renderAudioSection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold text-white">🎵 Configuration Audio Engine</h3>
        <div className={`w-3 h-3 rounded-full ${
          audio.isInitialized ? 'bg-green-500' : 'bg-red-500'
        }`} title={audio.isInitialized ? 'Audio initialisé' : 'Audio non disponible'} />
      </div>

      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h4 className="text-lg font-medium text-white">Contrôles Audio</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Audio Engine</span>
            <button
              onClick={() => handleAudioEnabledToggle(!audio.isEnabled)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                audio.isEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {audio.isEnabled ? '🔊 ON' : '🔇 OFF'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm text-gray-300">
              <span>Volume global</span>
              <span className="text-xs text-gray-400 font-mono">
                {Math.round(audio.volume * 100)}%
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">0%</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={audio.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-center pt-4 border-t border-gray-700">
          <div>
            <div className={`text-lg font-mono ${audio.isInitialized ? 'text-green-400' : 'text-red-400'}`}>
              {audio.isInitialized ? 'READY' : 'ERROR'}
            </div>
            <div className="text-xs text-gray-400">Audio Engine</div>
          </div>
          <div>
            <div className={`text-lg font-mono ${audio.isEnabled ? 'text-green-400' : 'text-gray-400'}`}>
              {audio.isEnabled ? 'ACTIVE' : 'MUTED'}
            </div>
            <div className="text-xs text-gray-400">Status</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterfaceSection = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">🎨 Configuration Interface</h3>
      
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h4 className="text-lg font-medium text-white">Apparence</h4>
        <div className="text-gray-400">
          🚧 Section en développement - Thèmes, couleurs, tailles d'éléments...
        </div>
      </div>
    </div>
  );

  const renderGeneralSection = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">⚙️ Configuration Générale</h3>
      
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h4 className="text-lg font-medium text-white">Paramètres Globaux</h4>
        <div className="text-gray-400">
          🚧 Section en développement - Auto-save, raccourcis, export/import settings...
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'midi-input': return renderMidiInputSection();
      case 'midi-output': return renderMidiOutputSection();
      case 'audio': return renderAudioSection();
      case 'interface': return renderInterfaceSection();
      case 'general': return renderGeneralSection();
      default: return renderMidiInputSection();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🔧 Configuration Globale</h1>
          <p className="text-gray-400">
            Paramètres centralisés pour tous les modes du projet
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-4 space-y-2 sticky top-4">
              <h3 className="text-lg font-semibold text-white mb-4">Sections</h3>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 rounded-lg p-6">
              {renderActiveSection()}
            </div>
          </div>
        </div>

        {/* Contrôles de sauvegarde */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">💾 Sauvegarde</h3>
              {saveMessage && (
                <div className={`px-3 py-1 rounded text-sm font-medium ${
                  saveMessage.includes('✅') 
                    ? 'bg-green-600/20 text-green-400 border border-green-600/50' 
                    : 'bg-red-600/20 text-red-400 border border-red-600/50'
                }`}>
                  {saveMessage}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={showCurrentConfig}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                🔍 Voir Config
              </button>
              <button
                onClick={handleManualSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">💡 Configuration Centralisée</h3>
          <div className="text-blue-200 text-sm space-y-1">
            <p>• Les paramètres définis ici sont utilisés dans tous les modes du projet</p>
            <p>• MIDI Input/Output configuré une fois, disponible partout</p>
            <p>• Les settings sont sauvegardés dans localStorage du navigateur</p>
            <p>• Cliquez "💾 Sauvegarder" pour confirmer les changements</p>
          </div>
        </div>
      </div>
    </div>
  );
}