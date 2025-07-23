# CLAUDE.md - Melody Sequencer Project

This file provides guidance to Claude Code (claude.ai/code) when working with the Melody Sequencer project.

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

## 🎵 Current Development Status (2025-07-23)

### V1 Status
- ✅ **Production ready** - Fully functional sequencer
- ⚠️ **Known issues** - Transport timing bugs, speed change issues
- 🔒 **Maintenance mode** - No new features, stability focus
- 📚 **Complete documentation** in `v1/CLAUDE_V1.md`

### V2 Status - 🚀 **PIANO ROLL COMPLET & FONCTIONNEL**
- ✅ **Piano Roll Professionnel** - Interface moderne style DAW complète
- ✅ **Audio Polyphonique** - SimpleAudioEngine avec PolySynth + reverb
- ✅ **Navigation Octaves** - Scroll/boutons, gamme C1-C7 complète
- ✅ **Steps Variables** - Support 8/16/32/64 steps avec accents adaptatifs
- ✅ **Responsive Design** - Optimisé mobile/tablette avec interactions tactiles
- ✅ **Architecture Robuste** - Base stable et extensible pour futures features
- 📱 **Mobile-First** - Interface tactile optimisée pour tous écrans

### 🎯 **Priorités V2 (Prochaines Étapes)**
1. **Éditeur Vélocité** - Contrôle intensité par note (slider/courbe)
2. **Longueur Notes** - Support notes longues (pas seulement on/off)
3. **Outils Sélection** - Sélection multiple, copier/coller, déplacer
4. **Export MIDI** - Exportation des patterns créés
5. **Presets System** - Sauvegarde/chargement de patterns
6. **Raccourcis Clavier** - Shortcuts (espace=play, delete, etc.)
7. **Génération IA** - Magenta.js pour création assistée

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