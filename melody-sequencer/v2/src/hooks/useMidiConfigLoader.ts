/**
 * useMidiConfigLoader - Hook pour charger la configuration MIDI sauvegardée
 */

'use client';

import { useEffect, useRef } from 'react';
import { MidiConfigStorage } from '../lib/MidiConfigStorage';
import { useMidiConfig } from '../contexts/MidiConfigContext';

export function useMidiConfigLoader() {
  const { midiInput, midiOutput, audio } = useMidiConfig();
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Charger la configuration seulement une fois au montage
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadStoredConfig = async () => {
      try {
        const storedConfig = MidiConfigStorage.loadConfig();
        if (!storedConfig) {
          console.log('[useMidiConfigLoader] ℹ️ Aucune configuration sauvegardée');
          return;
        }

        console.log('[useMidiConfigLoader] 🔄 Chargement configuration...', storedConfig);
        console.log('[useMidiConfigLoader] 🔍 MIDI Input selectedDeviceId:', storedConfig.midiInput.selectedDeviceId);
        console.log('[useMidiConfigLoader] 🔍 Engines status:', {
          midiInputInit: midiInput.isInitialized,
          midiOutputInit: midiOutput.isInitialized, 
          audioInit: audio.isInitialized
        });

        // Appliquer directement la configuration après un délai court
        console.log('[useMidiConfigLoader] 🚀 Application immédiate de la configuration...');
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes seulement

        // Appliquer MIDI Input
        if (storedConfig.midiInput.selectedDeviceId) {
          console.log('[useMidiConfigLoader] 🎹 Chargement MIDI Input:', storedConfig.midiInput);
          
          // Sélectionner le device
          const deviceSelected = midiInput.selectDevice(storedConfig.midiInput.selectedDeviceId);
          
          if (deviceSelected) {
            // Attendre un peu que la sélection soit effective
            setTimeout(() => {
              // Appliquer les paramètres
              if (typeof storedConfig.midiInput.playthroughEnabled === 'boolean') {
                midiInput.setPlaythroughEnabled(storedConfig.midiInput.playthroughEnabled);
              }
              // NE PAS appliquer recordEnabled automatiquement - l'utilisateur doit l'activer manuellement
              // if (typeof storedConfig.midiInput.recordEnabled === 'boolean') {
              //   midiInput.setRecordEnabled(storedConfig.midiInput.recordEnabled);
              // }
              if (typeof storedConfig.midiInput.channel === 'number') {
                midiInput.setChannel(storedConfig.midiInput.channel);
              }
              if (typeof storedConfig.midiInput.octaveTranspose === 'number') {
                midiInput.setOctaveTranspose(storedConfig.midiInput.octaveTranspose);
              }
              if (typeof storedConfig.midiInput.velocityScale === 'number') {
                midiInput.setVelocityScale(storedConfig.midiInput.velocityScale);
              }
              
              console.log('[useMidiConfigLoader] ✅ MIDI Input configuré');
            }, 500);
          } else {
            console.warn('[useMidiConfigLoader] ⚠️ Device MIDI Input non trouvé:', storedConfig.midiInput.selectedDeviceId);
          }
        }

        // Appliquer MIDI Output
        if (storedConfig.midiOutput.selectedDeviceId) {
          console.log('[useMidiConfigLoader] 🎛️ Chargement MIDI Output:', storedConfig.midiOutput);
          midiOutput.selectDevice(storedConfig.midiOutput.selectedDeviceId);
        }

        // Appliquer Audio
        if (storedConfig.audio) {
          console.log('[useMidiConfigLoader] 🎵 Chargement Audio:', storedConfig.audio);
          if (typeof storedConfig.audio.enabled === 'boolean') {
            audio.setEnabled(storedConfig.audio.enabled);
          }
          if (typeof storedConfig.audio.volume === 'number') {
            audio.setVolume(storedConfig.audio.volume);
          }
        }

        console.log('[useMidiConfigLoader] ✅ Configuration chargée et appliquée');
        
      } catch (error) {
        console.error('[useMidiConfigLoader] ❌ Erreur chargement configuration:', error);
      }
    };

    // Démarrer le chargement après un court délai
    setTimeout(loadStoredConfig, 1000);
    
  }, [midiInput.isInitialized, midiOutput.isInitialized, audio.isInitialized]);

  return {
    // Fonction pour recharger manuellement
    reloadConfig: () => {
      hasLoaded.current = false;
    }
  };
}