import { Project, ProjectScene, ProjectObject } from '../../types';

/**
 * Classe pour la sérialisation et la désérialisation des projets
 * Permet de sauvegarder et charger des projets au format JSON
 */
export class ProjectSerializer {
  /**
   * Sérialise un projet en JSON
   */
  static serialize(project: Project): string {
    return JSON.stringify(project, null, 2);
  }

  /**
   * Désérialise un JSON en projet
   */
  static deserialize(json: string): Project {
    const data = JSON.parse(json);
    return this.reviveProject(data);
  }

  /**
   * "Réanime" un projet désérialisé (convertit les dates, etc.)
   */
  private static reviveProject(data: any): Project {
    const project: Project = {
      id: data.id || `project-${Date.now()}`,
      name: data.name || 'Nouveau Projet',
      version: data.version || '1.0.0',
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      scenes: data.scenes ? data.scenes.map(this.reviveScene) : [],
      activeSceneId: data.activeSceneId || (data.scenes && data.scenes[0] ? data.scenes[0].id : `scene-${Date.now()}`),
      metadata: data.metadata || {}
    };

    // Si pas de scène, en créer une
    if (project.scenes.length === 0) {
      project.scenes = [this.createDefaultScene()];
      project.activeSceneId = project.scenes[0].id;
    }

    return project;
  }

