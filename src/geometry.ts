import * as THREE from 'three';

export const BOARD_SIZE = 8;
export const SQUARE_SIZE = 2.0;
export const BOARD_OFFSET = ((BOARD_SIZE - 1) * SQUARE_SIZE) / 2; // 7.0

// Helper to convert board coordinates (col: 0..7 for a..h, row: 0..7 for 1..8) to 3D world position
export function squareToWorldPos(col: number, row: number, y: number = 0): THREE.Vector3 {
  const x = col * SQUARE_SIZE - BOARD_OFFSET;
  const z = -(row * SQUARE_SIZE - BOARD_OFFSET);
  return new THREE.Vector3(x, y, z);
}

// Convert world X, Z to board col, row (0..7)
export function worldPosToSquare(pos: THREE.Vector3): { col: number; row: number } | null {
  const halfSq = SQUARE_SIZE / 2;
  const colFloat = (pos.x + BOARD_OFFSET + halfSq) / SQUARE_SIZE;
  const rowFloat = (-pos.z + BOARD_OFFSET + halfSq) / SQUARE_SIZE;

  const col = Math.floor(colFloat);
  const row = Math.floor(rowFloat);

  if (col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE) {
    return { col, row };
  }
  return null;
}

// Algebraic square (e.g. "e4") to col, row
export function squareToCoords(square: string): { col: number; row: number } {
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(square[1], 10) - 1;
  return { col, row };
}

// col, row to algebraic square (e.g. 4, 3 -> "e4")
export function coordsToSquare(col: number, row: number): string {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = (row + 1).toString();
  return `${file}${rank}`;
}

export class GeometryBuilder {
  private static latheSegments = 48; // High resolution curves

  // Create standard lathe geometry from 2D points [radius, y]
  private static createLathe(points: [number, number][]): THREE.BufferGeometry {
    const v2Points = points.map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(v2Points, this.latheSegments);
    geo.computeVertexNormals();
    return geo;
  }

  // Pawn Geometry
  static createPawnGeometry(): THREE.BufferGeometry {
    const points: [number, number][] = [
      [0.0, 0.0],
      [0.72, 0.0],
      [0.72, 0.06],
      [0.65, 0.12],
      [0.60, 0.22],
      [0.48, 0.35],
      [0.40, 0.45],
      [0.26, 0.95],
      [0.22, 1.15],
      [0.34, 1.20],
      [0.35, 1.26],
      [0.22, 1.30],
      [0.20, 1.40],
      [0.0, 1.40]
    ];
    const bodyGeo = this.createLathe(points);

    // Head sphere
    const headGeo = new THREE.SphereGeometry(0.38, 32, 28);
    headGeo.translate(0, 1.68, 0);

    return this.mergeGeometries([bodyGeo, headGeo]);
  }

  // Rook Geometry
  static createRookGeometry(): THREE.BufferGeometry {
    const basePoints: [number, number][] = [
      [0.0, 0.0],
      [0.76, 0.0],
      [0.76, 0.08],
      [0.68, 0.18],
      [0.60, 0.30],
      [0.46, 0.48],
      [0.42, 1.55],
      [0.52, 1.70],
      [0.58, 1.82],
      [0.58, 2.40],
      [0.42, 2.40],
      [0.42, 2.10],
      [0.0, 2.10]
    ];
    const bodyGeo = this.createLathe(basePoints);

    // Crenellations (battlements) atop the tower
    const crenellations: THREE.BufferGeometry[] = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const bGeo = new THREE.BoxGeometry(0.24, 0.26, 0.2);
      bGeo.translate(0.5, 2.48, 0);
      bGeo.rotateY(angle);
      crenellations.push(bGeo);
    }

