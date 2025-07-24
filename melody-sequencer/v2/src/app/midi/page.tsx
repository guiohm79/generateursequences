'use client';

import React, { useState } from 'react';
import { midiEngine, MidiNote } from '../../lib/MidiEngine';

const MidiPage: React.FC = () => {
  const [exportStatus, setExportStatus] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [demoPattern, setDemoPattern] = useState<MidiNote[]>([
    // Pattern de démonstration avec différentes vélocités et durées
    { step: 0, note: 'C4', velocity: 80, duration: 1, isActive: true },
    { step: 2, note: 'E4', velocity: 100, duration: 1, isActive: true },  
    { step: 4, note: 'G4', velocity: 60, duration: 2, isActive: true },   // Note longue
    { step: 8, note: 'C5', velocity: 120, duration: 1, isActive: true },
    { step: 10, note: 'E5', velocity: 90, duration: 1, isActive: true },
    { step: 12, note: 'G5', velocity: 70, duration: 1, isActive: true },
    { step: 14, note: 'C6', velocity: 110, duration: 2, isActive: true }, // Note longue
  ]);

  const handleExportDemo = async () => {
    try {
      setExportStatus('Export en cours...');
      
      // Valider les notes
      const validation = midiEngine.validateNotes(demoPattern);
      if (!validation.valid) {
        setExportStatus(`Erreur de validation: ${validation.errors.join(', ')}`);
        return;
      }

      // Exporter vers MIDI
      const result = midiEngine.exportToMidi(demoPattern, {
        tempo: 120,
        timeSignature: [4, 4]
      });

      if (result.success && result.data && result.filename) {
        // Télécharger le fichier
        midiEngine.downloadMidiFile(result);
        
        const info = midiEngine.getMidiInfo(demoPattern);
        setExportStatus(
          `✅ Export réussi!\n` +
          `Fichier: ${result.filename}\n` +
          `Notes actives: ${info.activeNotes}\n` +
          `Durée: ${info.duration} steps\n` +
          `Tempo: ${info.tempo} BPM`
        );
      } else {
        setExportStatus(`❌ Erreur d'export: ${result.error}`);
      }
    } catch (error) {
      setExportStatus(`❌ Erreur inattendue: ${error instanceof Error ? error.message : 'Inconnue'}`);
    }
  };

  const handleImportDemo = () => {
    setImportStatus('❌ Import MIDI pas encore implémenté - sera ajouté dans une prochaine version');
  };

  const toggleNote = (index: number) => {
    const newPattern = [...demoPattern];
    newPattern[index].isActive = !newPattern[index].isActive;
    setDemoPattern(newPattern);
  };

  const updateVelocity = (index: number, velocity: number) => {
    const newPattern = [...demoPattern];
    newPattern[index].velocity = Math.max(1, Math.min(127, velocity));
    setDemoPattern(newPattern);
  };

  const updateDuration = (index: number, duration: number) => {
    const newPattern = [...demoPattern];
    newPattern[index].duration = Math.max(1, Math.min(8, duration));
    setDemoPattern(newPattern);
  };

  const addNote = () => {
    const newNote: MidiNote = {
      step: demoPattern.length * 2,
      note: 'C4',
      velocity: 80,
      duration: 1,
      isActive: true
    };
    setDemoPattern([...demoPattern, newNote]);
  };

  const removeNote = (index: number) => {
    const newPattern = demoPattern.filter((_, i) => i !== index);
    setDemoPattern(newPattern);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎼 Module MIDI Export/Import
          </h1>
          <p className="text-gray-300 text-lg">
            Module réutilisable pour l'export/import MIDI - Architecture modulaire
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section Export */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              📤 Export MIDI
              <span className="ml-3 px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">
                ✅ Fonctionnel
              </span>
            </h2>

            {/* Pattern Editor */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Pattern de démonstration</h3>
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  + Ajouter Note
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {demoPattern.map((note, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={note.isActive}
                      onChange={() => toggleNote(index)}
                      className="w-4 h-4"
                      aria-label={`Activer/désactiver la note ${note.note} au step ${note.step}`}
                    />
                    
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div>
                        <label className="text-gray-400 block">Step</label>
                        <span className="text-white">{note.step}</span>
                      </div>
                      
                      <div>
                        <label className="text-gray-400 block">Note</label>
                        <span className="text-white">{note.note}</span>
                      </div>
                      
                      <div>
                        <label className="text-gray-400 block">Vélocité</label>
                        <input
                          type="range"
                          min="1"
                          max="127"
                          value={note.velocity}
                          onChange={(e) => updateVelocity(index, parseInt(e.target.value))}
                          className="w-full"
                          aria-label={`Vélocité de la note ${note.note}: ${note.velocity}`}
                          title={`Vélocité: ${note.velocity}`}
                        />
                        <span className="text-white text-xs">{note.velocity}</span>
                      </div>
                      
                      <div>
                        <label className="text-gray-400 block">Durée</label>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={note.duration}
                          onChange={(e) => updateDuration(index, parseInt(e.target.value))}
                          className="w-full"
                          aria-label={`Durée de la note ${note.note}: ${note.duration} steps`}
                          title={`Durée: ${note.duration} steps`}
                        />
                        <span className="text-white text-xs">{note.duration}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeNote(index)}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-sm transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleExportDemo}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
            >
              🎼 Exporter vers MIDI (.mid)
            </button>

            {exportStatus && (
              <div className="mt-4 p-4 bg-black/30 rounded-lg">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">{exportStatus}</pre>
              </div>
            )}
          </div>

          {/* Section Import */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              📥 Import MIDI
              <span className="ml-3 px-3 py-1 bg-yellow-500/20 text-yellow-300 text-sm rounded-full">
                🚧 À venir
              </span>
            </h2>

            <p className="text-gray-300 mb-6">
              L'import MIDI sera implémenté dans une prochaine version. 
              Le module est conçu pour supporter cette fonctionnalité.
            </p>

            <div className="mb-6">
              <input
                type="file"
                accept=".mid,.midi"
                disabled
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                aria-label="Sélectionner un fichier MIDI à importer (fonctionnalité pas encore disponible)"
                title="Import MIDI pas encore implémenté"
              />
            </div>

            <button
              onClick={handleImportDemo}
              disabled
              className="w-full py-3 bg-gray-600 text-gray-400 font-semibold rounded-lg cursor-not-allowed"
            >
              📂 Importer MIDI (Bientôt disponible)
            </button>

            {importStatus && (
              <div className="mt-4 p-4 bg-black/30 rounded-lg">
                <p className="text-sm text-gray-300">{importStatus}</p>
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📚 Documentation du Module</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🔧 Architecture Modulaire</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• <code className="bg-black/30 px-2 py-1 rounded">MidiEngine</code> - Classe principale réutilisable</li>
                <li>• <code className="bg-black/30 px-2 py-1 rounded">MidiNote</code> - Interface standardisée</li>
                <li>• <code className="bg-black/30 px-2 py-1 rounded">midiEngine</code> - Instance singleton</li>
                <li>• Support complet des notes longues et vélocité</li>
                <li>• Validation automatique des données</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🎯 Usage dans d'autres Features</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Piano Roll: Export direct des patterns</li>
                <li>• Presets: Sauvegarde en format MIDI</li>
                <li>• Sequencer: Export de séquences complètes</li>
                <li>• Pattern Analyzer: Import pour analyse</li>
                <li>• Facilement extensible pour nouveaux besoins</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-black/30 rounded-lg">
            <h4 className="text-white font-semibold mb-2">💡 Exemple d'usage dans le code:</h4>
            <pre className="text-sm text-gray-300 overflow-x-auto">
{`import { midiEngine, MidiNote } from '@/lib/MidiEngine';

// Export d'un pattern
const notes: MidiNote[] = [...]; // Vos notes
const result = midiEngine.exportToMidi(notes, { tempo: 120 });
if (result.success) {
  midiEngine.downloadMidiFile(result);
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MidiPage;