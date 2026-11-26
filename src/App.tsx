import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Vector3, 
  MeshBuilder,
  StandardMaterial,
  Color3,
  Scene,
  Engine
} from '@babylonjs/core';
import { 
  Project, 
  ProjectScene, 
  ProjectObject,
  UIState,
  PrimitiveType,
  BooleanOperation,
  ExportOptions
} from './types';
import BabylonScene from './lib/geometry/BabylonScene';
import { createPrimitive } from './lib/geometry/PrimitiveFactory';
import { AnimationSystem } from './lib/animation/AnimationSystem';
import { ExportSystem } from './lib/export/ExportSystem';
import { ProjectSerializer } from './lib/utils/ProjectSerializer';
import { AIIntegration, aiIntegration } from './lib/utils/AIIntegration';
import { CSG } from 'csg';

// Styles CSS
import './App.css';

const App: React.FC = () => {
  // État du projet
  const [project, setProject] = useState<Project>(() => createNewProject());
  const [uiState, setUiState] = useState<UIState>({
    selectedObjectId: undefined,
    selectedObjectsIds: [],
    activeTool: undefined,
    mode: 'select',
    showProperties: true,
    showTimeline: false,
    showLayers: false,
    showHistory: false
  });

  // Références pour les systèmes
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const animationSystemRef = useRef<AnimationSystem | null>(null);
  const exportSystemRef = useRef<ExportSystem | null>(null);

  // État pour l'interface
  const [showPrimitiveMenu, setShowPrimitiveMenu] = useState(false);
  const [showBooleanMenu, setShowBooleanMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAnimationMenu, setShowAnimationMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportOptions['format']>('stl');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  // Initialiser les systèmes quand la scène est prête
  useEffect(() => {
    if (sceneRef.current && engineRef.current) {
      animationSystemRef.current = new AnimationSystem(sceneRef.current);
      exportSystemRef.current = new ExportSystem(sceneRef.current, engineRef.current);
    }
  }, [sceneRef.current, engineRef.current]);

  // Créer un nouveau projet
  const createNewProject = (): Project => ({
    id: `project-${Date.now()}`,
    name: 'Nouveau Projet',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    scenes: [createNewScene()],
    activeSceneId: `scene-${Date.now()}`,
    metadata: {}
  });

  // Créer une nouvelle scène
  const createNewScene = (): ProjectScene => ({
    id: `scene-${Date.now()}`,
    name: 'Scène 1',
    objects: [],
    animations: [],
    camera: {
      position: { x: 0, y: 0, z: -10 },
      target: { x: 0, y: 0, z: 0 },
      fov: Math.PI / 3
    },
    lights: [
      {
        type: 'hemispheric',
        position: { x: 0, y: 1, z: 0 },
        intensity: 0.5,
        color: '#ffffff'
      },
      {
        type: 'directional',
        direction: { x: -1, y: -2, z: -1 },
        intensity: 1.0,
        color: '#ffffff'
      }
    ],
    environment: {
      backgroundColor: '#1a1a25',
      fog: {
        type: 'linear',
        start: 10,
        end: 100,
        color: '#000000'
      }
    }
  });

  // Gestion des objets
  const handleObjectCreated = useCallback((obj: ProjectObject) => {
    setProject(prev => {
      const newProject = { ...prev };
      const activeSceneIndex = newProject.scenes.findIndex(
        s => s.id === newProject.activeSceneId
      );
      
      if (activeSceneIndex !== -1) {
        newProject.scenes[activeSceneIndex] = {
          ...newProject.scenes[activeSceneIndex],
          objects: [...newProject.scenes[activeSceneIndex].objects, obj]
        };
        newProject.updatedAt = new Date();
      }
      
      return newProject;
    });

    // Sélectionner le nouvel objet
    setUiState(prev => ({
      ...prev,
      selectedObjectId: obj.id,
      selectedObjectsIds: [obj.id]
    }));
  }, []);

  const handleObjectSelected = useCallback((id?: string, ids?: string[]) => {
    setUiState(prev => ({
      ...prev,
      selectedObjectId: id,
      selectedObjectsIds: ids || []
    }));
  }, []);

  const handleObjectModified = useCallback((id: string, updates: Partial<ProjectObject>) => {
    setProject(prev => {
      const newProject = { ...prev };
      const activeSceneIndex = newProject.scenes.findIndex(
        s => s.id === newProject.activeSceneId
      );
      
      if (activeSceneIndex !== -1) {
        const objects = newProject.scenes[activeSceneIndex].objects.map(obj =>
          obj.id === id ? { ...obj, ...updates } : obj
        );
        newProject.scenes[activeSceneIndex] = { ...newProject.scenes[activeSceneIndex], objects };
        newProject.updatedAt = new Date();
      }
      
      return newProject;
    });
  }, []);

  const handleObjectDeleted = useCallback((id: string) => {
    setProject(prev => {
      const newProject = { ...prev };
      const activeSceneIndex = newProject.scenes.findIndex(
        s => s.id === newProject.activeSceneId
      );
      
      if (activeSceneIndex !== -1) {
        const objects = newProject.scenes[activeSceneIndex].objects.filter(
          obj => obj.id !== id
        );
        newProject.scenes[activeSceneIndex] = { ...newProject.scenes[activeSceneIndex], objects };
        newProject.updatedAt = new Date();
      }
      
      return newProject;
    });

    setUiState(prev => ({
      ...prev,
      selectedObjectId: undefined,
      selectedObjectsIds: prev.selectedObjectsIds.filter(id => id !== id)
    }));
  }, []);

  // Création de primitives
  const createBox = useCallback(() => {
    const newObj: ProjectObject = {
      id: `obj-${Date.now()}`,
      name: 'Cube',
      type: 'primitive',
      primitive: {
        type: 'box',
        width: 1,
        height: 1,
        depth: 1
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };
    handleObjectCreated(newObj);
  }, [handleObjectCreated]);

  const createSphere = useCallback(() => {
    const newObj: ProjectObject = {
      id: `obj-${Date.now()}`,
      name: 'Sphère',
      type: 'primitive',
      primitive: {
        type: 'sphere',
        diameter: 1,
        segments: 32
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };
    handleObjectCreated(newObj);
  }, [handleObjectCreated]);

  const createCylinder = useCallback(() => {
    const newObj: ProjectObject = {
      id: `obj-${Date.now()}`,
      name: 'Cylindre',
      type: 'primitive',
      primitive: {
        type: 'cylinder',
        diameter: 1,
        height: 1,
        tessellation: 24
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };
    handleObjectCreated(newObj);
  }, [handleObjectCreated]);

  const createTorus = useCallback(() => {
    const newObj: ProjectObject = {
      id: `obj-${Date.now()}`,
      name: 'Tore',
      type: 'primitive',
      primitive: {
        type: 'torus',
        diameter: 2,
        width: 0.5,
        tessellation: 24,
        subdivisions: 12
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };
    handleObjectCreated(newObj);
  }, [handleObjectCreated]);

  const createPlane = useCallback(() => {
    const newObj: ProjectObject = {
      id: `obj-${Date.now()}`,
      name: 'Plan',
      type: 'primitive',
      primitive: {
        type: 'plane',
        width: 1,
        height: 1
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };
    handleObjectCreated(newObj);
  }, [handleObjectCreated]);

  const createCone = useCallback(() => {
    const newObj: ProjectObject = {
      id: `obj-${Date.now()}`,
      name: 'Cône',
      type: 'primitive',
      primitive: {
        type: 'cone',
        diameter: 1,
        height: 1,
        tessellation: 24
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };
    handleObjectCreated(newObj);
  }, [handleObjectCreated]);

  // Opérations booléennes
  const applyBooleanOperation = useCallback((operation: BooleanOperation) => {
    if (uiState.selectedObjectsIds.length < 2) {
      alert('Veuillez sélectionner au moins deux objets pour une opération booléenne');
      return;
    }

    const objAId = uiState.selectedObjectsIds[0];
    const objBId = uiState.selectedObjectsIds[1];

    const newObj: ProjectObject = {
      id: `bool-${operation}-${Date.now()}`,
      name: `Booléen (${operation})`,
      type: 'boolean',
      booleanOperation: {
        type: operation,
        meshA: objAId,
        meshB: objBId,
        resultName: `bool-${operation}-${Date.now()}`
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      locked: false
    };

    handleObjectCreated(newObj);
    
    // Désélectionner les anciens objets
    setUiState(prev => ({
      ...prev,
      selectedObjectId: newObj.id,
      selectedObjectsIds: [newObj.id]
    }));

    setShowBooleanMenu(false);
  }, [uiState.selectedObjectsIds, handleObjectCreated]);

  // Sauvegarde et chargement
  const handleSaveProject = useCallback(() => {
    ProjectSerializer.exportToFile(project, `${project.name.replace(/\s+/g, '_')}.fusion360`);
    setShowFileMenu(false);
  }, [project]);

  const handleLoadProject = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedProject = await ProjectSerializer.importFromFile();
      if (loadedProject) {
        setProject(ProjectSerializer.repairProject(loadedProject));
        setUiState({
          selectedObjectId: undefined,
          selectedObjectsIds: [],
          activeTool: undefined,
          mode: 'select',
          showProperties: true,
          showTimeline: false,
          showLayers: false,
          showHistory: false
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      alert('Erreur lors du chargement du projet');
    } finally {
      setIsLoading(false);
      setShowFileMenu(false);
    }
  }, []);

  const handleNewProject = useCallback(() => {
    if (window.confirm('Voulez-vous vraiment créer un nouveau projet? Les modifications non sauvegardées seront perdues.')) {
      setProject(createNewProject());
      setUiState({
        selectedObjectId: undefined,
        selectedObjectsIds: [],
        activeTool: undefined,
        mode: 'select',
        showProperties: true,
        showTimeline: false,
        showLayers: false,
        showHistory: false
      });
    }
    setShowFileMenu(false);
  }, []);

  // Intégration IA
  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) {
      alert('Veuillez entrer un prompt');
      return;
    }

    setAiBusy(true);
    setAiResponse(null);

    try {
      // Pour l'instant, on simule une réponse IA
      // Dans une implémentation réelle, on utiliserait aiIntegration.sendRequest()
      const mockResponse = {
        success: true,
        message: 'Objet généré par IA',
        geometry: {
          type: 'box' as const,
          name: `IA: ${aiPrompt}`,
          width: 1,
          height: 1,
          depth: 1
        }
      };

      setAiResponse('Génération en cours...');

      // Attendre un peu pour simuler le traitement
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (mockResponse.success && mockResponse.geometry) {
        const newObj: ProjectObject = {
          id: `ai-${Date.now()}`,
          name: `IA: ${aiPrompt.substring(0, 30)}`,
          type: 'primitive',
          primitive: mockResponse.geometry as any,
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          visible: true,
          locked: false
        };
        handleObjectCreated(newObj);
        setAiResponse(`Objet "${newObj.name}" créé avec succès!`);
      }
    } catch (error) {
      console.error('Erreur lors de la génération IA:', error);
      setAiResponse('Erreur lors de la génération');
    } finally {
      setAiBusy(false);
      setShowAIMenu(false);
    }
  }, [aiPrompt, handleObjectCreated]);

  const handleAIConnect = useCallback(() => {
    // Configuration de la connexion IA
    const apiUrl = prompt('Entrez l\'URL de l\'API IA:', aiIntegration['apiUrl'] || '');
    if (apiUrl) {
      aiIntegration.setApiUrl(apiUrl);
      const apiKey = prompt('Entrez la clé API (laisser vide si non requis):', aiIntegration['apiKey'] || '');
      if (apiKey !== null) {
        aiIntegration.setApiKey(apiKey);
        alert('Connexion IA configurée avec succès!');
      }
    }
    setShowAIMenu(false);
  }, []);

  // Export
  const handleExport = useCallback(async () => {
    if (!exportSystemRef.current) return;

    setIsExporting(true);

    try {
      const activeScene = project.scenes.find(s => s.id === project.activeSceneId);
      if (!activeScene) {
        alert('Scène active non trouvée');
        return;
      }

      const options: ExportOptions = {
        format: exportFormat,
        quality: 0.92,
        resolution: { width: 1920, height: 1080 }
      };

      const blob = await exportSystemRef.current.exportProject(project, options);
      
      if (blob) {
        const filename = `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
        exportSystemRef.current.downloadBlob(blob, filename);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert(`Erreur lors de l'export: ${error}`);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  }, [project, exportFormat]);

  // Gestion du mode
  const setMode = useCallback((mode: UIState['mode']) => {
    setUiState(prev => ({
      ...prev,
      mode,
      activeTool: mode === 'select' ? undefined : prev.activeTool
    }));
  }, []);

  // Supprimer l'objet sélectionné
  const deleteSelected = useCallback(() => {
    if (uiState.selectedObjectId) {
      handleObjectDeleted(uiState.selectedObjectId);
    } else if (uiState.selectedObjectsIds.length > 0) {
      uiState.selectedObjectsIds.forEach(id => handleObjectDeleted(id));
    }
  }, [uiState.selectedObjectId, uiState.selectedObjectsIds, handleObjectDeleted]);

  // Dupliquer l'objet sélectionné
  const duplicateSelected = useCallback(() => {
    if (!uiState.selectedObjectId) return;

    const activeScene = project.scenes.find(s => s.id === project.activeSceneId);
    if (!activeScene) return;

    const selectedObj = activeScene.objects.find(o => o.id === uiState.selectedObjectId);
    if (!selectedObj) return;

    const newObj: ProjectObject = {
      ...selectedObj,
      id: `copy-${selectedObj.id}-${Date.now()}`,
      name: `${selectedObj.name} (copie)`,
      // Déplacer légèrement la copie
      transform: {
        ...selectedObj.transform,
        position: {
          ...selectedObj.transform.position,
          x: selectedObj.transform.position.x + 1
        }
      }
    };

    handleObjectCreated(newObj);
  }, [uiState.selectedObjectId, project, handleObjectCreated]);

  // Réinitialiser la vue caméra
  const resetCamera = useCallback(() => {
    // La caméra sera réinitialisée par le composant BabylonScene
    setProject(prev => {
      const newProject = { ...prev };
      const activeSceneIndex = newProject.scenes.findIndex(
        s => s.id === newProject.activeSceneId
      );
      
      if (activeSceneIndex !== -1) {
        newProject.scenes[activeSceneIndex] = {
          ...newProject.scenes[activeSceneIndex],
          camera: {
            position: { x: 0, y: 0, z: -10 },
            target: { x: 0, y: 0, z: 0 },
            fov: Math.PI / 3
          }
        };
      }
      
      return newProject;
    });
  }, []);

  // Rendu de l'interface
  return (
    <div className="app-container">
      {/* Barre d'outils principale */}
      <div className="toolbar">
        <div className="toolbar-group">
          <button 
            className="tool-button" 
            onClick={() => setShowFileMenu(!showFileMenu)}
            title="Fichier"
          >
            <span className="icon">📁</span>
            <span>Fichier</span>
          </button>
          
          <button 
            className="tool-button" 
            onClick={() => setShowPrimitiveMenu(!showPrimitiveMenu)}
            title="Créer une primitive"
          >
            <span className="icon">+</span>
            <span>Créer</span>
          </button>
          
          <button 
            className="tool-button" 
            onClick={() => setShowBooleanMenu(!showBooleanMenu)}
            title="Opérations booléennes"
            disabled={uiState.selectedObjectsIds.length < 2}
          >
            <span className="icon">⊕</span>
            <span>Booléen</span>
          </button>
          
          <button 
            className="tool-button" 
            onClick={() => setShowAnimationMenu(!showAnimationMenu)}
            title="Animation"
          >
            <span className="icon">▶</span>
            <span>Animer</span>
          </button>
          
          <button 
            className="tool-button" 
            onClick={() => setShowAIMenu(!showAIMenu)}
            title="Intelligence Artificielle"
          >
            <span className="icon">🤖</span>
            <span>IA</span>
          </button>
          
          <button 
            className="tool-button" 
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Exporter"
          >
            <span className="icon">↓</span>
            <span>Exporter</span>
          </button>
        </div>

        <div className="toolbar-group">
          <button 
            className={`tool-button ${uiState.mode === 'select' ? 'active' : ''}`}
            onClick={() => setMode('select')}
            title="Sélectionner (S)"
          >
            <span className="icon">🖱</span>
          </button>
          
          <button 
            className={`tool-button ${uiState.mode === 'move' ? 'active' : ''}`}
            onClick={() => setMode('move')}
            title="Déplacer (M)"
          >
            <span className="icon">↔</span>
          </button>
          
          <button 
            className={`tool-button ${uiState.mode === 'rotate' ? 'active' : ''}`}
            onClick={() => setMode('rotate')}
            title="Tourner (R)"
          >
            <span className="icon">🔄</span>
          </button>
          
          <button 
            className={`tool-button ${uiState.mode === 'scale' ? 'active' : ''}`}
            onClick={() => setMode('scale')}
            title="Redimensionner (S)"
          >
            <span className="icon">↕</span>
          </button>
        </div>

        <div className="toolbar-group">
          <button 
            className="tool-button" 
            onClick={duplicateSelected}
            title="Dupliquer (Ctrl+D)"
            disabled={!uiState.selectedObjectId && uiState.selectedObjectsIds.length === 0}
          >
            <span className="icon">📋</span>
          </button>
          
          <button 
            className="tool-button danger" 
            onClick={deleteSelected}
            title="Supprimer (Suppr)"
            disabled={!uiState.selectedObjectId && uiState.selectedObjectsIds.length === 0}
          >
            <span className="icon">🗑</span>
          </button>
          
          <button 
            className="tool-button" 
            onClick={resetCamera}
            title="Réinitialiser la vue"
          >
            <span className="icon">🔍</span>
          </button>
        </div>
      </div>

      {/* Menu Fichier */}
      {showFileMenu && (
        <div className="dropdown-menu" onMouseLeave={() => setShowFileMenu(false)}>
          <h3>Fichier</h3>
          <button onClick={handleNewProject}>
            <span className="icon">📄</span> Nouveau
          </button>
          <button onClick={handleSaveProject}>
            <span className="icon">💾</span> Sauvegarder
          </button>
          <button onClick={handleLoadProject} disabled={isLoading}>
            <span className="icon">📂</span> {isLoading ? 'Chargement...' : 'Ouvrir'}
          </button>
        </div>
      )}

      {/* Menu des primitives */}
      {showPrimitiveMenu && (
        <div className="dropdown-menu" onMouseLeave={() => setShowPrimitiveMenu(false)}>
          <h3>Primitives</h3>
          <button onClick={() => { createBox(); setShowPrimitiveMenu(false); }}>Cube</button>
          <button onClick={() => { createSphere(); setShowPrimitiveMenu(false); }}>Sphère</button>
          <button onClick={() => { createCylinder(); setShowPrimitiveMenu(false); }}>Cylindre</button>
          <button onClick={() => { createTorus(); setShowPrimitiveMenu(false); }}>Tore</button>
          <button onClick={() => { createPlane(); setShowPrimitiveMenu(false); }}>Plan</button>
          <button onClick={() => { createCone(); setShowPrimitiveMenu(false); }}>Cône</button>
        </div>
      )}

      {/* Menu des opérations booléennes */}
      {showBooleanMenu && (
        <div className="dropdown-menu" onMouseLeave={() => setShowBooleanMenu(false)}>
          <h3>Opérations Booléennes</h3>
          <p style={{ fontSize: '0.8em', margin: '5px 0', color: '#666' }}>
            Sélectionnez 2 objets
          </p>
          <button onClick={() => applyBooleanOperation('union')}>Union</button>
          <button onClick={() => applyBooleanOperation('subtraction')}>Soustraction</button>
          <button onClick={() => applyBooleanOperation('intersection')}>Intersection</button>
        </div>
      )}

      {/* Menu d'export */}
      {showExportMenu && (
        <div className="dropdown-menu" onMouseLeave={() => setShowExportMenu(false)}>
          <h3>Exporter</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>Format:</label>
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value as ExportOptions['format'])}
              style={{ width: '100%', marginTop: '5px' }}
            >
              <option value="stl">STL (Impression 3D)</option>
              <option value="obj">OBJ (Modélisation)</option>
              <option value="gltf">GLTF (Web)</option>
              <option value="png">PNG (Image)</option>
              <option value="mp4">MP4 (Vidéo)</option>
              <option value="webm">WebM (Vidéo)</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            style={{ width: '100%' }}
          >
            {isExporting ? 'Export en cours...' : 'Exporter'}
          </button>
        </div>
      )}

      {/* Menu IA */}
      {showAIMenu && (
        <div className="dropdown-menu" style={{ width: '300px' }} onMouseLeave={() => setShowAIMenu(false)}>
          <h3>Intelligence Artificielle</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Décrivez l'objet à générer..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
            />
          </div>
          <button 
            onClick={handleAIGenerate}
            disabled={aiBusy || !aiPrompt.trim()}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            {aiBusy ? 'Génération...' : 'Générer Objet'}
          </button>
          <button 
            onClick={handleAIConnect}
            style={{ width: '100%' }}
          >
            Configurer API IA
          </button>
          {aiResponse && (
            <p style={{ 
              marginTop: '10px', 
              padding: '8px', 
              background: '#252526',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#a0a0a0'
            }}>
              {aiResponse}
            </p>
          )}
        </div>
      )}

      {/* Menu d'animation */}
      {showAnimationMenu && (
        <div className="dropdown-menu" onMouseLeave={() => setShowAnimationMenu(false)}>
          <h3>Animation</h3>
          <button onClick={() => {
            setShowAnimationMenu(false);
            setUiState(prev => ({ ...prev, showTimeline: !prev.showTimeline }));
          }}>
            Timeline
          </button>
          <button onClick={() => {
            setShowAnimationMenu(false);
            // Créer une animation simple
            if (uiState.selectedObjectId && animationSystemRef.current) {
              const activeScene = project.scenes.find(s => s.id === project.activeSceneId);
              if (activeScene) {
                const obj = activeScene.objects.find(o => o.id === uiState.selectedObjectId);
                if (obj) {
                  animationSystemRef.current.createSimpleAnimation(
                    obj.id,
                    'position',
                    { x: obj.transform.position.x, y: obj.transform.position.y, z: obj.transform.position.z },
                    { x: obj.transform.position.x + 5, y: obj.transform.position.y, z: obj.transform.position.z },
                    2.0,
                    false
                  );
                }
              }
            }
          }}>
            Créer Animation
          </button>
        </div>
      )}

      {/* Zone de rendu 3D */}
      <div className="canvas-container">
        <BabylonScene
          project={project}
          uiState={uiState}
          onObjectSelected={handleObjectSelected}
          onSceneUpdated={(scene) => {
            setProject(prev => {
              const newProject = { ...prev };
              const index = newProject.scenes.findIndex(s => s.id === scene.id);
              if (index !== -1) {
                newProject.scenes[index] = scene;
                newProject.updatedAt = new Date();
              }
              return newProject;
            });
          }}
          onObjectCreated={handleObjectCreated}
          onObjectModified={handleObjectModified}
          onObjectDeleted={handleObjectDeleted}
          onAnimationCreated={(clip) => {
            setProject(prev => {
              const newProject = { ...prev };
              const activeSceneIndex = newProject.scenes.findIndex(
                s => s.id === newProject.activeSceneId
              );
              
              if (activeSceneIndex !== -1) {
                newProject.scenes[activeSceneIndex] = {
                  ...newProject.scenes[activeSceneIndex],
                  animations: [...newProject.scenes[activeSceneIndex].animations, clip]
                };
                newProject.updatedAt = new Date();
              }
              
              return newProject;
            });
          }}
        />
      </div>

      {/* Panneau des propriétés */}
      {uiState.showProperties && (
        <div className="properties-panel">
          <h3>Propriétés</h3>
          
          {uiState.selectedObjectId ? (
            <>
              <div className="property-group">
                <label>Nom</label>
                <input 
                  type="text" 
                  value={project.scenes
                    .find(s => s.id === project.activeSceneId)
                    ?.objects.find(o => o.id === uiState.selectedObjectId)?.name || ''}
                  onChange={(e) => {
                    const activeScene = project.scenes.find(s => s.id === project.activeSceneId);
                    if (activeScene) {
                      const obj = activeScene.objects.find(o => o.id === uiState.selectedObjectId);
                      if (obj) {
                        handleObjectModified(obj.id, { name: e.target.value });
                      }
                    }
                  }}
                />
              </div>

              <div className="property-group">
                <h4>Transformation</h4>
                <div className="transform-controls">
                  <div>
                    <label>Position</label>
                    <div className="vector-input">
                      <input type="number" step="0.1" placeholder="X" />
                      <input type="number" step="0.1" placeholder="Y" />
                      <input type="number" step="0.1" placeholder="Z" />
                    </div>
                  </div>
                  <div>
                    <label>Rotation</label>
                    <div className="vector-input">
                      <input type="number" step="0.1" placeholder="X" />
                      <input type="number" step="0.1" placeholder="Y" />
                      <input type="number" step="0.1" placeholder="Z" />
                    </div>
                  </div>
                  <div>
                    <label>Scale</label>
                    <div className="vector-input">
                      <input type="number" step="0.1" placeholder="X" />
                      <input type="number" step="0.1" placeholder="Y" />
                      <input type="number" step="0.1" placeholder="Z" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: '#666', textAlign: 'center' }}>
              Sélectionnez un objet
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      {uiState.showTimeline && (
        <div className="timeline-panel">
          <h3>Timeline</h3>
          <p style={{ color: '#666', textAlign: 'center' }}>
            Timeline à implémenter
          </p>
        </div>
      )}

      {/* Barre de statut */}
      <div className="status-bar">
        <div className="status-left">
          <span>{project.name}</span>
          <span style={{ marginLeft: '20px' }}>
            {project.scenes.find(s => s.id === project.activeSceneId)?.objects.length || 0} objets
          </span>
        </div>
        <div className="status-right">
          <span>FPS: {engineRef.current?.getFps().toFixed(1) || '0'}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
