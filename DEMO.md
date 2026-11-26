# 🎬 **Démonstration de Fusion360-Web**

Bienvenue dans la démonstration de **Fusion360-Web**, un logiciel de modélisation 3D procédurale complet, inspiré de Fusion 360, fonctionnant entièrement dans le navigateur.

---

## 🚀 **Démarrage Rapide**

### 1. **Installation**

```bash
# Cloner le dépôt (si nécessaire)
git clone https://github.com/votre-utilisateur/fusion360-web.git
cd fusion360-web

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🎯 **Fonctionnalités Principales**

### 📦 **1. Création d'Objets 3D**

#### **Primitives de base**
1. Cliquez sur le bouton **"Créer"** dans la barre d'outils
2. Sélectionnez une primitive :
   - **Cube** : Boîte 3D
   - **Sphère** : Sphère parfaite
   - **Cylindre** : Cylindre
   - **Tore** : Anneau (donut)
   - **Plan** : Surface plane
   - **Cône** : Cône

3. L'objet apparaît dans la scène et est automatiquement sélectionné

#### **Manipulation des objets**
- **Sélection** : Cliquez sur un objet
- **Sélection multiple** : `Ctrl+Click` ou `Shift+Click`
- **Déplacement** : Mode **Déplacer** (bouton ↔) + drag
- **Rotation** : Mode **Tourner** (bouton 🔄) + drag
- **Redimensionnement** : Mode **Redimensionner** (bouton ↕) + drag

#### **Propriétés**
- Le panneau **Propriétés** (à droite) affiche les informations de l'objet sélectionné
- Modifiez le nom, la position, la rotation, etc.

---

### ⊕ **2. Opérations Booléennes**

Créez des formes complexes en combinant des objets :

1. **Sélectionnez deux objets** (Ctrl+Click)
2. Cliquez sur le bouton **"Booléen"**
3. Choisissez une opération :
   - **Union** : Fusionne les deux objets
   - **Soustraction** : Retire le second objet du premier
   - **Intersection** : Garde seulement la partie commune

⚠️ **Note** : Les opérations booléennes sont actuellement implémentées avec des placeholders. Une implémentation complète nécessiterait une bibliothèque CSG robuste comme OpenCASCADE.js.

---

### ▶ **3. Animation**

Créez des animations pour vos objets :

1. Sélectionnez un objet
2. Cliquez sur le bouton **"Animer"**
3. Choisissez **"Créer Animation"**
4. Une animation simple est créée (déplacement de 5 unités sur l'axe X)
5. Ouvrez la **Timeline** pour éditer les keyframes

#### **Timeline**
- Visualisez et éditez les animations dans le temps
- Ajoutez, supprimez et modifiez les keyframes
- Ajustez la durée et la vitesse des animations

---

### ↓ **4. Export**

Exportez vos créations dans différents formats :

1. Cliquez sur le bouton **"Exporter"**
2. Sélectionnez un format :
   - **STL** : Pour l'impression 3D
   - **OBJ** : Format universel de modélisation 3D
   - **GLTF** : Format moderne pour le web
   - **PNG** : Capture d'écran
   - **MP4/WebM** : Vidéo de l'animation

3. Le fichier est téléchargé automatiquement

⚠️ **Note** : L'export vidéo nécessite FFmpeg.wasm et peut être lent pour les longues animations.

---

### 🤖 **5. Intégration IA**

Connectez un agent IA pour générer des objets automatiquement :

1. Cliquez sur le bouton **"IA"**
2. **Configurer l'API** :
   - Entrez l'URL de votre API IA (ex: `http://localhost:8000`)
   - Entrez votre clé API (si nécessaire)
3. **Générer un objet** :
   - Décrivez l'objet dans le champ de texte (ex: "un cube rouge de 2m de côté")
   - Cliquez sur **"Générer Objet"**
   - L'objet est créé automatiquement dans la scène

#### **Exemple avec l'agent IA fourni**

1. Lancez l'agent IA exemple :
   ```bash
   python example-ai-agent.py
   ```
   (Nécessite Python 3.8+ et FastAPI: `pip install fastapi uvicorn`)

2. Dans Fusion360-Web, configurez l'API : `http://localhost:8000/api/ai`

3. Testez la génération d'objets !

---

### 📁 **6. Gestion des Projets**

#### **Nouveau Projet**
- Cliquez sur **Fichier > Nouveau**
- Confirmez pour créer un nouveau projet vide

#### **Sauvegarder**
- Cliquez sur **Fichier > Sauvegarder**
- Le projet est téléchargé au format `.fusion360` (JSON)

#### **Ouvrir**
- Cliquez sur **Fichier > Ouvrir**
- Sélectionnez un fichier `.fusion360` ou `.json`
- Le projet est chargé dans l'application

---

## 🎮 **Raccourcis Clavier**

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

---

## 🎨 **Exemples Pratiques**

### **Exemple 1 : Créer un engrenage simple**

1. Créez un **cylindre** (diamètre: 2, hauteur: 0.5)
2. Créez un **cube** (largeur: 0.5, hauteur: 0.5, profondeur: 2)
3. Dupliquez le cube 8 fois
4. Disposez les cubes autour du cylindre (comme des dents)
5. Sélectionnez le cylindre et un cube, puis faites une **Union**
6. Répétez l'Union avec tous les cubes

### **Exemple 2 : Animation d'un système solaire**

