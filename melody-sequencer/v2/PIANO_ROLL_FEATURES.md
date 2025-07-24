# Piano Roll V2 - Guide des Fonctionnalités

## 🎹 Vue d'Ensemble

Le Piano Roll V2 est un éditeur professionnel de séquences musicales avec toutes les fonctionnalités modernes d'un DAW. Interface responsive, interactions tactiles optimisées, et workflow professionnel.

**Accès :** `http://localhost:3000/piano-roll`

---

## ✅ Fonctionnalités Implémentées

### 🎵 **Core Features**

#### Interface Piano Roll
- **Design professionnel** - Style DAW moderne avec glassmorphism
- **Responsive parfait** - Mobile, tablette, desktop optimisés
- **Piano keys** - Touches noires/blanches avec octaves visuelles
- **Grid adaptatif** - Cellules ajustées selon nombre de steps

#### Navigation Octaves
- **Gamme complète** - C1 à C7 (7 octaves)
- **Scroll molette** - Navigation fluide avec preventDefault optimisé
- **Boutons navigation** - Flèches gauche/droite pour changer octave
- **Quick jump** - Boutons directs C1, C2, C3, C4, C5
- **Affichage range** - Indicateur "C2 - C4" selon octaves visibles

#### Steps Variables
- **Configurations** - 8, 16, 32, 64 steps
- **Accents adaptatifs** - Temps forts calculés automatiquement
  - 8/16 steps : accents sur 1, 5, 9, 13
  - 32 steps : accents sur 1, 5, 9, 13, 17, 21, 25, 29  
  - 64 steps : accent tous les 4 steps
- **Cellules dynamiques** - Largeur adaptée au nombre de steps
- **Colonnes visuelles** - Temps forts avec couleur différente

#### Audio Engine
- **SimpleAudioEngine** - Architecture stable sans crashes
- **PolySynth** - Synthé polyphonique professionnel
- **Reverb** - Effet de réverbération intégré
- **Transport temps réel** - Play/Stop sans lag
- **Contrôle tempo** - 60-180 BPM avec slider

---

### 🎨 **Éditeur de Vélocité**

#### Couleurs Temps Réel
- **Gradient vert→rouge** - Intensité visuelle immédiate
  - Vert (faible) : vélocité 1-32
  - Vert→Jaune : vélocité 33-64  
  - Jaune→Orange : vélocité 65-96
  - Orange→Rouge : vélocité 97-127

#### Interactions
- **Drag vertical** - Sur n'importe quelle partie de la note
- **Feedback immédiat** - Couleur change en temps réel
- **Indicateur numérique** - Valeur affichée pendant le drag
- **Support mobile** - Gestes tactiles optimisés
- **Précision** - 2 pixels = 1 unité de vélocité

#### Gestion Intelligente
- **Notes longues** - Vélocité appliquée sur toute la longueur
- **Édition partout** - Drag sur début, milieu, ou fin de note
- **Limites respectées** - Valeurs 1-127 toujours maintenues

---

### 📏 **Notes Longues**

#### Durée Variable
- **Range** - 1 à plusieurs steps de longueur
- **Indicateur visuel** - Chiffre affiché sur notes longues
- **Rendu adaptatif** - Coins arrondis appropriés selon position
- **Support audio** - SimpleAudioEngine gère les notes soutenues

#### Redimensionnement
- **Poignée de resize** - Bord droit avec cursor ew-resize
- **Drag horizontal** - Étendre/réduire par glissement
- **Validation limites** - Ne peut pas dépasser la grille
- **Temps réel** - Aperçu pendant le redimensionnement
- **Collision detection** - Évite les chevauchements

#### Rendu Visuel
- **Note début** - Coin gauche arrondi + indicateur durée
- **Note milieu** - Rectangle continu sans bordures
- **Note fin** - Coin droit arrondi + poignée resize
- **Note unique** - Tous les coins arrondis (durée = 1)

---

### 🎯 **Sélection Multiple**

#### Méthodes de Sélection
- **Rectangle** - Drag dans zone vide pour sélection multiple
- **Ctrl+clic** - Ajouter/retirer notes individuellement
- **Contour jaune** - Feedback visuel des notes sélectionnées
- **Compteur** - Nombre de notes sélectionnées dans les stats

#### Rectangle de Sélection
- **Drag libre** - Dans zones vides entre les notes
- **Rectangle jaune** - Bordure + fond transparent
- **Sélection temps réel** - Notes ajoutées pendant le drag
- **Ctrl comportement** - Avec Ctrl : ajoute à sélection existante

#### État Visual
- **Ring jaune** - Contour des notes sélectionnées
- **Scale effet** - Légère mise en évidence
- **Persistance** - Sélection maintenue entre actions
- **Clear logique** - Clic sans Ctrl désélectionne tout

---

### ⌨️ **Raccourcis Clavier**

#### Sélection
- **Ctrl+A** - Sélectionner toutes les notes du pattern
- **Ctrl+clic** - Ajouter/retirer note de la sélection
- **Escape** - Désélectionner toutes les notes

