# CLAUDE_V2.md - Melody Sequencer V2 Documentation

This file provides complete documentation for the **V2 (modern)** version of the Melody Sequencer.

> **Note**: For project overview and V1 information, see `../CLAUDE.md` at project root.

## Project Overview

**Melody Sequencer V2** is a complete rewrite of the browser-based step sequencer, built with modern architecture and AI-powered music generation. This version aims to solve the architectural issues of V1 while adding advanced features powered by Magenta.js.

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
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first styling framework
- **Tone.js** - Web Audio API framework for sound synthesis
- **@magenta/music** - AI-powered music generation and analysis
- **@tonejs/midi** - MIDI file parsing and generation

### **Testing & Quality**
- **Vitest** - Fast unit testing framework
- **@testing-library/react** - Component testing utilities
- **ESLint** - Code linting and formatting

## Architecture Principles

### **🏗️ Design Goals**
1. **Stability First** - No transport bugs or infinite re-render loops
2. **Type Safety** - Full TypeScript coverage with strict mode
3. **Testability** - Every function unit tested before integration
4. **Modularity** - Independent, composable modules
5. **AI Integration** - Magenta.js features built-in from day one

### **🚫 V1 Anti-Patterns Avoided**
- ❌ Complex nested React hooks with circular dependencies
- ❌ Unstable function references causing re-renders
- ❌ Mixing Tone.js relative notation with absolute durations
- ❌ Fragile shared state across multiple components
- ❌ No testing strategy

### **✅ V2 Architecture Patterns**
- ✅ **Singleton AudioEngine** - Transport logic outside React lifecycle
- ✅ **TypeScript interfaces** - Explicit contracts between modules
- ✅ **State management** - Zustand for predictable global state
- ✅ **Dependency injection** - Testable, mockable dependencies
- ✅ **Error boundaries** - Graceful failure handling

## Core Architecture

### **AudioEngine Singleton (src/lib/AudioEngine.ts)**
```typescript
class AudioEngine {
  private static instance: AudioEngine;
  
  // Stable transport without React re-renders
  start(pattern: Pattern, config: PlaybackConfig): void
  stop(): void
  changeSpeed(noteLength: NoteLength): void
  updatePattern(pattern: Pattern): void
}
```

### **Type Definitions (src/types/)**
```typescript
// Complete type coverage for all music data
interface Pattern {
  [noteName: string]: Step[];
}

interface Step {
  on: boolean;
  velocity: number;
  accent?: boolean;
  slide?: boolean;
}

type NoteLength = '4n' | '8n' | '16n' | '32n' | '64n';
```

### **React Components (src/components/)**
- **Sequencer** - Main application container
- **PianoRoll** - Visual step editor
- **Transport** - Play/stop/tempo controls
- **PatternGenerator** - AI-powered pattern creation
- **MIDIExporter** - Export functionality

### **Hooks (src/hooks/)**
- **useAudioEngine** - Simple interface to AudioEngine singleton
- **usePatternState** - Pattern data management with Zustand
- **useMagentaAI** - AI music generation features
- **useMIDI** - Web MIDI API integration

## Magenta.js Integration

### **AI Features Planned**
1. **Smart Continuation** - `MusicRNN` to continue melodies
2. **Drum Generation** - `DrumsRNN` for rhythm patterns
3. **Style Transfer** - Apply musical styles to existing patterns
4. **Chord Progression** - Generate harmonies from melodies
5. **Interactive Training** - Learn from user preferences

### **Implementation Strategy**
```typescript
// src/lib/MagentaAI.ts
class MagentaAI {
  private musicRNN: MusicRNN;
  private drumsRNN: DrumsRNN;
  
  async continuePattern(pattern: Pattern): Promise<Pattern>
  async generateDrums(pattern: Pattern): Promise<Pattern>
  async transferStyle(pattern: Pattern, style: string): Promise<Pattern>
}
```

## Migration from V1

### **Priority Order**
1. **Phase 1: Core Features**
   - Basic piano roll and playback
   - MIDI export
   - Simple pattern generation

2. **Phase 2: V1 Feature Parity**
   - Random pattern generation
   - Synth presets and audio output
   - Favorites system

3. **Phase 3: Enhanced Features**
   - Custom scales management
   - Pattern morphing
   - Evolution algorithms

4. **Phase 4: AI Features**
   - Magenta.js integration
   - Smart pattern continuation
   - Style-based generation

5. **Phase 5: Advanced AI**
   - Real-time AI collaboration
   - Genre analysis
   - Harmonic progression

### **Code Migration Guidelines**
```typescript
// ❌ V1 Pattern (avoid)
const useTransport = ({ currentPreset, midiOutputEnabled, noteLength, tempo }) => {
  const synthRef = useRef(null);
  const playStep = useCallback((stepIndex, time, pattern) => {
    // Complex logic mixed with React lifecycle
  }, [/* many dependencies */]);
  
  const startTransport = useCallback(async (steps, pattern, onStepChange) => {
    // Transport logic inside React hook
  }, [/* circular dependencies */]);
};

// ✅ V2 Pattern (adopt)
// src/lib/AudioEngine.ts
class AudioEngine {
  start(pattern: Pattern, config: PlaybackConfig): void {
    const durationSeconds = this.calculateDuration(config.tempo, config.noteLength);
    Tone.Transport.scheduleRepeat(this.sequence, durationSeconds, startTime);
  }
}

// src/hooks/useAudioEngine.ts
export function useAudioEngine() {
  return {
    start: (pattern: Pattern) => AudioEngine.getInstance().start(pattern, config),
    stop: () => AudioEngine.getInstance().stop()
  };
}
```

