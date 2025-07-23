import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from '../../lib/AudioEngine';
import { Pattern, PlaybackConfig } from '../../types';

// Mock Tone.js
vi.mock('tone', () => ({
  Transport: {
    bpm: { value: 120 },
    scheduleRepeat: vi.fn(() => 1),
    clear: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    state: 'stopped'
  },
  PolySynth: vi.fn(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    set: vi.fn(),
    dispose: vi.fn()
  })),
  context: {
    state: 'running'
  },
  start: vi.fn()
}));

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let mockPattern: Pattern;
  let mockConfig: PlaybackConfig;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
    mockPattern = {
      'C4': [
        { on: true, velocity: 0.8 },
        { on: false, velocity: 0 },
        { on: true, velocity: 0.6 },
        { on: false, velocity: 0 }
      ]
    };
    mockConfig = {
      tempo: 120,
      noteLength: '16n',
      midiOutputEnabled: false
    };
  });

  afterEach(() => {
    audioEngine.dispose();
  });

  it('should be a singleton', () => {
    const instance1 = AudioEngine.getInstance();
    const instance2 = AudioEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize with correct default state', () => {
    const state = audioEngine.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentStep).toBe(0);
    expect(state.tempo).toBe(120);
    expect(state.noteLength).toBe('16n');
  });

  it('should handle pattern playback', async () => {
    const eventListener = vi.fn();
    audioEngine.addEventListener(eventListener);

    await audioEngine.start(mockPattern, mockConfig);

    expect(eventListener).toHaveBeenCalledWith({
      type: 'transportStart',
      data: { config: mockConfig, pattern: mockPattern }
    });
  });

  it('should stop transport correctly', () => {
    const eventListener = vi.fn();
    audioEngine.addEventListener(eventListener);

    audioEngine.stop();

    expect(eventListener).toHaveBeenCalledWith({
      type: 'transportStop'
    });
  });

  it('should change tempo correctly', () => {
    const eventListener = vi.fn();
    audioEngine.addEventListener(eventListener);

    audioEngine.changeTempo(140);

    expect(eventListener).toHaveBeenCalledWith({
      type: 'tempoChange',
      data: { tempo: 140 }
    });
  });

  it('should change speed correctly', () => {
    const eventListener = vi.fn();
    audioEngine.addEventListener(eventListener);

    audioEngine.changeSpeed('8n');

    expect(eventListener).toHaveBeenCalledWith({
      type: 'tempoChange',
      data: { noteLength: '8n' }
    });
  });

  it('should remove event listeners correctly', () => {
    const eventListener = vi.fn();
    const removeListener = audioEngine.addEventListener(eventListener);

    audioEngine.changeTempo(140);
    expect(eventListener).toHaveBeenCalledTimes(1);

    removeListener();
    audioEngine.changeTempo(160);
    expect(eventListener).toHaveBeenCalledTimes(1);
  });

  it('should update pattern correctly', () => {
    const newPattern: Pattern = {
      'D4': [{ on: true, velocity: 0.9 }]
    };

    audioEngine.updatePattern(newPattern);
    
    // Pattern should be updated (we can't directly test private properties,
    // but we can test that no errors are thrown)
    expect(() => audioEngine.updatePattern(newPattern)).not.toThrow();
  });
});