#### Copier/Coller
- **Ctrl+C** - Copier notes sélectionnées vers clipboard
- **Ctrl+V** - Coller à la position du curseur souris
- **Fallback intelligent** - Si pas de curseur, colle au centre
- **Positions relatives** - Maintient espacement entre notes
- **Auto-sélection** - Notes collées automatiquement sélectionnées

#### Suppression
- **Delete** - Supprimer notes sélectionnées
- **Backspace** - Alternative à Delete

#### Déplacement Précis
- **Flèche gauche (←)** - Déplacer sélection 1 step vers la gauche
- **Flèche droite (→)** - Déplacer sélection 1 step vers la droite  
- **Flèche haut (↑)** - Déplacer sélection 1 note vers les aigus
- **Flèche bas (↓)** - Déplacer sélection 1 note vers les graves

#### Validation Intelligente
- **Limites grille** - Ne sort jamais des bounds de la grille
- **Détection collision** - Évite les conflits avec notes existantes
- **Mouvement atomique** - Toute la sélection bouge ensemble
- **Rollback** - Si impossible, aucun mouvement effectué

---

## 🛠️ **Détails Techniques**

### Architecture
```typescript
// Structure des notes avec durée
interface NoteEvent {
  step: number;           // Position sur la grille
  note: string;          // Note musicale (ex: "C4")
  velocity: number;      // Intensité 0-127
  isActive: boolean;     // État de la note
  duration: number;      // Longueur en steps
}

// Identifiant unique de note
type NoteId = string;    // Format: "step-note" (ex: "5-C4")

// État de sélection
selectedNotes: Set<NoteId>

// Rectangle de sélection
interface SelectionRectangle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSelecting: boolean;
}
```

### États de Drag
```typescript
// Vélocité editing
dragState: {
  isDragging: boolean;
  step: number;
  note: string;
  startY: number;
  startVelocity: number;
  currentVelocity: number;
}

// Note resizing
resizeState: {
  isResizing: boolean;
  step: number;
  note: string;
  startX: number;
  startDuration: number;
  currentDuration: number;
}
```

### Performance
- **Event preventDefault** - Wheel events avec passive:false
- **Optimized renders** - Set operations pour sélections
- **Collision detection** - O(n) algorithmes efficaces
- **Memory efficient** - Cleanup automatique des listeners

---

## 📱 **Support Mobile**

### Interactions Tactiles
- **Touch-optimized** - Toutes interactions adaptées tactile
- **Gestures support** - Drag, pinch, tap optimisés
- **Large targets** - Boutons et poignées taille tactile appropriée
- **Visual feedback** - Hover states adaptés au touch

### Layout Responsive
- **Mobile stack** - Interface empilée verticalement
- **Adaptive sizing** - Cellules et textes ajustés par écran
- **Touch-large controls** - Transport controls agrandis
- **Grid responsive** - Scroll horizontal fluide

### Events Handling
- **TouchEvents** - Support complet touch/mouse
- **Prevent conflicts** - Touch et mouse events séparés
- **Gesture recognition** - Distinction tap/drag/pinch
- **Performance** - 60fps sur mobile garanti

---

## 🎵 **Utilisation Pratique**

### Workflow Basique
1. **Choisir octave** - Scroll molette ou boutons navigation
2. **Sélectionner steps** - 8/16/32/64 selon besoin musical
3. **Créer notes** - Clic sur grille pour ajouter
4. **Ajuster vélocité** - Drag vertical pour intensité
5. **Étendre notes** - Drag horizontal pour longueur
6. **Play/Stop** - Test en temps réel

### Workflow Avancé
1. **Sélection multiple** - Rectangle ou Ctrl+clic
2. **Édition groupée** - Déplacer avec flèches
3. **Copier patterns** - Ctrl+C/V pour dupliquer
4. **Affiner timing** - Déplacement précis pixel par pixel
5. **Layering** - Combiner plusieurs octaves

### Cas d'Usage
- **Mélodies simples** - Notes courtes, octave unique
- **Accords** - Sélection multiple, même timing
- **Basslines** - Notes longues, octaves graves
- **Arpeggios** - Patterns répétitifs avec copier/coller
- **Rythmes complexes** - Mix steps 16/32/64

---

## 🚀 **Prochaines Évolutions**

### En Développement
1. **Export MIDI** - Sauvegarde fichiers .mid
2. **Système Presets** - Templates de patterns
3. **Undo/Redo** - Historique des actions
4. **Quantization** - Alignement automatique

### Roadmap Future
- **Multi-patterns** - Gestion plusieurs séquences
- **Scale helpers** - Assistant gammes et accords
- **AI Generation** - Création assistée par IA
- **Collaboration** - Édition temps réel multi-utilisateurs

---

**🎹 Piano Roll V2 - Production Ready**  
*Session 2025-07-24 : Vélocité, Notes Longues, Sélection Multiple - COMPLET*