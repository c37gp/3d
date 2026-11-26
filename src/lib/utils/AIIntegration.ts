import { 
  Project, 
  ProjectObject,
  ProjectScene,
  PrimitiveParams,
  BooleanOperation,
  AIRequest,
  AIResponse
} from '../../types';
import { ProjectSerializer } from './ProjectSerializer';

/**
 * Classe pour l'intégration avec des agents IA
 * Permet de connecter le logiciel à des modèles d'IA pour la génération procédurale
 */
export class AIIntegration {
  private apiUrl: string;
  private apiKey: string;
  private onRequestCallbacks: Array<(request: AIRequest) => void> = [];
  private onResponseCallbacks: Array<(response: AIResponse) => void> = [];
  private onErrorCallbacks: Array<(error: Error) => void> = [];

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || '';
    this.apiKey = apiKey || '';
  }

  /**
   * Définit l'URL de l'API
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * Définit la clé API
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Ajoute un callback pour les requêtes
   */
  onRequest(callback: (request: AIRequest) => void): void {
    this.onRequestCallbacks.push(callback);
  }

  /**
   * Ajoute un callback pour les réponses
   */
  onResponse(callback: (response: AIResponse) => void): void {
    this.onResponseCallbacks.push(callback);
  }

  /**
   * Ajoute un callback pour les erreurs
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * Envoie une requête à l'API IA
   */
  async sendRequest(request: AIRequest): Promise<AIResponse | null> {
    // Notifier les callbacks de la requête
    this.onRequestCallbacks.forEach(cb => cb(request));

    try {
      if (!this.apiUrl) {
        throw new Error('URL de l\'API non configurée');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Request-Type': 'fusion360-web'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Erreur ${response.status}: ${errorData.message || 'Erreur inconnue'}`
        );
      }

      const data = await response.json();
      const aiResponse: AIResponse = {
        success: data.success || true,
        message: data.message,
        data: data.data,
        geometry: data.geometry,
        operations: data.operations
      };

      // Notifier les callbacks de la réponse
      this.onResponseCallbacks.forEach(cb => cb(aiResponse));

      return aiResponse;
      
    } catch (error) {
      console.error('Erreur lors de la requête IA:', error);
      this.onErrorCallbacks.forEach(cb => cb(error as Error));
      return null;
    }
  }

  /**
   * Génère un objet 3D à partir d'un prompt
   */
  async generateObjectFromPrompt(
    prompt: string,
    context?: string,
    scene?: ProjectScene
  ): Promise<ProjectObject | null> {
    const request: AIRequest = {
      prompt,
      context: context || `Crée un objet 3D pour une scène de modélisation. ${context || ''}`,
      parameters: {
        type: 'object',
        scene: scene ? ProjectSerializer.serialize(scene) : undefined
      }
    };

    const response = await this.sendRequest(request);
    
    if (response && response.success && response.geometry) {
      // Convertir la géométrie en objet
      const geometry = Array.isArray(response.geometry) ? response.geometry[0] : response.geometry;
      
      const newObj: ProjectObject = {
        id: `ai-${Date.now()}`,
        name: `IA: ${prompt.substring(0, 20)}`,
        type: 'primitive',
        primitive: geometry as PrimitiveParams,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        visible: true,
        locked: false
      };

      return newObj;
    }

    return null;
  }

  /**
   * Applique une opération booléenne suggérée par l'IA
   */
  async suggestBooleanOperation(
    objects: ProjectObject[],
    context?: string
  ): Promise<{ operation: BooleanOperation; objAId: string; objBId: string } | null> {
    const request: AIRequest = {
      prompt: `Suggère une opération booléenne entre ces objets: ${objects.map(o => o.name).join(', ')}`,
      context: context || 'Quelle opération booléenne serait la plus appropriée?',
      parameters: {
        type: 'boolean_suggestion',
        objects: objects.map(o => ({
          id: o.id,
          name: o.name,
          type: o.type,
          position: o.transform.position
        }))
      }
    };

    const response = await this.sendRequest(request);
    
    if (response && response.success && response.data) {
      return {
        operation: response.data.operation as BooleanOperation,
        objAId: response.data.objAId as string,
        objBId: response.data.objBId as string
      };
    }

    return null;
  }

  /**
   * Optimise une scène avec l'IA
   */
  async optimizeScene(
    scene: ProjectScene,
    criteria: 'performance' | 'quality' | 'size' = 'performance'
  ): Promise<ProjectScene | null> {
    const request: AIRequest = {
      prompt: `Optimise cette scène 3D pour ${criteria}`,
      context: `Scène avec ${scene.objects.length} objets et ${scene.animations.length} animations`,
      parameters: {
        type: 'optimization',
        criteria,
        scene: ProjectSerializer.serialize(scene)
      }
    };

    const response = await this.sendRequest(request);
    
    if (response && response.success && response.data) {
      return ProjectSerializer.deserialize(JSON.stringify(response.data.optimizedScene));
    }

    return null;
  }

  /**
   * Génère une animation à partir d'un prompt
   */
  async generateAnimationFromPrompt(
    prompt: string,
    objects: ProjectObject[],
    duration: number = 5
  ): Promise<any | null> {
    const request: AIRequest = {
      prompt,
      context: `Crée une animation pour ces objets: ${objects.map(o => o.name).join(', ')}`,
      parameters: {
        type: 'animation',
        objects: objects.map(o => o.id),
        duration
      }
    };

    const response = await this.sendRequest(request);
    
    if (response && response.success && response.data) {
      return response.data.animation;
    }

    return null;
  }

  /**
   * Analyse une scène et suggère des améliorations
   */
  async suggestImprovements(
    project: Project
  ): Promise<Array<{ type: string; description: string; action: () => void }>> {
    const request: AIRequest = {
      prompt: 'Analyse ce projet 3D et suggère des améliorations',
      context: `Projet avec ${project.scenes.length} scènes et ${project.scenes.reduce((sum, s) => sum + s.objects.length, 0)} objets`,
      parameters: {
        type: 'analysis',
        project: ProjectSerializer.serialize(project)
      }
    };

    const response = await this.sendRequest(request);
    
    if (response && response.success && response.data && response.data.suggestions) {
      return response.data.suggestions.map((suggestion: any) => ({
        type: suggestion.type,
        description: suggestion.description,
        action: suggestion.action ? () => this.executeSuggestion(suggestion.action) : () => {}
      }));
    }

    return [];
  }

  /**
   * Exécute une suggestion d'amélioration
   */
  private async executeSuggestion(action: any): Promise<void> {
    // Implémentation à personnaliser selon les actions suggérées
    console.log('Exécution de la suggestion:', action);
  }

  /**
   * Connecte à un WebSocket pour une communication temps réel avec l'IA
   */
  connectWebSocket(url: string): WebSocket | null {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('Connexion WebSocket établie avec l\'IA');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ai_response') {
            const response: AIResponse = {
              success: data.success,
              message: data.message,
              data: data.data,
              geometry: data.geometry,
              operations: data.operations
            };
            this.onResponseCallbacks.forEach(cb => cb(response));
          }
        } catch (error) {
          console.error('Erreur lors du traitement du message WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        this.onErrorCallbacks.forEach(cb => cb(error as any));
      };

      ws.onclose = () => {
        console.log('Connexion WebSocket fermée');
      };

      return ws;
      
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      return null;
    }
  }

  /**
   * Envoie une requête via WebSocket
   */
  sendWebSocketRequest(ws: WebSocket, request: AIRequest): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ai_request',
        ...request
      }));
      this.onRequestCallbacks.forEach(cb => cb(request));
    } else {
      console.error('WebSocket non connecté');
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  closeWebSocket(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }

  /**
   * Génère un résumé du projet pour l'IA
   */
  generateProjectSummary(project: Project): string {
    const activeScene = project.scenes.find(s => s.id === project.activeSceneId);
    if (!activeScene) return 'Projet sans scène active';

    const objectTypes = new Map<string, number>();
    activeScene.objects.forEach(obj => {
      const count = objectTypes.get(obj.type) || 0;
      objectTypes.set(obj.type, count + 1);
    });

    return `Projet: ${project.name}
` +
           `Version: ${project.version}
` +
           `Scènes: ${project.scenes.length}
` +
           `Scène active: ${activeScene.name}
` +
           `Objets: ${activeScene.objects.length}
` +
           `  - Primitives: ${objectTypes.get('primitive') || 0}
` +
           `  - Booléens: ${objectTypes.get('boolean') || 0}
` +
           `  - Importés: ${objectTypes.get('imported') || 0}
` +
           `  - Groupes: ${objectTypes.get('group') || 0}
` +
           `Animations: ${activeScene.animations.length}
` +
           `Créé: ${project.createdAt.toISOString().slice(0, 10)}
` +
           `Modifié: ${project.updatedAt.toISOString().slice(0, 10)}`;
  }

  /**
   * Nettoie les callbacks
   */
  dispose(): void {
    this.onRequestCallbacks = [];
    this.onResponseCallbacks = [];
    this.onErrorCallbacks = [];
  }
}

/**
 * Instance globale pour l'intégration IA (singleton)
 */
export const aiIntegration = new AIIntegration();
