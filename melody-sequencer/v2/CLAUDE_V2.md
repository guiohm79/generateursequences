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

## Current Status (Session 2025-07-25 - Copier/Coller Modulaire)

### 🎹 **SÉQUENCEUR PROFESSIONNEL COMPLET - TOUTES FONCTIONNALITÉS CORE TERMINÉES**

#### ✅ **Core Features (Production Ready)**
- **Piano Roll DAW-Grade** - Interface professionnelle style studio
- **Audio Polyphonique** - SimpleAudioEngine avec PolySynth + reverb
- **Navigation Octaves** - Scroll molette + boutons, gamme C1-C7 complète
- **Steps Variables** - Support 8/16/32/64 steps avec accents adaptatifs
- **Responsive Design** - Optimisé mobile/tablette/desktop avec touch
- **Architecture Robuste** - Aucun crash, performance optimale

#### ✅ **Advanced Features (Complètement Implémentées)**
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

- **⌨️ Raccourcis Clavier Globaux Professionnels (20+ raccourcis)**
  - **Espace** - Play/Stop global (le plus important!)
  - **Ctrl+A/C/V** - Sélectionner tout/Copier/Coller intelligent
  - **Ctrl+D/S/O/E** - Dupliquer/Sauver preset/Ouvrir/Export MIDI
  - **Ctrl+Z/Y** - Undo/Redo professionnel (historique 50 actions)
  - **Delete/Backspace** - Supprimer notes sélectionnées
  - **Flèches** - Déplacer sélection (Shift = rapide/octave)
  - **Home/End/PgUp/PgDn** - Navigation avancée
  - **1/2/3/4** - Vitesses lecture + **C** Clear + **M** Mute
  - **Escape** - Désélectionner + fermer dialogs

- **🎼 Export MIDI Professionnel**
  - Module MidiEngine réutilisable et modulaire
  - Export parfait vers fichiers .mid avec timing précis
  - Support complet des notes longues et vélocité
  - Construction MIDI manuelle basée sur l'approche V1 qui fonctionnait
  - Page dédiée `/midi` pour tests et documentation
  - Intégration transparente dans le piano roll

- **🎵 Vitesses de Lecture**
  - Support 1/8 (lent), 1/16 (normal), 1/32 (rapide)
  - Interface avec boutons de sélection intuitifs
  - **CRITIQUE** : Affecte SEULEMENT l'audio de lecture
  - **Export MIDI toujours cohérent** (évite les problèmes V1)
  - Architecture séparée pour éviter les bugs de timing

- **🎼 Import MIDI Complet**
  - Parser MIDI professionnel avec support format standard
  - **Drag & Drop** - Interface visuelle avec overlay
  - **Sélecteur classique** - Bouton d'import traditionnel
  - **Limitation intelligente** - Max 64 steps avec notification utilisateur
  - **Conversion optimale** - Notes longues + vélocité + timing précis
  - **Validation complète** - Fichiers, formats, tailles
  - **Gestion d'erreurs** - Feedback détaillé avec warnings

- **💾 Système Presets Professionnel**
  - **localStorage** - Sauvegarde automatique (max 50 presets)
  - **Export/Import JSON** - Partage et sauvegarde externe
  - **Interface intégrée** - Dialogs dans le piano roll
  - **Validation formats** - Import sécurisé avec détection erreurs
  - **Métadonnées complètes** - BPM, description, auteur, timestamp
  - **Gestion intelligente** - Évite les doublons, limite mémoire

- **↶↷ Undo/Redo Professionnel**
  - **Historique 50 actions** - Mémoire optimisée avec compression
  - **UndoRedoManager** - Classe dédiée, pas de crashes
  - **Actions trackées** - Add/delete notes, vélocité, copier/coller, etc.
  - **Interface complète** - Boutons + tooltips + indicateur position
  - **États profonds** - Copie complète patterns + métadonnées
  - **Protection** - Pas de sauvegarde pendant opérations undo/redo
  - **Feedback visuel** - Messages avec nom de l'action annulée/refaite

