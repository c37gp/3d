import { 
  MeshBuilder, 
  Vector3, 
  Scene, 
  Mesh,
  CreateGroundOptions,
  CreateBoxOptions,
  CreateSphereOptions,
  CreateCylinderOptions,
  CreateTorusOptions,
  CreatePlaneOptions,
  CreateConeOptions
} from '@babylonjs/core';
import { PrimitiveParams, PrimitiveType } from '../../types';
import { TextBuilder } from './TextBuilder';

/**
 * Crée une primitive géométrique Babylon.js à partir des paramètres
 */
export const createPrimitive = (
  params: PrimitiveParams,
  scene: Scene,
  id?: string
): Mesh | null => {
  try {
    const meshId = id || `primitive-${params.type}-${Date.now()}`;
    
    switch (params.type) {
      case 'box':
        return createBox(params, scene, meshId);
      
      case 'sphere':
        return createSphere(params, scene, meshId);
      
      case 'cylinder':
        return createCylinder(params, scene, meshId);
      
      case 'torus':
        return createTorus(params, scene, meshId);
      
      case 'plane':
        return createPlane(params, scene, meshId);
      
      case 'cone':
        return createCone(params, scene, meshId);
      
      case 'polyhedron':
        return createPolyhedron(params, scene, meshId);
      
      case 'extrusion':
        return createExtrusion(params, scene, meshId);
      
      case 'revolution':
        return createRevolution(params, scene, meshId);
      
      case 'loft':
        return createLoft(params, scene, meshId);
      
      case 'text':
        return createText(params, scene, meshId);
      
      default:
        console.warn(`Type de primitive inconnu: ${params.type}`);
        return null;
    }
  } catch (error) {
    console.error(`Erreur lors de la création de la primitive ${params.type}:`, error);
    return null;
  }
};

/**
 * Crée un cube/boîte
 */
const createBox = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const options: CreateBoxOptions = {
    width: params.width || 1,
    height: params.height || 1,
    depth: params.depth || 1,
    faceColors: undefined,
    faceUV: undefined,
    sideOrientation: Mesh.DEFAULTSIDE,
    frontUVs: undefined,
    backUVs: undefined,
    wrap: true,
    updatable: true
  };

  // Si des dimensions spécifiques sont fournies
  if (params.diameterX !== undefined) {
    options.width = params.diameterX;
  }
  if (params.diameterY !== undefined) {
    options.height = params.diameterY;
  }
  if (params.diameterZ !== undefined) {
    options.depth = params.diameterZ;
  }

  const mesh = MeshBuilder.CreateBox(id, options, scene);
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée une sphère
 */
const createSphere = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const options: CreateSphereOptions = {
    diameter: params.diameter || params.radius ? params.radius * 2 : 1,
    diameterX: params.diameterX,
    diameterY: params.diameterY,
    diameterZ: params.diameterZ,
    segments: params.segments || 32,
    arc: params.arc || 1,
    slice: params.slice || 1,
    sideOrientation: Mesh.DEFAULTSIDE,
    frontUVs: undefined,
    backUVs: undefined,
    updatable: true
  };

  const mesh = MeshBuilder.CreateSphere(id, options, scene);
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée un cylindre
 */
const createCylinder = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const options: CreateCylinderOptions = {
    diameter: params.diameter || 1,
    diameterTop: params.diameterY,
    diameterBottom: params.diameterX,
    height: params.height || 1,
    tessellation: params.tessellation || 24,
    subdivisions: params.subdivisions || 1,
    arc: params.arc || 1,
    sideOrientation: Mesh.DEFAULTSIDE,
    frontUVs: undefined,
    backUVs: undefined,
    updatable: true,
    hasRings: false
  };

  const mesh = MeshBuilder.CreateCylinder(id, options, scene);
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée un tore
 */