    return this.mergeGeometries([bodyGeo, ...crenellations]);
  }

  // Knight Geometry (Base + sculpted horse head)
  static createKnightGeometry(): THREE.BufferGeometry {
    const basePoints: [number, number][] = [
      [0.0, 0.0],
      [0.76, 0.0],
      [0.76, 0.08],
      [0.68, 0.18],
      [0.58, 0.32],
      [0.46, 0.48],
      [0.42, 0.85],
      [0.48, 0.95],
      [0.0, 0.95]
    ];
    const baseGeo = this.createLathe(basePoints);

    // 2D Profile of the Knight's head (facing +X)
    const shape = new THREE.Shape();
    shape.moveTo(-0.28, 0.9);
    shape.bezierCurveTo(-0.35, 1.3, -0.32, 1.8, -0.25, 2.2);
    shape.lineTo(-0.15, 2.45);
    shape.lineTo(-0.06, 2.7);
    shape.lineTo(0.04, 2.4);
    shape.lineTo(0.25, 2.2);
    shape.lineTo(0.52, 1.8);
    shape.lineTo(0.48, 1.6);
    shape.lineTo(0.32, 1.62);
    shape.lineTo(0.38, 1.48);
    shape.bezierCurveTo(0.25, 1.35, 0.15, 1.25, 0.1, 1.15);
    shape.bezierCurveTo(0.05, 1.05, 0.0, 0.95, 0.15, 0.9);
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.36,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06
    };

    const headGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    headGeo.translate(0, 0, -0.18);
    headGeo.computeVertexNormals();

    // Eye sockets
    const eyeR = new THREE.SphereGeometry(0.06, 16, 16);
    eyeR.translate(0.12, 2.05, 0.22);
    const eyeL = new THREE.SphereGeometry(0.06, 16, 16);
    eyeL.translate(0.12, 2.05, -0.22);

    return this.mergeGeometries([baseGeo, headGeo, eyeR, eyeL]);
  }

  // Bishop Geometry
  static createBishopGeometry(): THREE.BufferGeometry {
    const points: [number, number][] = [
      [0.0, 0.0],
      [0.75, 0.0],
      [0.75, 0.08],
      [0.66, 0.18],
      [0.58, 0.32],
      [0.44, 0.48],
      [0.26, 1.40],
      [0.40, 1.55],
      [0.34, 1.65],
      [0.44, 1.95],
      [0.46, 2.30],
      [0.35, 2.65],
      [0.18, 2.85],
      [0.05, 2.95],
      [0.0, 3.0]
    ];
    const bodyGeo = this.createLathe(points);

    // Finial ball
    const finialGeo = new THREE.SphereGeometry(0.12, 20, 20);
    finialGeo.translate(0, 3.08, 0);

    return this.mergeGeometries([bodyGeo, finialGeo]);
  }

  // Queen Geometry
  static createQueenGeometry(): THREE.BufferGeometry {
    const points: [number, number][] = [
      [0.0, 0.0],
      [0.82, 0.0],
      [0.82, 0.08],
      [0.72, 0.20],
      [0.62, 0.35],
      [0.46, 0.52],
      [0.28, 1.70],
      [0.44, 1.90],
      [0.38, 2.02],
      [0.46, 2.45],
      [0.58, 2.95],
      [0.54, 3.15],
      [0.36, 3.20],
      [0.15, 3.30],
      [0.0, 3.32]
    ];
    const bodyGeo = this.createLathe(points);

    // Crown pearls
    const crownPearls: THREE.BufferGeometry[] = [];
    const pearlCount = 8;
    const rimRadius = 0.54;
    const rimY = 3.16;

    for (let i = 0; i < pearlCount; i++) {
      const angle = (i * Math.PI * 2) / pearlCount;
      const pearl = new THREE.SphereGeometry(0.065, 16, 16);
      pearl.translate(Math.cos(angle) * rimRadius, rimY, Math.sin(angle) * rimRadius);
      crownPearls.push(pearl);
    }

    const centerOrb = new THREE.SphereGeometry(0.16, 24, 24);
    centerOrb.translate(0, 3.44, 0);

    return this.mergeGeometries([bodyGeo, centerOrb, ...crownPearls]);
  }

  // King Geometry
  static createKingGeometry(): THREE.BufferGeometry {
    const points: [number, number][] = [
      [0.0, 0.0],
      [0.85, 0.0],
      [0.85, 0.08],
      [0.75, 0.22],
      [0.65, 0.38],
      [0.48, 0.55],
      [0.30, 1.80],
      [0.48, 2.02],
      [0.42, 2.15],
      [0.50, 2.65],
      [0.60, 3.15],
      [0.56, 3.35],
      [0.38, 3.42],
      [0.15, 3.52],
      [0.0, 3.55]
    ];
    const bodyGeo = this.createLathe(points);

    // Cross
    const crossVert = new THREE.BoxGeometry(0.12, 0.42, 0.09);
    crossVert.translate(0, 3.76, 0);

    const crossHoriz = new THREE.BoxGeometry(0.32, 0.11, 0.09);
    crossHoriz.translate(0, 3.82, 0);

    return this.mergeGeometries([bodyGeo, crossVert, crossHoriz]);
  }

  // Merge BufferGeometries
  private static mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geos.length === 1) return geos[0];

    let totalVertices = 0;

    for (const g of geos) {
      const nonIndexed = g.index ? g.toNonIndexed() : g;
      totalVertices += nonIndexed.attributes.position.count;
    }

    const posArray = new Float32Array(totalVertices * 3);
    const normArray = new Float32Array(totalVertices * 3);
    let offset = 0;

    for (const g of geos) {
      const nonIndexed = g.index ? g.toNonIndexed() : g;
      const pos = nonIndexed.attributes.position.array;
      const norm = nonIndexed.attributes.normal?.array;

      posArray.set(pos, offset * 3);
      if (norm) {
        normArray.set(norm, offset * 3);
      }
      offset += nonIndexed.attributes.position.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
    merged.computeVertexNormals();
    return merged;
  }
}