1. Créez une **sphère** (Soleil)
2. Créez une autre **sphère** plus petite (Terre)
3. Déplacez la Terre à une distance du Soleil
4. Sélectionnez la Terre et créez une animation de rotation autour du Soleil
5. Ajoutez une Lune en animation autour de la Terre

### **Exemple 3 : Table avec des pieds**

1. Créez un **cube** large et plat (plateau de la table)
2. Créez 4 **cylindres** fins (pieds)
3. Positionnez les cylindres aux coins du plateau
4. Faites une **Union** entre le plateau et chaque pied

---

## 🐛 **Problèmes Connus et Limitations**

### **Opérations Booléennes**
- Actuellement implémentées avec des placeholders
- Une implémentation complète nécessiterait :
  - OpenCASCADE.js (portage WASM de OpenCASCADE)
  - Ou une bibliothèque CSG robuste pour Babylon.js
  - Ou l'implémentation d'un algorithme CSG personnalisé

### **Export Vidéo**
- L'export vidéo est lent et consomme beaucoup de mémoire
- FFmpeg.wasm a des limitations de performance
- Pour de meilleures performances, envisagez un export côté serveur

### **Animation Complexe**
- La timeline est basique et nécessite des améliorations
- Pas encore de support pour les animations imbriquées
- Les interpolations avancées (spline) sont limitées

### **Intégration IA**
- L'agent IA exemple est très basique
- Pour une vraie intelligence, utilisez un modèle comme :
  - GPT-4 Vision
  - Claude 3
  - Llama 3
  - Un modèle local (Ollama, etc.)

---

## 🔧 **Personnalisation**

### **Ajouter de nouvelles primitives**

Modifiez `src/lib/geometry/PrimitiveFactory.ts` :

```typescript
case 'new_primitive':
  return createNewPrimitive(params, scene, id);
```

### **Ajouter de nouvelles opérations booléennes**

Modifiez `src/lib/geometry/BooleanOperations.ts` pour implémenter une vraie bibliothèque CSG.

### **Étendre l'export**

Ajoutez de nouveaux formats dans `src/lib/export/ExportSystem.ts` :

```typescript
case 'fbx':
  return this.exportToFBX(projectScene, options);
```

### **Améliorer l'UI**

Modifiez les composants React dans `src/components/` et les styles dans `src/App.css`.

---

## 📊 **Performances**

### **Optimisation**
- Utilisez des **instances** pour les objets identiques
- Limitez le nombre de **faces** (tessellation)
- Désactivez les **ombres** pour les scènes complexes
- Utilisez le **Level of Detail (LOD)** pour les objets éloignés

### **Benchmark**
| Action | Temps estimé | Notes |
|--------|--------------|-------|
| Création d'un cube | < 10ms | Instantané |
| Création de 100 cubes | < 100ms | Très rapide |
| Opération booléenne | 100-500ms | Placeholder |
| Export STL | 100-1000ms | Selon la complexité |
| Export PNG (1920x1080) | 200-500ms | Rendu haute résolution |
| Export MP4 (5s, 720p) | 10-30s | FFmpeg.wasm |

---

## 🌐 **Déploiement**

### **Build pour la production**

```bash
npm run build
```

Les fichiers sont générés dans le dossier `dist/`.

### **Déploiement sur Netlify/Vercel**

1. Créez un compte sur [Netlify](https://www.netlify.com/) ou [Vercel](https://vercel.com/)
2. Connectez votre dépôt GitHub
3. Configurez le build :
   - Commande : `npm run build`
   - Dossier de déploiement : `dist`
4. Déployez !

### **Déploiement sur un serveur web**

Copiez simplement le contenu du dossier `dist/` sur votre serveur web.

---

## 📚 **Ressources**

### **Documentation**
- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)

### **Tutoriels**
- [Babylon.js Tutorials](https://doc.babylonjs.com/features/nb_frameworks/react)
- [3D Modeling with Babylon.js](https://doc.babylonjs.com/features/featuresDeepDive/mesh/creations)
- [WebGL Programming Guide](https://www.khronos.org/webgl/)

### **Communauté**
- [Babylon.js Forum](https://forum.babylonjs.com/)
- [React Community](https://react.dev/community)
- [Stack Overflow](https://stackoverflow.com/)

---

## 🎉 **Prochaines Étapes**

### **Pour les utilisateurs**
- [ ] Essayer toutes les fonctionnalités
- [ ] Créer des modèles complexes
- [ ] Exporter et imprimer en 3D
- [ ] Partager vos créations

### **Pour les développeurs**
- [ ] Implémenter les opérations booléennes complètes
- [ ] Améliorer la timeline d'animation
- [ ] Ajouter le support des textures
- [ ] Implémenter le rendu réaliste (ray tracing)
- [ ] Ajouter la physique (collisions, gravité)
- [ ] Implémenter la collaboration en temps réel

---

## 📞 **Support**

Pour toute question ou problème :

1. Vérifiez la [documentation](#-ressources)
2. Consultez les [problèmes connus](#-problèmes-connus-et-limitations)
3. Ouvrez une issue sur GitHub
4. Contactez l'équipe de développement

---

**Merci d'utiliser Fusion360-Web !** 🎊

Nous espérons que ce logiciel vous aidera à créer des modèles 3D incroyables directement dans votre navigateur. N'hésitez pas à contribuer, signaler des bugs ou suggérer des améliorations.

*L'équipe Fusion360-Web*
