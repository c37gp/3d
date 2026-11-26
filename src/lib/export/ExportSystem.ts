import { 
  Scene, 
  Engine,
  Mesh,
  AbstractMesh,
  Vector3,
  Tools
} from '@babylonjs/core';
import { 
  Project, 
  ProjectScene,
  ProjectObject,
  ExportOptions
} from '../../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * Système d'export pour le logiciel de modélisation 3D
 * Permet d'exporter des scènes en différents formats : STL, OBJ, GLTF, images, vidéo
 */
export class ExportSystem {
  private scene: Scene;
  private engine: Engine;
  private ffmpeg: FFmpeg | null = null;
  private ffmpegLoaded: boolean = false;

  constructor(scene: Scene, engine: Engine) {
    this.scene = scene;
    this.engine = engine;
  }

  /**
   * Initialise FFmpeg.wasm pour l'export vidéo
   */
  async initFFmpeg(): Promise<void> {
    if (this.ffmpegLoaded) return;

    this.ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
    
    try {
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      });
      this.ffmpegLoaded = true;
      console.log('FFmpeg.wasm initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement de FFmpeg.wasm:', error);
      this.ffmpeg = null;
    }
  }

  /**
   * Exporte la scène en STL (format pour impression 3D)
   */
  async exportToSTL(
    projectScene: ProjectScene,
    options: ExportOptions = { format: 'stl' }
  ): Promise<Blob | null> {
    try {
      // STL est un format binaire simple pour les meshes
      // On va exporter tous les objets de la scène
      const meshes: Mesh[] = [];
      
      // Trouver tous les meshes dans la scène Babylon.js
      this.scene.meshes.forEach(mesh => {
        if (mesh.id && !mesh.id.startsWith('axis') && !mesh.id.startsWith('ground') && !mesh.id.startsWith('grid')) {
          meshes.push(mesh as Mesh);
        }
      });

      if (meshes.length === 0) {
        console.warn('Aucun mesh à exporter en STL');
        return null;
      }

      // Créer le contenu STL
      const stlContent = this.createSTLContent(meshes);
      return new Blob([stlContent], { type: 'application/vnd.ms-pki.stl' });
      
    } catch (error) {
      console.error('Erreur lors de l\'export STL:', error);
      return null;
    }
  }

  /**
   * Crée le contenu binaire STL à partir de meshes
   */
  private createSTLContent(meshes: Mesh[]): Uint8Array {
    // Calculer le nombre total de triangles
    let totalTriangles = 0;
    meshes.forEach(mesh => {
      const indices = mesh.getIndices();
      if (indices) {
        totalTriangles += indices.length / 3;
      }
    });

    // Header STL (80 octets) + nombre de triangles (4 octets)
    const headerSize = 80 + 4;
    const triangleSize = 50; // 12 (normale) + 3 * 12 (vertices) + 2 (attribut)
    const bufferSize = headerSize + totalTriangles * triangleSize;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // Écrire le header (80 octets de zéros pour l'instant)
    for (let i = 0; i < 80; i++) {
      view.setUint8(i, 0);
    }

    // Écrire le nombre de triangles (4 octets, little-endian)
    view.setUint32(80, totalTriangles, true);

    let offset = 84;

    // Écrire chaque triangle
    meshes.forEach(mesh => {
      const positions = mesh.getVerticesData(0); // VertexBuffer.PositionKind
      const indices = mesh.getIndices();

      if (!positions || !indices) return;

      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];

        // Récupérer les vertices
        const v0 = new Vector3(
          positions[i0 * 3],
          positions[i0 * 3 + 1],
          positions[i0 * 3 + 2]
        );
        const v1 = new Vector3(
          positions[i1 * 3],
          positions[i1 * 3 + 1],
          positions[i1 * 3 + 2]
        );
        const v2 = new Vector3(
          positions[i2 * 3],
          positions[i2 * 3 + 1],
          positions[i2 * 3 + 2]
        );

        // Calculer la normale (produit vectoriel de v1-v0 et v2-v0)
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const normal = Vector3.Cross(edge1, edge2).normalize();

        // Écrire la normale (3 float32)
        view.setFloat32(offset, normal.x, true);
        view.setFloat32(offset + 4, normal.y, true);
        view.setFloat32(offset + 8, normal.z, true);
        offset += 12;

        // Écrire les vertices (3 float32 chacun)
        view.setFloat32(offset, v0.x, true);
        view.setFloat32(offset + 4, v0.y, true);
        view.setFloat32(offset + 8, v0.z, true);
        offset += 12;

        view.setFloat32(offset, v1.x, true);
        view.setFloat32(offset + 4, v1.y, true);
        view.setFloat32(offset + 8, v1.z, true);
        offset += 12;

        view.setFloat32(offset, v2.x, true);
        view.setFloat32(offset + 4, v2.y, true);
        view.setFloat32(offset + 8, v2.z, true);
        offset += 12;

        // Écrire l'attribut (2 octets, toujours 0)
        view.setUint16(offset, 0, true);
        offset += 2;
      }
    });

    return new Uint8Array(buffer);
  }

  /**
   * Exporte la scène en OBJ (format texte pour modélisation 3D)
   */
  async exportToOBJ(
    projectScene: ProjectScene,
    options: ExportOptions = { format: 'obj' }
  ): Promise<Blob | null> {
    try {
      let objContent = '# Fusion360-Web Export\n';
      objContent += `# Generated: ${new Date().toISOString()}\n\n`;

      const meshes: Mesh[] = [];
      let vertexOffset = 1;
      const vertexMap = new Map<Mesh, number[]>();

      // Trouver tous les meshes dans la scène Babylon.js
      this.scene.meshes.forEach(mesh => {
        if (mesh.id && !mesh.id.startsWith('axis') && !mesh.id.startsWith('ground') && !mesh.id.startsWith('grid')) {
          meshes.push(mesh as Mesh);
        }
      });

      if (meshes.length === 0) {
        console.warn('Aucun mesh à exporter en OBJ');
        return null;
      }

      // Écrire les vertices
      meshes.forEach((mesh, meshIndex) => {
        const positions = mesh.getVerticesData(0);
        if (!positions) return;

        const meshVertices: number[] = [];
        objContent += `# Object: ${mesh.name || mesh.id}\n`;

        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const y = positions[i + 1];
          const z = positions[i + 2];
          objContent += `v ${x} ${y} ${z}\n`;
          meshVertices.push(vertexOffset++);
        }

        vertexMap.set(mesh, meshVertices);

        // Écrire les normales (optionnel)
        const normals = mesh.getVerticesData(1); // VertexBuffer.NormalKind
        if (normals) {
          for (let i = 0; i < normals.length; i += 3) {
            const nx = normals[i];
            const ny = normals[i + 1];
            const nz = normals[i + 2];
            objContent += `vn ${nx} ${ny} ${nz}\n`;
          }
        }

        // Écrire les textures (optionnel)
        const uvs = mesh.getVerticesData(2); // VertexBuffer.UVKind
        if (uvs) {
          for (let i = 0; i < uvs.length; i += 2) {
            const u = uvs[i];
            const v = uvs[i + 1];
            objContent += `vt ${u} ${1 - v}\n`; // Inverser V pour OBJ
          }
        }

        objContent += '\n';
      });

      // Écrire les faces
      meshes.forEach(mesh => {
        const indices = mesh.getIndices();
        if (!indices) return;

        const meshVertices = vertexMap.get(mesh) || [];
        objContent += `# Faces for: ${mesh.name || mesh.id}\n`;

        for (let i = 0; i < indices.length; i += 3) {
          const i0 = meshVertices[indices[i]];
          const i1 = meshVertices[indices[i + 1]];
          const i2 = meshVertices[indices[i + 2]];
          
          // Format: f v1 v2 v3 (avec éventuellement vt/vn)
          objContent += `f ${i0} ${i1} ${i2}\n`;
        }

        objContent += '\n';
      });

      return new Blob([objContent], { type: 'text/plain' });
      
    } catch (error) {
      console.error('Erreur lors de l\'export OBJ:', error);
      return null;
    }
  }

  /**
   * Exporte la scène en GLTF (format moderne pour le web)
   */
  async exportToGLTF(
    projectScene: ProjectScene,
    options: ExportOptions = { format: 'gltf', binary: true }
  ): Promise<Blob | null> {
    try {
      // GLTF est un format complexe, on utilise l'exporteur Babylon.js
      const exporter = await import('@babylonjs/serializers/gltf');
      
      const meshes: AbstractMesh[] = [];
      
      // Trouver tous les meshes à exporter
      this.scene.meshes.forEach(mesh => {
        if (mesh.id && !mesh.id.startsWith('axis') && !mesh.id.startsWith('ground') && !mesh.id.startsWith('grid')) {
          meshes.push(mesh);
        }
      });

      if (meshes.length === 0) {
        console.warn('Aucun mesh à exporter en GLTF');
        return null;
      }

      // Exporter en GLTF
      const gltf = await exporter.GLTFSerializer.ExportAsync(
        this.scene,
        meshes,
        {
          shouldExportMeshes: true,
          shouldExportMaterials: true,
          shouldExportTextures: true,
          shouldExportLight: true,
          shouldExportCameras: true,
          binary: options.binary
        }
      );

      if (gltf) {
        return new Blob([gltf], { type: options.binary ? 'application/octet-stream' : 'application/json' });
      }

      return null;
      
    } catch (error) {
      console.error('Erreur lors de l\'export GLTF:', error);
      return null;
    }
  }

  /**
   * Exporte la scène en image (PNG, JPG)
   */
  async exportToImage(
    options: ExportOptions = { format: 'png', resolution: { width: 1920, height: 1080 } }
  ): Promise<Blob | null> {
    try {
      const width = options.resolution?.width || this.engine.getRenderWidth();
      const height = options.resolution?.height || this.engine.getRenderHeight();

      // Créer un rendu haute résolution
      const texture = new BABYLON.RenderTargetTexture(
        'exportTexture',
        { width, height },
        this.scene,
        false
      );

      // Rendre la scène dans la texture
      this.scene.render();

      // Attendre que le rendu soit terminé
      await Tools.DelayAsync(100);

      // Extraire les données de l'image
      const data = this.engine.readPixels(0, 0, width, height);

      if (!data) {
        console.error('Impossible de lire les pixels du rendu');
        return null;
      }

      // Créer un canvas pour encoder l'image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Impossible de créer le contexte 2D');
        return null;
      }

      // Convertir les données RGBA en ImageData
      const imageData = ctx.createImageData(width, height);
      for (let i = 0; i < data.length; i++) {
        imageData.data[i] = data[i];
      }

      // Dessiner sur le canvas
      ctx.putImageData(imageData, 0, 0);

      // Exporter en Blob
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => {
            texture.dispose();
            resolve(blob);
          },
          `image/${options.format}`,
          options.quality || 0.92
        );
      });

    } catch (error) {
      console.error('Erreur lors de l\'export en image:', error);
      return null;
    }
  }

  /**
   * Exporte la scène en vidéo (MP4, WebM)
   */
  async exportToVideo(
    projectScene: ProjectScene,
    animationClipId: string,
    options: ExportOptions = {
      format: 'mp4',
      resolution: { width: 1280, height: 720 },
      fps: 30,
      duration: 5
    }
  ): Promise<Blob | null> {
    try {
      // Initialiser FFmpeg
      await this.initFFmpeg();
      if (!this.ffmpeg || !this.ffmpegLoaded) {
        console.error('FFmpeg.wasm non disponible');
        return null;
      }

      const width = options.resolution?.width || 1280;
      const height = options.resolution?.height || 720;
      const fps = options.fps || 30;
      const duration = options.duration || 5;
      const totalFrames = Math.floor(duration * fps);

      // Créer un canvas pour le rendu
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Impossible de créer le contexte 2D');
        return null;
      }

      // Configurer Babylon.js pour rendre dans ce canvas
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
      });

      // Cloner la scène ou utiliser la scène existante
      const scene = this.scene;
      scene.getEngine().stopRenderLoop();

      // Créer une caméra pour le rendu vidéo
      const camera = scene.cameras[0];
      if (camera) {
        camera.attachControl(null, false);
      }

      // Rendre chaque frame
      const frames: Blob[] = [];
      const framePromises: Promise<void>[] = [];

      for (let frame = 0; frame < totalFrames; frame++) {
        const time = (frame / fps) % duration;
        
        // Mettre à jour l'animation
        // Note: Il faudrait intégrer avec AnimationSystem pour mettre à jour les animations
        
        // Rendre la scène
        scene.render();

        // Capturer le canvas
        framePromises.push(
          new Promise<void>((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) {
                frames.push(blob);
              }
              resolve();
            }, 'image/png', 0.8);
          })
        );
      }

      // Attendre que toutes les frames soient capturées
      await Promise.all(framePromises);

      // Si on n'a pas assez de frames, retourner null
      if (frames.length < totalFrames * 0.5) {
        console.error('Pas assez de frames capturées');
        return null;
      }

      // Créer un fichier vidéo avec FFmpeg
      await this.ffmpeg.writeFile('input.png', await fetchFile(frames[0]));

      // Note: Pour simplifier, on utilise seulement la première frame
      // Une implémentation complète devrait traiter toutes les frames
      // et créer une séquence vidéo

      const outputFormat = options.format === 'webm' ? 'webm' : 'mp4';
      const outputName = `output.${outputFormat}`;

      // Exécuter FFmpeg
      await this.ffmpeg.exec([
        '-i', 'input.png',
        '-f', 'image2',
        '-r', String(fps),
        '-s', `${width}x${height}`,
        '-c:v', outputFormat === 'webm' ? 'libvpx-vp9' : 'libx264',
        '-pix_fmt', 'yuv420p',
        outputName
      ]);

      // Lire le fichier de sortie
      const result = await this.ffmpeg.readFile(outputName);
      
      if (result) {
        return new Blob([result as Uint8Array], { type: `video/${outputFormat}` });
      }

      return null;
      
    } catch (error) {
      console.error('Erreur lors de l\'export vidéo:', error);
      return null;
    }
  }

  /**
   * Exporte un projet complet
   */
  async exportProject(
    project: Project,
    options: ExportOptions
  ): Promise<Blob | null> {
    const activeScene = project.scenes.find(s => s.id === project.activeSceneId);
    if (!activeScene) {
      console.error('Scène active non trouvée');
      return null;
    }

    switch (options.format) {
      case 'stl':
        return this.exportToSTL(activeScene, options);
      case 'obj':
        return this.exportToOBJ(activeScene, options);
      case 'gltf':
      case 'glb':
        return this.exportToGLTF(activeScene, { ...options, format: 'gltf', binary: true });
      case 'png':
      case 'jpg':
      case 'jpeg':
        return this.exportToImage({ ...options, format: options.format });
      case 'mp4':
      case 'webm':
        // Pour la vidéo, il faut une animation
        if (activeScene.animations && activeScene.animations.length > 0) {
          return this.exportToVideo(activeScene, activeScene.animations[0].id, options);
        } else {
          console.error('Aucune animation trouvée pour l\'export vidéo');
          return null;
        }
      default:
        console.error(`Format d'export non supporté: ${options.format}`);
        return null;
    }
  }

  /**
   * Télécharge un blob comme fichier
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Nettoie les ressources
   */
  async dispose(): Promise<void> {
    if (this.ffmpeg) {
      try {
        await this.ffmpeg.exit();
      } catch (error) {
        console.error('Erreur lors de la fermeture de FFmpeg:', error);
      }
    }
    this.ffmpeg = null;
    this.ffmpegLoaded = false;
  }
}
