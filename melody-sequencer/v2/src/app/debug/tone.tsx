'use client';

import { useState, useCallback } from 'react';

export default function TestTone() {
  const [status, setStatus] = useState('Non testé');
  const [isLoading, setIsLoading] = useState(false);

  const testToneJS = useCallback(async () => {
    setIsLoading(true);
    setStatus('Chargement de Tone.js...');
    
    try {
      // Import dynamique de Tone.js
      const Tone = await import('tone');
      setStatus('✅ Tone.js chargé avec succès');
      
      // Test simple d'initialisation
      if (Tone.context.state === 'suspended') {
        await Tone.start();
        setStatus('✅ Tone.js initialisé et contexte activé');
      }
      
      // Test création d'un synth simple
      const synth = new Tone.Synth().toDestination();
      setStatus('✅ Synth créé avec succès');
      
      // Test jouer une note
      synth.triggerAttackRelease('C4', '8n');
      setStatus('✅ Note jouée avec succès');
      
      // Nettoyage
      synth.dispose();
      setStatus('✅ Tous les tests Tone.js réussis');
      
    } catch (error) {
      console.error('Erreur Tone.js:', error);
      setStatus(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Test Tone.js - Isolation</h1>
      
      <div className="space-y-4">
        <p>Status: <span className="font-mono">{status}</span></p>
        
        <button 
          onClick={testToneJS}
          disabled={isLoading}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-600"
        >
          {isLoading ? 'Test en cours...' : 'Tester Tone.js'}
        </button>
        
        <div className="text-sm text-gray-400">
          <p>Ce test vérifie si Tone.js peut être chargé et utilisé sans plantage.</p>
          <p>Si ce test passe, le problème vient de notre architecture.</p>
          <p>Si ce test plante, le problème vient de Tone.js ou de l'environnement.</p>
        </div>
      </div>
    </div>
  );
}