# CLAUDE.md - Melody Sequencer Project

This file provides guidance to Claude Code (claude.ai/code) when working with the Melody Sequencer project.

## But du projet

Ce projet a pour but de facilité l'inspiration de l'utilisateur dans la recherche de sequences musicales, ce projet est un outils en parrallele d'un DAW,
Ce projet doit pouvoir creer des sequences musicales en respectant les critères de l'utilisateur, il doit egalement donner des suite de note ou des sequences completes en fonction des notes présentes sur la grille du piano roll.
Actuellement le projet est orienté vers la musique electronique type trance goa, psytrance...

Ce projet est en constante evolution c'est pourqui une approche modulaire a été adoptée.

## 🎯 Project Structure Overview

This project uses a **dual-version architecture** with V1 (stable) and V2 (modern) development streams:

```
melody-sequencer/
├── v1/                    # Stable version (JavaScript)
│   ├── CLAUDE_V1.md      # Complete V1 documentation
│   └── ...               # Working V1 codebase
├── v2/                    # Modern version (TypeScript + AI)  
│   ├── CLAUDE_V2.md      # V2 architecture and patterns
│   └── ...               # V2 development codebase
└── README.md             # Project overview and quick start
```

## 🚦 Working with Versions

### **When working on V1 (Stable/Maintenance):**
- Read `v1/CLAUDE_V1.md` for complete V1 documentation
- V1 is **feature-frozen** - only critical bugfixes
- Focus on stability and user experience
- Contains full project history and lessons learned

### **When working on V2 (Active Development):**
- Read `v2/CLAUDE_V2.md` for architecture details
- V2 has a **simple and robust foundation** - no more crashes!
- Use `SimpleAudioEngine` as base for all audio features
- Add features via the extensible menu system
- Focus on progressive enhancement over complex architecture

## 🎵 Current Development Status (2025-07-28) - **SÉQUENCEUR COMPLET + IA HYBRIDE + SYSTÈME APPRENTISSAGE**

### V1 Status
- ✅ **Production ready** - Fully functional sequencer
- ⚠️ **Known issues** - Transport timing bugs, speed change issues
- 🔒 **Maintenance mode** - No new features, stability focus
- 📚 **Complete documentation** in `v1/CLAUDE_V1.md`

### V2 Status - 🎹 **SÉQUENCEUR PROFESSIONNEL COMPLET + ÉDITEUR GAMMES + MIDI OUTPUT + TOUTES FONCTIONNALITÉS**
- ✅ **Piano Roll DAW-Grade** - Interface professionnelle style studio
- ✅ **Audio Polyphonique** - SimpleAudioEngine avec PolySynth + reverb
- ✅ **Navigation Octaves** - Scroll/boutons, gamme C1-C7 complète
- ✅ **Steps Variables** - Support 8/16/32/64 steps avec accents adaptatifs
- ✅ **Éditeur Vélocité** - Couleurs vert→rouge + drag vertical temps réel
- ✅ **Notes Longues** - Support durée + redimensionnement horizontal
- ✅ **Sélection Multiple** - Rectangle, Ctrl+clic, copier/coller intelligent
- ✅ **Déplacement Flèches** - Navigation précise avec clavier + Shift rapide
- ✅ **Export MIDI Professionnel** - Module réutilisable, timing parfait
- ✅ **Import MIDI Complet** - Drag & drop + sélecteur, limitation 64 steps automatique
- ✅ **Système Presets Complet** - Sauvegarde localStorage + export/import JSON + **suppression des presets**
- ✅ **Raccourcis Clavier Globaux** - 20+ raccourcis professionnels (Espace=Play, Ctrl+Z/Y, etc.)
- ✅ **Copier/Coller Intelligent** - Positions relatives + collage position souris
- ✅ **Undo/Redo Professionnel** - Historique 50 actions avec interface complète
- ✅ **Vitesses de Lecture** - 1/8, 1/16, 1/32 (audio seulement, MIDI toujours cohérent)
- ✅ **Responsive Design** - Optimisé mobile/tablette avec interactions tactiles
- ✅ **Architecture Robuste** - Base stable et extensible
- ✅ **MODULARISATION COMPLÈTE** - Architecture modulaire Phase 3.3 terminée avec succès
- ✅ **Pages Test Modulaires** - 2 pages test complètes avec toutes fonctionnalités
- ✅ **Hub Interactif Complet** - Gestion tâches, notes, statuts + export/import + corrections UX
- ✅ **🎨 GÉNÉRATEUR INSPIRATION** - Moteur de génération basé sur randomEngine V1 + 6 ambiances + interface complète
- ✅ **🎼 ÉDITEUR DE GAMMES COMPLET** - Création, gestion et export de gammes personnalisées + intégration générateur
- ✅ **MIDI Output Temps Réel** - Contrôle devices externes + toggle audio interne + interface complète
- ✅ **🤖 GÉNÉRATION IA MAGENTA.JS** - Intégration complète avec contraintes musicales (Phase 1-3 terminées)
- ✅ **🎹 MIDI INPUT TEMPS RÉEL** - Contrôle piano roll via clavier maître + recording + playthrough + diagnostic complet
- ✅ **🧠 SYSTÈME IA HYBRIDE COMPLET** - Apprentissage personnel + alimentation patterns avec tags
- ✅ **👍 ALIMENTATION IA INTELLIGENTE** - Dialog sélection style/part + métadonnées précises
- ✅ **📊 DATASET PERSONNEL** - Collecte patterns aimés + statistiques d'apprentissage + export/import
- 📱 **Mobile-First** - Interface tactile professionnelle