#### 🔍 **Détails Techniques Avancés**
- **Collage intelligent** - Position curseur souris avec fallback centre
- **Déplacement précis** - Validation limites + détection collisions
- **Gestion vélocité** - Affichage uniforme sur toute longueur note
- **Interactions optimisées** - Pas de sélection auto des nouvelles notes
- **Performance** - Wheel events avec passive:false, scroll fluide
- **MIDI Engine** - Construction manuelle avec delta times, validation complète
- **Vitesses sécurisées** - Séparation audio/MIDI pour éviter les problèmes V1

#### 🏗️ **Architecture Modulaire Complète - Phase 3.3 TERMINÉE + Copier/Coller**
- **8 Hooks Spécialisés** - État, édition, presets, undo/redo, MIDI, raccourcis, etc.
- **4 Modules Utilitaires** - Constants, noteHelpers, patternHelpers, selectionHelpers
- **5 Composants UI Modulaires** - TransportControls (52 props), OctaveNavigation, StepHeader, PianoKeys, PianoGridComplete
- **Architecture Multi-modes** - Base extensible pour modes futurs (Inspiration, Arrangement, Gammes)
- **2 Pages Test Complètes** - `/test-complete` + `/pianorollBase/test-navigation` avec toutes fonctionnalités
- **Copier/Coller Modulaire** - Système intelligent avec positions relatives dans pages test
- **100% Fonctionnel** - Aucune régression, toutes interactions préservées, TypeScript correct
- **Maintenabilité** - Code distribué, responsabilités séparées, tests facilités

### 🎯 **PROCHAINES PRIORITÉS (Features Avancées)**
1. ✅ ~~**Presets System**~~ - **TERMINÉ** - localStorage + export/import JSON
2. ✅ ~~**MIDI Import**~~ - **TERMINÉ** - Drag & drop + limitation 64 steps  
3. ✅ ~~**Undo/Redo**~~ - **TERMINÉ** - Historique 50 actions complet
4. ✅ ~~**Raccourcis Clavier Globaux**~~ - **TERMINÉ** - 20+ shortcuts professionnels
5. ✅ ~~**Modularisation Complète - Phase 3.3**~~ - **TERMINÉ** - 5 composants UI modulaires + page test fonctionnelle
6. ✅ ~~**Copier/Coller Modulaire**~~ - **TERMINÉ** - Système intelligent dans pages test avec positions relatives + TypeScript
7. **Quantization** - Alignement automatique des notes sur la grille
8. **Scale Helper** - Assistant gammes et accords musicaux
9. **Multi-patterns** - Gestion de plusieurs patterns/séquences
10. **AI Generation** - Intégration Magenta.js pour création assistée

### 📊 **Architecture Finale V2 - Production**
```
V2 Piano Roll Professionnel + MIDI (COMPLET):
├── 🎹 Piano Roll Interface/
│   ├── page.tsx (1000+ lignes optimisées)
│   ├── Navigation octaves (C1-C7, scroll+boutons)
│   ├── Steps adaptatifs (8/16/32/64 + accents)
│   ├── Vélocité couleurs (vert→rouge + drag)
│   ├── Notes longues (durée + redimensionnement)
│   ├── Sélection multiple (rectangle + Ctrl+clic)
│   ├── Copier/coller (position curseur intelligent)
│   ├── Déplacement flèches (précision pixel)
│   ├── Export MIDI intégré (bouton + feedback)
│   ├── Vitesses lecture (1/8, 1/16, 1/32)
│   └── Mobile/tactile (preventDefault optimisé)
├── 🔊 Audio Engine/
│   ├── SimpleAudioEngine.ts (PolySynth + vitesses)
│   ├── useSimpleAudio.ts (hook états + vitesses)
│   ├── Pattern conversion (notes longues support)
│   ├── Vélocité normalization (0-127 → 0-1)
│   ├── Vitesses sécurisées (séparation audio/MIDI)
│   └── Transport temps réel (aucun lag)
├── 🎼 MIDI Engine/
│   ├── MidiEngine.ts (module réutilisable)
│   ├── Construction manuelle (delta times V1)
│   ├── Export .mid (timing parfait)
│   ├── Validation complète (notes + vélocité)
│   ├── Page dédiée /midi (tests + doc)
│   └── Architecture modulaire (usage multiple)
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
    ├── Contrôles vitesse (boutons intuitifs)
    └── Accessibilité (ARIA labels, keyboard nav)
```

