# Melody Sequencer - Architecture V1/V2

## 📁 Structure du Projet

### **v1/** - Version Stable Actuelle
- **Status** : ✅ Fonctionnelle pour usage quotidien
- **Tech Stack** : Next.js 15, React, Tone.js, Tailwind CSS
- **Caractéristiques** :
  - Séquenceur mélodique complet
  - Génération aléatoire de patterns  
  - Morphing et évolution génétique
  - Export MIDI et système de favoris
  - Gammes personnalisées et ambiances

### **v2/** - Version Moderne avec IA
- **Status** : 🚧 En développement actif
- **Tech Stack** : Next.js 15, TypeScript, Tone.js, Magenta.js, Tailwind CSS
- **Objectifs** :
  - Architecture robuste sans bugs de transport
  - Intelligence artificielle musicale intégrée
  - Tests unitaires complets
  - Code moderne et maintenable
  - Performances optimisées

## 🚀 Quick Start

### Utiliser V1 (Stable)
```bash
cd v1
npm install
npm run dev
# → http://localhost:3000
```

### Développer V2 (Moderne)
```bash
cd v2
npm install    # À faire lors du prochain développement
npm run dev    
# → http://localhost:3001
```

## 📈 Roadmap V2

### Phase 1: Fondations (En Cours)
- ✅ Setup Next.js + TypeScript + Tailwind + Tests
- ✅ Architecture modulaire définie
- 🚧 AudioEngine singleton implémentation
- 🚧 Tests unitaires de base

### Phase 2: Core Features
- 🔜 Piano roll basique avec TypeScript
- 🔜 Transport audio stable (play/stop/tempo)
- 🔜 Export MIDI fonctionnel
- 🔜 Presets synthétiseurs

### Phase 3: AI Integration
- 🔜 Intégration Magenta.js
- 🔜 Smart pattern continuation
- 🔜 Style transfer basique
- 🔜 Drum pattern generation

### Phase 4: V1 Feature Parity
- 🔜 Génération aléatoire avancée
- 🔜 Système de favoris
- 🔜 Morphing et évolution génétique
- 🔜 Gammes personnalisées

### Phase 5: AI Advanced Features
- 🔜 Collaborative AI composition
- 🔜 Genre detection et classification
- 🔜 Harmonisation automatique
- 🔜 Real-time AI assistance

## 🔄 Status Actuel (2025-07-23)

### V1 - Production Ready
- ✅ **Fonctionnel** pour usage quotidien
- ⚠️ **Bugs mineurs** (vitesse lecture, transport occasionnel)
- 🔒 **Maintenance uniquement** - Pas de nouvelles fonctionnalités
- 📚 **Documentation complète** dans `v1/CLAUDE.md`

### V2 - Développement Actif
- 🏗️ **Architecture définie** - TypeScript + Singleton pattern
- 📋 **Documentation créée** - Voir `v2/CLAUDE.md`
- 🧪 **Tests ready** - Vitest + Testing Library setup
- 🎯 **Objectif** - Version stable avec IA d'ici fin développement

## 📊 Comparaison Technique

| Aspect | V1 | V2 |
|--------|----|----|
| **Langage** | JavaScript | TypeScript |
| **Architecture** | Hooks React imbriqués | Singleton + Hooks simples |
| **Tests** | Aucun | Vitest + Coverage |
| **IA Musicale** | Random basique | Magenta.js intégré |
| **Stabilité** | Bugs transport connus | Architecture robuste |
| **Maintenance** | Difficile (dette technique) | Facile (code moderne) |

## 🎯 Stratégie de Développement

- **V1** reste utilisable pour la production
- **V2** sert de laboratoire pour nouvelles fonctionnalités
- **Migration progressive** des meilleures fonctionnalités V1 → V2
- **Architecture moderne** dès le départ pour éviter la dette technique
- **Approche parallèle** permet d'innover sans risquer la stabilité

## 📚 Documentation

- **V1** : Voir `v1/CLAUDE.md` pour architecture actuelle et historique
- **V2** : Voir `v2/CLAUDE.md` pour nouvelle architecture et patterns
- **Migration** : Guidelines de migration V1→V2 dans la doc V2

---

**Melody Sequencer V1/V2 - Developed with ♫ and powered by AI**