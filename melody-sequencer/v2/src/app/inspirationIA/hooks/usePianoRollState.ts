/**
 * Hook pour gérer l'état principal du Piano Roll
 */

'use client';

import { useState } from 'react';
import { NoteEvent, NoteId, SelectionRectangle, ClipboardData } from '../types';
import { DEFAULT_STEPS } from '../utils/constants';

// États de drag pour l'édition de vélocité
interface DragState {
  isDragging: boolean;
  step: number;
  note: string;
  startY: number;
  startVelocity: number;
  currentVelocity: number;
}

// États de redimensionnement pour les notes longues
interface ResizeState {
  isResizing: boolean;
  step: number;
  note: string;
  startX: number;
  startDuration: number;
  currentDuration: number;
}

export function usePianoRollState() {
  // État principal du pattern
  const [pattern, setPattern] = useState<NoteEvent[]>([]);
  
  // États d'interaction
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<NoteId>>(new Set());
  const [selectionRect, setSelectionRect] = useState<SelectionRectangle | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [mousePosition, setMousePosition] = useState<{ step: number; note: string } | null>(null);
  
  // Configuration de la vue
  const [visibleOctaveStart, setVisibleOctaveStart] = useState(2); // Commence à C2
  const [visibleOctaveCount, setVisibleOctaveCount] = useState(3); // Affiche 3 octaves
  const [stepCount, setStepCount] = useState(DEFAULT_STEPS);
  
  // État d'export/import
  const [exportStatus, setExportStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [midiImportStatus, setMidiImportStatus] = useState<string>('');
  
  return {
    // État principal
    pattern,
    setPattern,
    
    // États d'interaction
    dragState,
    setDragState,
    resizeState,
    setResizeState,
    selectedNotes,
    setSelectedNotes,
    selectionRect,
    setSelectionRect,
    clipboard,
    setClipboard,
    mousePosition,
    setMousePosition,
    
    // Configuration de la vue
    visibleOctaveStart,
    setVisibleOctaveStart,
    visibleOctaveCount,
    setVisibleOctaveCount,
    stepCount,
    setStepCount,
    
    // État d'export/import
    exportStatus,
    setExportStatus,
    isDragOver,
    setIsDragOver,
    midiImportStatus,
    setMidiImportStatus
  };
}

// Types exportés pour utilisation externe
export type { DragState, ResizeState };