const createTorus = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const options: CreateTorusOptions = {
    diameter: params.diameter || 2,
    thickness: params.width || 0.5,
    tessellation: params.tessellation || 24,
    subdivisions: params.subdivisions || 12,
    arc: params.arc || 1,
    sideOrientation: Mesh.DEFAULTSIDE,
    frontUVs: undefined,
    backUVs: undefined,
    updatable: true
  };

  const mesh = MeshBuilder.CreateTorus(id, options, scene);
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée un plan
 */
const createPlane = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const options: CreatePlaneOptions = {
    width: params.width || 1,
    height: params.height || 1,
    subdivisions: params.subdivisions || 1,
    sideOrientation: Mesh.DEFAULTSIDE,
    frontUVs: undefined,
    backUVs: undefined,
    updatable: true,
    sourcePlane: Mesh.PLANE_XY
  };

  const mesh = MeshBuilder.CreatePlane(id, options, scene);
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée un cône
 */
const createCone = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const options: CreateConeOptions = {
    diameter: params.diameter || 1,
    diameterTop: params.diameterY || 0,
    height: params.height || 1,
    tessellation: params.tessellation || 24,
    subdivisions: params.subdivisions || 1,
    arc: params.arc || 1,
    sideOrientation: Mesh.DEFAULTSIDE,
    frontUVs: undefined,
    backUVs: undefined,
    updatable: true,
    hasRings: false,
    enclose: false
  };

  const mesh = MeshBuilder.CreateCone(id, options, scene);
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée un polyèdre
 */
const createPolyhedron = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  // Type de polyèdre (tétraèdre, cube, octaèdre, etc.)
  const type = params.subdivisions || 0;
  
  const mesh = MeshBuilder.CreatePolyhedron(id, {
    type: type,
    size: params.width || 1,
    sizeX: params.diameterX,
    sizeY: params.diameterY,
    sizeZ: params.diameterZ,
    custom: undefined,
    faceColors: undefined,
    sideOrientation: Mesh.DEFAULTSIDE,
    frontUVs: undefined,
    backUVs: undefined,
    updatable: true
  }, scene);
  
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée une extrusion
 */
const createExtrusion = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  // Si un shape est fourni (tableau de Vector3)
  if (params.shape && params.shape.length > 0) {
    // Convertir Vector3[] en tableau de nombres [x, y, z, x, y, z, ...]
    const shape: number[] = [];
    params.shape.forEach(v => {
      shape.push(v.x, v.y, v.z);
    });

    // Si un path est fourni (pour extrusion le long d'un chemin)
    if (params.path && params.path.length > 0) {
      const path: number[] = [];
      params.path.forEach(v => {
        path.push(v.x, v.y, v.z);
      });

      const mesh = MeshBuilder.ExtrudeShape(
        id,
        { shape, path, scale: 1, rotation: 0, cap: MeshBuilder.EXTRUDECAP_ALL },
        scene
      );
      mesh.id = id;
      mesh.name = params.name || id;
      return mesh;
    } else {
      // Extrusion simple
      const mesh = MeshBuilder.ExtrudeShape(
        id,
        { 
          shape, 
          depth: params.height || 1,
          scale: 1,
          rotation: 0,
          cap: MeshBuilder.EXTRUDECAP_ALL
        },
        scene
      );
      mesh.id = id;
      mesh.name = params.name || id;
      return mesh;
    }
  }

  // Sinon, créer un cube par défaut
  return createBox(params, scene, id);
};

/**
 * Crée une surface de révolution
 */
