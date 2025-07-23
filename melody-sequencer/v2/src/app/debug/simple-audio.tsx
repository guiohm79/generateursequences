'use client';

import { useState, useEffect } from 'react';
import { useSimpleAudio } from '../../hooks/useSimpleAudio';
import { SimplePattern } from '../../lib/SimpleAudioEngine';

const TEST_PATTERN: SimplePattern = {
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

export default function TestSimpleAudio() {
  const {
    isPlaying,
    isInitialized,
    currentStep,
    tempo,
    initialize,
    start,
    stop,
    setPattern,
    setTempo
  } = useSimpleAudio();
  
  const [logs, setLogs] = useState<string[]>([]);
  
  // Capturer les logs console
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const addLog = (level: string, ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = `[${timestamp}] [${level}] ${args.join(' ')}`;
      setLogs(prev => [...prev.slice(-20), message]); // Garder les 20 derniers
    };
    
    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', ...args);
    };
    
    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', ...args);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', ...args);
    };
    
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  const handleInitialize = async () => {
    console.log('User clicked Initialize');
    const success = await initialize();
    console.log('Initialize result:', success);
  };
  
  const handleStart = async () => {
    console.log('User clicked Start');
    setPattern(TEST_PATTERN);
    const success = await start();
    console.log('Start result:', success);
  };
  
  const handleStop = () => {
    console.log('User clicked Stop');
    stop();
  };
  
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Test Simple Audio - Base Solide</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contrôles */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Contrôles</h2>
          
          <div className="space-y-2">
            <button 
              onClick={handleInitialize}
              disabled={isInitialized}
              className="w-full bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              {isInitialized ? '✅ Initialisé' : 'Initialiser'}
            </button>
            
            <button 
              onClick={handleStart}
              disabled={!isInitialized || isPlaying}
              className="w-full bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-600"
            >
              {isPlaying ? '🎵 En cours...' : 'PLAY'}
            </button>
            
            <button 
              onClick={handleStop}
              disabled={!isPlaying}
              className="w-full bg-red-600 px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-600"
            >
              STOP
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm">Tempo: {tempo} BPM</label>
            <input
              type="range"
              min="60"
              max="180"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        {/* État */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">État</h2>
          
          <div className="bg-gray-800 p-4 rounded space-y-2 font-mono text-sm">
            <div>Initialisé: <span className={isInitialized ? 'text-green-400' : 'text-red-400'}>
              {isInitialized ? '✅' : '❌'}
            </span></div>
            <div>En lecture: <span className={isPlaying ? 'text-green-400' : 'text-yellow-400'}>
              {isPlaying ? '🎵' : '⏸️'}
            </span></div>
            <div>Step: <span className="text-blue-400">{currentStep + 1}/16</span></div>
            <div>Tempo: <span className="text-purple-400">{tempo} BPM</span></div>
          </div>
        </div>
      </div>
      
      {/* Logs */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Logs en temps réel</h2>
        <div className="bg-black p-4 rounded h-64 overflow-y-scroll font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className={
              log.includes('[ERROR]') ? 'text-red-400' :
              log.includes('[WARN]') ? 'text-yellow-400' :
              'text-green-400'
            }>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p><strong>Test de robustesse:</strong> Cette version utilise une architecture ultra-simple.</p>
        <p>Si cela plante, le problème vient de Tone.js ou de l'environnement.</p>
        <p>Si cela fonctionne, nous pourrons construire dessus progressivement.</p>
      </div>
    </div>
  );
}