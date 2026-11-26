import { 
  Scene, 
  Animation, 
  EasingFunction,
  AbstractMesh,
  Vector3,
  Quaternion,
  Color3,
  Material
} from '@babylonjs/core';
import { 
  AnimationClip, 
  AnimationTrack, 
  Keyframe,
  ProjectObject,
  ProjectScene
} from '../../types';

/**
 * Système de gestion des animations pour Babylon.js
 * Ce système permet de créer, modifier et lire des animations complexes
 */
export class AnimationSystem {
  private scene: Scene;
  private animations: Map<string, Animation> = new Map();
  private animationClips: Map<string, AnimationClip> = new Map();
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private globalStartTime: number = 0;
  private speed: number = 1.0;
  private onUpdateCallbacks: Array<(time: number) => void> = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.setupAnimationLoop();
  }

  /**
   * Configure la boucle d'animation
   */
  private setupAnimationLoop(): void {
    this.scene.registerBeforeRender(() => {
      if (this.isPlaying) {
        const now = Date.now();
        const elapsed = (now - this.globalStartTime) * 0.001 * this.speed;
        this.currentTime = this.globalStartTime === 0 ? 0 : elapsed;
        
        // Mettre à jour toutes les animations
        this.updateAnimations(this.currentTime);
        
        // Appeler les callbacks
        this.onUpdateCallbacks.forEach(cb => cb(this.currentTime));
      }
    });
  }

  /**
   * Met à jour toutes les animations
   */
  private updateAnimations(time: number): void {
    this.animationClips.forEach(clip => {
      if (clip.tracks) {
        clip.tracks.forEach(track => {
          const animation = this.animations.get(track.id);
          if (animation) {
            // Calculer la valeur interpolée pour cette track
            const value = this.getInterpolatedValue(track, time % clip.duration);
            
            // Appliquer la valeur à la cible
            this.applyAnimationValue(track, value);
          }
        });
      }
    });
  }

  /**
   * Calcule la valeur interpolée pour une track à un temps donné
   */
  private getInterpolatedValue(track: AnimationTrack, time: number): any {
    if (track.keyframes.length === 0) return null;
    if (track.keyframes.length === 1) return track.keyframes[0].value;

    // Trouver les keyframes entre lesquelles on se trouve
    let prevKf: Keyframe | null = null;
    let nextKf: Keyframe | null = null;

    for (let i = 0; i < track.keyframes.length; i++) {
      const kf = track.keyframes[i];
      if (kf.time <= time) {
        prevKf = kf;
      } else {
        nextKf = kf;
        break;
      }
    }

    // Si on est avant le premier keyframe
    if (!prevKf && nextKf) {
      return nextKf.value;
    }

    // Si on est après le dernier keyframe
    if (prevKf && !nextKf) {
      if (track.loop) {
        // Reboucler
        const firstKf = track.keyframes[0];
        const lastKf = track.keyframes[track.keyframes.length - 1];
        const loopTime = time % lastKf.time;
        return this.interpolate(firstKf, track.keyframes.find(kf => kf.time > loopTime) || firstKf, loopTime, track);
      }
      return prevKf.value;
    }

    // Si on a trouvé deux keyframes
    if (prevKf && nextKf) {
      return this.interpolate(prevKf, nextKf, time, track);
    }

    return null;
  }

  /**
   * Interpole entre deux keyframes
   */
  private interpolate(
    prevKf: Keyframe,
    nextKf: Keyframe,
    time: number,
    track: AnimationTrack
  ): any {
    const t = (time - prevKf.time) / (nextKf.time - prevKf.time);
    
    // Appliquer l'interpolation
    switch (track.interpolation || 'linear') {
      case 'linear':
        return this.lerp(prevKf.value, nextKf.value, t);
      case 'easeIn':
        return this.lerp(prevKf.value, nextKf.value, this.easeIn(t));
      case 'easeOut':
        return this.lerp(prevKf.value, nextKf.value, this.easeOut(t));
      case 'easeInOut':
        return this.lerp(prevKf.value, nextKf.value, this.easeInOut(t));
      case 'spline':
        return this.lerp(prevKf.value, nextKf.value, this.smoothStep(t));
      default:
        return this.lerp(prevKf.value, nextKf.value, t);
    }
  }

  /**
   * Interpolation linéaire
   */
  private lerp(start: any, end: any, t: number): any {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * t;
    }
    
    if (start instanceof Vector3 && end instanceof Vector3) {
      return Vector3.Lerp(start, end, t);
    }
    
    if (start && end && typeof start === 'object' && typeof end === 'object') {
      const result: any = {};
      for (const key in start) {
        if (start[key] !== undefined && end[key] !== undefined) {
          result[key] = this.lerp(start[key], end[key], t);
        }
      }
      return result;
    }
    
    return t < 0.5 ? start : end;
  }

  /**
   * Fonctions d'easing
   */
  private easeIn(t: number): number {
    return t * t;
  }

  private easeOut(t: number): number {
    return t * (2 - t);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  /**
   * Applique une valeur d'animation à une cible
   */
  private applyAnimationValue(track: AnimationTrack, value: any): void {
    // Trouver la cible dans la scène
    const target = this.findTarget(track.target);
    if (!target) return;

    switch (track.property) {
      case 'position':
        if (value instanceof Vector3) {
          target.position = value.clone();
        } else if (value && value.x !== undefined) {
          target.position = new Vector3(value.x, value.y, value.z);
        }
        break;

      case 'rotation':
        if (value instanceof Vector3) {
          target.rotation = value.clone();
        } else if (value && value.x !== undefined) {
          target.rotation = new Vector3(value.x, value.y, value.z);
        }
        break;

      case 'scale':
        if (value instanceof Vector3) {
          target.scaling = value.clone();
        } else if (value && value.x !== undefined) {
          target.scaling = new Vector3(value.x, value.y, value.z);
        }
        break;

      case 'visibility':
        target.isVisible = Boolean(value);
        break;

      case 'material':
        if (target.material && value) {
          if (value.color) {
            (target.material as any).diffuseColor = new Color3(
              value.color.r || value.color[0],
              value.color.g || value.color[1],
              value.color.b || value.color[2]
            );
          }
        }
        break;
    }
  }

  /**
   * Trouve une cible dans la scène par son ID
   */
  private findTarget(targetId: string): AbstractMesh | null {
    // Rechercher dans tous les meshes de la scène
    const meshes = this.scene.meshes;
    for (const mesh of meshes) {
      if (mesh.id === targetId || mesh.name === targetId) {
        return mesh as AbstractMesh;
      }
    }
    
    // Rechercher dans les transform nodes
    const transformNodes = this.scene.transformNodes;
    for (const node of transformNodes) {
      if (node.id === targetId || node.name === targetId) {
        return node as unknown as AbstractMesh;
      }
    }
    
    return null;
  }

  /**
   * Crée une nouvelle animation clip
   */
  createAnimationClip(clip: AnimationClip): string {
    const clipId = clip.id || `clip-${Date.now()}`;
    const newClip: AnimationClip = {
      ...clip,
      id: clipId,
      duration: clip.duration || this.calculateClipDuration(clip)
    };
    
    this.animationClips.set(clipId, newClip);
    
    // Créer les animations Babylon.js pour chaque track
    newClip.tracks.forEach(track => {
      const animId = track.id || `anim-${Date.now()}`;
      const animation = new Animation(
        animId,
        track.property,
        this.scene.getEngine().getDeltaTime(),
        track.property,
        true
      );
      
      // Ajouter les keyframes
      track.keyframes.forEach(kf => {
        animation.setKeys([
          { frame: kf.time * 60, value: kf.value } // Convertir secondes en frames (60 fps)
        ]);
      });
      
      this.animations.set(animId, animation);
    });
    
    return clipId;
  }

  /**
   * Calcule la durée d'une animation clip à partir de ses tracks
   */
  private calculateClipDuration(clip: AnimationClip): number {
    let maxDuration = 0;
    
    clip.tracks.forEach(track => {
      if (track.keyframes.length > 0) {
        const lastKf = track.keyframes[track.keyframes.length - 1];
        maxDuration = Math.max(maxDuration, lastKf.time);
      }
    });
    
    return maxDuration;
  }

  /**
   * Crée une animation simple pour un objet
   */
  createSimpleAnimation(
    targetId: string,
    property: 'position' | 'rotation' | 'scale',
    from: any,
    to: any,
    duration: number = 1.0,
    loop: boolean = false
  ): string {
    const trackId = `track-${Date.now()}`;
    const clipId = `clip-${Date.now()}`;
    
    const keyframes: Keyframe[] = [
      { time: 0, value: from },
      { time: duration, value: to }
    ];
    
    const track: AnimationTrack = {
      id: trackId,
      name: `${property}-${targetId}`,
      property,
      target: targetId,
      keyframes,
      loop
    };
    
    const clip: AnimationClip = {
      id: clipId,
      name: `Animation-${targetId}-${property}`,
      tracks: [track],
      duration
    };
    
    return this.createAnimationClip(clip);
  }

  /**
   * Joue une animation clip
   */
  playClip(clipId: string, startTime: number = 0): void {
    const clip = this.animationClips.get(clipId);
    if (!clip) {
      console.warn(`Animation clip ${clipId} non trouvée`);
      return;
    }

    this.isPlaying = true;
    this.currentTime = startTime;
    this.globalStartTime = Date.now() - startTime * 1000;
  }

  /**
   * Met en pause les animations
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Arrête les animations
   */
  stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.globalStartTime = 0;
  }

  /**
   * Réinitialise les animations
   */
  reset(): void {
    this.stop();
    this.currentTime = 0;
    
    // Réinitialiser toutes les cibles à leur état initial
    this.animationClips.forEach(clip => {
      clip.tracks.forEach(track => {
        const target = this.findTarget(track.target);
        if (target && track.keyframes.length > 0) {
          const firstValue = track.keyframes[0].value;
          this.applyAnimationValue(track, firstValue);
        }
      });
    });
  }

  /**
   * Définit la vitesse de lecture
   */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * Obtient la vitesse de lecture actuelle
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * Obtient le temps actuel de l'animation
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Vérifie si les animations sont en cours de lecture
   */
  isPlayingAnimation(): boolean {
    return this.isPlaying;
  }

  /**
   * Ajoute un callback pour les mises à jour
   */
  onUpdate(callback: (time: number) => void): void {
    this.onUpdateCallbacks.push(callback);
  }

  /**
   * Supprime un callback
   */
  removeOnUpdate(callback: (time: number) => void): void {
    this.onUpdateCallbacks = this.onUpdateCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Supprime une animation clip
   */
  removeClip(clipId: string): boolean {
    const clip = this.animationClips.get(clipId);
    if (!clip) return false;

    // Supprimer toutes les tracks de cette clip
    clip.tracks.forEach(track => {
      this.animations.delete(track.id);
    });
    
    this.animationClips.delete(clipId);
    return true;
  }

  /**
   * Exporte les animations au format JSON
   */
  exportToJSON(): any {
    const data: any = {
      clips: [],
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
      speed: this.speed
    };

    this.animationClips.forEach(clip => {
      data.clips.push({
        id: clip.id,
        name: clip.name,
        duration: clip.duration,
        tracks: clip.tracks.map(track => ({
          id: track.id,
          name: track.name,
          property: track.property,
          target: track.target,
          loop: track.loop,
          keyframes: track.keyframes.map(kf => ({
            time: kf.time,
            value: kf.value,
            interpolation: kf.interpolation
          }))
        }))
      });
    });

    return data;
  }

  /**
   * Importe les animations depuis un JSON
   */
  importFromJSON(data: any): void {
    this.stop();
    this.animations.clear();
    this.animationClips.clear();

    if (data.speed !== undefined) {
      this.speed = data.speed;
    }

    if (data.clips) {
      data.clips.forEach((clipData: any) => {
        const clip: AnimationClip = {
          id: clipData.id,
          name: clipData.name,
          duration: clipData.duration,
          tracks: clipData.tracks.map((trackData: any) => ({
            id: trackData.id,
            name: trackData.name,
            property: trackData.property,
            target: trackData.target,
            loop: trackData.loop,
            keyframes: trackData.keyframes.map((kfData: any) => ({
              time: kfData.time,
              value: kfData.value,
              interpolation: kfData.interpolation
            }))
          }))
        };
        this.createAnimationClip(clip);
      });
    }

    if (data.isPlaying) {
      this.currentTime = data.currentTime || 0;
      this.isPlaying = true;
      this.globalStartTime = Date.now() - this.currentTime * 1000;
    }
  }

  /**
   * Crée une animation à partir d'un projet
   */
  createAnimationFromProject(
    projectScene: ProjectScene,
    objectId: string,
    property: 'position' | 'rotation' | 'scale',
    startValue: any,
    endValue: any,
    duration: number = 1.0
  ): string {
    const obj = projectScene.objects.find(o => o.id === objectId);
    if (!obj) {
      console.error(`Objet ${objectId} non trouvé`);
      return '';
    }

    return this.createSimpleAnimation(objectId, property, startValue, endValue, duration);
  }

  /**
   * Crée une animation complexe avec plusieurs keyframes
   */
  createComplexAnimation(
    targetId: string,
    property: 'position' | 'rotation' | 'scale',
    keyframes: Array<{ time: number; value: any }>,
    duration: number,
    loop: boolean = false
  ): string {
    const trackId = `track-${Date.now()}`;
    const clipId = `clip-${Date.now()}`;

    const animationKeyframes: Keyframe[] = keyframes.map(kf => ({
      time: kf.time,
      value: kf.value
    }));

    const track: AnimationTrack = {
      id: trackId,
      name: `${property}-${targetId}`,
      property,
      target: targetId,
      keyframes: animationKeyframes,
      loop
    };

    const clip: AnimationClip = {
      id: clipId,
      name: `Animation-${targetId}-${property}`,
      tracks: [track],
      duration
    };

    return this.createAnimationClip(clip);
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.stop();
    this.animations.clear();
    this.animationClips.clear();
    this.onUpdateCallbacks = [];
  }
}
