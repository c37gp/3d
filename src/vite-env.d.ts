/// <reference types="vite/client" />

// Déclarations pour les modules sans types
declare module 'csg' {
  export class CSG {
    static fromPolygons(polygons: any[]): CSG;
    union(csg: CSG): CSG;
    subtract(csg: CSG): CSG;
    intersect(csg: CSG): CSG;
    toPolygons(): any[];
  }
  
  export class Polygon {
    constructor(vertices: CSG.Vertex[]);
  }
  
  export class Vertex {
    constructor(x: number, y: number, z: number);
    x: number;
    y: number;
    z: number;
  }
}

// Déclarations pour Babylon.js (si nécessaire)
declare module '@babylonjs/core' {
  export * from '@babylonjs/core';
}

declare module '@babylonjs/gui' {
  export * from '@babylonjs/gui';
}

declare module '@babylonjs/loaders' {
  export * from '@babylonjs/loaders';
}

declare module '@babylonjs/serializers' {
  export * from '@babylonjs/serializers';
}
