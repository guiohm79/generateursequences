import { getMenuCategories } from '../data/menuItems';
import { MenuSection } from '../components/MenuSection';

export default function Home() {
  const categories = getMenuCategories();
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🎹 Melody Sequencer V2
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Piano Roll Professionnel - Production Ready
          </p>
          
          <div className="bg-green-900 border border-green-600 p-6 rounded-xl max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-3">🎯 Piano Roll Professionnel COMPLET</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-200 mb-2">✅ <strong>Fonctionnalités Core :</strong></p>
                <ul className="text-green-100 space-y-1 ml-4">
                  <li>• Interface DAW professionnelle</li>
                  <li>• Audio polyphonique (PolySynth + reverb)</li>
                  <li>• Navigation octaves C1-C7</li>
                  <li>• Steps adaptatifs (8/16/32/64)</li>
                </ul>
              </div>
              <div>
                <p className="text-green-200 mb-2">✅ <strong>Fonctionnalités Avancées :</strong></p>
                <ul className="text-green-100 space-y-1 ml-4">
                  <li>• Vélocité couleurs (vert→rouge)</li>
                  <li>• Notes longues redimensionnables</li>
                  <li>• Sélection multiple + copier/coller</li>
                  <li>• Déplacement par flèches clavier</li>
                </ul>
              </div>
            </div>
            <p className="text-center text-green-200 mt-4 font-medium">
              🚀 Prochaines étapes : Export MIDI, Système Presets, Undo/Redo
            </p>
          </div>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'stable').length, 0)}
            </div>
            <div className="text-sm text-gray-400">Stable</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'testing').length, 0)}
            </div>
            <div className="text-sm text-gray-400">En test</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'new').length, 0)}
            </div>
            <div className="text-sm text-gray-400">Nouveau</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">
              {categories.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'planned').length, 0)}
            </div>
            <div className="text-sm text-gray-400">Planifié</div>
          </div>
        </div>
        
        {/* Sections du menu */}
        {categories.map(category => (
          <MenuSection 
            key={category.id} 
            category={category}
          />
        ))}
        
        {/* Footer */}
        <div className="mt-16 text-center border-t border-gray-700 pt-8">
          <p className="text-gray-400 text-sm mb-2">
            🎹 Melody Sequencer V2 - Piano Roll Professionnel Production Ready
          </p>
          <p className="text-gray-500 text-xs mb-1">
            Session 2025-07-24 : Vélocité, Notes Longues, Sélection Multiple - COMPLET
          </p>
          <p className="text-gray-500 text-xs">
            Ajoutez facilement de nouvelles fonctionnalités en modifiant le fichier menuItems.ts
          </p>
        </div>
      </div>
    </main>
  );
}