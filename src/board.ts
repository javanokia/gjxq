import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  BOARD_SIZE,
  SQUARE_SIZE,
  BOARD_OFFSET,
  GeometryBuilder,
  createChessMaterials,
  squareToWorldPos,
  worldPosToSquare,
  coordsToSquare
} from './geometry';
import { getSceneConfig, SceneTheme } from './environment';

export interface PieceData {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  square: string;
}

export interface PieceMeshObject extends THREE.Group {
  pieceData?: PieceData;
}

export class Chess3DBoard {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  // Materials & Geometries
  private materials = createChessMaterials();
  private geometries: Record<string, THREE.BufferGeometry> = {};
  private sharedRingGeo!: THREE.CylinderGeometry;
  private sharedFeltGeo!: THREE.CylinderGeometry;

  // Board pieces mapping: square (e.g. "e4") -> PieceMeshObject
  public pieceMeshes: Map<string, PieceMeshObject> = new Map();
  public pieceList: PieceMeshObject[] = [];
  public squareMeshes: THREE.Mesh[][] = [];
  private flatSquares: THREE.Mesh[] = [];

  // Interaction highlights
  private selectionMarker: THREE.Mesh;
  private checkMarker: THREE.Mesh;
  private moveIndicators: THREE.Mesh[] = [];
  private lastMoveMarkers: THREE.Mesh[] = [];

  // Lights
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private mainLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private sideRimLight!: THREE.DirectionalLight;
  private spotLight!: THREE.SpotLight;

  // Scene Meshes & Materials
  private tableMesh!: THREE.Mesh;
  private tableRimMesh!: THREE.Mesh;
  private playmatMesh!: THREE.Mesh;
  private lightSquareMat!: THREE.MeshStandardMaterial;
  private darkSquareMat!: THREE.MeshStandardMaterial;
  public currentTheme: SceneTheme = 'royal';

  // Environment & Texture Caches
  private pmremCache = new Map<SceneTheme, THREE.Texture>();
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  private coordTextureCache = new Map<string, THREE.CanvasTexture>();
  private coordMaterialCache = new Map<string, THREE.MeshBasicMaterial>();

  // Raycasting & Throttled Hover
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private pointerDirty: boolean = false;

  // Active animations
  private activeAnimations: Array<{
    update: (delta: number) => boolean; // return true when finished
  }> = [];

  // Event callbacks
  public onSquareClicked?: (square: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x211a15, 0.007); // Gentle warm depth fog

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    // Default position: looking from White side
    this.camera.position.set(0, 18, 19);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below table
    this.controls.minDistance = 6;
    this.controls.maxDistance = 45;
    this.controls.target.set(0, 0, 0);

    // 5. Lights & Environment
    this.setupLighting();
    this.setupTableAndRoom();

    // 6. Preload Geometries
    this.initGeometries();

    // 7. Build Chessboard
    this.buildBoard();

    // 8. Apply Initial Scene Theme
    this.setSceneTheme('royal');

    // 9. Markers
    this.selectionMarker = this.createHighlightRing(0x00d2ff, 0.95);
    this.scene.add(this.selectionMarker);

    this.checkMarker = this.createHighlightRing(0xff2222, 1.05);
    this.scene.add(this.checkMarker);

