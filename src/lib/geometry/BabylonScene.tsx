import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  Vector3, 
  HemisphericLight, 
  DirectionalLight,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  Color3,
  Color4,
  PBRMaterial,
  Texture,
  SceneLoader,
  Matrix,
  TransformNode,
  AbstractMesh,
  Animation,
  EasingFunction,
  Curve3,
  Path3D
} from '@babylonjs/core';
import { Project, ProjectObject, ProjectScene, PrimitiveParams, BooleanOperation, Transform, UIState, BabylonContext } from '../../types';
import { createPrimitive } from './PrimitiveFactory';
import { applyBooleanOperation } from './BooleanOperations';
import { CSG } from 'csg';

// Contexte pour accéder à la scène Babylon.js depuis les composants enfants
export const BabylonContext = React.createContext<BabylonContext | null>(null);

interface BabylonSceneProps {
  project: Project;
  uiState: UIState;
  onObjectSelected: (id?: string, ids?: string[]) => void;
  onSceneUpdated: (scene: ProjectScene) => void;
  onObjectCreated: (obj: ProjectObject) => void;
  onObjectModified: (id: string, updates: Partial<ProjectObject>) => void;
  onObjectDeleted: (id: string) => void;
  onAnimationCreated: (clip: any) => void;
  width?: number;
  height?: number;
}