### 🎯 **Priorités V2 (Prochaines Étapes)**
1. ✅ ~~**Presets System**~~ - **TERMINÉ** - Sauvegarde localStorage + export/import JSON + **suppression presets**
2. ✅ ~~**Raccourcis Clavier**~~ - **TERMINÉ** - 20+ shortcuts professionnels  
3. ✅ ~~**Undo/Redo**~~ - **TERMINÉ** - Historique 50 actions avec interface
4. ✅ ~~**MIDI Import**~~ - **TERMINÉ** - Drag & drop + limitation 64 steps
5. ✅ ~~**Modularisation Piano Roll**~~ - **TERMINÉ** - Architecture hooks + utils modulaire
6. ✅ ~~**Composants UI Modulaires - Phase 3.3**~~ - **TERMINÉ** - 5 composants modulaires fonctionnels + page test
7. ✅ ~~**Copier/Coller Modulaire**~~ - **TERMINÉ** - Implémenté dans pages test modulaires avec positions relatives
8. ✅ ~~**Hub Interactif**~~ - **TERMINÉ** - Gestion tâches/notes/statuts + corrections UX + export/import
9. ✅ ~~**🎨 Générateur Inspiration**~~ - **TERMINÉ** - Moteur randomEngine V1 adapté TypeScript + 6 ambiances + interface complète
10. ✅ ~~**🎼 Éditeur de Gammes**~~ - **TERMINÉ** - Création/gestion gammes personnalisées + intégration générateur + corrections UX
11. ✅ ~~**MIDI Output Temps Réel**~~ - **TERMINÉ** - Contrôle devices externes + toggle audio interne + corrections z-index
12. ✅ ~~**🤖 Génération IA Magenta.js**~~ - **TERMINÉ** - Phase 1-3 complètes avec contraintes musicales
13. ✅ ~~**🎹 MIDI Input Temps Réel**~~ - **TERMINÉ** - Contrôle clavier maître + recording + playthrough
14. ✅ ~~**🧠 Système IA Hybride**~~ - **TERMINÉ** - UserPatternCollector + alimentation intelligente + dataset personnel
15. ✅ ~~**👍 Tags Alimentation IA**~~ - **TERMINÉ** - Dialog sélection style/part + métadonnées précises
16. **Quantization** - Alignement automatique des notes sur la grille
17. **Assistant de Gammes** - Assistant gammes et accords musicaux NOTA: assitantGamme existe déjà mais il faut ajouter de l'attractivité a ce mode.
18. **Multi-patterns** - Gestion de plusieurs patterns/séquences
19. **Génération IA Avancée** - Modèles Magenta supplémentaires (MelodyRNN, PerformanceRNN)

## 🛠️ Quick Development Commands

### V1 (Stable)
```bash
cd v1
npm install
npm run dev      # → http://localhost:3000
npm run lint
```

### V2 (Simple & Robuste)
```bash
cd v2
npm install      # Setup dependencies
npm run dev      # → http://localhost:3000 (menu extensible)
npm run build    # Compile production
npm run lint     # Linting (désactivé temporairement)
```

## 🧭 Decision Tree: Which Version to Work On?

**Work on V1 if:**
- ❗ **Critical bug** affecting user experience
- 🔧 **Quick fix** needed for production use
- 📚 **Understanding** existing architecture/features
- 🔍 **Investigating** bugs to avoid in V2

**Work on V2 if:**
- ✨ **New features** - Ajouter des fonctionnalités au menu extensible
- 🏗️ **Architecture** - Construire sur la base SimpleAudioEngine stable
- 🎵 **Core features** - Séquenceur, PianoRoll, Transport, Export MIDI
- 📈 **Long-term** development goals

## ⚠️ Important Notes

### ❌ Architecture Complexe Évitée (Leçons Apprises)
- EventBus et singletons multiples causaient des plantages
- Lazy loading Tone.js mal implémenté créait des blocages  
- PatternEngine et SynthEngine séparés ajoutaient de la complexité
- Architecture modulaire trop complexe pour les besoins actuels