const createRevolution = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  // Si un profile est fourni
  if (params.profile && params.profile.length > 0) {
    // Convertir Vector3[] en tableau de nombres
    const profile: number[] = [];
    params.profile.forEach(v => {
      profile.push(v.x, v.y);
    });

    // Axe de révolution (x, y ou z)
    const axis = params.axis || 'y';
    let rotationAxis: Vector3;
    
    switch (axis) {
      case 'x':
        rotationAxis = Vector3.Right();
        break;
      case 'z':
        rotationAxis = Vector3.Forward();
        break;
      default: // y
        rotationAxis = Vector3.Up();
        break;
    }

    // Créer la surface de révolution
    const mesh = MeshBuilder.CreateLathe(
      id,
      {
        shape: profile,
        radius: params.radius || 1,
        tessellation: params.tessellation || 32,
        arc: params.arc || Math.PI * 2,
        closed: true,
        updatable: true,
        sideOrientation: Mesh.DEFAULTSIDE,
        frontUVs: undefined,
        backUVs: undefined
      },
      scene
    );
    
    // Rotater si nécessaire
    if (axis !== 'y') {
      // La lathe est créée autour de l'axe Y par défaut
      // Il faut la rotater pour correspondre à l'axe souhaité
      mesh.rotation = rotationAxis.scale(Math.PI / 2);
    }

    mesh.id = id;
    mesh.name = params.name || id;
    return mesh;
  }

  // Sinon, créer un cylindre par défaut
  return createCylinder(params, scene, id);
};

/**
 * Crée un loft (interpolation entre plusieurs profils)
 */
const createLoft = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  // Si des profiles sont fournis
  if (params.profiles && params.profiles.length > 0) {
    // Convertir Vector3[][] en tableau de tableaux de nombres
    const profiles: number[][] = params.profiles.map(profile => {
      const result: number[] = [];
      profile.forEach(v => {
        result.push(v.x, v.y);
      });
      return result;
    });

    // Créer le loft
    const mesh = MeshBuilder.CreateLathe(
      id,
      {
        shape: profiles[0], // Utiliser le premier profil
        radius: params.radius || 1,
        tessellation: params.tessellation || 32,
        arc: params.arc || Math.PI * 2,
        closed: true,
        updatable: true
      },
      scene
    );

    // Note: Babylon.js n'a pas de méthode CreateLoft native
    // Pour un vrai loft, il faudrait implémenter une solution personnalisée
    // ou utiliser une bibliothèque externe

    mesh.id = id;
    mesh.name = params.name || id;
    return mesh;
  }

  // Sinon, créer un cube par défaut
  return createBox(params, scene, id);
};

/**
 * Crée du texte 3D
 */
const createText = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const text = params.text || 'Text';
  const fontSize = params.fontSize || 1;
  const fontFamily = params.fontFamily || 'Arial';

  // Utiliser TextBuilder pour créer du texte 3D
  const mesh = TextBuilder.Create3DText(
    id,
    text,
    {
      font: fontFamily,
      size: fontSize,
      depth: params.depth || 0.5,
      resolution: params.tessellation || 32,
      sideOrientation: Mesh.DEFAULTSIDE
    },
    scene
  );

  if (mesh) {
    mesh.id = id;
    mesh.name = params.name || id;
  }
  return mesh;
};

/**
 * Crée un sol
 */
export const createGround = (
  params: PrimitiveParams,
  scene: Scene,
  id: string
): Mesh => {
  const options: CreateGroundOptions = {
    width: params.width || 10,
    height: params.height || 10,
    subdivisions: params.subdivisions || 1,
    updatable: true
  };

  const mesh = MeshBuilder.CreateGround(id, options, scene);
  mesh.id = id;
  mesh.name = params.name || id;
  return mesh;
};

/**
 * Crée une grille de référence
 */
export const createGrid = (
  scene: Scene,
  id: string = 'grid',
  size: number = 10,
  divisions: number = 10
): Mesh => {
  const mesh = MeshBuilder.CreateGround(id, { width: size, height: size, subdivisions: divisions }, scene);
  
  const material = new BABYLON.StandardMaterial(`${id}-mat`, scene);
  material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  material.wireframe = true;
  
  mesh.material = material;
  mesh.id = id;
  mesh.name = id;
  
  return mesh;
};
