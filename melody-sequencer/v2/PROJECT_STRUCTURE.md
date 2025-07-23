# 📁 Structure du Projet V2 - Nettoyé et Organisé

## Vue d'ensemble

Après nettoyage, le projet V2 suit une architecture **simple, robuste et extensible**.

## Structure des dossiers

```
v2/
├── 📁 src/
│   ├── 📁 app/                    # Pages Next.js 14
│   │   ├── globals.css            # Styles globaux
│   │   ├── layout.tsx             # Layout principal
│   │   ├── page.tsx               # Page d'accueil avec menu extensible
│   │   └── 📁 debug/              # Pages de test et debug
│   │       ├── simple.tsx         # Test React de base
│   │       ├── tone.tsx           # Test Tone.js isolé
│   │       ├── simple-audio.tsx   # Test audio engine simple
│   │       ├── 📁 test/           # Route /debug/test
│   │       ├── 📁 test-tone/      # Route /debug/test-tone
│   │       └── 📁 test-simple-audio/ # Route /debug/test-simple-audio
│   │
│   ├── 📁 components/             # Composants réutilisables
│   │   ├── MenuCard.tsx           # Carte de menu individual
│   │   └── MenuSection.tsx        # Section de menu par catégorie
│   │
│   ├── 📁 data/                   # Configuration et données
│   │   └── menuItems.ts           # Configuration du menu extensible
│   │
│   ├── 📁 hooks/                  # Hooks React
│   │   └── useSimpleAudio.ts      # Hook pour SimpleAudioEngine
│   │
│   ├── 📁 lib/                    # Bibliothèques principales
│   │   └── SimpleAudioEngine.ts   # Engine audio simple et robuste
│   │
│   └── 📁 types/                  # Types TypeScript
│       ├── index.ts               # Types de base (SimpleStep, SimplePattern, etc.)
│       └── menu.ts                # Types pour le système de menu
│
├── 📄 package.json                # Dépendances et scripts
├── 📄 next.config.js              # Configuration Next.js
├── 📄 tailwind.config.js          # Configuration Tailwind CSS
├── 📄 tsconfig.json               # Configuration TypeScript
├── 📄 MENU_SYSTEM.md              # Documentation du menu extensible
└── 📄 PROJECT_STRUCTURE.md        # Ce fichier
```

## Fichiers supprimés (nettoyage)

### ❌ Architecture complexe obsolète
- `src/core/` - EventBus, AudioEngineV2, PatternEngine, SynthEngine
- `src/services/` - ErrorService complexe
- `src/lib/AudioEngine.ts` - Engine monolithique
- `src/lib/ToneLoader.ts` - Loader complexe
- `src/hooks/useAudioEngine.ts` - Hook complexe
- `src/hooks/useToneLoader.ts` - Hook loader

### ❌ Composants obsolètes
- `src/components/Transport.tsx` - Utilisait ancienne architecture
- `src/components/PianoRoll.tsx` - À recréer avec architecture simple
- `src/components/MagentaVisualizer.tsx` - À recréer si nécessaire

### ❌ Tests et config obsolètes
- `src/__tests__/` - Tests de l'ancienne architecture
- `vitest.config.ts.disabled` - Config de test non utilisée
- `next.config.backup.js` - Sauvegarde de config
- `test-debug.html` - Fichier debug temporaire

## Architecture actuelle

### 🎵 Audio Engine
- **`SimpleAudioEngine`** - Une seule classe, une seule responsabilité
- **`useSimpleAudio`** - Hook React minimaliste
- **Pas de singleton complexe** - Instanciation normale
- **Pas d'EventBus** - Communication directe
- **Timing simple** - `setInterval` au lieu de `Tone.Transport`

### 🎨 Interface Utilisateur
- **Page d'accueil** - Menu extensible organisé par catégories
- **Pages de debug** - Tests isolés dans `/debug/`
- **Composants modulaires** - MenuCard et MenuSection réutilisables
- **Design responsive** - Tailwind CSS avec thème sombre

### 📋 Système de Menu
- **Configuration centralisée** - `data/menuItems.ts`
- **Types stricts** - `types/menu.ts`
- **Catégories** - Debug, Core, Features, Tools, Experimental
- **Status tracking** - stable, testing, new, planned, broken

## Points forts de cette architecture

✅ **Simple** - Architecture facile à comprendre et maintenir  
✅ **Robuste** - Plus de plantages, gestion d'erreurs propre  
✅ **Extensible** - Ajouter des features en 2 minutes  
✅ **Organisé** - Structure claire et logique  
✅ **Testé** - Base solide validée par les tests debug  
✅ **Documenté** - Documentation complète et à jour  

## Prochaines étapes recommandées

1. **Développer les features core** - Séquenceur, PianoRoll, Transport
2. **Implémenter les features avancées** - Export MIDI, presets, effets
3. **Ajouter des outils** - Analyseurs, moniteurs
4. **Expérimenter** - IA, mode collaboratif

## Comment ajouter une nouvelle fonctionnalité

1. **Ajouter l'item dans `menuItems.ts`**
2. **Créer la page dans `src/app/ma-feature/page.tsx`**
3. **Créer le composant si nécessaire**
4. **Mettre à jour le status quand terminé**

Simple et efficace! 🎵