### ✅ Architecture Simple Adoptée (Ce qui Marche)
- **SimpleAudioEngine** - Une classe, une responsabilité, pas de plantage
- **useSimpleAudio** - Hook minimaliste avec polling d'état
- **Menu extensible** - Système simple pour ajouter des features
- **Types simplifiés** - Seulement ce qui est réellement utilisé
- **Structure claire** - Organisation logique et documentée

## 📖 Documentation Navigation

### 📁 V1 (Stable)
- **V1 Complete Docs**: `v1/CLAUDE_V1.md` - Architecture complète V1
- **Development History**: Timeline complète dans les docs V1

### 📁 V2 (Simple & Robuste)  
- **V2 Architecture**: `v2/CLAUDE_V2.md` - Architecture détaillée
- **Menu System**: `v2/MENU_SYSTEM.md` - Guide pour ajouter des features
- **Project Structure**: `v2/PROJECT_STRUCTURE.md` - Structure après nettoyage
- **Cleanup Summary**: `v2/CLEANUP_SUMMARY.md` - Résumé du nettoyage

### 🚀 Comment Ajouter une Feature V2
1. **Ajouter l'item** dans `v2/src/data/menuItems.ts`
2. **Créer la page** dans `v2/src/app/ma-feature/page.tsx`  
3. **Développer** en utilisant `SimpleAudioEngine` comme base
4. **Tester** via le menu de debug
5. **Documenter** et mettre à jour le status

---