// Procedural high-resolution wood grain texture generator with caching
const woodTextureCache = new Map<string, THREE.CanvasTexture>();

export function createProceduralWoodTexture(
  type: 'light' | 'dark' | 'border' | 'table'
): THREE.CanvasTexture {
  const cached = woodTextureCache.get(type);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  let baseColor = '#e8dcc4';
  let grainColor = '#c7b393';
  let grainFreq = 24;

  if (type === 'light') {
    // Maple / Birch
    baseColor = '#efe5cf';
    grainColor = '#d9c6a7';
    grainFreq = 28;
  } else if (type === 'dark') {
    // Walnut / Mahogany
    baseColor = '#3a2217';
    grainColor = '#24140d';
    grainFreq = 22;
  } else if (type === 'border') {
    // Rosewood / Dark Cherry border
    baseColor = '#221109';
    grainColor = '#140a05';
    grainFreq = 18;
  } else if (type === 'table') {
    // Dark Charcoal / Walnut Studio Table
    baseColor = '#15171b';
    grainColor = '#0d0e11';
    grainFreq = 16;
  }

  // Base background
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Draw organic wood rings / wavy grain
  ctx.fillStyle = grainColor;
  for (let y = 0; y < 512; y++) {
    const wave = Math.sin(y / grainFreq) * 12 + Math.cos(y / (grainFreq * 2.3)) * 6;
    const alpha = (Math.sin((y + wave) * 0.15) + 1) * 0.12;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, y, 512, 1.5);
  }

  // Add subtle micro fibers
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const rlen = 6 + Math.random() * 18;
    ctx.fillRect(rx, ry, rlen, 1);
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  woodTextureCache.set(type, texture);
  return texture;
}

export interface ChessMaterials {
  whitePiece: THREE.MeshPhysicalMaterial;
  blackPiece: THREE.MeshPhysicalMaterial;
  brassTrim: THREE.MeshStandardMaterial;
  felt: THREE.MeshStandardMaterial;
  lightWoodTex: THREE.CanvasTexture;
  darkWoodTex: THREE.CanvasTexture;
}

let cachedMaterials: ChessMaterials | null = null;

// Procedural materials with luxury MeshPhysicalMaterial
export function createChessMaterials(): ChessMaterials {
  if (cachedMaterials) return cachedMaterials;

  const lightWoodTex = createProceduralWoodTexture('light');
  const darkWoodTex = createProceduralWoodTexture('dark');

  // White pieces: French Boxwood / Polished Ivory with lacquer clearcoat
  const whitePieceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfcf7ed,
    roughness: 0.16,
    metalness: 0.02,
    clearcoat: 0.75,
    clearcoatRoughness: 0.08,
    reflectivity: 0.85,
    envMapIntensity: 1.5
  });

  // Black pieces: Polished Obsidian / African Blackwood with high-gloss clearcoat reflections
  // Uses rich espresso undertone so the piece form and details are clearly visible
  const blackPieceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x24201e,
    roughness: 0.14,
    metalness: 0.06,
    clearcoat: 0.92,
    clearcoatRoughness: 0.05,
    reflectivity: 0.96,
    envMapIntensity: 2.4
  });

  // Brass Trim Collar (weighted luxury ring above felt)
  const brassTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
    envMapIntensity: 1.5
  });

  // Velvet Baize Felt under pieces
  const feltMaterial = new THREE.MeshStandardMaterial({
    color: 0x143c22,
    roughness: 0.95,
    metalness: 0.0
  });

  cachedMaterials = {
    whitePiece: whitePieceMaterial,
    blackPiece: blackPieceMaterial,
    brassTrim: brassTrimMaterial,
    felt: feltMaterial,
    lightWoodTex,
    darkWoodTex
  };

  return cachedMaterials;
}