## Testing Strategy

### **Test Structure**
```
src/
├── __tests__/
│   ├── lib/
│   │   ├── AudioEngine.test.ts      # Core transport tests
│   │   └── MagentaAI.test.ts        # AI feature tests
│   ├── components/
│   │   ├── Sequencer.test.tsx       # Main component tests
│   │   └── PianoRoll.test.tsx       # UI interaction tests
│   └── hooks/
│       └── usePatternState.test.ts  # State management tests
```

### **Test Requirements**
- ✅ **AudioEngine** - 100% coverage of transport logic
- ✅ **Pattern utilities** - All music data transformations tested
- ✅ **React components** - User interaction flows validated
- ✅ **Magenta integration** - AI features with mock data
- ✅ **E2E scenarios** - Complete user workflows tested

## Development Workflow

### **Feature Development Process**
1. **Write tests first** - Define expected behavior
2. **Implement feature** - Make tests pass
3. **Integration test** - Verify with real data
4. **Type check** - Ensure TypeScript compliance
5. **Performance check** - No re-render loops or memory leaks

### **Code Quality Gates**
- 🔒 **TypeScript strict mode** - No `any` types allowed
- 🔒 **Test coverage > 90%** - All critical paths tested
- 🔒 **ESLint clean** - No warnings or errors
- 🔒 **Performance budget** - Bundle size and runtime metrics

## Known V1 Issues - Resolved in V2

### **✅ Transport System Stability**
- **V1 Problem**: Infinite re-render loops, unreliable playback
- **V2 Solution**: AudioEngine singleton outside React lifecycle

### **✅ Speed Change Reliability**  
- **V1 Problem**: All speeds sound identical, inconsistent timing
- **V2 Solution**: Precise duration calculations, hot-swappable speeds

### **✅ Type Safety**
- **V1 Problem**: Runtime errors, undefined behaviors
- **V2 Solution**: Full TypeScript coverage with strict types

### **✅ Testing Coverage**
- **V1 Problem**: No automated testing, manual validation only
- **V2 Solution**: Comprehensive test suite with TDD approach

### **✅ Architecture Complexity**
- **V1 Problem**: Tangled dependencies, hard to debug
- **V2 Solution**: Clean separation of concerns, modular design

## Current Status (Session 2025-07-23)

### 🚀 **PIANO ROLL COMPLET - Production Ready**
- 🎹 **Piano Roll Professionnel** - Interface DAW moderne style Cubase/Logic
- 🎵 **Audio Polyphonique** - PolySynth + reverb pour son professionnel
- 🎚️ **Navigation Octaves** - Scroll molette + boutons, gamme C1-C7 complète
- 📏 **Steps Variables** - Support 8/16/32/64 steps avec accents adaptatifs
- 📱 **Responsive Design** - Mobile/tablette/desktop optimisé
- ⚡ **Performance** - Scroll fluide, interactions temps réel
- 🎨 **Design Moderne** - Glass-morphism, gradients, animations

### 🎯 **NEXT SESSION PRIORITIES**
1. **Velocity Editor** - Contrôle intensité par note (slider/courbe)
2. **Note Length** - Support notes longues (sustain/legato) 
3. **Selection Tools** - Multi-sélection, copier/coller, déplacer
4. **MIDI Export** - Exportation patterns en fichiers MIDI
5. **Presets System** - Banque de patterns et sons
6. **Keyboard Shortcuts** - Raccourcis productivité (espace=play, etc.)
7. **AI Generation** - Intégration Magenta.js pour création assistée

### 📊 **Architecture Finale V2**
```
V2 Production Architecture:
├── 🎹 Piano Roll/
│   ├── page.tsx (750+ lignes, interface complète)
│   ├── Navigation octaves (C1-C7, molette+boutons)
│   ├── Steps variables (8/16/32/64 adaptatifs)
│   ├── Responsive design (mobile/desktop)
│   └── Interactions tactiles (touch-optimized)
├── 🔊 Audio Engine/
│   ├── SimpleAudioEngine.ts (PolySynth + reverb)
│   ├── useSimpleAudio.ts (hook états audio)
│   ├── Pattern conversion (visual → audio)
│   └── Transport synchronisé (play/stop/tempo)
├── 🎨 Design System/
│   ├── Glass-morphism containers
│   ├── Gradient backgrounds
│   ├── Adaptive cell sizing
│   └── Touch-friendly interactions
└── 📱 Responsive/
    ├── Mobile (stack vertical, touch-large)
    ├── Tablet (layout intermédiaire)
    └── Desktop (interface complète)
```

---

---

## 📖 Navigation Documentation

- **🏠 Project Root**: `../CLAUDE.md` - Project overview and version guidance
- **📚 V1 Docs**: `../v1/CLAUDE_V1.md` - Legacy codebase and lessons learned
- **🚀 V2 Docs**: This file - Modern architecture and development guide
- **📋 Quick Start**: `../README.md` - Development commands and comparison

**This is the V2 (modern) documentation. For production version, see V1 docs.**