  /**
   * "Réanime" une scène
   */
  private static reviveScene(data: any): ProjectScene {
    return {
      id: data.id || `scene-${Date.now()}`,
      name: data.name || 'Scène',
      objects: data.objects ? data.objects.map(this.reviveObject) : [],
      animations: data.animations || [],
      camera: data.camera || {
        position: { x: 0, y: 0, z: -10 },
        target: { x: 0, y: 0, z: 0 },
        fov: Math.PI / 3
      },
      lights: data.lights || [
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
      environment: data.environment || {
        backgroundColor: '#1a1a25',
        fog: {
          type: 'linear',
          start: 10,
          end: 100,
          color: '#000000'
        }
      }
    };
  }

  /**
   * "Réanime" un objet
   */
  private static reviveObject(data: any): ProjectObject {
    return {
      id: data.id || `obj-${Date.now()}`,
      name: data.name || 'Objet',
      type: data.type || 'primitive',
      primitive: data.primitive,
      booleanOperation: data.booleanOperation,
      transform: data.transform || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      material: data.material,
      visible: data.visible !== false,
      locked: data.locked || false,
      parentId: data.parentId,
      childrenIds: data.childrenIds || []
    };
  }

  /**
   * Crée une scène par défaut
   */
  private static createDefaultScene(): ProjectScene {
    return {
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
    };
  }

  /**
   * Crée un nouveau projet vide
   */
  static createNewProject(): Project {
    return {
      id: `project-${Date.now()}`,
      name: 'Nouveau Projet',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      scenes: [this.createDefaultScene()],
      activeSceneId: `scene-${Date.now()}`,
      metadata: {}
    };
  }

  /**
   * Clone un projet
   */
  static cloneProject(project: Project): Project {
    return this.deserialize(this.serialize(project));
  }

  /**
   * Exporte un projet en fichier
   */
  static exportToFile(project: Project, filename?: string): void {
    const json = this.serialize(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.fusion360`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Importe un projet depuis un fichier
   */
  static async importFromFile(): Promise<Project | null> {
    return new Promise<Project | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.fusion360,.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = e.target?.result as string;
            if (json) {
              resolve(this.deserialize(json));
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Erreur lors de l\'import du projet:', error);
            resolve(null);
          }
        };
        reader.readAsText(file);
      };

      input.click();
    });
  }

  /**
   * Sauvegarde un projet dans le localStorage
   */
  static saveToLocalStorage(project: Project, key: string = 'fusion360-project'): void {
    const json = this.serialize(project);
    localStorage.setItem(key, json);
  }

  /**
   * Charge un projet depuis le localStorage
   */
  static loadFromLocalStorage(key: string = 'fusion360-project'): Project | null {
    const json = localStorage.getItem(key);
    if (!json) return null;
    
    try {
      return this.deserialize(json);
    } catch (error) {
      console.error('Erreur lors du chargement du projet depuis localStorage:', error);
      return null;
    }
  }

  /**
   * Supprime un projet du localStorage
   */
  static deleteFromLocalStorage(key: string = 'fusion360-project'): void {
    localStorage.removeItem(key);
  }

  /**
   * Vérifie si un projet existe dans le localStorage
   */
  static hasProjectInLocalStorage(key: string = 'fusion360-project'): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Liste tous les projets sauvegardés dans le localStorage
   */
  static listLocalStorageProjects(): Array<{ key: string; project: Project }> {
    const projects: Array<{ key: string; project: Project }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fusion360-')) {
        const json = localStorage.getItem(key);
        if (json) {
          try {
            const project = this.deserialize(json);
            projects.push({ key, project });
          } catch (error) {
            console.error(`Erreur lors du chargement du projet ${key}:`, error);
          }
        }
      }
    }
    
    return projects;
  }

  /**
   * Valide un projet
   */
  static validateProject(project: Project): boolean {
    if (!project.id || !project.name || !project.scenes) {
      return false;
    }
    
    if (project.scenes.length === 0) {
      return false;
    }
    
    if (!project.scenes.find(s => s.id === project.activeSceneId)) {
      return false;
    }
    
    return true;
  }

  /**
   * Répare un projet invalide
   */
  static repairProject(project: Project): Project {
    if (!project.id) {
      project.id = `project-${Date.now()}`;
    }
    
    if (!project.name) {
      project.name = 'Projet réparé';
    }
    
    if (!project.version) {
      project.version = '1.0.0';
    }
    
    if (!project.createdAt) {
      project.createdAt = new Date();
    }
    
    if (!project.updatedAt) {
      project.updatedAt = new Date();
    }
    
    if (!project.scenes || project.scenes.length === 0) {
      project.scenes = [this.createDefaultScene()];
      project.activeSceneId = project.scenes[0].id;
    }
    
    if (!project.scenes.find(s => s.id === project.activeSceneId)) {
      project.activeSceneId = project.scenes[0].id;
    }
    
    if (!project.metadata) {
      project.metadata = {};
    }
    
    // Réparer les scènes
    project.scenes = project.scenes.map(scene => {
      if (!scene.id) {
        scene.id = `scene-${Date.now()}`;
      }
      if (!scene.name) {
        scene.name = 'Scène';
      }
      if (!scene.objects) {
        scene.objects = [];
      }
      if (!scene.animations) {
        scene.animations = [];
      }
      if (!scene.camera) {
        scene.camera = {
          position: { x: 0, y: 0, z: -10 },
          target: { x: 0, y: 0, z: 0 },
          fov: Math.PI / 3
        };
      }
      if (!scene.lights) {
        scene.lights = [
          {
            type: 'hemispheric',
            position: { x: 0, y: 1, z: 0 },
            intensity: 0.5,
            color: '#ffffff'
          }
        ];
      }
      if (!scene.environment) {
        scene.environment = {
          backgroundColor: '#1a1a25'
        };
      }
      
      // Réparer les objets
      scene.objects = scene.objects.map(obj => {
        if (!obj.id) {
          obj.id = `obj-${Date.now()}`;
        }
        if (!obj.name) {
          obj.name = 'Objet';
        }
        if (!obj.type) {
          obj.type = 'primitive';
        }
        if (!obj.transform) {
          obj.transform = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          };
        }
        if (obj.visible === undefined) {
          obj.visible = true;
        }
        if (obj.locked === undefined) {
          obj.locked = false;
        }
        
        return obj;
      });
      
      return scene;
    });
    
    return project;
  }
}