## Modularisation Phase 3.3 - Composants UI

### **Architecture Modulaire Finale**

```
src/app/pianorollBase/components/
├── TransportControls.tsx        (399 lignes, 48 props)
│   ├── Play/Stop + tempo + vitesses lecture
│   ├── Pattern info (steps, notes, sélection)  
│   ├── Presets (save/load/export/import)
│   ├── Undo/Redo + historique visuel
│   └── Export/Import MIDI avec feedback
├── OctaveNavigation.tsx         (89 lignes)
│   ├── Boutons navigation octaves
│   ├── Scroll wheel support
│   └── Responsive mobile/desktop
├── StepHeader.tsx               (43 lignes)
│   ├── Numérotation steps 1-64
│   ├── Accents adaptatifs (4/8/16 beats)
│   └── Current step highlighting
├── PianoKeys.tsx                (67 lignes)
│   ├── Affichage touches piano
│   ├── Distinction blanches/noires
│   └── Layout responsive optimisé
└── PianoGridComplete.tsx        (244 lignes)
    ├── Toutes interactions Piano Roll:
    ├── • Velocity drag vertical + feedback
    ├── • Note resizing horizontal (notes longues)
    ├── • Multi-selection (rectangle + Ctrl+click)
    ├── • Visual feedback (couleurs, animations)
    └── • Touch support mobile complet
```

### **Page Test Modulaire**
- **Route**: `/test-complete` (accessible via menu Debug)
- **Intégration**: Tous composants + 100% fonctionnalités
- **Validation**: 0 régression, audio fonctionnel, import MIDI réel

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

**V2 est maintenant PRODUCTION READY avec toutes les fonctionnalités core d'un séquenceur professionnel !**

## 🎉 **RÉSUMÉ : SÉQUENCEUR PROFESSIONNEL COMPLET**

V2 dispose maintenant de **TOUTES les fonctionnalités essentielles** d'un séquenceur DAW professionnel :

### ✅ **Production Ready Features**
- 🎹 **Piano Roll DAW-grade** avec interface tactile responsive
- 🎼 **Export/Import MIDI complet** avec timing parfait et limitation intelligente
- 💾 **Système Presets** localStorage + JSON avec métadonnées
- ↶↷ **Undo/Redo professionnel** avec historique 50 actions
- ⌨️ **20+ Raccourcis clavier** pour workflow professionnel
- 🎨 **Éditeur vélocité** couleurs + drag temps réel
- 📏 **Notes longues** avec redimensionnement
- 🎯 **Sélection multiple** avec copier/coller intelligent positions relatives
- 🎵 **3 vitesses lecture** (1/8, 1/16, 1/32)
- 📱 **Interface responsive** mobile/tablet/desktop
- 🧪 **2 Pages test modulaires** avec toutes fonctionnalités

### 🏗️ **Architecture Robuste**
- **SimpleAudioEngine** - Aucun crash, performance optimale
- **Types TypeScript** - Sécurité et maintenabilité
- **Gestion d'erreurs** - Feedback utilisateur complet
- **Optimisation mémoire** - Historique et presets intelligents

**V2 est maintenant un séquenceur professionnel comparable aux outils DAW !** 🎵