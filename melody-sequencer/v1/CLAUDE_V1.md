# CLAUDE_V1.md - Melody Sequencer V1 Documentation

This file provides complete documentation for the **V1 (stable)** version of the Melody Sequencer.

> **Note**: For project overview and V2 information, see `../CLAUDE.md` at project root.

## Project Overview

This is a **Melody Sequencer Pro** - a Next.js web application that creates a browser-based step sequencer for generating melodic patterns. The app can output audio through Web Audio API (Tone.js) or send MIDI data to external VST instruments via Web MIDI API.

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
```

## Core Architecture

### Main Application Structure
- **Entry Point**: `app/page.js` renders the main `MelodySequencer` component
- **Main Component**: `app/components/MelodySequencer.js` (1600+ lines) - the heart of the application containing all sequencer logic
- **Piano Roll**: `app/components/PianoRoll.js` - the visual grid for note editing
- **Popup Components**: RandomPopup, SynthPopup, VariationPopup, MIDIOutputSettings, FavoritesPopup, ScalesManagerPopup for various configuration dialogs

### Core Libraries (`app/lib/`)
- **midiOutput.js**: Web MIDI API wrapper with MIDIOutput class for external hardware/software communication
- **randomEngine.js**: Musical pattern generation engine with multiple algorithms (Goa/Psy/Prog styles, scales, moods)
- **synthPresets.js**: Tone.js synthesizer configurations (MonoSynth, PolySynth, FMSynth)
- **presetStorage.js**: Browser localStorage management for user presets
- **variationEngine.js**: Pattern modification and inspiration algorithms with robust error handling
- **inspirationEngine.js**: AI-style pattern generation from existing MIDI data using Markov chains
- **favoritesStorage.js**: Favorites management with hybrid pattern storage and metadata
- **scalesStorage.js**: Dynamic scales management with custom scales support

### Key Dependencies
- **Tone.js**: Web Audio API framework for sound synthesis and sequencing
- **@tonejs/midi**: MIDI file parsing and generation
- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Styling framework

## Pattern Data Structure

Patterns are stored as objects where each note name (e.g., "C4", "F#3") maps to an array of step objects:
```javascript
{
  "C4": [0, {on: true, velocity: 100, accent: false, slide: false}, 0, ...],
  "D4": [0, 0, {on: true, velocity: 80}, ...]
}
```

Each step can be:
- `0` or `false`: silent step
- Object with `{on: true, velocity: 1-127, accent?: boolean, slide?: boolean}`: active note

## MIDI Integration

The app supports two audio outputs:
1. **Internal synthesis** via Tone.js (default)
2. **External MIDI** via Web MIDI API to hardware/VST instruments

MIDI setup requires a virtual MIDI port (loopMIDI on Windows, IAC on macOS) - see `docs/MIDI_CONNECTION_GUIDE.md` for complete setup instructions.

Control Change messages:
- CC 16: Accent (127 = on, 0 = off)
- CC 17: Slide/Portamento (127 = on, 0 = off)

## Musical Features

### Pattern Generation
The `randomEngine.js` supports:
- **Scales**: Major, minor, harmonic minor, phrygian, dorian, plus exotic scales (Hungarian minor, double harmonic, etc.)
- **Styles**: 'goa', 'psy', 'prog', 'deep' with different rhythmic characteristics
- **Parts**: 'bassline', 'lead', 'pad', 'arpeggio', 'hypnoticLead'
- **Moods**: 'dark', 'uplifting', 'dense' for post-processing effects
- **Seeded generation**: Reproducible patterns using mulberry32 PRNG

### Voice Modes
- **Mono**: Single note priority (highest pitch wins, with portamento support)
- **Poly**: Multiple simultaneous notes

### Export/Import
- Export patterns to MIDI files with proper timing and CC data
- Import MIDI files for pattern variation/inspiration
- Pattern history with undo/redo functionality

### Custom Scales System
- **Dynamic scale management** via ScalesManagerPopup component
- **Default scales** preserved in ScalesStorage (major, minor, modes, exotic scales)
- **Custom scales creation** with interval validation (0-11 semitones)
- **Import/Export** of custom scales in JSON format
- **Real-time integration** with randomEngine via refreshScales()
- **Categories and search** for organizing scales
- **Visual preview** of scale intervals as note names

### Favorites System
- **Pattern storage** via FavoritesStorage with hybrid approach (seeds + full patterns)
- **Metadata support**: name, tags, description, creation/modification dates
- **Search and filtering** by name, tags, and categories
- **Export/Import** functionality for sharing favorite patterns
- **Auto-saving** of sequencer settings (tempo, octaves, note length)
- **Quick access** through FavoritesPopup component

### Variation Engine
- **Multiple transformation types**: transposition, swing, humanization, retrograde, inversion
- **Scale quantization** with custom scale support
- **Advanced rhythm analysis** for contextual humanization
- **Robust error handling** for retrograde with proper validation
- **Inspiration mode** integration with Markov chains and Euclidean rhythms

### User Interface Organization
The interface is organized into **6 functional groups** for clarity:

#### 🎮 **CONTRÔLES DE LECTURE** (blue)
- Play/Pause, Stop, Clear, Undo buttons
- Speed selector for note timing (1/4 to 1/64)

#### 🎲 **GÉNÉRATION CRÉATIVE** (orange)  
- Random pattern generation with parameters
- "Again" button for regeneration with same params
- Variations engine for pattern transformation

#### ⭐ **GESTION & STOCKAGE** (gold)
- Favorites management for pattern storage
- Custom scales manager
- MIDI export functionality

#### 🔧 **AUDIO & MIDI** (green)
- Sound/synthesis settings
- MIDI output toggle and configuration
- External hardware/VST integration

#### 🎵 **MANIPULATION** (red-orange)
- Octave shift buttons (up/down)
- Real-time pattern transformation

#### ⚙️ **PARAMÈTRES** (cyan)
- Tempo control (60-240 BPM)
- Octave range settings (min/max)

## Development Notes

### State Management
The main component uses extensive React state with useRef for audio objects and transport management. Key states include:
- Pattern data structure
- Transport controls (playing, tempo, current step)
- Audio/MIDI output settings
- UI popup visibility states
- Pattern history for undo/redo

### Audio Performance
- Tone.js Transport handles precise timing
- MIDI output optimized for low latency (50-200ms note duration)
- All Notes Off messages prevent stuck notes

### Code Conventions
- French comments and UI text throughout the codebase
- ES6 modules with named exports
- React functional components with hooks
- CSS classes follow kebab-case (sequencer, controls-section, etc.)

### Testing Strategy
No formal test framework is configured. Manual testing focuses on:
- Pattern playback accuracy
- MIDI connectivity with external software
- Export/import functionality
- Browser compatibility (Chrome/Edge recommended for Web MIDI)

When making changes, always test both internal audio and MIDI output modes, and verify that pattern export/import maintains musical integrity.

## Recent Updates & Bug Fixes

### Version 2025-01-22 Latest Updates
- **🎛️ Enhanced Controls**: Added comprehensive control panels with visual feedback and improved UX
- **🔄 Real-time Pattern Updates**: Optimized pattern modification system with instant audio/visual sync
- **🎨 Advanced UI Components**: Enhanced popup interfaces with better state management and validation
- **🧬 Genetic Algorithm Refinements**: Improved evolution engine with better mutation strategies and fitness calculations
- **🎯 Pattern Management**: Streamlined workflow for pattern creation, modification, and storage
- **🔧 Performance Optimizations**: Reduced render cycles and improved memory usage for complex patterns

### Version 2025-01 Major Creative Updates
- **🎨 Ambiance Generator**: Added 6 creative ambiance presets (Nostalgique, Énergique, Mystérieux, Tribal, Cosmique, Hypnotique) with automatic tempo and synth suggestions
- **🎲 Happy Accidents**: Intelligent "creative errors" system with 5 mutation types (off-scale notes, rhythm shifts, unexpected accents, ghost notes, surprise silences)
- **🌊 Real-time Morphing**: Seamless transition between patterns with live interpolation slider and Apply/Cancel controls
- **🧬 Genetic Evolution**: Advanced pattern evolution with two modes:
  - **Evolve**: Subtle progressive mutations (8% rate, 40% intensity)
  - **Boost**: Aggressive 5-generation evolution (18% rate, 80% intensity, population selection)
- **📊 Fitness System**: Automatic pattern scoring based on density, creativity, and musical interest
- **🎯 Enhanced Random Popup**: New tabbed interface with Ambiance/Manual modes and Happy Accidents controls

### Creative Features Deep Dive

#### Ambiance System (`randomEngine.js`)
- **6 Predefined Ambiances**: Each with curated scales, styles, moods, tempo ranges, and synth recommendations
- **Intelligent Selection**: Randomized parameter selection within ambiance constraints
- **Auto-Application**: Suggested tempo and synthesizer settings applied automatically
- **Compatibility**: Works with existing seed system and Happy Accidents

#### Happy Accidents Engine
- **5 Accident Types**: Off-scale notes (30%), rhythm shifts (20%), unexpected accents (25%), ghost notes (15%), surprise silences (10%)
- **Intensity Control**: 10-100% slider for accident frequency and impact
- **Seeded Randomness**: Reproducible "accidents" using same seed system
- **Visual Feedback**: Special styling for accident-modified notes

#### Morphing System (`morphPatterns()`)
- **Intelligent Interpolation**: Smart blending of velocities, note appearances/disappearances
- **Real-time Audio**: Morphed pattern plays live during slider adjustment
- **Visual Integration**: Piano roll displays morphed state with special styling
- **Seamless Workflow**: Generate target, morph, apply or cancel

#### Genetic Evolution Engine
- **5 Mutation Types**: Note changes, velocity shifts, rhythm mutations, accent mutations, genetic duplications
- **Fitness Calculation**: Based on pattern density, velocity diversity, accent usage, and evolutionary markers
- **Generation Tracking**: Complete history with fitness scores and mutation counts
- **Population Selection**: Multi-candidate evolution with best-fitness selection
- **Reversion System**: Navigate back to any previous generation or original pattern

### Version 2024-07 Updates
- **Fixed retrograde crash bug**: Added robust validation and error handling in variationEngine.js to prevent application crashes from malformed MIDI data
- **Added Favorites System**: Complete pattern storage with hybrid approach (seeds + full patterns), metadata, search/filtering
- **Added Custom Scales Manager**: Dynamic scale creation/modification with real-time integration into random generation
- **Fixed scales integration**: Resolved issue where custom scales weren't appearing in Random popup 
- **UI Reorganization**: Completely restructured interface into 6 functional groups for better usability
- **Enhanced error handling**: Improved MIDI processing with proper validation and fallbacks
- **Cross-component communication**: Added trigger systems for real-time updates between managers and generators

### Known Issues Fixed
- ✅ Retrograde effect causing crashes (timing validation added)
- ✅ Custom scales not showing in Random popup (dynamic loading implemented) 
- ✅ Interface organization unclear (6-group structure implemented)
- ✅ Import errors with getAvailableScales() (proper module imports fixed)
- ✅ Morphing audio/visual sync (currentPlayingPattern integration in useCallback dependencies)
- ✅ Variable initialization order (currentPlayingPattern moved before function definitions)
- ✅ Pattern mutation consistency (improved seeded randomization across all features)
- ✅ Evolution fitness calculation accuracy (enhanced scoring algorithms)
- ✅ UI state synchronization (better component communication and updates)
- ✅ Memory leaks in pattern generation (optimized object creation and cleanup)

### Latest Development Sessions

#### **2025-07-23: Création Architecture V1/V2 - Stratégie Nouveau Développement**

**🚨 Décision Stratégique Majeure:**
Suite aux difficultés répétées avec les bugs de transport et la complexité croissante du debugging sur l'architecture existante, nous avons décidé de créer une approche **V1/V2 parallèle**.

**🏗️ Nouvelle Structure du Projet:**
```
melody-sequencer/
├── v1/                    # Version stable actuelle (cette version)
│   ├── app/              # Code React existant fonctionnel
│   ├── CLAUDE.md         # Documentation complète (ce fichier)
│   └── ...              # Tous les fichiers de la version stable
├── v2/                    # Version moderne avec IA (en développement)
│   ├── src/              # Architecture TypeScript moderne
│   ├── package.json      # Stack: Next.js + TypeScript + Magenta.js
│   └── ...              # Configuration moderne
└── README_VERSIONS.md     # Documentation des deux versions
```

**✅ Avantages de cette Approche:**
1. **V1 reste fonctionnelle** - Pas de régression pour l'utilisateur
2. **V2 architecture propre** - Évite la dette technique héritée
3. **Développement parallèle** - Nouvelles fonctionnalités sans risque
4. **Migration progressive** - Les meilleures fonctionnalités V1 → V2
5. **Magenta.js intégré** - IA musicale avancée dès le départ

**🎯 Roadmap V2:**
- **Phase 1**: Setup + Architecture transport stable (singleton pattern)
- **Phase 2**: Intégration Magenta.js pour IA musicale
- **Phase 3**: Migration fonctionnalités V1 essentielles
- **Phase 4**: Nouvelles fonctionnalités avancées IA
- **Phase 5**: Remplacement V1 → V2

**📊 Status V1 (Cette Version):**
- ✅ **Fonctionnelle** pour usage quotidien
- ⚠️ **Bugs connus** mais non-critiques
- 🔒 **Gelée** - Plus de modifications majeures
- 📚 **Référence** - Sert de "pièces détachées" pour V2

**🚀 Status V2:**
- 🚧 **En développement** - Architecture moderne
- 💡 **TypeScript** - Code plus robuste
- 🤖 **Magenta.js** - IA musicale intégrée
- 🧪 **Tests unitaires** - Qualité assurée

#### **2025-07-23: Tentatives Debug Transport - Leçons Apprises**

**🔄 Bugs Investigués:**
1. **Bug vitesse lecture** - Toutes les vitesses (1/4, 1/8, 1/16, etc.) identiques
2. **Analyse root cause** - `noteLength` non pris en compte dans `useEffect` dependencies
3. **Fix tenté** - Ajout `noteLength` aux dépendances + conversion durées Tone.js
4. **Résultat** - Fix partiel mais architecture toujours fragile

**📚 Leçons Clés pour V2:**
- ❌ **Éviter** - Hooks imbriqués complexes avec dépendances circulaires
- ❌ **Éviter** - Notation Tone.js native ("4n", "16n") - Préférer durées calculées
- ✅ **Adopter** - Architecture singleton pour transport (hors cycle React)
- ✅ **Adopter** - TypeScript pour détecter les erreurs de dépendances
- ✅ **Adopter** - Tests unitaires pour valider chaque modification

**🎯 Architecture Cible V2:**
```typescript
// Singleton AudioEngine (hors React)
class AudioEngine {
  private static instance: AudioEngine;
  
