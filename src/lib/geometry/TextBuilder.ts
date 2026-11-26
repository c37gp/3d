import { 
  Mesh, 
  Scene, 
  Vector3,
  StandardMaterial,
  Color3,
  MeshBuilder,
  VertexBuffer
} from '@babylonjs/core';

/**
 * Classe pour créer du texte 3D dans Babylon.js
 * Cette classe utilise une approche simplifiée pour créer du texte 3D
 * sans dépendre de polices externes
 */
export class TextBuilder {
  /**
   * Crée du texte 3D à partir d'une chaîne de caractères
   * @param name - Nom du mesh
   * @param text - Texte à afficher
   * @param options - Options de création
   * @param scene - Scène Babylon.js
   * @returns Mesh contenant le texte 3D
   */
  static Create3DText(
    name: string,
    text: string,
    options: {
      font?: string;
      size?: number;
      depth?: number;
      resolution?: number;
      sideOrientation?: number;
    } = {},
    scene: Scene
  ): Mesh | null {
    const {
      size = 1,
      depth = 0.5,
      resolution = 32,
      sideOrientation = 0
    } = options;

    // Pour l'instant, on utilise une approche simplifiée
    // car la création de texte 3D vrai nécessite des polices spécifiques
    
    // Créer un mesh vide
    const mesh = new Mesh(name, scene);
    
    // Ajouter des vertices pour chaque caractère
    // Cette implémentation est simplifiée et crée des cubes pour chaque caractère
    
    const charWidth = size / text.length;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charMesh = MeshBuilder.CreateBox(
        `${name}-char-${i}`,
        {
          width: charWidth * 0.8,
          height: size,
          depth: depth
        },
        scene
      );
      
      // Positionner le caractère
      charMesh.position = new Vector3(
        (i - text.length / 2) * charWidth + charWidth / 2,
        0,
        0
      );
      
      // Appliquer un matériau
      const material = new StandardMaterial(`${name}-char-${i}-mat`, scene);
      
      // Couleur basée sur le caractère (pour la démonstration)
      const hue = (i * 0.1) % 1;
      material.diffuseColor = TextBuilder.hsvToRgb(hue, 0.8, 0.8);
      material.emissiveColor = TextBuilder.hsvToRgb(hue, 0.3, 0.5);
      
      charMesh.material = material;
      charMesh.parent = mesh;
    }
    
    return mesh;
  }

  /**
   * Crée du texte 2D (plane avec texture de texte)
   * @param name - Nom du mesh
   * @param text - Texte à afficher
   * @param options - Options de création
   * @param scene - Scène Babylon.js
   * @returns Mesh contenant le texte 2D
   */
  static Create2DText(
    name: string,
    text: string,
    options: {
      font?: string;
      size?: number;
      color?: string;
      backgroundColor?: string;
    } = {},
    scene: Scene
  ): Mesh | null {
    const { size = 1, color = '#ffffff', backgroundColor = '#00000000' } = options;
    
    // Créer un plane pour le texte
    const plane = MeshBuilder.CreatePlane(name, { width: size * text.length * 0.6, height: size }, scene);
    
    // Appliquer un matériau avec une texture de texte
    // Pour l'instant, on utilise une couleur unie
    const material = new StandardMaterial(`${name}-mat`, scene);
    material.diffuseColor = TextBuilder.hexToColor3(color);
    material.emissiveColor = TextBuilder.hexToColor3(color);
    material.disableLighting = true;
    
    plane.material = material;
    
    return plane;
  }

  /**
   * Convertit HSV en RGB
   */
  static hsvToRgb(h: number, s: number, v: number): Color3 {
    let r, g, b;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return new Color3(r, g, b);
  }

  /**
   * Convertit une couleur hexadécimale en Color3
   */
  static hexToColor3(hex: string): Color3 {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    return new Color3(r, g, b);
  }

  /**
   * Crée un seul caractère 3D
   */
  static Create3DCharacter(
    char: string,
    options: {
      size?: number;
      depth?: number;
      resolution?: number;
    } = {},
    scene: Scene
  ): Mesh | null {
    const { size = 1, depth = 0.5, resolution = 16 } = options;
    
    // Pour l'instant, on retourne un cube comme placeholder
    return MeshBuilder.CreateBox(
      `char-${char}-${Date.now()}`,
      { size: size * 0.8, height: size, depth: depth },
      scene
    );
  }

  /**
   * Crée un texte 3D avec extrusion
   */
  static CreateExtrudedText(
    name: string,
    text: string,
    options: {
      font?: string;
      size?: number;
      depth?: number;
      resolution?: number;
    } = {},
    scene: Scene
  ): Mesh | null {
    // Cette méthode utiliserait normalement une bibliothèque de polices 3D
    // comme three-mesh-ui ou une police personnalisée
    
    // Pour l'instant, on utilise la méthode Create3DText
    return TextBuilder.Create3DText(name, text, options, scene);
  }
}
