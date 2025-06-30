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

  // Style directement appliqué pour correspondre exactement à la capture d'écran
  const containerStyle = {
    backgroundColor: '#121212',
    color: 'white',
    padding: '10px',
    width: '300px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px'
  };

  const statusStyle = {
    fontSize: '14px',
    marginBottom: '10px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    marginTop: '10px'
  };

  const selectStyle = {
    width: '100%',
    backgroundColor: '#121212',
    color: 'white',
    border: '1px solid #333',
    padding: '3px'
  };

  const inputStyle = {
    width: '100px',
    backgroundColor: '#121212',
    color: 'white',
    border: '1px solid #333',
    padding: '3px'
  };

  const buttonStyle = {
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    padding: '5px 15px',
    margin: '10px 5px 0 0',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Configuration MIDI</h3>
      
      <div style={statusStyle}>
        {statusMessage || (midiEnabled ? "Système MIDI initialisé" : "MIDI désactivé")}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>Port MIDI</label>
          <button 
            onClick={refreshPortList}
            style={buttonStyle}
          >
            Rafraîchir
          </button>
        </div>
        <select
          value={selectedPort}
          onChange={handlePortChange}
          style={selectStyle}
        >
          <option value="">Sélectionner un port...</option>
          {availablePorts.map(port => (
            <option key={port.id} value={port.id}>
              {port.name} {port.manufacturer ? `(${port.manufacturer})` : ''}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label style={labelStyle}>Canal MIDI (0-15)</label>
        <input
          type="number"
          min="0"
          max="15"
          value={midiChannel}
          onChange={handleChannelChange}
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button
          onClick={handleTestNote}
          disabled={!midiEnabled}
          style={{
            ...buttonStyle,
            backgroundColor: midiEnabled ? '#333' : '#222',
            color: midiEnabled ? 'white' : '#555',
            cursor: midiEnabled ? 'pointer' : 'not-allowed',
            borderRadius: '4px'
          }}
        >
          Tester
        </button>
        <button
          onClick={onClose}
          style={buttonStyle}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
