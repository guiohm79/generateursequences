# CLAUDE_V2.md - Melody Sequencer V2 Documentation

This file provides complete documentation for the **V2 (modern)** version of the Melody Sequencer.

> **Note**: For project overview and V1 information, see `../CLAUDE.md` at project root.

## Project Overview

**Melody Sequencer V2** is a complete rewrite of the browser-based step sequencer, built with modern architecture and professional piano roll interface. This version achieves the architectural stability V1 lacked while delivering a DAW-grade user experience.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Testing
npm test
npm run test:coverage
```

## Tech Stack

### **Core Technologies**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first styling framework
- **Tone.js** - Web Audio API framework for sound synthesis
- **React Hooks** - Modern state management patterns

### **Architecture Principles**
- **Stability First** - No crashes, reliable transport system
- **Professional UX** - DAW-grade piano roll interface
- **Mobile-First** - Touch-optimized responsive design
- **Performance** - Smooth interactions, optimized renders

## Current Status (Session 2025-07-24)

### 🎹 **PIANO ROLL PROFESSIONNEL - COMPLET & FONCTIONNEL**

#### ✅ **Core Features (Production Ready)**
- **Piano Roll DAW-Grade** - Interface professionnelle style studio
- **Audio Polyphonique** - SimpleAudioEngine avec PolySynth + reverb
- **Navigation Octaves** - Scroll molette + boutons, gamme C1-C7 complète
- **Steps Variables** - Support 8/16/32/64 steps avec accents adaptatifs
- **Responsive Design** - Optimisé mobile/tablette/desktop avec touch
- **Architecture Robuste** - Aucun crash, performance optimale

#### ✅ **Advanced Features (Nouvellement Ajoutées)**
- **🎨 Éditeur Vélocité**
  - Couleurs vert (faible) → rouge (forte) en temps réel
  - Drag vertical sur n'importe quelle partie de la note
  - Feedback visuel pendant l'édition (indicateur numérique)
  - Support mobile/tactile avec preventDefault correct

- **📏 Notes Longues**
  - Durée variable de 1 à plusieurs steps
  - Redimensionnement horizontal par drag sur bord droit
  - Rendu visuel avec coins arrondis appropriés
  - Indicateur de durée sur les notes longues

- **🎯 Sélection Multiple**
  - Rectangle de sélection (drag dans zone vide)
  - Ctrl+clic pour ajouter/retirer des notes individuelles
  - Contour jaune pour les notes sélectionnées
  - Compteur de sélection dans les stats

- **⌨️ Raccourcis Clavier**
  - **Ctrl+A** - Sélectionner toutes les notes
  - **Ctrl+C/V** - Copier/coller à la position du curseur
  - **Delete/Backspace** - Supprimer les notes sélectionnées
  - **Flèches** - Déplacer sélection (←→ steps, ↑↓ notes)
  - **Escape** - Désélectionner tout

#### 🔍 **Détails Techniques Avancés**
- **Collage intelligent** - Position curseur souris avec fallback centre
- **Déplacement précis** - Validation limites + détection collisions
- **Gestion vélocité** - Affichage uniforme sur toute longueur note
- **Interactions optimisées** - Pas de sélection auto des nouvelles notes
- **Performance** - Wheel events avec passive:false, scroll fluide

### 🎯 **PROCHAINES PRIORITÉS**
1. **Export MIDI** - Exportation patterns en fichiers .mid
2. **Presets System** - Sauvegarde/chargement patterns
3. **Undo/Redo** - Historique des actions
4. **Quantization** - Alignement automatique
5. **Scale Helper** - Assistant gammes et accords
6. **Multi-patterns** - Gestion plusieurs patterns
7. **AI Generation** - Intégration Magenta.js

### 📊 **Architecture Finale V2 - Production**
```
V2 Piano Roll Professionnel (COMPLET):
├── 🎹 Piano Roll Interface/
│   ├── page.tsx (1000+ lignes optimisées)
│   ├── Navigation octaves (C1-C7, scroll+boutons)
│   ├── Steps adaptatifs (8/16/32/64 + accents)
│   ├── Vélocité couleurs (vert→rouge + drag)
│   ├── Notes longues (durée + redimensionnement)
│   ├── Sélection multiple (rectangle + Ctrl+clic)
│   ├── Copier/coller (position curseur intelligent)
│   ├── Déplacement flèches (précision pixel)
│   └── Mobile/tactile (preventDefault optimisé)
├── 🔊 Audio Engine/
│   ├── SimpleAudioEngine.ts (PolySynth stable)
│   ├── useSimpleAudio.ts (hook états)
│   ├── Pattern conversion (notes longues support)
│   ├── Vélocité normalization (0-127 → 0-1)
│   └── Transport temps réel (aucun lag)
├── 🎯 Interactions/
│   ├── États sélection (Set<NoteId> optimisé)
│   ├── Drag states (vélocité + resize + selection)
│   ├── Clipboard (positions relatives)
│   ├── Validation collisions (déplacement)
│   └── Raccourcis clavier (workflow professionnel)
└── 🎨 UI/UX/
    ├── Design moderne (glassmorphism)
    ├── Responsive parfait (mobile/desktop)
    ├── Animations fluides (transitions CSS)
    ├── Feedback visuel (hover/drag/selection)
    └── Accessibilité (ARIA labels, keyboard nav)
