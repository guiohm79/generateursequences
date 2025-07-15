"use client";
import React, { useState, useEffect, useRef } from "react";

// Helper functions
function getAllNotes(minOct, maxOct) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const all = [];
  
  // On génère de l'octave la plus haute vers la plus basse
  for (let octave = maxOct; octave >= minOct; octave--) {
    // Et dans chaque octave, on va de B vers C (ordre inverse)
    for (let i = notes.length - 1; i >= 0; i--) {
      all.push(notes[i] + octave);
    }
  }
  return all;
}

function isBlackKey(noteName) {
  return noteName.includes('#');
}

export default function PianoRoll({ 
  pattern, 
  onToggleStep, 
  onToggleAccent, // Renommé pour correspondre au nom dans MelodySequencer
  onToggleSlide, // Renommé pour correspondre au nom dans MelodySequencer
  onChangeVelocity,
  currentStep,
  showVelocity = true,
  onChangeSteps,
  steps = 16 
}) {
  const [hoveredCell, setHoveredCell] = useState({ note: null, step: null });
  const dragRef = useRef({ note: null, step: null, startY: 0, startVelocity: 0 });
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Constants pour la tessiture des notes
  const minOctave = 2;
  const maxOctave = 5;
  
  // Définir une valeur par défaut pour cellWidth en fonction du nombre de steps
  const defaultCellWidth = steps === 16 ? 36 : steps === 32 ? 24 : 18;
  
  // Calculer dynamiquement la largeur des cellules en fonction de l'espace disponible
  // et du nombre de steps, tout en respectant une taille minimum pour l'utilisabilité
  const minCellWidth = steps === 16 ? 24 : steps === 32 ? 18 : 14;
  const keyboardWidth = 60; // Largeur de la colonne des touches de piano
  const availableWidth = containerWidth - keyboardWidth - 5; // 5px de marge
  const calculatedWidth = Math.max(minCellWidth, availableWidth / steps);
  const cellWidth = containerWidth > 0 ? calculatedWidth : defaultCellWidth;
  
  // Générer les notes pour le piano roll
  const pianoNotes = getAllNotes(minOctave, maxOctave);
  
  // Fonctions utilitaires pour accéder aux données du pattern
  function getNoteActive(note, step) {
    return pattern[note] && pattern[note][step] && pattern[note][step].on;
  }
  
  function getNoteVelocity(note, step) {
    return pattern[note] && pattern[note][step] && pattern[note][step].velocity || 100;
  }
  
  function getNoteAccent(note, step) {
    return pattern[note] && pattern[note][step] && pattern[note][step].accent;
  }
  
  function getNoteSlide(note, step) {
    return pattern[note] && pattern[note][step] && pattern[note][step].slide;
  }
  
  function getCellData(note, step) {
    return pattern[note] && pattern[note][step] || null;
  }
  
  // Handlers pour les raccourcis clavier
  function handleAccentKeyForCurrentCell() {
    const { note, step } = hoveredCell;
    if (note === null || step === null) return;
    const isActive = getNoteActive(note, step);
    if (isActive) {
      onToggleAccent(note, step, !getNoteAccent(note, step));
    }
  }
  
  function handleSlideKeyForCurrentCell() {
    const { note, step } = hoveredCell;
    if (note === null || step === null) return;
    const isActive = getNoteActive(note, step);
    if (isActive) {
      onToggleSlide(note, step, !getNoteSlide(note, step));
    }
  }
  
  // Listener global pour les raccourcis clavier
  useEffect(() => {
    function handleKeyDown(e) {
      // Si une note est survolée et la touche A est pressée
      if (e.key === 'a' || e.key === 'A') {
        handleAccentKeyForCurrentCell();
      }
      
      // Si une note est survolée et la touche S est pressée
      if (e.key === 's' || e.key === 'S') {
        handleSlideKeyForCurrentCell();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hoveredCell]);
  
  // Fonction pour gérer le drag & drop pour la vélocité
  function handleMouseDown(note, idx, e) {
    const cell = getCellData(note, idx);
    
    // On utilise un timer pour distinguer clic et début de drag
    const mouseDownTime = Date.now();
    
    // Si la note est active, on prépare pour un potentiel drag de vélocité
    if (cell && cell.on) {
      // Stocker la position initiale et la vélocité actuelle
      // mais ne pas encore activer le drag (attendre le premier mouvement)
      dragRef.current = { 
        note, 
        step: idx, 
        startY: e.clientY, 
        startVelocity: cell.velocity || 100,
        isDragging: false, // Le flag sera activé seulement dans handleMouseMove
        mouseDownTime: mouseDownTime
      };
      
      // Ajouter les listeners pour le mouvement et le relâchement
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    // Le clic pour activer/désactiver la note est géré par onClick
  }
  
  function handleMouseMove(e) {
    const { note, step, startY, startVelocity, isDragging, mouseDownTime } = dragRef.current;
    if (note === null || step === null) return;
    
    // Au premier mouvement, activer le mode dragging si on est sur une note active
    if (!isDragging) {
      // Vérifions qu'on a dépassé un seuil minimal de mouvement (3 pixels)
      const moveDistance = Math.abs(e.clientY - startY);
      if (moveDistance > 3) {
        // Activer le mode dragging
        dragRef.current.isDragging = true;
        
        // Empêcher l'activation/désactivation de la note (onClick)
        e.preventDefault();
        e.stopPropagation();
      } else {
        // Mouvement trop faible, on continue d'attendre
        return;
      }
    }
    
    // Empêcher les événements par défaut et la propagation pour éviter la sélection de notes
    e.preventDefault();
    e.stopPropagation();
    
    // Amélioration de la sensibilité et fluidité du contrôle de vélocité
    // Diminution du facteur de multiplication pour rendre le changement plus progressif
    let delta = startY - e.clientY;
    
    // Facteur de sensibilité réduit pour plus de précision
    const sensitivityFactor = 0.5;
    
    // Utilisation de Math.floor pour stabiliser les petits changements
    let newVel = Math.min(127, Math.max(20, startVelocity + Math.floor(delta * sensitivityFactor)));
    
    // Ne mettre à jour que si la valeur a réellement changé
    if (newVel !== getNoteVelocity(note, step)) {
      onChangeVelocity(note, step, newVel);
    }
  }
  
  function handleMouseUp() {
    dragRef.current = { note: null, step: null, startY: null, startVelocity: null, isDragging: false };
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }
  
  // Fonction pour générer des couleurs de note basées sur l'octave
  const getNoteColor = (note, active, isCurrentStep) => {
    if (!active) return 'transparent';

    const octave = parseInt(note.match(/\d/)[0], 10);
    
    // Couleurs basées uniquement sur l'octave et la lecture
    if (isCurrentStep) {
      // Notes en cours de lecture (jaune brillant)
      return '#ffcc00';
    } else {
      // Notes actives toujours en vert quelle que soit la position du curseur
      const baseColor = [150, 210, 140]; // Vert
      const intensity = 0.7 + (octave - minOctave) * 0.1;
      return `rgba(${baseColor[0] * intensity}, ${baseColor[1] * intensity}, ${baseColor[2] * intensity}, 0.95)`;
    }
  };
  
  // Effet pour détecter la largeur du conteneur et l'ajuster en cas de redimensionnement
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Fonction pour mesurer la largeur actuelle du conteneur
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    // Mesurer la largeur initiale
    updateWidth();
    
    // Mettre en place un observateur de redimensionnement
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    // Nettoyer l'observateur lors du démontage du composant
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [containerRef]);
  
  return (
    <div className="piano-roll" ref={containerRef}>
      {/* Instructions et contrôles */}
      <div style={{ 
        marginBottom: "10px", 
        padding: "8px 12px", 
        background: "#23252d", 
        borderRadius: "4px", 
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)" 
      }}>
        <strong>Instructions:</strong> Survolez ou sélectionnez une note puis utilisez:
        <ul style={{ margin: "5px 0 0 0", padding: "0 0 0 20px" }}>
          <li>Touche <kbd style={{ background: "#333", padding: "2px 6px", borderRadius: "3px", fontWeight: "bold" }}>A</kbd> pour activer/désactiver l'accent sur la note survolée</li>
          <li>Touche <kbd style={{ background: "#333", padding: "2px 6px", borderRadius: "3px", fontWeight: "bold" }}>S</kbd> pour activer/désactiver le slide sur la note survolée</li>
        </ul>
      </div>

      {/* Contrôle du nombre de pas */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button
          className={`btn${steps === 16 ? " active" : ""}`}
          style={{
            padding: "6px 12px",
            background: steps === 16 ? "#4a6cd3" : "#2a2e3a",
            border: "none",
            borderRadius: "4px",
            color: "white",
            fontWeight: steps === 16 ? "bold" : "normal",
            cursor: "pointer"
          }}
          onClick={() => onChangeSteps(16)}
        >
          16 Steps
        </button>
        <button
          className={`btn${steps === 32 ? " active" : ""}`}
          style={{
            padding: "6px 12px",
            background: steps === 32 ? "#4a6cd3" : "#2a2e3a",
            border: "none",
            borderRadius: "4px", 
            color: "white",
            fontWeight: steps === 32 ? "bold" : "normal",
            cursor: "pointer"
          }}
          onClick={() => onChangeSteps(32)}
        >
          32 Steps
        </button>
        <button
          className={`btn${steps === 64 ? " active" : ""}`}
          style={{
            padding: "6px 12px",
            background: steps === 64 ? "#4a6cd3" : "#2a2e3a",
            border: "none",
            borderRadius: "4px",
            color: "white",
            fontWeight: steps === 64 ? "bold" : "normal",
            cursor: "pointer"
          }}
          onClick={() => onChangeSteps(64)}
        >
          64 Steps
        </button>
      </div>

      {/* Conteneur principal avec style DAW */}
      <div style={{ 
        display: "flex", 
        width: "100%",
        height: "70vh",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        borderRadius: "5px",
        overflow: "hidden"
      }}>
        {/* Colonne de gauche avec le clavier piano */}
        <div style={{ 
          width: "60px", 
          flexShrink: 0,
          background: "#1a1c23",
          overflowY: "hidden",
          position: "relative",
          zIndex: 2,
          boxShadow: "2px 0 5px rgba(0,0,0,0.2)"
        }}>
          {/* Espace pour aligner avec les en-têtes */}
          <div style={{ 
            height: "30px", 
            borderBottom: "1px solid #333", 
            background: "#1a1c23" 
          }}></div>
          
          {/* Notes du piano */}
          {pianoNotes.map((note) => {
            const isBlack = isBlackKey(note);
            return (
              <div 
                key={`piano-key-${note}`} 
                style={{
                  height: "30px",
                  background: isBlack ? "#333" : "#eee", 
                  color: isBlack ? "#ddd" : "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: "1px solid #444",
                  position: "relative",
                  fontWeight: "bold",
                  fontSize: "12px"
                }}
              >
                <span style={{ 
                  position: "absolute",
                  right: "10px"
                }}>
                  {note}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Zone de la grille du séquenceur */}
        <div style={{ 
          flexGrow: 1,
          overflowX: "auto",
          overflowY: "auto",
          background: "#1a1c23"
        }}>
          {/* En-têtes fixes pour les numéros de steps */}
          <div style={{ 
            display: "flex", 
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#1a1c23",
            borderBottom: "2px solid #333",
            height: "30px"
          }}>
            {Array.from({ length: steps }).map((_, i) => {
              // Alternance de couleurs tous les 4 temps pour le regroupement visuel
              const isBeat = (i % 4) === 0;
              const isMeasure = (i % 16) === 0;
              const backgroundColor = isMeasure ? "#2c3142" : (isBeat ? "#242836" : "#1e222a");
              const isCurrentStepHeader = currentStep === i;
              
              // Maintenant que l'espace est optimisé, on peut afficher tous les numéros
              const shouldShowNumber = true;
              
              return (
                <div 
                  key={`header-${i}`}
                  style={{
                    width: `${cellWidth}px`,
                    height: "30px",
                    background: isCurrentStepHeader ? "#404c6e" : backgroundColor,
                    color: isCurrentStepHeader ? "#fff" : "#aaa",
                    borderRight: isBeat ? "1px solid #444" : "1px solid #333",
                    // Taille de police adaptée au nombre de steps et à l'espace disponible
                    fontSize: steps <= 16 ? "12px" : steps <= 32 ? "10px" : "8px",
                    fontWeight: isBeat || isCurrentStepHeader ? "bold" : "normal",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    userSelect: "none",
                    boxSizing: "border-box"
                  }}
                >
                  {shouldShowNumber ? (i + 1) : ""}
                </div>
              );
            })}
          </div>
          
          {/* Grille de cellules pour les notes */}
          <div>
            {pianoNotes.map((note) => {
              const isBlack = isBlackKey(note);
              return (
                <div 
                  key={`row-${note}`}
                  style={{ 
                    display: "flex", 
                    height: "30px",
                    background: isBlack ? "#252831" : "#2a2e38", 
                    borderBottom: "1px solid #393e4a"
                  }}
                >
                  {Array.from({ length: steps }).map((_, i) => {
                    // Regroupement visuel par 4 temps
                    const isBeat = (i % 4) === 0;
                    const isMeasure = (i % 16) === 0;
                    const cellBorderRight = isBeat ? "1px solid #444" : "1px solid #333";
                    
                    const cell = pattern[note] && pattern[note][i] !== undefined ? pattern[note][i] : null;
                    const isNoteActive = cell && cell.on;
                    const isCurrentCol = currentStep === i;
                    // Vitesse seulement pour les notes actives, ne pas définir pour les inactives
                    const vel = isNoteActive ? (cell.velocity || 100) : null;
                    const hasAccent = isNoteActive && cell.accent;
                    const hasSlide = isNoteActive && cell.slide;
                    
                    return (
                      <div 
                        key={`cell-${note}-${i}`}
                        style={{
                          width: `${cellWidth}px`,
                          height: "30px",
                          background: isNoteActive 
                            ? getNoteColor(note, true, isCurrentCol) 
                            : (isBlack ? "#252831" : "#2a2e38"),
                          borderRight: cellBorderRight,
                          boxSizing: "border-box",
                          position: "relative",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          boxShadow: isCurrentCol ? "inset 0 0 5px rgba(255,204,0,0.7)" : "none"
                        }}
                        onClick={() => onToggleStep(note, i)}
                        onMouseDown={e => handleMouseDown(note, i, e)}
                        onMouseEnter={() => setHoveredCell({ note, step: i })}
                        onMouseLeave={() => {
                          if (hoveredCell.note === note && hoveredCell.step === i) {
                            setHoveredCell({ note: null, step: null });
                          }
                        }}
                      >
                        {/* Indicateur de vélocité pour notes actives uniquement */}
                        {isNoteActive && (
                          <>
                            {/* Barre de vélocité visuelle - toujours affichée pour les notes actives */}
                            <div style={{
                              position: "absolute",
                              bottom: "3px",
                              left: "3px",
                              right: "3px",
                              height: "4px",
                              background: `linear-gradient(90deg, 
                                rgba(255,255,255,0.3) ${vel}%, 
                                rgba(255,255,255,0.05) ${vel}%)`,
                              borderRadius: "2px",
                              zIndex: 1
                            }}></div>
                            
                            {/* Valeur numérique de vélocité - affichée uniquement pour les notes actives 
                                et si l'option showVelocity est activée */}
                            {showVelocity && (steps <= 32 || hoveredCell.note === note && hoveredCell.step === i) && (
                              <div style={{
                                position: "absolute",
                                fontSize: steps <= 16 ? "10px" : "9px",
                                fontWeight: "bold",
                                color: "rgba(255,255,255,0.8)",
                                zIndex: 2
                              }}>
                                {vel}
                              </div>
                            )}
                          </>
                        )}
                        {/* Arrière-plan opaque pour les cellules inactives pour masquer les "000" */}
                        {!isNoteActive && (
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: isBlack ? "#252831" : "#2a2e38", /* Couleur de fond identique au fond de la cellule */
                            zIndex: 5, /* Z-index plus élevé pour être au-dessus du texte */
                            display: "flex", 
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: "2px"
                          }}>
                            {/* Pattern texturé léger pour les cellules inactives */}
                            <div style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)",
                              zIndex: 6
                            }}></div>
                          </div>
                        )}
                        
                        {/* Indicateurs pour accent et slide */}
                        <div style={{ position: "absolute", top: "2px", right: "4px", display: "flex" }}>
                          {hasAccent && (
                            <span style={{ 
                              fontSize: "11px", 
                              fontWeight: "bold",
                              color: "#FFCC00", /* Jaune vif pour plus de contraste */
                              marginRight: "3px",
                              padding: "0px 2px",
                              background: "rgba(0,0,0,0.4)", /* Fond semi-transparent */
                              borderRadius: "3px"
                            }}>A</span>
                          )}
                          {hasSlide && (
                            <span style={{ 
                              fontSize: "11px", 
                              fontWeight: "bold",
                              color: "#00FFCC", /* Cyan pour contraster avec l'accent */
                              padding: "0px 2px",
                              background: "rgba(0,0,0,0.4)", /* Fond semi-transparent */
                              borderRadius: "3px"
                            }}>S</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
