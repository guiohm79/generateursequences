# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Main Component**: `app/components/MelodySequencer.js` (1450+ lines) - the heart of the application containing all sequencer logic
- **Piano Roll**: `app/components/PianoRoll.js` - the visual grid for note editing
- **Popup Components**: RandomPopup, SynthPopup, VariationPopup, MIDIOutputSettings for various configuration dialogs

### Core Libraries (`app/lib/`)
- **midiOutput.js**: Web MIDI API wrapper with MIDIOutput class for external hardware/software communication
- **randomEngine.js**: Musical pattern generation engine with multiple algorithms (Goa/Psy/Prog styles, scales, moods)
- **synthPresets.js**: Tone.js synthesizer configurations (MonoSynth, PolySynth, FMSynth)
- **presetStorage.js**: Browser localStorage management for user presets
- **variationEngine.js**: Pattern modification and inspiration algorithms
- **inspirationEngine.js**: AI-style pattern generation from existing MIDI data

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