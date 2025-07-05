"use client";
import React, { useRef, useState, useEffect } from "react";

// Génère la liste des notes du piano roll
function getAllNotes(minOct, maxOct) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const all = [];
  for (let octave = minOct; octave <= maxOct; octave++) {
    notes.forEach(note => all.push(note + octave));
  }
  return all;
}

export default function PianoRoll({
  minOctave = 3,
  maxOctave = 5,
  steps = 16,
  pattern = {},
  onToggleStep,
  onChangeVelocity,
  currentStep,
  onChangeSteps,
  onToggleAccent,
  onToggleSlide,
  showVelocityValues = true, // Nouvelle prop pour contrôler l'affichage des valeurs numériques
}) {
  const pianoNotes = getAllNotes(minOctave, maxOctave).reverse();

  // Pour le drag de vélocité
  const dragRef = useRef({ note: null, step: null, startY: null, startVelocity: null });

  // État pour stocker la note et le pas sélectionnés
  const [selectedCell, setSelectedCell] = useState({ note: null, step: null });
  
  // Ajouter un état pour le survol
  const [hoveredCell, setHoveredCell] = useState({ note: null, step: null });

  // Information sur la note sélectionnée 
  const [selectedInfo, setSelectedInfo] = useState(null);
  
  // Variables d'effet pour contrôler la gestion du survol et des raccourcis clavier
  const [activeHoverControl, setActiveHoverControl] = useState(false);
  
  // Mise en évidence visuelle de la cellule hover active
  const [hoverTarget, setHoverTarget] = useState({ note: null, step: null });

  // Debug pour suivre la cellule survolée
  useEffect(() => {
   
    // Mettre à jour le hoverTarget seulement si c'est une note active
    if (hoveredCell.note !== null && hoveredCell.step !== null) {
      const cell = pattern[hoveredCell.note]?.[hoveredCell.step];
      if (cell && cell.on) {
        setHoverTarget(hoveredCell);
      }
    }
  }, [hoveredCell, pattern]);

  // Attachement direct des raccourcis clavier aux cellules plutôt que d'utiliser un listener global
  const handleAccentKeyForCurrentCell = (note, step) => {
    // Vérifier que la cellule existe et est active
    const cell = pattern[note]?.[step];
    if (cell && cell.on) {
      console.log(`Applique accent sur: ${note} pas ${step}`);
      onToggleAccent(note, step);
      return true;
    }
    return false;
  };
  
  const handleSlideKeyForCurrentCell = (note, step) => {
    // Vérifier que la cellule existe et est active
    const cell = pattern[note]?.[step];
    if (cell && cell.on) {
      console.log(`Applique slide sur: ${note} pas ${step}`);
      onToggleSlide(note, step);
      return true;
    }
    return false;
  };
  
  // Listener global pour les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // N'utiliser que la cible du survol (qui est mise à jour seulement pour les notes actives)
      const { note, step } = hoverTarget;
      if (note === null || step === null) return;
      
      // Touche 'A' pour l'accent
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleAccentKeyForCurrentCell(note, step);
      }
      
      // Touche 'S' pour le slide
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSlideKeyForCurrentCell(note, step);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hoverTarget, pattern, onToggleAccent, onToggleSlide, handleAccentKeyForCurrentCell, handleSlideKeyForCurrentCell]);

  // Mise à jour des infos de la cellule sélectionnée
  useEffect(() => {
    const { note, step } = selectedCell;
    if (note && step !== null) {
      setSelectedInfo(pattern[note]?.[step] || null);
    } else {
      setSelectedInfo(null);
    }
  }, [selectedCell, pattern]);

  function handleMouseDown(note, idx, e) {
    e.preventDefault();
    const cell = pattern[note]?.[idx];
    
    // Sélection de la cellule avec clic principal
    setSelectedCell({ note, step: idx });
    
    // Toggle on/off la note : 1 clic active, re-clic désactive (marche tout le temps)
    onToggleStep(note, idx);

    // Drag vertical pour vélocité (seulement si activée après le toggle)
    if (!cell || !cell.on) {
      // la note vient d'être activée, vélocité à 100 par défaut
      dragRef.current = {
        note, step: idx,
        startY: e.clientY,
        startVelocity: 100,
      };
    } else {
      // la note était déjà active
      dragRef.current = {
        note, step: idx,
        startY: e.clientY,
        startVelocity: cell.velocity || 100,
      };
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e) {
    const { note, step, startY, startVelocity } = dragRef.current;
    if (note === null || step === null) return;
    let delta = startY - e.clientY;
    let newVel = Math.min(127, Math.max(20, startVelocity + Math.round(delta * 0.8)));
    onChangeVelocity(note, step, newVel);
  }

  function handleMouseUp() {
    dragRef.current = { note: null, step: null, startY: null, startVelocity: null };
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  return (
    <div className="piano-roll">
      {/* Indications des contrôles clavier */}
      <div style={{ marginBottom: "10px", padding: "5px 10px", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
        <strong>Instructions:</strong> Survolez ou sélectionnez une note puis utilisez:
        <ul style={{ margin: "5px 0 0 0", padding: "0 0 0 20px" }}>
          <li>Touche <kbd style={{ background: "#333", padding: "2px 6px", borderRadius: "3px", fontWeight: "bold" }}>A</kbd> pour activer/désactiver l'accent sur la note survolée</li>
          <li>Touche <kbd style={{ background: "#333", padding: "2px 6px", borderRadius: "3px", fontWeight: "bold" }}>S</kbd> pour activer/désactiver le slide sur la note survolée</li>
        </ul>
      </div>
      <div className="piano-roll-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div className="steps-control" style={{ display: "flex", gap: 10 }}>
          <button
            className={`btn steps-btn${steps === 16 ? " active" : ""}`}
            onClick={() => onChangeSteps(16)}
          >16 Steps</button>
          <button
            className={`btn steps-btn${steps === 32 ? " active" : ""}`}
            onClick={() => onChangeSteps(32)}
          >32 Steps</button>
          <button
            className={`btn steps-btn${steps === 64 ? " active" : ""}`}
            onClick={() => onChangeSteps(64)}
          >64 Steps</button>
        </div>
      </div>
      {/* Header steps avec surbrillance */}
      <div className="grid-container" style={{
        display: "grid",
        gridTemplateColumns: `60px repeat(${steps}, 1fr)`,
        width: "100%",
        position: "relative",
        boxSizing: "border-box"
      }}>
        {/* Cellule vide en haut à gauche */}
        <div style={{ 
          background: "transparent", 
          border: "none",
          gridColumn: "1 / 2",
          gridRow: "1 / 2",
          zIndex: 3,
          position: "sticky",
          top: 0,
          left: 0,
          boxSizing: "border-box"
        }}></div>
        
        {/* En-têtes des colonnes (numéros de pas) */}
        {Array(steps).fill().map((_, i) => (
          <div
            key={`header-${i}`}
            className={`step-header-cell${currentStep === i ? " current-step" : ""}`}
            style={{
              ...(currentStep === i ? {
                background: "#00eaff44",
                color: "#00eaff",
                fontWeight: 700
              } : {}),
              gridColumn: `${i + 2} / ${i + 3}`,
              gridRow: "1 / 2",
              height: "24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: steps > 32 ? "0.65rem" : "0.8rem",
              background: currentStep === i ? "#00eaff44" : "#191c23",
              position: "sticky",
              top: 0,
              zIndex: 2,
              boxSizing: "border-box",
              margin: 0,
              padding: 0
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div
        className="piano-grid"
        style={{
          maxHeight: "70vh", // Augmentation de la hauteur maximale
          overflowY: "auto",
          overflowX: "auto",
          borderRadius: 12, // Bordure plus arrondie
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ajout d'une ombre
          padding: "4px 0", // Ajout de padding vertical
          width: "100%", // Toujours utiliser la largeur maximale disponible
          display: "grid", // Utiliser Grid au lieu de flex
          gridTemplateColumns: `60px repeat(${steps}, 1fr)` // Même structure de grille que l'en-tête
        }}
      >
        {/* Labels des notes (première colonne) */}
        {pianoNotes.map((note, rowIndex) => (
          <div 
            key={`label-${note}`}
            className={`note-label${note.includes("#") ? " black-key" : ""}`}
            style={{ 
              gridColumn: "1 / 2",
              gridRow: `${rowIndex + 2} / ${rowIndex + 3}`,
              fontSize: "0.95rem",
              fontWeight: note.includes("#") ? "normal" : "bold",
              borderRadius: "6px 0 0 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: "10px",
              height: "24px",
              boxShadow: note.includes("#") ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : "inset 0 0 0 1px rgba(255,255,255,0.2)",
              background: note.includes("#") ? "linear-gradient(to right, #1a1c25, #252736)" : "linear-gradient(to right, #252736, #2c2e40)",
              color: note.includes("#") ? "#8af" : "#fff",
              letterSpacing: "0.5px",
              boxSizing: "border-box",
              margin: "1px 0"
            }}
          >
            <span style={{ fontWeight: "bold" }}>{note.replace(/([0-9])/g, '')}</span>
            <span style={{ opacity: 0.7, fontSize: "0.8em", marginLeft: "2px" }}>
              {note.match(/[0-9]/)?.[0]}
            </span>
          </div>
        ))}
        
        {/* Cellules de notes (grille principale) */}
        {pianoNotes.map((note, rowIndex) => {
          return Array(steps).fill().map((_, i) => {
            const cell = pattern[note] && pattern[note][i] !== undefined ? pattern[note][i] : null;
            const vel = cell && cell.on ? (cell.velocity || 100) : null;
            return (
              <div
                key={`cell-${note}-${i}`}
                className={
                  "step-cell" +
                  (cell && cell.on ? " active" : "") +
                  (currentStep === i && cell && cell.on ? " playing" : "") +
                  (currentStep === i ? " current-column" : "") + 
                  ((hoveredCell.note === note && hoveredCell.step === i) ? " hovered" : "")
                }
                style={{
                  ...(cell && cell.on ? {
                    background: `linear-gradient(to top, #00eaff ${(vel/127)*100}%, #252736 ${(vel/127)*100}%)`,
                    boxShadow: "0 0 8px rgba(0, 234, 255, 0.4)",
                  } : {}),
                  position: "relative",
                  gridColumn: `${i + 2} / ${i + 3}`,
                  gridRow: `${rowIndex + 2} / ${rowIndex + 3}`,
                  height: "24px",
                  margin: "1px",
                  boxSizing: "border-box",
                  borderRadius: "2px"
                }}
                title={vel ? `Vélocité: ${vel}${cell?.accent ? " - Accent" : ""}${cell?.slide ? " - Slide" : ""}` : ""}
                onMouseDown={e => handleMouseDown(note, i, e)}
                onMouseEnter={() => {
                  setHoveredCell({ note, step: i });
                }}
                onMouseLeave={() => {
                  if (hoveredCell.note === note && hoveredCell.step === i) {
                    setHoveredCell({ note: null, step: null });
                  }
                }}
              >
                {/* Contrôles pour accent/slide directement sur la cellule si elle est active */}
                {cell && cell.on && (
                  <div className="cell-controls">
                    <div 
                      className={`accent-button ${cell.accent ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => onToggleAccent(note, i), 0);
                      }}
                      title="Accent (A)"
                    >
                      A
                    </div>
                    <div 
                      className={`slide-button ${cell.slide ? 'active' : ''}`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => onToggleSlide(note, i), 0);
                      }}
                      title="Slide (S)"
                    >
                      S
                    </div>
                  </div>
                )}
                {/* Indicateurs visuels d'accent et slide */}
                {cell && cell.on && cell.accent && (
                  <div className="accent-indicator"></div>
                )}
                
                {cell && cell.on && cell.slide && (
                  <div className="slide-indicator"></div>
                )}
                
                {/* Indicateur de sélection */}
                {selectedCell.note === note && selectedCell.step === i && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                      border: "2px solid yellow",
                      boxSizing: "border-box",
                      zIndex: 1,
                      pointerEvents: "none",
                      borderRadius: "3px"
                    }}
                  />
                )}
              </div>
            );
          })
        })}
      </div>
    </div>
  );
}