    // 10. Event Listeners
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);

    // 11. Start Render Loop
    this.animate();
  }

  private setupLighting() {
    // 1. Soft Warm Hemisphere Light (Ceiling sky bounce & Floor ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0xfff6ea, 0x483a2e, 1.4);
    this.hemiLight.position.set(0, 30, 0);
    this.scene.add(this.hemiLight);

    // 2. Ambient light for baseline visibility
    this.ambientLight = new THREE.AmbientLight(0xfff5e6, 0.75);
    this.scene.add(this.ambientLight);

    // 3. Main Key directional light with soft shadow
    this.mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.mainLight.position.set(15, 26, 16);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 70;
    const d = 16;
    this.mainLight.shadow.camera.left = -d;
    this.mainLight.shadow.camera.right = d;
    this.mainLight.shadow.camera.top = d;
    this.mainLight.shadow.camera.bottom = -d;
    this.mainLight.shadow.bias = -0.0004;
    this.scene.add(this.mainLight);

    // 4. Cool Daylight Fill light from window side
    this.fillLight = new THREE.DirectionalLight(0xbddaff, 1.0);
    this.fillLight.position.set(-16, 20, -14);
    this.scene.add(this.fillLight);

    // 5. Golden Rim backlight to make piece silhouettes pop out crisply
    this.rimLight = new THREE.DirectionalLight(0xffe2a3, 1.3);
    this.rimLight.position.set(0, 12, -22);
    this.scene.add(this.rimLight);

    // 6. Side Rim light from right to sculpt piece curves
    this.sideRimLight = new THREE.DirectionalLight(0xffe6b3, 0.9);
    this.sideRimLight.position.set(22, 12, 0);
    this.scene.add(this.sideRimLight);

    // 7. Overhead soft spotlight for focused illumination on the 8x8 chessboard
    this.spotLight = new THREE.SpotLight(0xfffaed, 1.0, 45, Math.PI / 3.8, 0.5, 1.2);
    this.spotLight.position.set(0, 24, 0);
    this.scene.add(this.spotLight);
  }

  private setupTableAndRoom() {
    // 1. Luxury Polished Tabletop
    const tableGeo = new THREE.CylinderGeometry(28, 28, 1.4, 64);
    const tableMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.02,
      clearcoat: 0.7,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9
    });
    this.tableMesh = new THREE.Mesh(tableGeo, tableMat);
    this.tableMesh.position.y = -0.7;
    this.tableMesh.receiveShadow = true;
    this.scene.add(this.tableMesh);

    // 2. Beveled Outer Rim running around table circumference
    const rimGeo = new THREE.TorusGeometry(28.05, 0.28, 16, 64);
    rimGeo.rotateX(Math.PI / 2);
    const goldRimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });
    this.tableRimMesh = new THREE.Mesh(rimGeo, goldRimMat);
    this.tableRimMesh.position.y = -0.05;
    this.scene.add(this.tableRimMesh);

    // 3. Inlaid Baize Playmat directly under the chess board
    const matGeo = new THREE.CylinderGeometry(15.2, 15.2, 0.06, 64);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x184229, // Emerald velvet
      roughness: 0.92,
      metalness: 0.0
    });
    this.playmatMesh = new THREE.Mesh(matGeo, matMat);
    this.playmatMesh.position.y = 0.01;
    this.playmatMesh.receiveShadow = true;
    this.scene.add(this.playmatMesh);

    // 4. Gold Inlay Ring on Playmat Edge
    const matBorderGeo = new THREE.RingGeometry(14.8, 15.1, 64);
    matBorderGeo.rotateX(-Math.PI / 2);
    const matBorder = new THREE.Mesh(matBorderGeo, goldRimMat);
    matBorder.position.y = 0.045;
    this.scene.add(matBorder);
  }

  private initGeometries() {
    this.geometries['p'] = GeometryBuilder.createPawnGeometry();
    this.geometries['r'] = GeometryBuilder.createRookGeometry();
    this.geometries['n'] = GeometryBuilder.createKnightGeometry();
    this.geometries['b'] = GeometryBuilder.createBishopGeometry();
    this.geometries['q'] = GeometryBuilder.createQueenGeometry();
    this.geometries['k'] = GeometryBuilder.createKingGeometry();

    // Shared sub-geometries for all 32 pieces (reused to minimize GPU buffer allocations)
    this.sharedRingGeo = new THREE.CylinderGeometry(0.77, 0.77, 0.05, 36);
    this.sharedFeltGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.04, 32);
  }

  private buildBoard() {
    // Satin non-glare finish for pleasant readability
    this.lightSquareMat = new THREE.MeshStandardMaterial({
      color: 0xfbf6ec,
      map: this.materials.lightWoodTex,
      roughness: 0.62, // Anti-glare satin finish
      metalness: 0.0
    });

    // Warm rich walnut/rosewood tone ensuring black pieces contrast sharply
    this.darkSquareMat = new THREE.MeshStandardMaterial({
      color: 0x543224,
      map: this.materials.darkWoodTex,
      roughness: 0.65, // Anti-glare satin finish
      metalness: 0.0
    });

    const squareGeo = new THREE.BoxGeometry(SQUARE_SIZE, 0.4, SQUARE_SIZE);

    this.squareMeshes = [];
    this.flatSquares = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      this.squareMeshes[col] = [];
      for (let row = 0; row < BOARD_SIZE; row++) {
        const isLight = (col + row) % 2 !== 0;
        const mesh = new THREE.Mesh(squareGeo, isLight ? this.lightSquareMat : this.darkSquareMat);
        const worldPos = squareToWorldPos(col, row, 0.2);
        mesh.position.copy(worldPos);
        mesh.receiveShadow = true;
        mesh.userData = { square: coordsToSquare(col, row), col, row };
        this.scene.add(mesh);
        this.squareMeshes[col][row] = mesh;
        this.flatSquares.push(mesh);
      }
    }

    // Wooden Border Frame
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x24160d, // Dark mahogany wood frame
      roughness: 0.35,
      metalness: 0.05
    });

    const boardWidth = BOARD_SIZE * SQUARE_SIZE;
    const borderWidth = 1.3;
    const totalWidth = boardWidth + borderWidth * 2;
    const frameHeight = 0.55;

    // North & South border bars
    const barNorthSouthGeo = new THREE.BoxGeometry(totalWidth, frameHeight, borderWidth);
    const barNorth = new THREE.Mesh(barNorthSouthGeo, borderMat);
    barNorth.position.set(0, frameHeight / 2 - 0.05, -(boardWidth / 2 + borderWidth / 2));
    barNorth.receiveShadow = true;
    barNorth.castShadow = true;
    this.scene.add(barNorth);

    const barSouth = new THREE.Mesh(barNorthSouthGeo, borderMat);
    barSouth.position.set(0, frameHeight / 2 - 0.05, boardWidth / 2 + borderWidth / 2);
    barSouth.receiveShadow = true;
    barSouth.castShadow = true;
    this.scene.add(barSouth);

    // East & West border bars
    const barEastWestGeo = new THREE.BoxGeometry(borderWidth, frameHeight, boardWidth);
    const barEast = new THREE.Mesh(barEastWestGeo, borderMat);
    barEast.position.set(boardWidth / 2 + borderWidth / 2, frameHeight / 2 - 0.05, 0);
    barEast.receiveShadow = true;
    barEast.castShadow = true;
    this.scene.add(barEast);

    const barWest = new THREE.Mesh(barEastWestGeo, borderMat);
    barWest.position.set(-(boardWidth / 2 + borderWidth / 2), frameHeight / 2 - 0.05, 0);
    barWest.receiveShadow = true;
    barWest.castShadow = true;
    this.scene.add(barWest);

    // Inset golden chamfer strip around the board
    const goldStripMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.8
    });
    const stripGeo = new THREE.BoxGeometry(boardWidth + 0.1, 0.42, 0.08);
    const s1 = new THREE.Mesh(stripGeo, goldStripMat);
    s1.position.set(0, 0.21, boardWidth / 2 + 0.04);
    this.scene.add(s1);

    const s2 = new THREE.Mesh(stripGeo, goldStripMat);
    s2.position.set(0, 0.21, -(boardWidth / 2 + 0.04));
    this.scene.add(s2);

    const stripGeoEW = new THREE.BoxGeometry(0.08, 0.42, boardWidth + 0.1);
    const s3 = new THREE.Mesh(stripGeoEW, goldStripMat);
    s3.position.set(boardWidth / 2 + 0.04, 0.21, 0);
    this.scene.add(s3);

    const s4 = new THREE.Mesh(stripGeoEW, goldStripMat);
    s4.position.set(-(boardWidth / 2 + 0.04), 0.21, 0);
    this.scene.add(s4);

    // Create crisp coordinate labels flush on top of border
    this.addCoordinateLabels();
  }

  // Switch between scenes
  public setSceneTheme(theme: SceneTheme) {
    this.currentTheme = theme;
    const config = getSceneConfig(theme);

    // 1. Skybox and Environment
    this.scene.background = config.skybox;
    this.scene.backgroundBlurriness = config.blurriness;

    // PMREM Environment texture caching (drastically speeds up scene transitions)
    let envMap = this.pmremCache.get(theme);
    if (!envMap) {
      if (!this.pmremGenerator) {
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
      }
      envMap = this.pmremGenerator.fromEquirectangular(config.skybox).texture;
      this.pmremCache.set(theme, envMap);
    }
    this.scene.environment = envMap;

    // 2. Update Lights
    this.hemiLight.color.setHex(config.hemiSky);
    this.hemiLight.groundColor.setHex(config.hemiGround);
    this.hemiLight.intensity = config.hemiIntensity;

    this.ambientLight.color.setHex(config.ambientColor);
    this.ambientLight.intensity = config.ambientIntensity;

    this.mainLight.color.setHex(config.keyColor);
    this.mainLight.intensity = config.keyIntensity;
    this.mainLight.position.set(...config.keyPos);

    this.fillLight.color.setHex(config.fillColor);
    this.fillLight.intensity = config.fillIntensity;

    this.rimLight.color.setHex(config.rimColor);
    this.rimLight.intensity = config.rimIntensity;

    // 3. Update Table & Playmat
    const tableMat = this.tableMesh.material as THREE.MeshPhysicalMaterial;
    tableMat.map = config.tableTexture;
    tableMat.color.setHex(config.tableColor);
    tableMat.roughness = config.tableRoughness;
    tableMat.metalness = config.tableMetalness;
    tableMat.needsUpdate = true;

    (this.tableRimMesh.material as THREE.MeshStandardMaterial).color.setHex(config.tableRimColor);
    (this.playmatMesh.material as THREE.MeshStandardMaterial).color.setHex(config.playmatColor);

    // 4. Update Board Squares
    this.lightSquareMat.color.setHex(config.boardLightSquareColor);
    this.lightSquareMat.roughness = config.boardRoughness;
    this.darkSquareMat.color.setHex(config.boardDarkSquareColor);
    this.darkSquareMat.roughness = config.boardRoughness;
  }

  // Flat horizontal coordinate marks that never clip or get cut off
  private addCoordinateLabels() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8'];

    // Border center line is at 8.65 from origin
    const borderDist = BOARD_SIZE * (SQUARE_SIZE / 2) + 0.65; // 8.65
    const labelY = 0.506; // Flush right on top of border frame (y = 0.50)

    for (let i = 0; i < 8; i++) {
      const coord = i * SQUARE_SIZE - BOARD_OFFSET;

      // Bottom letter (South / White side)
      const labelA = this.createCoordinateMesh(letters[i], 0);
      labelA.position.set(coord, labelY, borderDist);
      this.scene.add(labelA);

      // Top letter (North / Black side - oriented towards black player)
      const labelB = this.createCoordinateMesh(letters[i], Math.PI);
      labelB.position.set(coord, labelY, -borderDist);
      this.scene.add(labelB);

      // Left number (West)
      const labelN1 = this.createCoordinateMesh(numbers[i], 0);
      labelN1.position.set(-borderDist, labelY, -coord);
      this.scene.add(labelN1);

      // Right number (East)
      const labelN2 = this.createCoordinateMesh(numbers[i], Math.PI);
      labelN2.position.set(borderDist, labelY, -coord);
      this.scene.add(labelN2);
    }
  }

  private getCoordinateMaterial(text: string): THREE.MeshBasicMaterial {
    let mat = this.coordMaterialCache.get(text);
    if (!mat) {
      let texture = this.coordTextureCache.get(text);
      if (!texture) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        ctx.font = 'bold 160px "Cinzel", "Segoe UI", system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fce7b8';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 12;
        ctx.fillText(text, 128, 128);

        texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this.coordTextureCache.set(text, texture);
      }
      mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1
      });
      this.coordMaterialCache.set(text, mat);
    }
    return mat;
  }

  private createCoordinateMesh(text: string, rotationZ: number = 0): THREE.Mesh {
    const mat = this.getCoordinateMaterial(text);
    const geo = new THREE.PlaneGeometry(0.85, 0.85);
    geo.rotateX(-Math.PI / 2);
    if (rotationZ !== 0) {
      geo.rotateY(rotationZ);
    }
    return new THREE.Mesh(geo, mat);
  }

  private createHighlightRing(color: number, radius: number): THREE.Mesh {
    const geo = new THREE.RingGeometry(radius * 0.72, radius, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.41;
    mesh.visible = false;
    return mesh;
  }

  // Create a single 3D piece mesh group
  public createPieceMesh(data: PieceData): PieceMeshObject {
    const group = new THREE.Group() as PieceMeshObject;
    group.pieceData = data;

    const geo = this.geometries[data.type];
    const mat = data.color === 'w' ? this.materials.whitePiece : this.materials.blackPiece;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Luxury Brass Accent Ring Collar (reusing sharedRingGeo)
    const brassRing = new THREE.Mesh(this.sharedRingGeo, this.materials.brassTrim);
    brassRing.position.y = 0.02;
    brassRing.castShadow = true;
    group.add(brassRing);

    // Green/burgundy velvet base felt pad (reusing sharedFeltGeo)
    const felt = new THREE.Mesh(this.sharedFeltGeo, this.materials.felt);
    felt.position.y = -0.02;
    group.add(felt);

    // Rotate Knight to face opponent
    if (data.type === 'n') {
      if (data.color === 'w') {
        group.rotation.y = Math.PI / 2; // Facing black side (-Z)
      } else {
        group.rotation.y = -Math.PI / 2; // Facing white side (+Z)
      }
    }

    return group;
  }

  // Synchronize entire board from chess.js board state
  public syncBoard(boardState: ({ type: string; color: string; square: string } | null)[][]) {
    // Collect existing pieces
    const currentPieces = new Map(this.pieceMeshes);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const item = boardState[r][c];
        const sq = coordsToSquare(c, 7 - r); // chess.js row 0 is rank 8

        const existing = currentPieces.get(sq);

        if (item) {
          if (
            existing &&
            existing.pieceData?.type === item.type &&
            existing.pieceData?.color === item.color
          ) {
            // Keep piece
            currentPieces.delete(sq);
          } else {
            // Remove old if mismatch
            if (existing) {
              this.scene.remove(existing);
              this.pieceMeshes.delete(sq);
              currentPieces.delete(sq);
            }

            // Create new piece
            const newPiece = this.createPieceMesh({
              type: item.type as PieceData['type'],
              color: item.color as PieceData['color'],
              square: sq
            });
            const pos = squareToWorldPos(c, 7 - r, 0.4);
            newPiece.position.copy(pos);
            this.scene.add(newPiece);
            this.pieceMeshes.set(sq, newPiece);
          }
        } else if (existing) {
          // Empty square, remove piece
          this.scene.remove(existing);
          this.pieceMeshes.delete(sq);
          currentPieces.delete(sq);
        }
      }
    }

    // Clean up any remaining
    currentPieces.forEach((mesh, sq) => {
      this.scene.remove(mesh);
      this.pieceMeshes.delete(sq);
    });

    this.updatePieceList();
  }

  private updatePieceList() {
    this.pieceList = Array.from(this.pieceMeshes.values());
  }

  // Animate a piece moving from square to square
  public animateMove(
    fromSq: string,
    toSq: string,
    onFinish?: () => void
  ) {
    const piece = this.pieceMeshes.get(fromSq);
    if (!piece) {
      if (onFinish) onFinish();
      return;
    }

    const { col: toCol, row: toRow } = this.squareToRowCol(toSq);
    const targetPos = squareToWorldPos(toCol, toRow, 0.4);
    const startPos = piece.position.clone();

    // Check if there is an opponent piece on the destination
    const capturedPiece = this.pieceMeshes.get(toSq);
    if (capturedPiece) {
      this.animateCapture(capturedPiece);
    }

    // Update map immediately
    this.pieceMeshes.delete(fromSq);
    this.pieceMeshes.set(toSq, piece);
    if (piece.pieceData) {
      piece.pieceData.square = toSq;
    }

    // Parabolic arc movement
    const duration = 0.38; // seconds
    let elapsed = 0;
    const arcHeight = 1.35;

    this.activeAnimations.push({
      update: (delta: number) => {
        elapsed += delta;
        const progress = Math.min(elapsed / duration, 1.0);
        // Smooth easing (cubic)
        const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        piece.position.lerpVectors(startPos, targetPos, t);
        // Parabolic arc in Y
        piece.position.y = 0.4 + Math.sin(progress * Math.PI) * arcHeight;

        if (progress >= 1.0) {
          piece.position.copy(targetPos);
          if (onFinish) onFinish();
          return true;
        }
        return false;
      }
    });
  }

  // Animate captured piece tilting and sliding off the board
  public animateCapture(piece: PieceMeshObject) {
    let elapsed = 0;
    const duration = 0.35;
    const startPos = piece.position.clone();
    const isWhite = piece.pieceData?.color === 'w';
    // Move towards side trays
    const targetX = isWhite ? -11.5 : 11.5;
    const targetPos = new THREE.Vector3(targetX, 0.2, (Math.random() - 0.5) * 8);

    this.activeAnimations.push({
      update: (delta: number) => {
        elapsed += delta;
        const progress = Math.min(elapsed / duration, 1.0);
        piece.position.lerpVectors(startPos, targetPos, progress);
        piece.rotation.z = progress * 0.8 * (isWhite ? -1 : 1);
        piece.scale.multiplyScalar(0.98);

        if (progress >= 1.0) {
          this.scene.remove(piece);
          this.updatePieceList();
          return true;
        }
        return false;
      }
    });
  }

  // Highlight selected square / piece
  public setSelectedSquare(square: string | null) {
    if (!square) {
      this.selectionMarker.visible = false;
      return;
    }
    const { col, row } = this.squareToRowCol(square);
    const pos = squareToWorldPos(col, row, 0.41);
    this.selectionMarker.position.copy(pos);
    (this.selectionMarker.material as THREE.MeshBasicMaterial).opacity = 0.85;
    this.selectionMarker.visible = true;
  }

  // Highlight check on King
  public setCheckSquare(square: string | null) {
    if (!square) {
      this.checkMarker.visible = false;
      return;
    }
    const { col, row } = this.squareToRowCol(square);
    const pos = squareToWorldPos(col, row, 0.415);
    this.checkMarker.position.copy(pos);
    (this.checkMarker.material as THREE.MeshBasicMaterial).opacity = 0.9;
    this.checkMarker.visible = true;
  }

  // Show legal destination move indicators
  public setLegalMoves(targets: { square: string; isCapture: boolean }[]) {
    // Clear existing indicators
    for (const ind of this.moveIndicators) {
      this.scene.remove(ind);
    }
    this.moveIndicators = [];

    for (const t of targets) {
      const { col, row } = this.squareToRowCol(t.square);
      const pos = squareToWorldPos(col, row, 0.42);

      if (t.isCapture) {
        // Double-ring glowing crimson capture target
        const group = new THREE.Group();
        const innerGeo = new THREE.RingGeometry(0.68, 0.78, 32);
        innerGeo.rotateX(-Math.PI / 2);
        const outerGeo = new THREE.RingGeometry(0.86, 0.96, 32);
        outerGeo.rotateX(-Math.PI / 2);

        const mat = new THREE.MeshBasicMaterial({
          color: 0xff3b30,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });

        const m1 = new THREE.Mesh(innerGeo, mat);
        const m2 = new THREE.Mesh(outerGeo, mat);
        group.add(m1, m2);
        group.position.copy(pos);
        group.userData = { targetSquare: t.square };
        this.scene.add(group);
        this.moveIndicators.push(group as any);
      } else {
        // Layered glowing glass bead for empty target square
        const group = new THREE.Group();
        const beadGeo = new THREE.CircleGeometry(0.22, 28);
        beadGeo.rotateX(-Math.PI / 2);
        const beadMat = new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });

        const haloGeo = new THREE.RingGeometry(0.28, 0.38, 28);
        haloGeo.rotateX(-Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4
        });

        const mBead = new THREE.Mesh(beadGeo, beadMat);
        const mHalo = new THREE.Mesh(haloGeo, haloMat);
        group.add(mBead, mHalo);
        group.position.copy(pos);
        group.userData = { targetSquare: t.square };
        this.scene.add(group);
        this.moveIndicators.push(group as any);
      }
    }
  }

  // Highlight last move from & to squares
  public setLastMove(fromSq: string | null, toSq: string | null) {
    for (const m of this.lastMoveMarkers) {
      this.scene.remove(m);
    }
    this.lastMoveMarkers = [];

    if (!fromSq || !toSq) return;

    [fromSq, toSq].forEach((sq) => {
      const { col, row } = this.squareToRowCol(sq);
      const pos = squareToWorldPos(col, row, 0.412);
      const geo = new THREE.PlaneGeometry(SQUARE_SIZE * 0.98, SQUARE_SIZE * 0.98);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xf4d03f,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.lastMoveMarkers.push(mesh);
    });
  }

  // Preset camera views
  public setCameraView(view: 'white' | 'black' | 'top' | 'side' | 'isometric') {
    const startPos = this.camera.position.clone();
    let targetPos = new THREE.Vector3();

    switch (view) {
      case 'white':
        targetPos.set(0, 18, 19);
        break;
      case 'black':
        targetPos.set(0, 18, -19);
        break;
      case 'top':
        targetPos.set(0, 26, 0.01);
        break;
      case 'side':
        targetPos.set(22, 14, 0);
        break;
      case 'isometric':
        targetPos.set(16, 17, 16);
        break;
    }

    const duration = 0.8;
    let elapsed = 0;
    this.activeAnimations.push({
      update: (delta) => {
        elapsed += delta;
        const progress = Math.min(elapsed / duration, 1.0);
        const t = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        this.camera.position.lerpVectors(startPos, targetPos, t);
        this.controls.target.set(0, 0, 0);
        if (progress >= 1.0) {
          this.camera.position.copy(targetPos);
          return true;
        }
        return false;
      }
    });
  }

  private squareToRowCol(sq: string): { col: number; row: number } {
    const col = sq.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = parseInt(sq[1], 10) - 1;
    return { col, row };
  }

  // Pointer interaction
  private onPointerDown = (e: MouseEvent) => {
    // Only handle primary mouse click
    if (e.button !== 0) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check legal move indicators first
    const indIntersects = this.raycaster.intersectObjects(this.moveIndicators, true);
    if (indIntersects.length > 0) {
      let current: THREE.Object3D | null = indIntersects[0].object;
      while (current && !current.userData?.targetSquare && current.parent) {
        current = current.parent;
      }
      const targetSq = current?.userData?.targetSquare;
      if (targetSq && this.onSquareClicked) {
        this.onSquareClicked(targetSq);
        return;
      }
    }

    // 2. Check piece meshes (using cached pieceList, avoiding Array.from allocation)
    const pieceIntersects = this.raycaster.intersectObjects(this.pieceList, true);
    if (pieceIntersects.length > 0) {
      let current: THREE.Object3D | null = pieceIntersects[0].object;
      while (current && !(current as PieceMeshObject).pieceData && current.parent) {
        current = current.parent;
      }
      const pMesh = current as PieceMeshObject;
      if (pMesh && pMesh.pieceData && this.onSquareClicked) {
        this.onSquareClicked(pMesh.pieceData.square);
        return;
      }
    }

    // 3. Check board square tiles (using pre-allocated flatSquares, zero allocation)
    const sqIntersects = this.raycaster.intersectObjects(this.flatSquares);
    if (sqIntersects.length > 0) {
      const clickedSq = sqIntersects[0].object.userData.square;
      if (clickedSq && this.onSquareClicked) {
        this.onSquareClicked(clickedSq);
      }
    }
  };

  private onPointerMove = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerDirty = true;
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private clock = new THREE.Clock();

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    // Run active animations
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const finished = this.activeAnimations[i].update(delta);
      if (finished) {
        this.activeAnimations.splice(i, 1);
      }
    }

    // Pulse effects for selection and check markers
    const time = this.clock.getElapsedTime();
    if (this.selectionMarker.visible) {
      const pulse = 0.7 + 0.25 * Math.sin(time * 6);
      (this.selectionMarker.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
    if (this.checkMarker.visible) {
      const pulse = 0.65 + 0.35 * Math.sin(time * 8);
      (this.checkMarker.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // Throttled raycasting for hover cursor style (max once per frame, zero GC)
    if (this.pointerDirty) {
      this.pointerDirty = false;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const indIntersects = this.raycaster.intersectObjects(this.moveIndicators, true);
      const pieceIntersects = this.raycaster.intersectObjects(this.pieceList, true);
      this.renderer.domElement.style.cursor =
        indIntersects.length > 0 || pieceIntersects.length > 0 ? 'pointer' : 'default';
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);

    // Clean up PMREM & Environment maps
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
    this.pmremCache.forEach((tex) => tex.dispose());
    this.pmremCache.clear();

    // Clean up Coordinate Labels & Materials
    this.coordTextureCache.forEach((t) => t.dispose());
    this.coordTextureCache.clear();
    this.coordMaterialCache.forEach((m) => m.dispose());
    this.coordMaterialCache.clear();

    // Clean up Geometries
    Object.values(this.geometries).forEach((geo) => geo.dispose());
    this.geometries = {};
    if (this.sharedRingGeo) this.sharedRingGeo.dispose();
    if (this.sharedFeltGeo) this.sharedFeltGeo.dispose();

    this.controls.dispose();
    this.renderer.dispose();
  }
}
