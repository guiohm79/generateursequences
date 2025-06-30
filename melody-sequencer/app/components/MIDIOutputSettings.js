"use client";
import React, { useState, useEffect } from "react";
import { getMIDIOutput } from "../lib/midiOutput";

export default function MIDIOutputSettings({ onClose }) {
  const [availablePorts, setAvailablePorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [midiChannel, setMidiChannel] = useState(0);
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Initialiser le système MIDI au chargement du composant
  useEffect(() => {
    console.log("MIDIOutputSettings - Initialisation");
    const initMIDI = async () => {
      const midiOutput = getMIDIOutput();
      try {
        const success = await midiOutput.initialize();
        console.log("MIDIOutputSettings - Initialisation MIDI:", success);
        if (success) {
          refreshPortList();
          setStatusMessage("Système MIDI initialisé");
          
          // Tente une connexion automatique si un seul port est disponible
          setTimeout(() => {
            const ports = midiOutput.getOutputPorts();
            console.log("Ports MIDI disponibles:", ports);
            if (ports.length === 1) {
              console.log("Un seul port disponible, connexion automatique:", ports[0].id);
              connectToPort(ports[0].id);
            }
          }, 500);
        } else {
          setStatusMessage("Échec d'initialisation MIDI");
        }
      } catch (error) {
        console.error("Erreur MIDI:", error);
        setStatusMessage("Erreur d'initialisation MIDI");
      }
    };

    initMIDI();
  }, []);

  // Rafraîchir la liste des ports MIDI disponibles
  const refreshPortList = () => {
    const midiOutput = getMIDIOutput();
    const ports = midiOutput.getOutputPorts();
    setAvailablePorts(ports);
    
    if (ports.length === 0) {
      setStatusMessage("Aucun port MIDI détecté");
    }
  };

  // Gérer la connexion à un port MIDI
  const handlePortChange = (e) => {
    const portId = e.target.value;
    connectToPort(portId);
  };
  
  // Fonction de connexion à un port utilisée à la fois par handlePortChange et par l'auto-connexion
  const connectToPort = (portId) => {
    console.log("MIDIOutputSettings - Tentative de connexion au port:", portId);
    setSelectedPort(portId);
    
    if (portId) {
      const midiOutput = getMIDIOutput();
      const success = midiOutput.connectToPort(portId);
      console.log("MIDIOutputSettings - Connexion au port:", success);
      
      if (success) {
        setMidiEnabled(true);
        setStatusMessage(`Connecté au port: ${availablePorts.find(p => p.id === portId)?.name}`);
      } else {
        setMidiEnabled(false);
        setStatusMessage("Échec de connexion au port MIDI");
      }
    } else {
      setMidiEnabled(false);
      setStatusMessage("");
    }
  };

  // Gérer le changement de canal MIDI
  const handleChannelChange = (e) => {
    const channel = parseInt(e.target.value);
    setMidiChannel(channel);
    
    if (midiEnabled) {
      const midiOutput = getMIDIOutput();
      midiOutput.setMIDIChannel(channel);
    }
  };

  // Tester la sortie MIDI avec une note simple
  const handleTestNote = () => {
    if (!midiEnabled) return;
    
    const midiOutput = getMIDIOutput();
    // Jouer une note C4 à vélocité 100
    midiOutput.sendNoteOn("C4", 100);
    
    // Arrêter la note après 500ms
    setTimeout(() => {
      midiOutput.sendNoteOff("C4");
    }, 500);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-full max-w-md z-50">
      <h3 className="text-lg font-semibold mb-3 text-white">Configuration Sortie MIDI</h3>
      
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <label className="text-gray-300 mb-1">Port MIDI</label>
          <button 
            onClick={refreshPortList}
            className="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-white"
          >
            Rafraîchir
          </button>
        </div>
        <select
          value={selectedPort}
          onChange={handlePortChange}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        >
          <option value="">Sélectionner un port...</option>
          {availablePorts.map(port => (
            <option key={port.id} value={port.id}>
              {port.name} ({port.manufacturer})
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="text-gray-300 mb-1 block">Canal MIDI (0-15)</label>
        <input
          type="number"
          min="0"
          max="15"
          value={midiChannel}
          onChange={handleChannelChange}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
        />
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <span className={`text-sm ${midiEnabled ? 'text-green-500' : 'text-gray-400'}`}>
          {statusMessage || (midiEnabled ? "MIDI activé" : "MIDI désactivé")}
        </span>
        <div>
          <button
            onClick={handleTestNote}
            disabled={!midiEnabled}
            className={`mr-2 px-4 py-2 rounded text-white ${
              midiEnabled 
                ? 'bg-green-600 hover:bg-green-500' 
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            Test
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
