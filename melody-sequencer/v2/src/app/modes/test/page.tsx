/**
 * Mode Test - Expérimentation et développement
 */

'use client';

import React from 'react';
import Link from 'next/link';

export default function TestModePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            🧪 Mode Test - Piano Roll Base
          </h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
          >
            ← Retour Hub
          </Link>
        </div>
        <p className="text-gray-300 text-lg">
          Zone d'expérimentation pour la refactorisation du Piano Roll
        </p>
      </div>

      {/* Navigation vers les versions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-900 border border-green-600 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            ✅ Piano Roll Original
          </h2>
          <p className="text-green-200 mb-4">
            Version stable et fonctionnelle (2203 lignes)
          </p>
          <Link
            href="/piano-roll"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
          >
            Ouvrir Original →
          </Link>
        </div>

        <div className="bg-blue-900 border border-blue-600 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            🧪 Piano Roll Base (Copie)
          </h2>
          <p className="text-blue-200 mb-4">
            Version pour expérimentation et refactorisation
          </p>
          <Link
            href="/pianorollBase"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Ouvrir Base →
          </Link>
        </div>
      </div>

      {/* Modes disponibles */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">🎛️ Modes Piano Roll (Futur)</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-600 rounded-lg p-4">
            <div className="text-2xl mb-2">🎹</div>
            <h3 className="font-bold">Édition</h3>
            <p className="text-sm opacity-75">Piano Roll classique</p>
            <span className="text-xs bg-green-600 px-2 py-1 rounded mt-2 inline-block">PRÊT</span>
          </div>
          
          <div className="bg-purple-600 rounded-lg p-4 opacity-50">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-bold">Inspiration</h3>
            <p className="text-sm opacity-75">Assistant IA</p>
            <span className="text-xs bg-gray-600 px-2 py-1 rounded mt-2 inline-block">BIENTÔT</span>
          </div>
          
          <div className="bg-green-600 rounded-lg p-4 opacity-50">
            <div className="text-2xl mb-2">🎼</div>
            <h3 className="font-bold">Arrangement</h3>
            <p className="text-sm opacity-75">Multi-patterns</p>
            <span className="text-xs bg-gray-600 px-2 py-1 rounded mt-2 inline-block">BIENTÔT</span>
          </div>
          
          <div className="bg-yellow-600 rounded-lg p-4 opacity-50">
            <div className="text-2xl mb-2">🎵</div>
            <h3 className="font-bold">Gammes</h3>
            <p className="text-sm opacity-75">Assistant musical</p>
            <span className="text-xs bg-gray-600 px-2 py-1 rounded mt-2 inline-block">BIENTÔT</span>
          </div>
        </div>
      </div>

      {/* Outils de développement */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">🛠️ Outils de Développement</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-bold mb-2">📊 Comparaison</h3>
            <p className="text-sm text-gray-300 mb-3">
              Comparer les performances entre l'original et la version refactorisée
            </p>
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
              disabled
            >
              Bientôt disponible
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-bold mb-2">🧪 Tests A/B</h3>
            <p className="text-sm text-gray-300 mb-3">
              Tester les fonctionnalités côte à côte
            </p>
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
              disabled
            >
              Bientôt disponible
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-bold mb-2">📈 Métriques</h3>
            <p className="text-sm text-gray-300 mb-3">
              Analyser les performances et l'utilisation
            </p>
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
              disabled
            >
              Bientôt disponible
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}