const BabylonScene: React.FC<BabylonSceneProps> = ({
  project,
  uiState,
  onObjectSelected,
  onSceneUpdated,
  onObjectCreated,
  onObjectModified,
  onObjectDeleted,
  onAnimationCreated,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const [babylonContext, setBabylonContext] = useState<BabylonContext | null>(null);
  const meshRefs = useRef<Map<string, AbstractMesh>>(new Map());
  const transformNodeRefs = useRef<Map<string, TransformNode>>(new Map());
  const selectedMeshRef = useRef<AbstractMesh | null>(null);
  const selectedMeshesRef = useRef<AbstractMesh[]>([]);

  // Initialisation de la scène
  useEffect(() => {
    if (!canvasRef.current) return;

    // Créer le moteur
    const engine = new Engine(canvasRef.current, true, { 
      preserveDrawingBuffer: true, 
      stencil: true 
    });
    engineRef.current = engine;

    // Créer la scène
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Configurer la couleur de fond
    scene.clearColor = new Color4(0.1, 0.1, 0.15, 1.0);
    scene.ambientColor = new Color3(0.3, 0.3, 0.3);

    // Créer la caméra
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 2.5,
      10,
      Vector3.Zero(),
      scene
    );
    cameraRef.current = camera;
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.panningSensibility = 100;
    camera.minZ = 0.1;
    camera.maxZ = 1000;

    // Ajouter des lumières
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5;
    hemiLight.diffuse = new Color3(0.8, 0.8, 0.9);
    hemiLight.specular = new Color3(0.2, 0.2, 0.3);

    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
    dirLight.intensity = 1.0;
    dirLight.diffuse = new Color3(1, 1, 0.95);
    dirLight.specular = new Color3(0.5, 0.5, 0.5);

    // Activer les ombres
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Ajouter un sol de référence
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    const groundMaterial = new StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.25);
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    // Ajouter des axes de référence
    const axisX = MeshBuilder.CreateBox("axisX", { width: 5, height: 0.1, depth: 0.1 }, scene);
    const axisXMat = new StandardMaterial("axisXMat", scene);
    axisXMat.diffuseColor = new Color3(1, 0, 0);
    axisXMat.emissiveColor = new Color3(0.8, 0, 0);
    axisX.material = axisXMat;
    axisX.position = new Vector3(2.5, 0, 0);

    const axisY = MeshBuilder.CreateBox("axisY", { width: 0.1, height: 5, depth: 0.1 }, scene);
    const axisYMat = new StandardMaterial("axisYMat", scene);
    axisYMat.diffuseColor = new Color3(0, 1, 0);
    axisYMat.emissiveColor = new Color3(0, 0.8, 0);
    axisY.material = axisYMat;
    axisY.position = new Vector3(0, 2.5, 0);

    const axisZ = MeshBuilder.CreateBox("axisZ", { width: 0.1, height: 0.1, depth: 5 }, scene);
    const axisZMat = new StandardMaterial("axisZMat", scene);
    axisZMat.diffuseColor = new Color3(0, 0, 1);
    axisZMat.emissiveColor = new Color3(0, 0, 0.8);
    axisZ.material = axisZMat;
    axisZ.position = new Vector3(0, 0, 2.5);

    // Créer le contexte
    setBabylonContext({
      scene,
      camera,
      canvas: canvasRef.current,
      engine,
      lights: [hemiLight, dirLight]
    });

    // Gérer le redimensionnement
    const handleResize = () => {
      if (engine) {
        engine.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
      meshRefs.current.clear();
      transformNodeRefs.current.clear();
    };
  }, []);

  // Charger les objets de la scène
  useEffect(() => {
    if (!sceneRef.current || !project.scenes || project.scenes.length === 0) return;

    const scene = sceneRef.current;
    const activeScene = project.scenes.find(s => s.id === project.activeSceneId) || project.scenes[0];

    // Nettoyer les anciens objets (sauf les axes et le sol)
    meshRefs.current.forEach((mesh, id) => {
      if (id !== 'ground' && id !== 'axisX' && id !== 'axisY' && id !== 'axisZ') {
        mesh.dispose();
        meshRefs.current.delete(id);
      }
    });
    transformNodeRefs.current.clear();

    // Créer les nouveaux objets
    activeScene.objects.forEach(obj => {
      createObjectInScene(obj, scene);
    });

    // Appliquer la caméra
    if (activeScene.camera) {
      const camera = cameraRef.current;
      if (camera) {
        camera.position = new Vector3(
          activeScene.camera.position.x,
          activeScene.camera.position.y,
          activeScene.camera.position.z
        );
        camera.setTarget(new Vector3(
          activeScene.camera.target.x,
          activeScene.camera.target.y,
          activeScene.camera.target.z
        ));
      }
    }

    // Appliquer les lumières
    if (activeScene.lights) {
      // Nettoyer les anciennes lumières (garder celles de base)
      const lights = scene.lights;
      for (let i = lights.length - 1; i >= 2; i--) {
        lights[i].dispose();
      }

      activeScene.lights.forEach(lightData => {
        let light;
        switch (lightData.type) {
          case 'hemispheric':
            light = new HemisphericLight(
              `light-${Math.random().toString(36).substr(2, 9)}`,
              new Vector3(lightData.position?.x || 0, lightData.position?.y || 1, lightData.position?.z || 0),
              scene
            );
            break;
          case 'directional':
            light = new DirectionalLight(
              `light-${Math.random().toString(36).substr(2, 9)}`,
              new Vector3(lightData.direction?.x || 0, lightData.direction?.y || -1, lightData.direction?.z || 0),
              scene
            );
            break;
          case 'point':
            light = new BABYLON.PointLight(
              `light-${Math.random().toString(36).substr(2, 9)}`,
              new Vector3(lightData.position?.x || 0, lightData.position?.y || 0, lightData.position?.z || 0),
              scene
            );
            break;
          case 'spot':
            light = new BABYLON.SpotLight(
              `light-${Math.random().toString(36).substr(2, 9)}`,
              new Vector3(lightData.position?.x || 0, lightData.position?.y || 0, lightData.position?.z || 0),
              new Vector3(lightData.direction?.x || 0, lightData.direction?.y || -1, lightData.direction?.z || 0),
              Math.PI / 3,
              10,
              scene
            );
            break;
        }
        if (light) {
          light.intensity = lightData.intensity || 1;
          if (lightData.color) {
            const color = hexToColor3(lightData.color);
            light.diffuse = color;
            light.specular = color;
          }
        }
      });
    }

    // Appliquer l'environnement
    if (activeScene.environment) {
      if (activeScene.environment.backgroundColor) {
        const color = hexToColor4(activeScene.environment.backgroundColor);
        scene.clearColor = color;
      }
      if (activeScene.environment.backgroundTexture) {
        // Charger la texture de fond
        const texture = new Texture(activeScene.environment.backgroundTexture, scene);
        scene.createDefaultSkybox(texture, true);
      }
      if (activeScene.environment.fog) {
        if (activeScene.environment.fog.type === 'linear') {
          scene.fogMode = Scene.FOGMODE_LINEAR;
          scene.fogStart = activeScene.environment.fog.start || 10;
          scene.fogEnd = activeScene.environment.fog.end || 100;
        } else {
          scene.fogMode = Scene.FOGMODE_EXP;
          scene.fogDensity = activeScene.environment.fog.density || 0.1;
        }
        scene.fogColor = hexToColor3(activeScene.environment.fog.color || '#000000');
      }
    }

  }, [project, project.activeSceneId]);

  // Gérer la sélection d'objets
  useEffect(() => {
    if (!sceneRef.current || !uiState) return;

    const scene = sceneRef.current;

    // Désélectionner tout
    selectedMeshesRef.current.forEach(mesh => {
      if (mesh.material) {
        (mesh.material as any).emissiveColor = null;
      }
    });
    selectedMeshesRef.current = [];
    selectedMeshRef.current = null;

    // Sélectionner les nouveaux objets
    if (uiState.selectedObjectId) {
      const mesh = meshRefs.current.get(uiState.selectedObjectId);
      if (mesh) {
        selectedMeshRef.current = mesh;
        selectedMeshesRef.current = [mesh];
        if (mesh.material) {
          (mesh.material as any).emissiveColor = new Color3(0.5, 0.8, 1);
        }
      }
    }

    if (uiState.selectedObjectsIds && uiState.selectedObjectsIds.length > 0) {
      uiState.selectedObjectsIds.forEach(id => {
        const mesh = meshRefs.current.get(id);
        if (mesh && !selectedMeshesRef.current.includes(mesh)) {
          selectedMeshesRef.current.push(mesh);
          if (mesh.material) {
            (mesh.material as any).emissiveColor = new Color3(0.5, 0.8, 1);
          }
        }
      });
    }

  }, [uiState.selectedObjectId, uiState.selectedObjectsIds]);

  // Créer un objet dans la scène
  const createObjectInScene = useCallback((obj: ProjectObject, scene: Scene) => {
    try {
      let mesh: AbstractMesh | null = null;
      let transformNode: TransformNode | null = null;

      // Créer un TransformNode pour gérer les transformations
      transformNode = new TransformNode(`transform-${obj.id}`, scene);
      transformNodeRefs.current.set(obj.id, transformNode);

      // Appliquer les transformations
      transformNode.position = new Vector3(
        obj.transform.position.x,
        obj.transform.position.y,
        obj.transform.position.z
      );
      transformNode.rotation = new Vector3(
        obj.transform.rotation.x,
        obj.transform.rotation.y,
        obj.transform.rotation.z
      );
      transformNode.scaling = new Vector3(
        obj.transform.scale.x,
        obj.transform.scale.y,
        obj.transform.scale.z
      );

      // Créer la géométrie
      if (obj.type === 'primitive' && obj.primitive) {
        mesh = createPrimitive(obj.primitive, scene, obj.id);
        if (mesh) {
          mesh.parent = transformNode;
          mesh.id = obj.id;
          mesh.name = obj.name || obj.id;
          meshRefs.current.set(obj.id, mesh);

          // Appliquer le matériau
          if (obj.material) {
            applyMaterial(mesh, obj.material, scene);
          }

          // Gérer la visibilité
          mesh.isVisible = obj.visible !== false;
          mesh.isPickable = !obj.locked;

          // Activer les ombres
          mesh.receiveShadows = true;
          mesh.checkCollisions = true;
        }
      }
      else if (obj.type === 'boolean' && obj.booleanOperation) {
        // Les opérations booléennes sont gérées séparément
        // On crée un placeholder pour l'instant
        mesh = MeshBuilder.CreateBox(`boolean-${obj.id}`, { size: 1 }, scene);
        mesh.parent = transformNode;
        mesh.id = obj.id;
        mesh.name = obj.name || obj.id;
        meshRefs.current.set(obj.id, mesh);
      }
      else if (obj.type === 'imported') {
        // Charger un modèle importé
        // Pour l'instant, on crée un placeholder
        mesh = MeshBuilder.CreateBox(`imported-${obj.id}`, { size: 1 }, scene);
        mesh.parent = transformNode;
        mesh.id = obj.id;
        mesh.name = obj.name || obj.id;
        meshRefs.current.set(obj.id, mesh);
      }

      // Ajouter des événements de sélection
      if (mesh) {
        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
              if (uiState.mode === 'select') {
                const ctrl = (window.event as any)?.ctrlKey || false;
                const shift = (window.event as any)?.shiftKey || false;
                
                if (ctrl || shift) {
                  // Sélection multiple
                  const currentIds = uiState.selectedObjectsIds || [];
                  if (currentIds.includes(obj.id)) {
                    onObjectSelected(undefined, currentIds.filter(id => id !== obj.id));
                  } else {
                    onObjectSelected(undefined, [...currentIds, obj.id]);
                  }
                } else {
                  // Sélection simple
                  onObjectSelected(obj.id, [obj.id]);
                }
              }
            }
          )
        );
      }

    } catch (error) {
      console.error(`Erreur lors de la création de l'objet ${obj.id}:`, error);
    }
  }, [project, uiState]);

  // Appliquer un matériau à un mesh
  const applyMaterial = (mesh: AbstractMesh, materialProps: any, scene: Scene) => {
    let material: Material;

    switch (materialProps.type) {
      case 'pbr':
        material = new PBRMaterial(`mat-${mesh.id}-pbr`, scene);
        if (materialProps.color) {
          (material as PBRMaterial).albedoColor = hexToColor3(materialProps.color);
        }
        if (materialProps.roughness !== undefined) {
          (material as PBRMaterial).roughness = materialProps.roughness;
        }
        if (materialProps.metallic !== undefined) {
          (material as PBRMaterial).metallic = materialProps.metallic;
        }
        if (materialProps.textureUrl) {
          const texture = new Texture(materialProps.textureUrl, scene);
          (material as PBRMaterial).albedoTexture = texture;
        }
        break;
      case 'wireframe':
        material = new StandardMaterial(`mat-${mesh.id}-wireframe`, scene);
        (material as StandardMaterial).wireframe = true;
        if (materialProps.wireframeColor) {
          (material as StandardMaterial).emissiveColor = hexToColor3(materialProps.wireframeColor);
        }
        if (materialProps.color) {
          (material as StandardMaterial).diffuseColor = hexToColor3(materialProps.color);
        }
        break;
      case 'transparent':
        material = new StandardMaterial(`mat-${mesh.id}-transparent`, scene);
        if (materialProps.color) {
          (material as StandardMaterial).diffuseColor = hexToColor3(materialProps.color);
        }
        if (materialProps.opacity !== undefined) {
          (material as StandardMaterial).alpha = materialProps.opacity;
        }
        (material as StandardMaterial).transparencyMode = Material.MATERIAL_ALPHABLEND;
        break;
      default: // standard
        material = new StandardMaterial(`mat-${mesh.id}-standard`, scene);
        if (materialProps.color) {
          (material as StandardMaterial).diffuseColor = hexToColor3(materialProps.color);
        }
        if (materialProps.specularColor) {
          (material as StandardMaterial).specularColor = hexToColor3(materialProps.specularColor);
        }
        if (materialProps.emissiveColor) {
          (material as StandardMaterial).emissiveColor = hexToColor3(materialProps.emissiveColor);
        }
    }

    mesh.material = material;
    return material;
  };

  // Utilitaires de conversion de couleurs
  const hexToColor3 = (hex: string) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return new Color3(r, g, b);
  };

  const hexToColor4 = (hex: string, alpha = 1.0) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return new Color4(r, g, b, alpha);
  };

  // Rendu de la scène
  const renderScene = () => {
    if (engineRef.current) {
      engineRef.current.runRenderLoop(() => {
        if (sceneRef.current) {
          sceneRef.current.render();
        }
      });
    }
  };

  useEffect(() => {
    renderScene();
  }, []);

  // Exposer les fonctions pour interagir avec la scène
  const createPrimitiveInScene = useCallback((params: PrimitiveParams) => {
    if (!sceneRef.current) return null;

    const scene = sceneRef.current;
    const newId = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    const newObj: ProjectObject = {
      id: newId,
      name: params.name || params.type,
      type: 'primitive',
      primitive: params,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };

    createObjectInScene(newObj, scene);
    onObjectCreated(newObj);
    return newId;
  }, [createObjectInScene, onObjectCreated]);

  const applyBooleanInScene = useCallback((operation: BooleanOperation, meshAId: string, meshBId: string) => {
    if (!sceneRef.current) return null;

    const scene = sceneRef.current;
    const meshA = meshRefs.current.get(meshAId);
    const meshB = meshRefs.current.get(meshBId);

    if (!meshA || !meshB) {
      console.error('Meshes non trouvés pour l\'opération booléenne');
      return null;
    }

    // Convertir les meshes Babylon.js en CSG
    const csgA = babylonMeshToCSG(meshA);
    const csgB = babylonMeshToCSG(meshB);

    if (!csgA || !csgB) {
      console.error('Conversion CSG échouée');
      return null;
    }

    // Appliquer l'opération
    let resultCSG;
    switch (operation) {
      case 'union':
        resultCSG = csgA.union(csgB);
        break;
      case 'subtraction':
        resultCSG = csgA.subtract(csgB);
        break;
      case 'intersection':
        resultCSG = csgA.intersect(csgB);
        break;
      default:
        return null;
    }

    // Convertir le résultat CSG en mesh Babylon.js
    const resultMesh = csgToBabylonMesh(resultCSG, scene, `boolean-${Date.now()}`);
    
    if (!resultMesh) {
      console.error('Conversion du résultat CSG échouée');
      return null;
    }

    // Créer un nouvel objet pour le résultat
    const newId = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newObj: ProjectObject = {
      id: newId,
      name: `Boolean-${operation}`,
      type: 'boolean',
      booleanOperation: {
        type: operation,
        meshA: meshAId,
        meshB: meshBId,
        resultName: newId
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };

    // Positionner le résultat au centre
    resultMesh.position = new Vector3(0, 0, 0);
    meshRefs.current.set(newId, resultMesh);
    
    onObjectCreated(newObj);
    return newId;
  }, [onObjectCreated]);

  // Convertir un mesh Babylon.js en CSG
  const babylonMeshToCSG = (mesh: AbstractMesh): CSG | null => {
    try {
      // Récupérer les vertices et faces
      const vertices: number[] = [];
      const faces: number[][] = [];

      if (mesh instanceof Mesh) {
        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = mesh.getIndices();

        if (!positions || !indices) return null;

        // Convertir les positions en tableau de nombres
        for (let i = 0; i < positions.length; i += 3) {
          vertices.push(positions[i], positions[i + 1], positions[i + 2]);
        }

        // Convertir les indices en faces (triangles)
        for (let i = 0; i < indices.length; i += 3) {
          faces.push([
            indices[i],
            indices[i + 1],
            indices[i + 2]
          ]);
        }

        return CSG.fromPolygons([
          new CSG.Polygon([
            new CSG.Vertex(0, 0, 0),
            new CSG.Vertex(1, 0, 0),
            new CSG.Vertex(0, 1, 0)
          ])
        ]);
      }
    } catch (error) {
      console.error('Erreur lors de la conversion Babylon.js -> CSG:', error);
    }
    return null;
  };

  // Convertir un CSG en mesh Babylon.js
  const csgToBabylonMesh = (csg: CSG, scene: Scene, name: string): Mesh | null => {
    try {
      // Pour l'instant, on retourne un cube comme placeholder
      // La conversion complète CSG -> Babylon.js est complexe
      return MeshBuilder.CreateBox(name, { size: 1 }, scene);
    } catch (error) {
      console.error('Erreur lors de la conversion CSG -> Babylon.js:', error);
      return null;
    }
  };

  // Gérer le clic sur la scène (pour désélectionner)
  const handleSceneClick = useCallback((e: React.MouseEvent) => {
    if (uiState.mode === 'select' && !e.ctrlKey && !e.shiftKey) {
      // Vérifier si on a cliqué sur un objet
      const pickResult = sceneRef.current?.pick(
        sceneRef.current?.pointerX || 0,
        sceneRef.current?.pointerY || 0
      );
      
      if (!pickResult || !pickResult.pickedMesh) {
        onObjectSelected(undefined, []);
      }
    }
  }, [uiState.mode, onObjectSelected]);

  return (
    <BabylonContext.Provider value={babylonContext}>
      <canvas
        ref={canvasRef}
        style={{ width: width || '100%', height: height || '100%', touchAction: 'none' }}
        onClick={handleSceneClick}
      />
      {babylonContext && (
        <>
          {React.Children.map(children, child => (
            React.cloneElement(child as React.ReactElement, { 
              babylonContext,
              createPrimitive: createPrimitiveInScene,
              applyBoolean: applyBooleanInScene
            })
          ))}
        </>
      )}
    </BabylonContext.Provider>
  );
};

export default React.memo(BabylonScene);
