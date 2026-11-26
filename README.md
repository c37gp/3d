# Fusion360-Web 🚀

**Logiciel de modélisation 3D procédurale inspiré de Fusion 360** - Entièrement basé sur le web avec Babylon.js

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![Babylon.js](https://img.shields.io/badge/Babylon.js-7.14+-blue.svg)

## 📋 **Fonctionnalités**

### ✅ **Modélisation 3D**
- **Primitives géométriques** : Cube, Sphère, Cylindre, Tore, Plan, Cône, Polyèdre
- **Opérations booléennes** : Union, Soustraction, Intersection
- **Modélisation procédurale** : Extrusion, Révolution, Loft
- **Transformation** : Déplacement, Rotation, Mise à l'échelle
- **Hiérarchie** : Groupement d'objets, parent/enfant

### ✅ **Animation**
- **Timeline** : Gestion des animations dans le temps
- **Keyframes** : Création d'animations par images clés
- **Interpolation** : Linéaire, Ease-in, Ease-out, Ease-in-out, Spline
- **Types d'animation** : Position, Rotation, Scale, Visibilité, Matériaux

### ✅ **Export**
- **3D** : STL (impression 3D), OBJ, GLTF/GLB
- **2D** : PNG, JPG
- **Vidéo** : MP4, WebM (avec FFmpeg.wasm)

### ✅ **Interface Utilisateur**
- **Barre d'outils** : Accès rapide aux fonctionnalités
- **Panneau de propriétés** : Édition des objets sélectionnés
- **Timeline** : Visualisation et édition des animations
- **Sélection multiple** : Ctrl+Click pour sélectionner plusieurs objets
- **Raccourcis clavier** : Pour un workflow rapide

### 🔜 **À venir** (Intégration IA)
- Génération procédurale par prompts
- Optimisation automatique des modèles
- Suggestions de design
- Détection de collisions intelligente

## 🛠 **Technologies Utilisées**

| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 19.3+ | Interface utilisateur |
| **TypeScript** | 7.0+ | Typage fort |
| **Babylon.js** | 7.14+ | Moteur 3D |
| **Vite** | 8.4+ | Bundler |
| **FFmpeg.wasm** | 0.12+ | Export vidéo |
| **CSG.js** | 1.0+ | Opérations booléennes |

## 📦 **Installation**

### Prérequis
- Node.js 20+ 
- npm 10+ ou yarn 1.22+

### Étapes

1. **Cloner le dépôt**
```bash
cd /workspace/fusion360-web
```

2. **Installer les dépendances**
```bash
git clone https://github.com/votre-utilisateur/fusion360-web.git
cd fusion360-web
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

4. **Ouvrir dans le navigateur**
```
http://localhost:3000
```

## 🚀 **Utilisation**

### **Création d'objets**
1. Cliquez sur le bouton **"Créer"** dans la barre d'outils
2. Sélectionnez une primitive (Cube, Sphère, etc.)
3. L'objet apparaît dans la scène et est automatiquement sélectionné

### **Opérations Booléennes**
1. Sélectionnez **deux objets** (Ctrl+Click pour sélection multiple)
2. Cliquez sur le bouton **"Booléen"**
3. Choisissez l'opération (Union, Soustraction, Intersection)
4. Un nouvel objet est créé avec le résultat

### **Animation**
1. Sélectionnez un objet
2. Ouvrez le menu **"Animer"**
3. Cliquez sur **"Créer Animation"** pour créer une animation simple
4. Utilisez la **Timeline** pour éditer les keyframes

### **Export**
1. Cliquez sur le bouton **"Exporter"**
2. Sélectionnez le format (STL, OBJ, GLTF, PNG, MP4, WebM)
3. Le fichier est téléchargé automatiquement

## 🎨 **Raccourcis Clavier**

| Raccourci | Action |
|-----------|--------|
| **S** | Mode Sélection |
| **M** | Mode Déplacement |
| **R** | Mode Rotation |
| **Ctrl+D** | Dupliquer l'objet |
| **Suppr** | Supprimer l'objet |
| **Ctrl+Click** | Sélection multiple |
| **Shift+Click** | Ajouter/Retirer de la sélection |
| **Molette** | Zoom |
| **Click + Drag** | Rotation de la caméra |
| **Shift + Drag** | Panoramique |

## 📂 **Structure du Projet**

```
fusion360-web/
├── src/
│   ├── components/           # Composants React
│   │   ├── 3d/              # Composants 3D
│   │   └── ui/              # Composants UI
│   ├── lib/                 # Bibliothèques internes
│   │   ├── geometry/        # Géométrie (primitives, booléens)
│   │   ├── animation/       # Système d'animation
│   │   └── export/          # Système d'export
│   ├── types/               # Types TypeScript
│   ├── utils/               # Utilitaires
│   ├── App.tsx              # Composant principal
│   ├── App.css              # Styles principaux
│   └── main.tsx             # Point d'entrée
├── public/                  # Fichiers statiques
├── index.html               # Page HTML
├── vite.config.ts           # Configuration Vite
├── package.json             # Dépendances
└── README.md                # Documentation
```

## 🔧 **Configuration**

### **Vite**
Le projet utilise Vite pour un développement rapide. La configuration est dans `vite.config.ts`.

### **TypeScript**
La configuration TypeScript est dans `tsconfig.json`. Le projet utilise des types stricts.

### **Babylon.js**
Babylon.js est utilisé pour le rendu 3D. Les principales classes utilisées :
- `Engine` : Moteur de rendu
- `Scene` : Scène 3D
- `MeshBuilder` : Création de primitives
- `ArcRotateCamera` : Caméra orbitale
- `StandardMaterial` / `PBRMaterial` : Matériaux

## 🎯 **Objectifs Futurs**

### **Version 1.1.0**
- [ ] Implémentation complète des opérations booléennes avec CSG
- [ ] Système de layers pour organiser les objets
- [ ] Historique (Undo/Redo) complet
- [ ] Import de fichiers 3D (STL, OBJ, GLTF)

### **Version 1.2.0**
- [ ] Intégration avec des agents IA
- [ ] Génération procédurale par prompts
- [ ] Optimisation automatique
- [ ] API REST pour l'intégration

### **Version 2.0.0**
- [ ] Collaboration en temps réel
- [ ] Version mobile (React Native)
- [ ] Plugin pour Blender/Fusion 360
- [ ] Marketplace de modèles

## 📜 **Licence**

Ce projet est sous licence **MIT**. Vous êtes libre de l'utiliser, le modifier et le distribuer.

```
MIT License

Copyright (c) 2024 Fusion360-Web

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 **Contribution**

Les contributions sont les bienvenues ! Pour contribuer :

1. Forker le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalité`)
3. Commiter vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pousser vers la branche (`git push origin feature/ma-fonctionnalité`)
5. Ouvrir une Pull Request

## 📧 **Contact**

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue ou à nous contacter.

---

**Fusion360-Web** - Modélisation 3D procédurale dans le navigateur ✨
