"use client";
import React, { useState, useRef, useEffect } from "react";
import { Midi } from '@tonejs/midi';
import { SCALES } from '../lib/randomEngine';

const VariationPopup = ({ 
  visible, 
  onValidate, 
  onCancel, 
  currentPattern = null,
  octaves = { min: 3, max: 5 },
}) => {
  // Si le popup n'est pas visible, ne pas le rendre
  if (!visible) return null;

  // État pour suivre si on est en train de faire un drag
  const [isDragging, setIsDragging] = useState(false);

  // États pour les options de variation
  const [selectedSource, setSelectedSource] = useState("current"); // "current" ou "import"
  const [importedFile, setImportedFile] = useState(null);
  
  // Options de variation
  const [transpositions, setTranspositions] = useState([0]);
  const [transpositionInput, setTranspositionInput] = useState("0");
  const [swing, setSwing] = useState(0);
  const [humanize, setHumanize] = useState(0);
  const [retrograde, setRetrograde] = useState(false);
  const [invert, setInvert] = useState(false);
  const [seed, setSeed] = useState("");
  const [root, setRoot] = useState("C");
  const [scale, setScale] = useState("minor");
  const [keepScale, setKeepScale] = useState(false);
  const [useInspiration, setUseInspiration] = useState(false);   // NEW
  
  // Référence pour l'input de fichier
  const fileInputRef = useRef(null);

  // Fonction pour gérer l'import de fichier MIDI via le sélecteur de fichiers
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    } else {
      alert("Aucun fichier sélectionné");
    }
  };

  // Fonction commune pour traiter un fichier MIDI
  const processFile = (file) => {
    // Vérifier l'extension du fichier plutôt que le type MIME qui peut varier
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
      setImportedFile(file);
      setSelectedSource("import");
    } else {
      alert("Veuillez sélectionner un fichier MIDI valide (.mid ou .midi)");
    }
  };

  // Gestionnaires pour le drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Vérifier s'il y a des fichiers
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  // Fonction pour ajouter une transposition
  const addTransposition = () => {
    const value = parseInt(transpositionInput, 10);
    if (!isNaN(value) && !transpositions.includes(value)) {
      setTranspositions([...transpositions, value].sort((a, b) => a - b));
      setTranspositionInput("");
    }
  };

  // Fonction pour retirer une transposition
  const removeTransposition = (value) => {
    setTranspositions(transpositions.filter(t => t !== value));
  };

  // Gérer la validation du formulaire
  const handleSubmit = async () => {
    let midiData;

    // Récupérer les données MIDI selon la source
    if (selectedSource === "import" && importedFile) {
      // Lire le fichier MIDI importé
      const fileBuffer = await importedFile.arrayBuffer();
      midiData = fileBuffer;
    } else if (selectedSource === "current" && currentPattern) {
      // Utiliser le pattern actuel du séquenceur
      // Si c'est un objet pattern, on l'identifie par "current" pour que
      // handleVariationValidate sache qu'il faut le convertir
      midiData = "current";
    } else {
      alert("Veuillez sélectionner une source de données MIDI valide");
      return;
    }

    // Préparer les options pour le moteur de variation
    const options = {
      transpositions,
      swing,
      humanize,
      retrograde,
      invert,
      seed: seed ? parseInt(seed, 10) : null,
      root,
      scale,
      keepScale,
      useInspiration
    };

    // Appeler la fonction onValidate avec les options et les données MIDI
    onValidate(midiData, options);
  };

  // Liste des gammes disponibles à partir de randomEngine.js
  const scaleOptions = Object.keys(SCALES);
  
  // Liste des notes pour la tonique
  const noteOptions = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return (
    <div className="popup-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div 
        className="popup-container" 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
        backgroundColor: '#1a1a2e',
        borderRadius: '12px',
        boxShadow: '0 0 25px rgba(0, 234, 255, 0.5)',
        padding: '20px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        color: 'white',
        border: '1px solid #00eaff'
      }}>
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 234, 255, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            border: '2px dashed #00eaff'
          }}>
            <div style={{
              backgroundColor: 'rgba(0, 0, 30, 0.8)',
              padding: '20px',
              borderRadius: '8px',
              color: '#00eaff',
              fontWeight: 'bold'
            }}>
              Déposez votre fichier MIDI ici
            </div>
          </div>
        )}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#00eaff',
          borderBottom: '1px solid #00eaff',
          paddingBottom: '10px',
          marginBottom: '20px',
          textShadow: '0 0 10px rgba(0, 234, 255, 0.5)'
        }}>Modification de Séquence</h2>

        {/* Section Source */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#00eaff' }}>Source de la séquence</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              className={`btn ${selectedSource === "current" ? 'btn-active' : ''}`}
              onClick={() => setSelectedSource("current")}
              style={{ 
                backgroundColor: selectedSource === "current" ? '#00eaff' : '', 
                color: selectedSource === "current" ? '#000' : ''
              }}
            >
              Séquence actuelle
            </button>
            
            <button 
              className={`btn ${selectedSource === "import" ? 'btn-active' : ''}`}
              onClick={() => fileInputRef.current.click()}
              style={{ 
                backgroundColor: selectedSource === "import" ? '#00eaff' : '', 
                color: selectedSource === "import" ? '#000' : ''
              }}
            >
              Importer MIDI
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".mid" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            
            {importedFile && (
              <div style={{ marginLeft: '10px', color: '#8af' }}>
                Fichier: {importedFile.name}
              </div>
            )}
          </div>
        </div>

        {/* Section Options */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#00eaff' }}>Options de variation</h3>


          {/* Transpositions */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Transpositions (demi-tons)</label>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="±12, 0, 7..." 
                value={transpositionInput}
                onChange={(e) => setTranspositionInput(e.target.value)}
                style={{ width: '80px' }}
              />
              <button 
                className="btn" 
                onClick={addTransposition}
                style={{ minWidth: 'unset', padding: '5px 10px' }}
              >
                +
              </button>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginLeft: '10px' }}>
                {transpositions.map(t => (
                  <span 
                    key={t} 
                    style={{ 
                      padding: '2px 8px',
                      backgroundColor: '#00eaff33',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {t} 
                    <button 
                      onClick={() => removeTransposition(t)} 
                      style={{ 
                        marginLeft: '5px', 
                        border: 'none', 
                        background: 'none', 
                        color: 'white', 
                        cursor: 'pointer', 
                        padding: '0 5px' 
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Swing */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Swing (0-1)</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={swing} 
              onChange={(e) => setSwing(parseFloat(e.target.value))}
              style={{ width: '200px' }}
            />
            <span style={{ marginLeft: '10px' }}>{swing.toFixed(2)}</span>
          </div>
          
          {/* Humanize */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Humanisation (ms max)</label>
            <input 
              type="range" 
              min="0" 
              max="20" 
              step="1" 
              value={humanize} 
              onChange={(e) => setHumanize(parseInt(e.target.value, 10))}
              style={{ width: '200px' }}
            />
            <span style={{ marginLeft: '10px' }}>{humanize}ms</span>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
              Recommandé : 2-5ms pour du groove naturel, 8-15ms pour un effet plus marqué
            </div>
          </div>
          
          {/* Options de transformation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={retrograde}
                  onChange={(e) => setRetrograde(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Rétrograde (inversion temporelle)
              </label>
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={invert}
                  onChange={(e) => setInvert(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Inversion mélodique
              </label>
            </div>


            <label style={{ display:'flex',alignItems:'center',cursor:'pointer' }}>
            <input
              type="checkbox"
              checked={useInspiration}
              onChange={e=>setUseInspiration(e.target.checked)}
              style={{ marginRight:'8px' }}
            />
            Mode Inspiration (Markov + Euclid)
          </label>

          </div>
          
          {/* Seed */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Graine aléatoire (vide = aléatoire à chaque fois)</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="ex: 12345" 
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              style={{ width: '120px' }}
            />
          </div>
          
          {/* Gamme et tonalité */}
          <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Tonique</label>
              <select
                className="input-field"
                value={root}
                onChange={(e) => setRoot(e.target.value)}
                style={{ width: '100%' }}
              >
                {noteOptions.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Gamme</label>
              <select
                className="input-field"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                style={{ width: '100%' }}
              >
                {scaleOptions.map(scaleOption => (
                  <option key={scaleOption} value={scaleOption}>{scaleOption}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={keepScale}
                onChange={(e) => setKeepScale(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Quantiser à la gamme
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '10px', 
          borderTop: '1px solid #00eaff40', 
          paddingTop: '15px',
          marginTop: '15px'
        }}>
          <button className="btn" onClick={onCancel} style={{ minWidth: '100px' }}>
            Annuler
          </button>
          <button 
            className="btn" 
            onClick={handleSubmit} 
            style={{ 
              minWidth: '100px', 
              backgroundColor: '#00eaff', 
              color: '#000000',
              fontWeight: 'bold'
            }}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariationPopup;
