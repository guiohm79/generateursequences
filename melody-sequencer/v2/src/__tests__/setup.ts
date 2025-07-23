import '@testing-library/jest-dom';

// Mock Web Audio API globally
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: class MockAudioContext {
    state = 'running';
    createOscillator = () => ({});
    createGain = () => ({});
    close = () => Promise.resolve();
  }
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: window.AudioContext
});

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Tone.js')) {
    return;
  }
  originalWarn(...args);
};