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
        </div>
      </div>
      {/* Header steps avec surbrillance */}
      <div className="note-row step-header-row" style={{ userSelect: "none", position: "sticky", top: 0, zIndex: 2, background: "#191c23" }}>
        <div 
          className="note-label" 
          style={{ 
            background: "transparent", 
            border: "none",
            width: "60px" // Même largeur que les labels de notes (60px)
          }}
        ></div>
        {Array(steps).fill().map((_, i) => (
          <div
            key={i}
            className={`step-header-cell${currentStep === i ? " current-step" : ""}`}
            style={{
              ...(currentStep === i ? {
                background: "#00eaff44",
                color: "#00eaff",
                fontWeight: 700
              } : {}),
              width: "28px", // Même largeur que les cellules
              height: "24px",
              margin: "1px", // Même marge que les cellules
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div
        className="piano-grid"
        style={{
          maxHeight: "65vh", // Augmentation de la hauteur maximale
          overflowY: "auto",
          overflowX: "auto",
          borderRadius: 12, // Bordure plus arrondie
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ajout d'une ombre
          padding: "4px 0", // Ajout de padding vertical
        }}
      >
{pianoNotes.map(note => (
  <div className="note-row" key={note} style={{ marginBottom: "2px" }}> {/* Espacement entre les rangées */}
    <div 
      className={`note-label${note.includes("#") ? " black-key" : ""}`}
      style={{ 
        width: "60px", // Encore plus large pour les labels de notes
        fontSize: "0.95rem", // Texte légèrement plus grand
        fontWeight: note.includes("#") ? "normal" : "bold", // Notes naturelles en gras
        borderRadius: "6px 0 0 6px", // Coins plus arrondis côté gauche
        display: "flex",
        alignItems: "center", // Centrer verticalement
        justifyContent: "flex-end", // Aligner à droite
        paddingRight: "10px", // Espace à droite
        boxShadow: note.includes("#") ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : "inset 0 0 0 1px rgba(255,255,255,0.2)", // Bordure subtile
        background: note.includes("#") ? "linear-gradient(to right, #1a1c25, #252736)" : "linear-gradient(to right, #252736, #2c2e40)", // Dégradé subtil
        color: note.includes("#") ? "#8af" : "#fff", // Couleur différente pour les dièses
        letterSpacing: "0.5px", // Espacement des lettres
      }}
    >
      {/* Afficher la note de manière plus lisible */}
      <span style={{ fontWeight: "bold" }}>{note.replace(/([0-9])/g, '')}</span>
      <span style={{ opacity: 0.7, fontSize: "0.8em", marginLeft: "2px" }}>
        {note.match(/[0-9]/)?.[0]}
      </span>
    </div>
    {Array(steps).fill().map((_, i) => {
      const cell = pattern[note] && pattern[note][i] !== undefined ? pattern[note][i] : null;
      const vel = cell && cell.on ? (cell.velocity || 100) : null;
      return (
        <div
          key={i}
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
              boxShadow: "0 0 8px rgba(0, 234, 255, 0.4)", // Lueur pour les notes actives
            } : {}),
            position: "relative",
          }}
          title={vel ? `Vélocité: ${vel}${cell?.accent ? " - Accent" : ""}${cell?.slide ? " - Slide" : ""}` : ""}
          onMouseDown={e => handleMouseDown(note, i, e)}
          onMouseEnter={() => {
            // Mettre à jour la cellule survolée pour TOUTES les cellules (pas seulement actives)
            setHoveredCell({ note, step: i });
          }}
          onMouseLeave={() => {
            // Réinitialiser lorsqu'on quitte la cellule
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
                  e.stopPropagation(); // Empêcher le déclenchement du handleMouseDown
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Utiliser setTimeout pour s'assurer que l'événement ne se propage pas
                  setTimeout(() => onToggleAccent(note, i), 0);
                }}
                title="Accent (A)"
              >
                A
              </div>
              <div 
                className={`slide-button ${cell.slide ? 'active' : ''}`}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Empêcher le déclenchement du handleMouseDown
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Utiliser setTimeout pour s'assurer que l'événement ne se propage pas
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
    })}
  </div>
))}
      </div>
    </div>
  );
}
