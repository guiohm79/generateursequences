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

  // Utilisation des styles définis dans globals.css
  const containerStyle = {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    padding: '20px',
    width: '320px',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 212, 255, 0.1)'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '16px',
    color: 'var(--accent)',
    letterSpacing: '-0.01em'
  };

  const statusStyle = {
    fontSize: '13px',
    marginBottom: '16px',
    color: 'var(--text-secondary)'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    marginTop: '16px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const selectStyle = {
    width: '100%',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 10px',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.3s ease'
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 10px',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Configuration MIDI</h3>
      
      <div style={statusStyle}>
        {statusMessage || (midiEnabled ? "Système MIDI initialisé" : "MIDI désactivé")}
      </div>

      <div className="control-group" style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>Port MIDI</label>
          <button 
            onClick={refreshPortList}
            className="btn"
            style={{ padding: '8px 12px', fontSize: '12px' }}
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
      
      <div className="control-group" style={{ display: 'block' }}>
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
      
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={handleTestNote}
          disabled={!midiEnabled}
          className={midiEnabled ? "btn" : "btn"}
          style={{
            opacity: midiEnabled ? 1 : 0.5,
            cursor: midiEnabled ? 'pointer' : 'not-allowed'
          }}
        >
          Tester
        </button>
        <button
          onClick={onClose}
          className="btn primary"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
