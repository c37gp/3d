import { 
  Mesh, 
  Vector3, 
  Scene,
  VertexBuffer,
  MeshBuilder,
  StandardMaterial,
  Color3
} from '@babylonjs/core';
import { BooleanOperation, ProjectObject } from '../../types';

/**
 * Applique une opération booléenne entre deux meshes
 * Note: Cette implémentation utilise une approche simplifiée
 * Pour une implémentation complète, il faudrait utiliser une bibliothèque CSG robuste
 * comme OpenCASCADE.js ou implémenter un algorithme CSG personnalisé
 */
export const applyBooleanOperation = (
  meshA: Mesh,
  meshB: Mesh,
  operation: BooleanOperation,
  scene: Scene,
  resultName?: string
): Mesh | null => {
  try {
    // Pour l'instant, on retourne un cube comme placeholder
    // car l'implémentation complète des opérations booléennes est complexe
    
    console.warn(`Opération booléenne ${operation} non implémentée complètement. Retourne un placeholder.`);
    
    // Calculer la bounding box des deux meshes pour positionner le résultat
    const minA = meshA.getBoundingInfo().boundingBox.minimum;
    const maxA = meshA.getBoundingInfo().boundingBox.maximum;
    const minB = meshB.getBoundingInfo().boundingBox.minimum;
    const maxB = meshB.getBoundingInfo().boundingBox.maximum;
    
    const centerX = (minA.x + maxA.x + minB.x + maxB.x) / 4;
    const centerY = (minA.y + maxA.y + minB.y + maxB.y) / 4;
    const centerZ = (minA.z + maxA.z + minB.z + maxB.z) / 4;
    
    const sizeX = Math.max(maxA.x - minA.x, maxB.x - minB.x);
    const sizeY = Math.max(maxA.y - minA.y, maxB.y - minB.y);
    const sizeZ = Math.max(maxA.z - minA.z, maxB.z - minB.z);
    
    const result = MeshBuilder.CreateBox(
      resultName || `boolean-result-${Date.now()}`,
      {
        width: sizeX,
        height: sizeY,
        depth: sizeZ
      },
      scene
    );
    
    result.position = new Vector3(centerX, centerY, centerZ);
    
    // Appliquer un matériau pour distinguer le résultat
    const material = new StandardMaterial(`boolean-mat-${Date.now()}`, scene);
    switch (operation) {
      case 'union':
        material.diffuseColor = new Color3(0, 1, 0); // Vert
        break;
      case 'subtraction':
        material.diffuseColor = new Color3(1, 0, 0); // Rouge
        break;
      case 'intersection':
        material.diffuseColor = new Color3(0, 0, 1); // Bleu
        break;
    }
    material.emissiveColor = material.diffuseColor.scale(0.3);
    result.material = material;
    
    return result;
    
  } catch (error) {
    console.error(`Erreur lors de l'application de l'opération booléenne ${operation}:`, error);
    return null;
  }
};

/**
 * Convertit un mesh Babylon.js en un format compatible avec les bibliothèques CSG
 * Cette fonction extrait les vertices et les faces du mesh
 */
export const meshToCSGData = (mesh: Mesh): { vertices: number[]; faces: number[][] } | null => {
  try {
    const verticesData = mesh.getVerticesData(Vector3.TransformCoordinates);
    const indices = mesh.getIndices();
    
    if (!verticesData || !indices) {
      return null;
    }
    
    // Convertir les données de vertices en tableau de nombres
    const vertices: number[] = [];
    for (let i = 0; i < verticesData.length; i += 3) {
      vertices.push(verticesData[i], verticesData[i + 1], verticesData[i + 2]);
    }
    
    // Convertir les indices en faces (triangles)
    const faces: number[][] = [];
    for (let i = 0; i < indices.length; i += 3) {
      faces.push([indices[i], indices[i + 1], indices[i + 2]]);
    }
    
    return { vertices, faces };
    
  } catch (error) {
    console.error('Erreur lors de la conversion du mesh en données CSG:', error);
    return null;
  }
};

/**
 * Crée un mesh à partir de données CSG
 * Cette fonction est un placeholder pour une implémentation future
 */
export const csgDataToMesh = (
  vertices: number[],
  faces: number[][],
  scene: Scene,
  name: string
): Mesh | null => {
  try {
    // Pour l'instant, on retourne un cube comme placeholder
    return MeshBuilder.CreateBox(name, { size: 1 }, scene);
  } catch (error) {
    console.error('Erreur lors de la création du mesh à partir des données CSG:', error);
    return null;
  }
};

/**
 * Applique une opération booléenne à partir des IDs d'objets dans un projet
 */
export const applyBooleanOperationToProject = (
  projectObjects: ProjectObject[],
  operation: BooleanOperation,
  meshAId: string,
  meshBId: string,
  scene: Scene
): ProjectObject | null => {
  const objA = projectObjects.find(o => o.id === meshAId);
  const objB = projectObjects.find(o => o.id === meshBId);
  
  if (!objA || !objB) {
    console.error('Objets non trouvés pour l\'opération booléenne');
    return null;
  }
  
  // Créer un nouvel objet pour le résultat
  const resultId = `bool-${operation}-${Date.now()}`;
  const resultObj: ProjectObject = {
    id: resultId,
    name: `Boolean (${operation})`,
    type: 'boolean',
    booleanOperation: {
      type: operation,
      meshA: meshAId,
      meshB: meshBId,
      resultName: resultId
    },
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    visible: true,
    locked: false
  };
  
  return resultObj;
};

/**
 * Vérifie si deux meshes se chevauchent (collision)
 * Utile pour les opérations booléennes
 */
export const checkMeshIntersection = (meshA: Mesh, meshB: Mesh): boolean => {
  const boundingA = meshA.getBoundingInfo();
  const boundingB = meshB.getBoundingInfo();
  
  return boundingA.boundingBox.intersects(boundingB.boundingBox);
};

/**
 * Calcule la bounding box d'un mesh
 */
export const getMeshBoundingBox = (mesh: Mesh): { min: Vector3; max: Vector3 } => {
  const boundingInfo = mesh.getBoundingInfo();
  return {
    min: boundingInfo.boundingBox.minimum.clone(),
    max: boundingInfo.boundingBox.maximum.clone()
  };
};