```

## Core Architecture

### **SimpleAudioEngine (src/lib/SimpleAudioEngine.ts)**
```typescript
export class SimpleAudioEngine {
  private Tone: any = null;
  private synth: any = null;
  private isInitialized = false;
  private isPlaying = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentStep = 0;
  private pattern: SimplePattern = {};
  private tempo = 120;
  
  // Stable transport without React re-renders
  async initialize(): Promise<boolean>
  start(): void
  stop(): void
  setPattern(pattern: SimplePattern): void
  setTempo(newTempo: number): void
}
```

### **Type Definitions**
```typescript
// Pattern data structure avec support des notes longues
interface NoteEvent {
  step: number;
  note: string;
  velocity: number;
  isActive: boolean;
  duration: number; // Longueur en steps
}

// Type pour identifier une note de manière unique
type NoteId = string; // Format: "step-note" (ex: "5-C4")

// État de sélection par rectangle
interface SelectionRectangle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSelecting: boolean;
}

// Type pour le clipboard
interface ClipboardData {
  notes: NoteEvent[];
  relativePositions: { stepOffset: number; noteOffset: number }[];
}
```

### **Key Features Implementation**

#### **Vélocité par Couleurs**
```typescript
const getVelocityColorClass = (velocity: number): string => {
  const normalized = Math.max(0, Math.min(127, velocity)) / 127;
  
  if (normalized < 0.25) {
    return 'bg-gradient-to-br from-green-400 to-green-500 shadow-green-400/50';
  } else if (normalized < 0.5) {
    return 'bg-gradient-to-br from-green-500 to-yellow-400 shadow-green-500/50';
  } else if (normalized < 0.75) {
    return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-400/50';
  } else {
    return 'bg-gradient-to-br from-orange-500 to-red-500 shadow-red-500/50';
  }
};
```

#### **Sélection Multiple**
```typescript
// Gestion des raccourcis clavier
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'a': selectAllNotes(); break;
      case 'c': copySelectedNotes(); break;
      case 'v': pasteNotes(mousePosition.step, mousePosition.note); break;
    }
  } else {
    switch (e.key) {
      case 'Delete': deleteSelectedNotes(); break;
      case 'ArrowLeft': moveSelectedNotes(-1, 0); break;
      case 'ArrowRight': moveSelectedNotes(1, 0); break;
      case 'ArrowUp': moveSelectedNotes(0, -1); break;
      case 'ArrowDown': moveSelectedNotes(0, 1); break;
    }
  }
};
```

## Migration from V1 - COMPLETED

### **✅ V1 Issues Resolved**
- **Transport Stability** - SimpleAudioEngine outside React lifecycle
- **Speed Change Reliability** - Precise tempo calculations
- **Type Safety** - Full TypeScript coverage
- **Architecture Complexity** - Clean, simple patterns
- **User Experience** - Professional DAW-grade interface

### **✅ Feature Parity + Advanced Features**
- **Basic Piano Roll** ✅ - Professional interface
- **Audio Playback** ✅ - Polyphonic synthesis
- **Pattern Creation** ✅ - Visual editor with velocity
- **Note Length Support** ✅ - Long notes with resize
- **Multi-Selection** ✅ - Professional editing tools
- **Keyboard Shortcuts** ✅ - Workflow optimization
- **Mobile Support** ✅ - Touch-optimized

## Development Workflow

### **Code Quality Standards**
- **TypeScript Strict** - Full type coverage
- **Performance First** - No re-render loops
- **Mobile-First** - Touch interactions priority
- **Accessibility** - ARIA labels, keyboard navigation

### **Testing Strategy**
- **Manual Testing** - Real-world usage scenarios
- **Cross-Platform** - Desktop, tablet, mobile validation
- **Performance Testing** - Smooth interactions verification

---

## 📖 Navigation Documentation

- **🏠 Project Root**: `../CLAUDE.md` - Project overview and version guidance
- **📚 V1 Docs**: `../v1/CLAUDE_V1.md` - Legacy codebase and lessons learned
- **🚀 V2 Docs**: This file - Modern architecture and development guide
- **📋 Quick Start**: `../README.md` - Development commands and comparison

**V2 is now PRODUCTION READY with professional piano roll interface complete.**