/**
 * HelpDialog.tsx - Guide complet du Scale Helper
 * 
 * Dialog d'aide avec toutes les informations et guides d'utilisation
 * pour l'Assistant de Gammes (Scale Helper)
 */

'use client';

import React, { useState } from 'react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  if (!isOpen) return null;

  const helpSections: HelpSection[] = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      icon: '🎼',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-400">🎯 Qu'est-ce que le Scale Helper ?</h3>
          <p className="text-slate-300">
            Le <strong>Scale Helper</strong> (Assistant de Gammes) est un outil musical intelligent qui transforme 
            votre piano roll en assistant de composition. Il vous guide visuellement pour créer des mélodies 
            harmonieusement correctes.
          </p>
          
          <div className="bg-emerald-900/20 border border-emerald-600/50 rounded-lg p-4">
            <h4 className="font-medium text-emerald-300 mb-2">✨ Fonctionnalités principales :</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• <strong>Coloration intelligente</strong> : Notes colorées selon la gamme</li>
              <li>• <strong>Suggestions d'accords</strong> : Grille d'accords contextuels</li>
              <li>• <strong>Analyse théorique</strong> : Analyse harmonique temps réel</li>
              <li>• <strong>Aperçu audio</strong> : Écouter les accords avant de les placer</li>
              <li>• <strong>Correction automatique</strong> : Snap-to-scale pour éviter les fausses notes</li>
            </ul>
          </div>

          <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">🎵 Qui peut l'utiliser ?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <strong className="text-blue-200">Débutants :</strong>
                <ul className="text-slate-300 mt-1">
                  <li>• Apprendre les gammes visuellement</li>
                  <li>• Éviter les fausses notes</li>
                  <li>• Comprendre l'harmonie</li>
                </ul>
              </div>
              <div>
                <strong className="text-blue-200">Expérimentés :</strong>
                <ul className="text-slate-300 mt-1">
                  <li>• Composer plus rapidement</li>
                  <li>• Explorer de nouvelles gammes</li>
                  <li>• Analyser des progressions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'coloring',
      title: 'Coloration',
      icon: '🎨',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-400">🎨 Modes de Coloration</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center">
                🎹 <span className="ml-2">Mode Standard</span>
              </h4>
              <p className="text-slate-300 mb-3">Piano classique avec touches blanches et noires.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white text-black p-2 rounded text-center">Touches blanches</div>
                <div className="bg-slate-900 text-white p-2 rounded text-center">Touches noires</div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center">
                🎨 <span className="ml-2">Mode Gamme (Recommandé)</span>
              </h4>
              <p className="text-slate-300 mb-3">Coloration selon les notes de la gamme sélectionnée.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-emerald-500 text-white p-2 rounded text-center font-bold">
                  🟢 Tonique (Do)
                </div>
                <div className="bg-blue-500 text-white p-2 rounded text-center font-bold">
                  🔵 Dominante (Sol)
                </div>
                <div className="bg-emerald-100 text-emerald-800 p-2 rounded text-center">
                  🟡 Notes de la gamme
                </div>
                <div className="bg-slate-600 text-slate-300 p-2 rounded text-center">
                  ⚫ Hors gamme
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center">
                🎼 <span className="ml-2">Mode Degrés (Avancé)</span>
              </h4>
              <p className="text-slate-300 mb-3">Coloration selon les fonctions harmoniques.</p>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="bg-emerald-500 text-white p-2 rounded text-center">I - Tonique</div>
                <div className="bg-orange-400 text-white p-2 rounded text-center">ii - Sus-tonique</div>
                <div className="bg-yellow-400 text-slate-900 p-2 rounded text-center">iii - Médiante</div>
                <div className="bg-purple-400 text-white p-2 rounded text-center">IV - S.dominante</div>
                <div className="bg-blue-500 text-white p-2 rounded text-center">V - Dominante</div>
                <div className="bg-pink-400 text-white p-2 rounded text-center">vi - Sus.dominante</div>
              </div>
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-600/50 rounded-lg p-4">
            <h4 className="font-medium text-amber-300 mb-2">💡 Conseils d'utilisation :</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• Commencez par le <strong>mode Gamme</strong> pour apprendre</li>
              <li>• Les <strong>points colorés</strong> indiquent les notes importantes</li>
              <li>• <strong>Hover</strong> sur les touches pour voir les tooltips explicatifs</li>
              <li>• Changez de gamme pour voir la coloration s'adapter automatiquement</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'chords',
      title: 'Accords',
      icon: '🎹',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-400">🎹 Grille d'Accords Intelligente</h3>
          
          <p className="text-slate-300">
            La grille d'accords suggère automatiquement les accords compatibles avec votre gamme 
            et analyse votre historique pour des suggestions contextuelles.
          </p>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">📚 Types d'accords disponibles :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="bg-green-600 text-white px-2 py-1 rounded mb-2 text-center">Accords de base</div>
                  <p className="text-slate-300">Triades simples (Do, Ré, Mi...)</p>
                </div>
                <div>
                  <div className="bg-blue-600 text-white px-2 py-1 rounded mb-2 text-center">Accords de septième</div>
                  <p className="text-slate-300">Avec septième majeure ou mineure</p>
                </div>
                <div>
                  <div className="bg-purple-600 text-white px-2 py-1 rounded mb-2 text-center">Accords étendus</div>
                  <p className="text-slate-300">9ème, 11ème, 13ème, add9</p>
                </div>
                <div>
                  <div className="bg-orange-600 text-white px-2 py-1 rounded mb-2 text-center">Accords suspendus</div>
                  <p className="text-slate-300">sus2, sus4 pour créer des tensions</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎵 Fonctionnalités :</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">🔊</span>
                  <div>
                    <strong className="text-white">Aperçu audio :</strong>
                    <p className="text-slate-300">Cliquez sur 🔊 pour écouter l'accord avant de le placer</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">Insérer</span>
                  <div>
                    <strong className="text-white">Insertion rapide :</strong>
                    <p className="text-slate-300">Bouton "Insérer" pour ajouter l'accord au piano roll</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs">Smart</span>
                  <div>
                    <strong className="text-white">Suggestions contextuelles :</strong>
                    <p className="text-slate-300">L'IA analyse votre historique pour suggérer le prochain accord</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900/20 border border-emerald-600/50 rounded-lg p-4">
              <h4 className="font-medium text-emerald-300 mb-2">✨ Équivalences numériques :</h4>
              <p className="text-sm text-slate-300 mb-2">
                Chaque note affiche son numéro chromatique pour l'apprentissage :
              </p>
              <div className="grid grid-cols-6 gap-1 text-xs">
                <div className="bg-slate-700 text-center p-1 rounded">C(0)</div>
                <div className="bg-slate-700 text-center p-1 rounded">C#(1)</div>
                <div className="bg-slate-700 text-center p-1 rounded">D(2)</div>
                <div className="bg-slate-700 text-center p-1 rounded">D#(3)</div>
                <div className="bg-slate-700 text-center p-1 rounded">E(4)</div>
                <div className="bg-slate-700 text-center p-1 rounded">F(5)</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analysis',
      title: 'Analyse',
      icon: '📊',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-400">📊 Analyse Théorique Temps Réel</h3>
          
          <p className="text-slate-300">
            L'analyseur théorique examine votre séquence en temps réel et fournit des informations 
            détaillées sur l'harmonie, la mélodie et des conseils pédagogiques personnalisés.
          </p>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎯 Vue d'ensemble :</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• <strong>Tonalité détectée</strong> : Identification automatique de la gamme</li>
                <li>• <strong>Niveau de confiance</strong> : Pourcentage de certitude de l'analyse</li>
                <li>• <strong>Complexité</strong> : Débutant, Intermédiaire, Avancé</li>
                <li>• <strong>Caractère musical</strong> : Joyeux, Mélancolique, Mystérieux...</li>
                <li>• <strong>Statistiques</strong> : Nombre de notes, notes dans la gamme, étendue...</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎭 Analyse Harmonique :</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• <strong>Force de la tonalité</strong> : Stabilité harmonique (0-100%)</li>
                <li>• <strong>Progressions d'accords</strong> : Séquences détectées (I-V-vi-IV...)</li>
                <li>• <strong>Modulations</strong> : Changements de tonalité dans la séquence</li>
                <li>• <strong>Tensions harmoniques</strong> : Notes qui créent de la dissonance</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎶 Analyse Mélodique :</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• <strong>Contour</strong> : Forme de la mélodie (ascendant, arc, statique...)</li>
                <li>• <strong>Étendue</strong> : Nombre de demi-tons entre la note la plus grave/aiguë</li>
                <li>• <strong>Mouvement conjoint</strong> : Pourcentage de notes qui se suivent</li>
                <li>• <strong>Sauts mélodiques</strong> : Intervalles importants détectés</li>
                <li>• <strong>Point culminant</strong> : Note la plus haute et sa position</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎓 Conseils Pédagogiques :</h4>
              <p className="text-sm text-slate-300 mb-2">
                Le système génère automatiquement des conseils personnalisés selon :
              </p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Votre <strong>niveau détecté</strong> (complexité de la séquence)</li>
                <li>• La <strong>gamme utilisée</strong> et ses caractéristiques</li>
                <li>• Les <strong>erreurs courantes</strong> identifiées</li>
                <li>• Des <strong>suggestions d'amélioration</strong> concrètes</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">💡 Comment l'utiliser :</h4>
            <ol className="space-y-1 text-sm text-slate-300">
              <li>1. Créez ou chargez une séquence de notes</li>
              <li>2. L'analyse se met à jour automatiquement</li>
              <li>3. Naviguez entre les onglets pour explorer les différents aspects</li>
              <li>4. Cliquez sur les conseils pédagogiques pour les développer</li>
              <li>5. Utilisez les suggestions pour améliorer votre composition</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Workflow',
      icon: '🚀',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-400">🚀 Workflow de Composition</h3>
          
          <p className="text-slate-300">
            Guide pratique pour optimiser votre processus de composition avec le Scale Helper.
          </p>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎯 Étape 1 : Configuration</h4>
              <ol className="space-y-2 text-sm text-slate-300">
                <li>1. <strong>Choisir la gamme</strong> : Sélectionnez la tonalité de base (C majeur, D mineur...)</li>
                <li>2. <strong>Mode de coloration</strong> : Activez le mode "Gamme" pour voir les couleurs</li>
                <li>3. <strong>Snap-to-scale</strong> : Activez pour éviter les fausses notes</li>
                <li>4. <strong>Mode accords</strong> : Activez si vous composez avec des accords</li>
              </ol>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎵 Étape 2 : Composition</h4>
              <ol className="space-y-2 text-sm text-slate-300">
                <li>1. <strong>Commencez par la tonique</strong> : Placez des notes vertes (tonique)</li>
                <li>2. <strong>Ajoutez la dominante</strong> : Utilisez les notes bleues pour créer du mouvement</li>
                <li>3. <strong>Explorez les accords</strong> : Utilisez la grille d'accords avec aperçu audio</li>
                <li>4. <strong>Vérifiez l'analyse</strong> : Consultez l'onglet Analyse pour des suggestions</li>
              </ol>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎨 Étape 3 : Raffinement</h4>
              <ol className="space-y-2 text-sm text-slate-300">
                <li>1. <strong>Utilisez les suggestions</strong> : Suivez les conseils de l'analyseur</li>
                <li>2. <strong>Expérimentez les modes</strong> : Essayez le mode "Degrés" pour l'harmonie</li>
                <li>3. <strong>Corrigez automatiquement</strong> : Bouton "Corriger toutes les notes"</li>
                <li>4. <strong>Écoutez et ajustez</strong> : Utilisez play/pause pour évaluer le résultat</li>
              </ol>
            </div>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-600/50 rounded-lg p-4">
            <h4 className="font-medium text-emerald-300 mb-2">✨ Astuces de Pro :</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• <strong>Progressions populaires</strong> : Utilisez I-V-vi-IV pour commencer</li>
              <li>• <strong>Création d'accords</strong> : Cliquez sur plusieurs notes en même temps</li>
              <li>• <strong>Vélocité</strong> : Drag vertical sur les notes pour ajuster l'intensité</li>
              <li>• <strong>Durée</strong> : Drag horizontal pour créer des notes longues</li>
              <li>• <strong>Gammes exotiques</strong> : Explorez les modes (Dorien, Phrygien...)</li>
            </ul>
          </div>

          <div className="bg-amber-900/20 border border-amber-600/50 rounded-lg p-4">
            <h4 className="font-medium text-amber-300 mb-2">⚠️ Erreurs courantes à éviter :</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• Ne pas utiliser la tonique (notes vertes) assez souvent</li>
              <li>• Ignorer les suggestions d'analyse théorique</li>
              <li>• Utiliser trop de notes hors gamme sans justification</li>
              <li>• Ne pas écouter les aperçus audio des accords</li>
              <li>• Oublier de sauvegarder avec les presets</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'shortcuts',
      title: 'Raccourcis',
      icon: '⌨️',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-emerald-400">⌨️ Raccourcis Clavier</h3>
          
          <p className="text-slate-300">
            Maîtrisez ces raccourcis pour une composition ultra-rapide !
          </p>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎵 Transport et Lecture :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Play / Pause</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Espace</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Stop</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Espace (x2)</kbd>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">✂️ Édition et Sélection :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Sélectionner tout</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Ctrl + A</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Copier</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Ctrl + C</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Coller</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Ctrl + V</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Supprimer</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Del / Backspace</kbd>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">↩️ Undo / Redo :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Annuler</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Ctrl + Z</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Refaire</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Ctrl + Y / Ctrl + Shift + Z</kbd>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎯 Navigation et Déplacement :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Déplacer notes ←/→</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">← / →</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Déplacer notes ↑/↓</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">↑ / ↓</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Déplacement rapide</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Shift + Flèches</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Désélectionner</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Esc</kbd>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">🎼 Actions Scale Helper :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Vider grille</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">Sélection multiple</span>
                  <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Ctrl + Clic</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">💡 Astuces Raccourcis :</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• Maintenez <kbd className="bg-slate-600 px-1 rounded text-xs">Shift</kbd> pour des déplacements rapides (4 steps / 1 octave)</li>
              <li>• <kbd className="bg-slate-600 px-1 rounded text-xs">Ctrl + Clic</kbd> pour sélectionner plusieurs notes individuellement</li>
              <li>• Drag sur une note longue pour ajuster la vélocité de toute la note</li>
              <li>• Les raccourcis fonctionnent même quand les dialogs sont ouverts</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentSection = helpSections.find(section => section.id === activeSection) || helpSections[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <h2 className="text-2xl font-bold text-emerald-400 flex items-center">
            📚 Guide du Scale Helper
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation */}
          <div className="w-1/4 border-r border-slate-600 bg-slate-900/50 p-4">
            <nav className="space-y-2">
              {helpSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === section.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentSection.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDialog;