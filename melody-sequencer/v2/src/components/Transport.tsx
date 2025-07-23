'use client';

import { useState } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { Pattern, NoteLength } from '../types';
import { PianoRoll } from './PianoRoll';
import { MagentaVisualizer } from './MagentaVisualizer';

const INITIAL_PATTERN: Pattern = {
  'C4': [
    { on: true, velocity: 0.8 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.6 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.8 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.6 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.8 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.6 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.8 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.6 },
    { on: false, velocity: 0 }
  ],
  'E4': [
    { on: false, velocity: 0 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.7 },
    { on: false, velocity: 0 },
    { on: false, velocity: 0 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.7 },
    { on: false, velocity: 0 },
    { on: false, velocity: 0 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.7 },
    { on: false, velocity: 0 },
    { on: false, velocity: 0 },
    { on: false, velocity: 0 },
    { on: true, velocity: 0.7 },
    { on: false, velocity: 0 }
  ]
};

const NOTE_LENGTHS: NoteLength[] = ['4n', '8n', '16n', '32n', '64n'];

export function Transport() {
  const [pattern, setPattern] = useState<Pattern>(INITIAL_PATTERN);
  
  const { 
    isPlaying, 
    currentStep, 
    tempo, 
    noteLength, 
    start, 
    stop, 
    changeTempo, 
    changeSpeed,
    updatePattern 
  } = useAudioEngine();

  const handlePatternChange = (newPattern: Pattern) => {
    setPattern(newPattern);
    updatePattern(newPattern);
  };

  const handleStart = async () => {
    if (!isPlaying) {
      await start(pattern, {
        tempo,
        noteLength,
        midiOutputEnabled: false
      });
    } else {
      stop();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 text-white p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-bold text-center">Melody Sequencer V2</h2>
        
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleStart}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
          
          <div className="text-sm">
            Step: <span className="font-mono">{currentStep + 1}/16</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tempo: {tempo} BPM
            </label>
            <input
              type="range"
              min="60"
              max="200"
              value={tempo}
              onChange={(e) => changeTempo(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Note Length: {noteLength}
            </label>
            <select
              value={noteLength}
              onChange={(e) => changeSpeed(e.target.value as NoteLength)}
              className="w-full p-2 bg-gray-700 rounded"
            >
              {NOTE_LENGTHS.map(length => (
                <option key={length} value={length}>
                  {length}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <PianoRoll
        pattern={pattern}
        currentStep={currentStep}
        isPlaying={isPlaying}
        onPatternChange={handlePatternChange}
        width={1000}
        height={500}
      />
      
      <MagentaVisualizer
        pattern={pattern}
        currentStep={currentStep}
        isPlaying={isPlaying}
        width={1000}
        height={200}
      />
    </div>
  );
}