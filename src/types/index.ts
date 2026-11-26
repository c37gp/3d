// Types pour le logiciel de modélisation 3D procédurale

import { Vector3, Mesh, Scene, Camera, Light } from '@babylonjs/core';

// Types de base pour les objets 3D
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Scale {
  x: number;
  y: number;
  z: number;
}

export interface Transform {
  position: Position;
  rotation: Rotation;
  scale: Scale;
}

// Types pour les primitives géométriques
export type PrimitiveType = 
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'torus'
  | 'plane'
  | 'cone'
  | 'polyhedron'
  | 'extrusion'
  | 'revolution'
  | 'loft'
  | 'text';

export interface PrimitiveParams {
  type: PrimitiveType;
  name?: string;
  // Paramètres communs
  width?: number;
  height?: number;
  depth?: number;
  diameter?: number;
  radius?: number;
  segments?: number;
  // Paramètres spécifiques
  diameterX?: number;
  diameterY?: number;
  diameterZ?: number;
  tessellation?: number;
  subdivisions?: number;
  arc?: number;
  slice?: number;
  // Pour extrusion
  shape?: Vector3[];
  path?: Vector3[];
  // Pour révolution
  profile?: Vector3[];
  axis?: 'x' | 'y' | 'z';
  // Pour loft
  profiles?: Vector3[][];
  // Pour text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

// Types pour les opérations booléennes
export type BooleanOperation = 'union' | 'subtraction' | 'intersection';

export interface BooleanOperationData {
  type: BooleanOperation;
  meshA: string; // ID ou nom du mesh
  meshB: string;
  resultName?: string;
}

// Types pour les modifications géométriques
export interface Modification {
  type: 'extrude' | 'bevel' | 'subdivide' | 'smooth' | 'twist' | 'bend';
  parameters: Record<string, any>;
}

// Types pour les matériaux
export interface MaterialProperties {
  type: 'standard' | 'pbr' | 'wireframe' | 'transparent';
  color?: string;
  diffuseColor?: string;
  emissiveColor?: string;
  specularColor?: string;
  roughness?: number;
  metallic?: number;
  wireframeColor?: string;
  opacity?: number;
  textureUrl?: string;
}

// Types pour l'animation
export interface Keyframe {
  time: number; // en secondes
  value: any; // position, rotation, scale, etc.
  interpolation?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spline';
}

export interface AnimationTrack {
  id: string;
  name: string;
  property: 'position' | 'rotation' | 'scale' | 'visibility' | 'material';
  target: string; // ID de l'objet animé
  keyframes: Keyframe[];
  loop?: boolean;
  speed?: number;
}

export interface AnimationClip {
  id: string;
  name: string;
  tracks: AnimationTrack[];
  duration: number; // en secondes
  fps?: number;
}

// Types pour la timeline
export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

// Types pour les projets
export interface ProjectObject {
  id: string;
  name: string;
  type: 'primitive' | 'boolean' | 'imported' | 'group';
  primitive?: PrimitiveParams;
  booleanOperation?: BooleanOperationData;
  transform: Transform;
  material?: MaterialProperties;
  visible: boolean;
  locked: boolean;
  parentId?: string;
  childrenIds?: string[];
}

export interface ProjectScene {
  id: string;
  name: string;
  objects: ProjectObject[];
  animations: AnimationClip[];
  camera?: {
    position: Position;
    target: Position;
    fov?: number;
    orthographic?: boolean;
  };
  lights?: Array<{
    type: 'hemispheric' | 'directional' | 'point' | 'spot';
    position?: Position;
    direction?: Position;
    intensity?: number;
    color?: string;
  }>;
  environment?: {
    backgroundColor?: string;
    backgroundTexture?: string;
    environmentTexture?: string;
    fog?: {
      type: 'linear' | 'exponential';
      density?: number;
      color?: string;
      start?: number;
      end?: number;
    };
  };
}

export interface Project {
  id: string;
  name: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  scenes: ProjectScene[];
  activeSceneId: string;
  metadata?: Record<string, any>;
}

// Types pour l'export
export interface ExportOptions {
  format: 'stl' | 'obj' | 'gltf' | 'fbx' | 'mp4' | 'webm' | 'png' | 'jpg';
  quality?: number;
  resolution?: { width: number; height: number };
  fps?: number;
  duration?: number;
  includeAnimations?: boolean;
  includeTextures?: boolean;
  binary?: boolean; // pour GLTF
}

// Types pour l'intégration IA
export interface AIRequest {
  prompt: string;
  context?: string;
  parameters?: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  message?: string;
  data?: any; // Peut être un objet 3D, une animation, etc.
  geometry?: PrimitiveParams | PrimitiveParams[];
  operations?: BooleanOperationData[];
}

// Types pour l'UI
export interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'primitive' | 'modify' | 'boolean' | 'transform' | 'animation' | 'export';
  action: () => void;
  shortcut?: string;
  enabled?: boolean;
}

export interface UIState {
  selectedObjectId?: string;
  selectedObjectsIds: string[];
  activeTool?: string;
  mode: 'select' | 'move' | 'rotate' | 'scale' | 'create' | 'animate';
  showProperties: boolean;
  showTimeline: boolean;
  showLayers: boolean;
  showHistory: boolean;
}

// Types pour l'historique (undo/redo)
export interface HistoryAction {
  id: string;
  type: 'create' | 'delete' | 'modify' | 'transform' | 'boolean' | 'material';
  timestamp: Date;
  data: any;
  inverseData?: any;
}

// Types pour Babylon.js
export interface BabylonContext {
  scene: Scene;
  camera: Camera;
  canvas: HTMLCanvasElement;
  engine: any;
  lights: Light[];
}