  start(pattern: Pattern, tempo: number, noteLength: string) {
    const durationSeconds = this.calculateDuration(tempo, noteLength);
    Tone.Transport.scheduleRepeat(sequence, durationSeconds, startTime);
  }
  
  calculateDuration(tempo: number, noteLength: string): number {
    // Calcul précis des durées en secondes
  }
}

// Hook React simple (interface seulement)
function useAudioEngine() {
  return {
    start: () => AudioEngine.getInstance().start(...),
    stop: () => AudioEngine.getInstance().stop()
  };
}
```

#### **2025-01-22: Creative Features Enhancement**
This session focused on:
1. **Code Architecture Review**: Comprehensive analysis of existing components and their interactions
2. **Performance Optimization**: Identified and addressed bottlenecks in pattern processing
3. **Feature Enhancement**: Refined existing creative features with better user feedback
4. **Documentation Update**: Updated CLAUDE.md with all recent changes and improvements
5. **Testing Strategy**: Verified compatibility across different browser environments
6. **Code Quality**: Improved error handling and edge case management throughout the application

## Notes pour les Développeurs V2

### **🚫 Anti-Patterns V1 à Éviter:**
1. **Hooks complexes imbriqués** - `useTransport` avec multiples `useCallback` interdépendants
2. **Références instables** - Functions recréées à chaque render
3. **État partagé fragile** - `currentPlayingPattern` propagé à travers multiples composants
4. **Timing Tone.js flou** - Mélange notations relatives et durées absolues

### **✅ Patterns V2 à Adopter:**
1. **Singleton AudioEngine** - Une seule instance, cycle de vie indépendant de React
2. **TypeScript strict** - `strictNullChecks: true`, interfaces explicites
3. **Architecture modulaire** - Chaque fonctionnalité = module indépendant testable
4. **State management explicite** - Zustand ou Redux Toolkit pour état global
5. **Tests first** - Chaque fonction avec tests unitaires avant intégration

### **🎵 Fonctionnalités V1 à Migrer (Par Priorité):**
1. **Essentiel** - Piano roll, lecture basique, export MIDI
2. **Important** - Génération aléatoire, presets synthé, favoris
3. **Avancé** - Morphing, évolution génétique, gammes custom
4. **Expérimental** - Ambiances, happy accidents

### **🤖 Nouvelles Fonctionnalités V2 avec Magenta.js:**
1. **Smart Continuation** - Continuer une mélodie intelligemment
2. **Style Transfer** - Appliquer le style d'une mélodie à une autre
3. **Harmonisation Auto** - Générer accords à partir mélodie
4. **Genre Detection** - Analyser et classer les patterns
5. **Collaborative AI** - Humain + IA pour composition créative

---

## 📖 Navigation Documentation

- **🏠 Project Root**: `../CLAUDE.md` - Project overview and version guidance
- **📚 V1 Docs**: This file - Complete V1 documentation and history  
- **🚀 V2 Docs**: `../v2/CLAUDE_V2.md` - Modern architecture and AI features
- **📋 Quick Start**: `../README.md` - Development commands and comparison

**This is the V1 (stable) documentation. For active development, see V2 docs.**