**🎵 V2 est prêt pour le développement avec une base solide et un système extensible!**

  📋 **TOUTES LES FONCTIONNALITÉS CORE TERMINÉES !**
  ✅ Piano Roll Professionnel DAW-grade
  ✅ Export/Import MIDI complet avec limitation intelligente
  ✅ Système Presets localStorage + JSON + **suppression presets**
  ✅ Raccourcis Clavier Globaux (20+ shortcuts)
  ✅ Undo/Redo Professionnel (50 actions)
  ✅ Vélocité couleurs + drag vertical temps réel
  ✅ Notes longues + redimensionnement horizontal
  ✅ Sélection multiple + copier/coller intelligent + flèches
  ✅ Interface responsive mobile/desktop parfaite
  ✅ Architecture robuste SimpleAudioEngine
  ✅ Modularisation complète (5 composants UI + 8 hooks + 4 utils + 2 pages test complètes)
  ✅ Copier/Coller Modulaire avec positions relatives dans pages test
  ✅ **Hub Interactif** - Gestion tâches/notes/statuts + corrections UX + export/import
  ✅ **🎨 GÉNÉRATEUR INSPIRATION** - Moteur de génération automatique complet basé sur randomEngine V1
  ✅ **🎼 ÉDITEUR DE GAMMES COMPLET** - Création/gestion gammes personnalisées + intégration générateur
  ✅ **🧠 SYSTÈME IA HYBRIDE COMPLET** - UserPatternCollector + dataset personnel + apprentissage intelligent
  ✅ **👍 ALIMENTATION IA AVEC TAGS** - Dialog sélection style/part + métadonnées précises + workflow optimisé
  ✅ **MIDI Output Temps Réel** - Contrôle devices externes + toggle audio interne + corrections UX
  
  🎯 **PAGES TEST MODULAIRES (Session 2025-07-25) :**
  1. **`/test-complete`** - Test modulaire complet avec tous composants
  2. **`/pianorollBase/test-navigation`** - Test navigation + raccourcis + copier/coller
  3. **Fonctionnalités communes** : Copier/coller intelligent, raccourcis clavier, déplacement flèches
  4. **Architecture TypeScript** : Props correctes, gestion erreurs, accessibilité

  🎯 **NOUVELLES FONCTIONNALITÉS IA HYBRIDE (Session 2025-07-28) :**
  
  ## 🧠 **SYSTÈME IA HYBRIDE COMPLET**
  - **Architecture hybride** : Combine algorithme Inspiration + apprentissage Magenta.js
  - **UserPatternCollector.ts** : Classe complète collecte/analyse/gestion patterns aimés
  - **Dataset personnel** : Stockage localStorage avec métadonnées enrichies
  - **Statistiques temps réel** : Dashboard progression apprentissage (50 patterns = seuil)
  - **Export/Import JSON** : Sauvegarde et partage datasets personnels
  
  ## 👍 **ALIMENTATION IA AVEC TAGS**
  - **Dialog métadonnées** : Interface sélection style (6 choix) + part (5 choix) + description
  - **Workflow optimisé** : `/inspiration` génère → dialog tags → confirmation → dataset enrichi
  - **Pré-remplissage intelligent** : Paramètres générateur suggérés automatiquement
  - **Feedback enrichi** : Messages incluent style/part sélectionnés
  - **Traçabilité complète** : Historique undo/redo avec détails métadonnées
  
  ## 📊 **GESTION DATASET INTELLIGENTE**
  - **Pages réorganisées** : `/inspiration` pour alimenter, `/inspirationIA` pour gérer
  - **Interface `/inspirationIA`** : Focus gestion dataset + statistiques + workflow guidé
  - **Bouton `/inspiration`** : "👍 Alimenter IA" avec dialog sélection intentionnelle
  - **Apprentissage ciblé** : Chaque pattern correctement catégorisé par l'utilisateur
  - **Phase 2 préparée** : Architecture prête pour entraînement personnalisé à 50+ patterns

  🎯 **FONCTIONNALITÉS PRÉCÉDENTES (Session 2025-07-25) :**
  
  ## 🗑️ **GESTION PRESETS COMPLÈTE**
  - **Suppression presets** : Bouton 🗑️ rouge dans dialog "📁 Charger"
  - **Confirmation sécurisée** : "Supprimer définitivement le preset '[nom]' ?"
  - **Feedback utilisateur** : Message "✅ Preset '[nom]' supprimé"
  - **Interface améliorée** : Boutons "📁 Charger" + "🗑️" côte à côte
  - **Fonction** : `PresetManager.deletePreset()` avec mise à jour automatique

  ## 🎛️ **CORRECTIONS UX PIANO ROLL**
  - **Bouton renommé** : "🗑️ Clear" → "🗑️ Vider Grille"
  - **Tooltip amélioré** : "Vider la grille - Efface toutes les notes (raccourci: N)"
  - **Clarification** : Plus de confusion entre actions d'effacement
  - **Cohérence interface** : Terminologie unifiée

  ## 🏠 **HUB INTERACTIF CORRIGÉ**
  - **Zone cliquable corrigée** : Bouton "🔗 Accéder" dédié (plus de zone entière cliquable)
  - **Sélection type tâches** : Interface pour choisir test/bug/feature/doc
  - **Sélection type notes** : Interface pour choisir info/warning/error/idea
  - **Prévention erreurs hydratation** : `isMounted` + vérifications localStorage
  - **UX cohérente** : Formulaires similaires pour checkboxes et notes

  ## 🎨 **GÉNÉRATEUR INSPIRATION - SYSTÈME COMPLET (Session 2025-07-25)**
  - **🎯 Page `/inspiration`** : Piano Roll + moteur de génération intégré
  - **🏗️ InspirationEngine.ts** : Port TypeScript complet du randomEngine.js V1
  - **🎵 5 Types de patterns** : Bassline, Lead, HypnoticLead, Pad, Arpège
  - **🎨 6 Ambiances prédéfinies** : Énergique, Mystérieux, Nostalgique, Tribal, Cosmique, Hypnotique
  - **🎛️ 4 Styles musicaux** : Goa (variations subtiles), Psy (pondération phrygienne), Prog (hooks fixes), Deep (downtempo)
  - **🎹 14 Gammes** : Minor, Major, Phrygian, Hungarian, Enigmatic, Japanese, etc.
  - **🌟 Post-traitement** : Dark (-30 vélocité), Uplifting (+15), Dense (+30% notes)
  - **🚀 Interface double** : Génération rapide (3 boutons) + Générateur avancé (dialog complet)
  - **➕ Mode ajout** : Ajouter au pattern existant sans écraser
  - **♿ Accessibilité** : Tous les selects avec attributs title
  - **🎼 Algorithmes V1** : Bassline Goa/Psy, Lead avec pondération, Hypnotique évolutif
  - **🎯 Intégration parfaite** : Compatible avec tous composants modulaires + presets + undo/redo

  ## 🎼 **ÉDITEUR DE GAMMES COMPLET - SYSTÈME MUSICAL AVANCÉ (Session 2025-07-25)**
  - **🎯 Interface 3 onglets** : Créer, Gérer, Import/Export avec navigation intuitive
  - **🎵 Création assistée** : Sélecteur visuel 12 notes + presets rapides (Majeure, Mineure, Dorien, etc.)
  - **✅ Validation temps réel** : Vérification erreurs/avertissements + feedback immédiat
  - **🔧 Tonique automatique** : Note 0 (C) pré-sélectionnée + toujours incluse (correction UX majeure)
  - **💾 Persistance localStorage** : Sauvegarde automatique + limite 50 gammes
  - **📤 Export/Import JSON** : Partage gammes entre utilisateurs + backup
  - **🗑️ Gestion complète** : Suppression avec confirmation + mise à jour temps réel
  - **🎨 Intégration générateur** : Gammes personnalisées dans dialog génération + sélection automatique
  - **📖 ScaleManager.ts** : API complète validation/persistance + types TypeScript
  - **♿ Accessibilité** : Tooltips explicatifs + navigation clavier + messages d'aide
  - **🔄 Rafraîchissement dynamique** : Liste gammes mise à jour automatiquement après création
  - **🎼 Gammes built-in** : 14 gammes professionnelles + possibilité ajout illimité
  - **🌟 UX optimisée** : "💡 La tonique (C/0) est automatiquement incluse" + feedback visuel

  ## 🎛️ **MIDI OUTPUT TEMPS RÉEL - CONTRÔLE HARDWARE PROFESSIONNEL**
  - **🎹 Web MIDI API** : Détection automatique devices + connexion temps réel
  - **🔧 Interface complète** : Sélection device + enable/disable + status display
  - **🔇 Toggle audio interne** : Désactivation automatique synthé quand MIDI Output actif
  - **⚠️ Corrections z-index** : Dialog au niveau racine + z-[9999] + fermeture multiple (ESC, clic, bouton)
  - **🎵 Note mapping** : Conversion velocity + timing parfait + panic function
  - **📱 Responsive** : Interface adaptée mobile/desktop + boutons tactiles
  - **💡 Feedback utilisateur** : Status en temps réel + messages explicatifs
  - **🏗️ MidiOutputEngine.ts** : Architecture modulaire + gestion erreurs complète

  ## 🤖 **GÉNÉRATION IA MAGENTA.JS - SYSTÈME COMPLET (Session 2025-07-26)**
  
  ### **📖 Fonctionnement de Magenta.js dans le projet :**
  
  **Magenta.js** est une bibliothèque JavaScript de Google qui utilise l'Intelligence Artificielle pour générer de la musique. Dans notre projet, elle fonctionne selon ce pipeline :
  
  ```
  🤖 IA Magenta.js → 🔄 Conversion → 🎯 Contraintes Musicales → 🎹 Piano Roll
  ```
  
  ### **🌐 Exigences techniques et ressources :**
  
  **Connexion Internet :**
  - **✅ Obligatoire lors de la première initialisation** : Téléchargement du modèle pré-entraîné (~2-10 MB)
  - **⚡ Hors ligne ensuite** : Une fois chargé en mémoire, fonctionne sans connexion
  - **URL checkpoint** : `https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small`
  
  **Type d'appels et performances :**
  - **Initialisation** : Appel HTTP unique pour télécharger le modèle TensorFlow.js
  - **Génération** : 100% locale via WebGL/CPU (pas d'appel serveur)
  - **Latence** : ~500ms-2s pour générer 4-8 notes selon la complexité
  - **Modèle utilisé** : MusicVAE "mel_2bar_small" (mélodie sur 2 mesures, version légère)
  
  **Ressources système :**
  - **Mémoire** : ~50-100 MB RAM pour le modèle chargé
  - **GPU** : Utilise WebGL si disponible (accélération hardware)
  - **CPU** : Fallback sur CPU si pas de WebGL
  - **Navigateur** : Modern browsers avec support ES6+ et WebGL
  - **Cache** : Modèle mis en cache navigateur (IndexedDB) après premier téléchargement
  
  **Architecture TensorFlow.js :**
  - **Backend** : Détection automatique (webgl > cpu > wasm)
  - **Tensors** : Gestion automatique de la mémoire GPU/CPU
  - **Modèle** : Réseau de neurones pré-entraîné sur millions de mélodies MIDI
  - **Format interne** : Représentation vectorielle des notes musicales
  - **Température** : Paramètre de créativité (0.1 = répétitif, 1.5 = chaos)
  
  **Sécurité et vie privée :**
  - **Données** : Aucune donnée utilisateur envoyée à Google
  - **Traitement local** : Génération 100% côté client
  - **CORS** : Accès checkpoint via HTTPS sécurisé
  - **Offline** : Fonctionne sans connexion après initialisation
  
  **Phase 1 - Intégration de base :**
  - **Installation** : `@magenta/music` via npm (144 packages, ~15 MB)
  - **Import dynamique** : `await import('@magenta/music')` pour éviter le chargement initial
  - **Checkpoint loading** : Download automatique du modèle pré-entraîné au premier usage
  - **Test complet** : Interface de diagnostic avec status en temps réel + gestion d'erreurs réseau
  
  **Phase 2 - Conversion intelligente :**
  - **Format source** : Notes Magenta (pitch MIDI, startTime, endTime, velocity 0-1)
  - **Format cible** : NoteEvent (step, note, velocity MIDI, duration, isActive)
  - **Conversion timing** : Quantification automatique sur la grille du séquenceur
  - **Fallbacks robustes** : Gestion des cas problématiques (notes au même temps, vélocités nulles)
  - **Adaptation contextuelle** : Respect du tempo, stepCount et subdivision du projet
  
  **Phase 3 - Contraintes musicales :**
  - **Système de contraintes** : Application de vos paramètres musicaux aux sorties IA
  - **Gammes** : Force les notes dans la gamme choisie (C minor, D phrygian, etc.)
  - **Octaves** : Limite l'étendue des notes (1-7, configurable)
  - **Styles musicaux** : Psy (accents contretemps), Goa (variations), Prog (build-ups), Deep (douceur)
  - **Profils vélocité** : Dark (-30), Uplifting (+15), Dense (+20), Default
  - **5 presets de style** : Psy Trance, Goa Trance, Dark Psy, Progressive, Deep House
  
  ### **🔧 Architecture technique :**
  
  **Modules créés :**
  - **`magentaConverter.ts`** : Conversion Magenta → NoteEvent avec timing intelligent
  - **`aiConstraints.ts`** : Système de contraintes musicales avec presets
  - **`MagentaTest.tsx`** : Interface complète de test et configuration
  
  **Fonctionnalités clés :**
  - **Toggle contraintes** : Activer/désactiver facilement
  - **Interface 3 colonnes** : IA brutes | Converties | Contraintes finales
  - **Configuration complète** : 6 paramètres ajustables en temps réel
  - **Debug complet** : Logs détaillés de chaque étape de conversion
  - **Intégration transparente** : Les notes IA s'ajoutent directement au piano roll
  
  ### **🎵 Avantage unique :**
  
  **Le meilleur des deux mondes :**
  - **L'IA Magenta.js** apporte la créativité et les patterns complexes
  - **Vos contraintes musicales** garantissent la cohérence avec votre style
  - **Résultat** : Notes utilisables immédiatement dans vos compositions
  
  **Page de test :** `/inspirationIA` dans la section Expérimental
  
  **Workflow utilisateur :**
  1. Init Modèle → Configuration contraintes → Génération
  2. Les notes respectent automatiquement vos choix musicaux
  3. Édition, lecture et export comme des notes normales
  
  ### **⚠️ Limitations et recommandations :**
  
  **Limitations techniques :**
  - **Première utilisation** : Nécessite 5-15s pour télécharger + initialiser le modèle
  - **Taille mémoire** : Peut impacter les devices avec <4GB RAM
  - **Navigateurs anciens** : Incompatible avec IE, Safari <14, Chrome <80
  - **Mobile** : Performances réduites sur smartphones/tablettes bas de gamme
  
  **Limitations musicales :**
  - **Modèle actuel** : Optimisé pour mélodies courtes (2 mesures max)
  - **Style** : Entraîné sur dataset occidental (pop, classical, folk)
  - **Complexité** : Patterns relativement simples (pas de polyphonie complexe)
  - **Cohérence** : Peut générer des notes musicalement étranges sans contraintes
  
  **Recommandations d'usage :**
  - **Connexion stable** : Utiliser sur WiFi pour la première initialisation
  - **Workflow** : Activer les contraintes musicales pour des résultats cohérents
  - **Créativité** : Utiliser comme source d'inspiration, pas de remplacement
  - **Édition** : Toujours ajuster manuellement les résultats selon vos besoins

  ## 🧠 **SYSTÈME IA HYBRIDE COMPLET + ALIMENTATION INTELLIGENTE (Session 2025-07-28)**
  
  ### **🎯 Architecture IA Hybride - Le meilleur des deux mondes :**
  
  Le système combine l'efficacité de l'algorithme Inspiration avec l'apprentissage personnalisé via Magenta.js :
  
  ```
  🎨 Algorithme Inspiration → 👍 Alimentation IA → 📊 Dataset Personnel → 🧠 IA Personnalisée
  ```
  
  ### **👍 ALIMENTATION IA INTELLIGENTE - Système de Tags (Session 2025-07-28) :**
  
  **Interface Dialog Métadonnées :**
  - **🎨 Style Musical** : Sélection parmi 6 styles (Goa, Psy, Prog, Deep, Tribal, Dark)
  - **🎵 Type de Pattern** : Sélection parmi 5 types (Bassline, Lead, Lead Hypnotique, Pad, Arpège)
  - **📝 Description** : Champ libre pour annotations personnalisées
  - **ℹ️ Métadonnées automatiques** : Tempo, steps, gamme, source automatiquement ajoutées
  
  **Workflow Utilisateur Optimisé :**
  1. **Page `/inspiration`** → Génération de patterns avec algorithme avancé
  2. **Clic "👍 Alimenter IA"** → Dialog de sélection des métadonnées s'ouvre
  3. **Sélection intentionnelle** → L'utilisateur choisit style et fonction musicale
  4. **Confirmation** → Pattern sauvegardé avec métadonnées précises
  5. **Page `/inspirationIA`** → Consultation des statistiques d'apprentissage
  
  **Avantages du Système de Tags :**
  - ✅ **Dataset précis** : Chaque pattern correctement catégorisé par l'utilisateur
  - ✅ **Intention musicale claire** : Style et fonction explicitement définis
  - ✅ **Apprentissage ciblé** : L'IA apprend des patterns spécifiques par catégorie
  - ✅ **Feedback enrichi** : Messages incluent style/part sélectionnés
  - ✅ **Traçabilité** : Historique avec informations détaillées
  
  ### **📊 DATASET PERSONNEL - UserPatternCollector.ts :**
  
  **Collecte et Analyse :**
  - **Storage localStorage** : Persistance des patterns aimés avec métadonnées complètes
  - **Analyse musicale automatique** : Octaves, vélocités, complexité rythmique, notes prédominantes
  - **Statistiques en temps réel** : Compteurs par style/part, moyennes, progression vers entraînement
  - **Export/Import JSON** : Sauvegarde et partage des datasets personnels
  
  **Interface de Gestion (/inspirationIA) :**
  - **📈 Dashboard statistiques** : Patterns positifs/négatifs, styles préférés, tempo moyen
  - **🎯 Barre de progression** : Visualisation vers le seuil d'entraînement (50 patterns)
  - **💡 Workflow guidé** : Instructions claires pour alimenter depuis `/inspiration`
  - **🔧 Gestion avancée** : Suppression, export, recommandations personnalisées
  
  **Types et Interfaces TypeScript :**
  ```typescript
  interface PatternTrainingData {
    id: string;
    timestamp: number;
    pattern: NoteEvent[];
    metadata: PatternMetadata;
    userRating: number;
    source: 'inspiration' | 'manual' | 'ai' | 'import';
    musicContext: MusicContext;
  }
  
  interface PatternMetadata {
    style: 'goa' | 'psy' | 'prog' | 'deep' | 'tribal' | 'dark';
    part: 'bassline' | 'lead' | 'hypnoticLead' | 'pad' | 'arpeggio';
    tempo: number;
    stepCount: number;
    root: string;
    scale: string;
    description?: string;
  }
  ```
  
  ### **🚀 Phase 2 Future - Entraînement Personnalisé :**
  
  **Objectifs :**
  - **Modèle IA personnalisé** : Entraîné sur vos préférences musicales uniquement
  - **Génération dans votre style** : Patterns cohérents avec vos goûts
  - **Recommandations intelligentes** : Paramètres suggérés basés sur votre historique
  - **Apprentissage continu** : L'IA s'améliore avec chaque pattern alimenté
  
  **Seuil d'entraînement :** 50+ patterns positifs pour déclencher l'entraînement automatique

  ## 🎹 **MIDI INPUT TEMPS RÉEL - SYSTÈME COMPLET (Session 2025-07-26)**
  
  ### **🚀 DÉPLOIEMENT ASSISTANTGAMME (Session 2025-07-27)** 
  - **✅ Architecture copiée** : de `/pianorollBaseSettings` vers `/assitantGamme`
  - **✅ MIDI Input hooks** : `useMidiInputForMode` + `useMidiConfig` + `useMidiConfigLoader`
  - **✅ Callbacks temps réel** : `onNoteRecorded` avec position boucle calculée
  - **✅ Interface utilisateur** : Barre status MIDI identique avec ARM/REC/STOP
  - **✅ Workflow opérationnel** : ARM → REC+lecture → notes ajoutées temps réel → STOP
  - **✅ Test réussi** : Build compilation OK + serveur démarré port 3001
  - **🎼 Fonctionnalité unique** : MIDI Recording avec assistant gammes et coloration scale
  
  ### **🚀 DÉPLOIEMENT PIANOROLLBASE (Session 2025-07-27)** 
  - **✅ Mode principal** : `/pianorollBase` désormais équipé du système MIDI Recording complet
  - **✅ Architecture identique** : Pattern éprouvé appliqué avec succès depuis `/pianorollBaseSettings`
  - **✅ Interface mise à jour** : Titre "Piano Roll Base - Mode Principal + MIDI Recording"
  - **✅ Compilation réussie** : Build OK + serveur sur port 3002
  - **🎯 Impact** : Le mode principal modulaire a maintenant l'enregistrement MIDI temps réel
  - **📊 Status déploiement** : 3 pages équipées (/pianorollBaseSettings, /assistantGamme, /pianorollBase)

  ### **🎯 Architecture MIDI Input :**
  - **`MidiInputEngine.ts`** - Moteur Web MIDI API complet avec Web MIDI API native
  - **`useMidiInput.ts`** - Hook React avec polling d'état (même pattern que MIDI Output)
  - **`MidiConfigContext.tsx`** - Contexte React global pour état MIDI partagé
  - **Configuration centralisée** - Page `/configuration` pour tous paramètres MIDI
  
  ### **🎵 Fonctionnalités opérationnelles :**
  - **🎹 Détection automatique** - Scan devices MIDI connectés en temps réel
  - **🔊 Playthrough audio** - Feedback via SimpleAudioEngine (`playNote/stopNote`)
  - **🎥 Recording intelligent** - Capture timing précis vers piano roll avec quantization
  - **⚙️ Configuration avancée** - Canal MIDI, transposition octave, scaling vélocité
  - **📊 Status temps réel** - Affichage connexions + notes actives + diagnostic
  
  ### **🔧 Configuration MIDI Input :**
  - **Canal MIDI** : Tous canaux ou canal spécifique (1-16)
  - **Transposition** : -3 à +3 octaves avec mapping intelligent
  - **Scaling vélocité** : 0.1x à 2.0x pour ajustement dynamique
  - **Mode recording** : Timing quantization automatique sur grille
  - **Playthrough** : Toggle indépendant pour monitoring
  
  ### **🚀 Interface utilisateur :**
  - **Boutons diagnostic** : Test Audio, Init Audio, status détaillé
  - **Piano roll simplifié** : Grille cliquable avec affichage notes temps réel  
  - **Status dashboard** : Audio Engine, MIDI connections, séquenceur
  - **Debug complet** : Logs console pour troubleshooting
  
  ### **✅ PROBLÈME RÉSOLU - Playthrough audio fonctionnel :**
  - **Solution implémentée** : Callbacks MIDI persistants au niveau page principale
  - **Fix appliqué** : Auto-sélection device + callbacks dans useEffect page
  - **Status** : 100% fonctionnel, playthrough audio permanent
  
  ### **🎛️ Pages et intégration :**
  - **Configuration centralisée** : `/configuration` - paramètres MIDI IN/OUT globaux
  - **Intégration modes** : Tous modes piano roll utilisent `useMidiInputForMode()`
  - **Test avancé** : `/pianorollBaseSettings` - mode test avec MIDI intégré
  - **Persistance** : `MidiConfigStorage` - localStorage pour settings permanents
  
  ## 🔧 **CONFIGURATION CENTRALISÉE - SYSTÈME UNIFIÉ (Session 2025-07-27)**
  
  ### **🎯 Nouveau système de configuration globale :**
  - **Page `/configuration`** - Interface unique pour tous paramètres MIDI/Audio
  - **React Context** - `MidiConfigContext` pour état partagé en temps réel
  - **Persistance localStorage** - `MidiConfigStorage` pour settings permanents
  - **Hook simplifié** - `useMidiInputForMode()` pour intégration facile modes
  
  ### **🏗️ Architecture centralisée :**
  - **Élimination duplication** - Plus de panels MIDI dans chaque mode
  - **Configuration unique** - Device MIDI sélectionné une fois, utilisé partout
  - **Sauvegarde automatique** - Paramètres persistent entre sessions
  - **Interface claire** - Boutons explicites avec feedback visuel
  
  ### **🎛️ Workflow utilisateur optimisé :**
  1. **Configuration** : `/configuration` → sélectionner devices MIDI IN/OUT
  2. **Mode piano roll** : ARM → REC → Recording → Stop (boutons séparés)
  3. **Persistance** : Paramètres sauvegardés automatiquement
  4. **Cross-session** : Settings chargés automatiquement au démarrage
  
  ### **🔄 Corrections techniques majeures :**
  - **ARM ≠ Recording** : Séparation `recordEnabled` vs `isCurrentlyRecording`
  - **État cohérent** : `MidiInputEngine` avec flags séparés
  - **Timing optimisé** : Chargement config en 2s au lieu d'attente longue
  - **Simplification UX** : Recording géré par interface principale, pas config
  - **Page obsolète supprimée** : `/midiInput` remplacée par système centralisé

  ## 🎯 **PROCHAINES ÉTAPES - DÉPLOIEMENT MIDI RECORDING**
  
  ### **📈 Phase 1 : Déploiement aux pages principales (Sessions 2025-07-27)**
  ✅ **TERMINÉ** : 3/X pages équipées
  - ✅ `/pianorollBaseSettings` - Mode test/développement  
  - ✅ `/assistantGamme` - Assistant de gammes + MIDI Recording
  - ✅ `/pianorollBase` - **Mode principal modulaire + MIDI Recording**
  
  ### **🚀 Phase 2 : Pages restantes à équiper**
  - **🎨 `/inspiration`** - Générateur de séquences + MIDI Recording temps réel
  - **🤖 `/inspirationIA`** - Magenta.js IA + MIDI Recording temps réel  
  - **🎹 `/piano-roll`** - Mode non modulaire (legacy) - optionnel
  - **Autres modes** selon besoins utilisateurs
  
  ### **🔧 Pattern de déploiement établi :**
  1. Ajouter imports : `useMidiInputForMode`, `useMidiConfig`, `useMidiConfigLoader`
  2. Setup callbacks : `onNoteRecorded` avec position boucle calculée  
  3. Fonctions gestion : `handleMidiRecordingStart/Stop` avec synchronisation
  4. Interface UI : Barre status MIDI avec ARM/REC/STOP/Config
  5. Test compilation + serveur
  
  ### **🎯 Features Avancées (après déploiement complet) :**
  1. **Quantization** - Alignement automatique des notes sur la grille
  2. **Multi-patterns** - Gestion de plusieurs patterns/séquences  
  3. **Recording modes** - Overdub, Replace, Punch-in/out
  4. **Génération IA Avancée** - Modèles Magenta supplémentaires (MelodyRNN, PerformanceRNN)
  5. **MIDI Effects** - Transpose, humanize, swing en temps réel


