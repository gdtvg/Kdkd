import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraPreset, GridSize, MoveDirection, TileData, VisualTheme } from '../types';
import { THEMES, getTileCanvasTexture } from './themes';

export interface TileMeshInstance {
  id: string;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  topMesh: THREE.Mesh;
  targetPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  scale: THREE.Vector3;
  targetScale: THREE.Vector3;
  isMerging: boolean;
  value: number;
}

export interface BoardParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ThreeBoard {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator;

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;

  // Board 3D structures
  private boardGroup: THREE.Group;
  private cellSlotsGroup: THREE.Group;
  private tilesGroup: THREE.Group;
  private particlesGroup: THREE.Group;
  private contactShadowPlane: THREE.Mesh;

  // Dynamic Tile Meshes
  private tileInstances: Map<string, TileMeshInstance> = new Map();
  private particles: BoardParticle[] = [];

  // Configuration
  private gridSize: GridSize = 4;
  private theme: VisualTheme = 'cyberpunk';
  private cameraPreset: CameraPreset = 'iso';

  // Board dimensions
  private readonly BOARD_PHYSICAL_SIZE = 6.0; // Fixed physical size in 3D units
  private cellSize: number = 1.25;
  private cellGap: number = 0.15;
  private tileThickness: number = 0.35;

  // Interaction & Tilt
  private targetBoardRot = new THREE.Vector2(0, 0);
  private currentBoardRot = new THREE.Vector2(0, 0);
  private mouseParallax = new THREE.Vector2(0, 0);

  // Camera damping (steep top-down isometric view for optimal board visibility)
  private targetCamPos = new THREE.Vector3(0, 9.8, 5.0);
  private targetCamLook = new THREE.Vector3(0, 0, 0);

  // Graphics fidelity
  private is8KMode: boolean = false;

  // Raycasting for interactive cheat selection
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  // Animation frame
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Event callbacks
  public onTileClick?: (tileId: string, value: number) => void;
  public onCellClick?: (row: number, col: number) => void;

  constructor(container: HTMLElement, gridSize: GridSize, theme: VisualTheme) {
    this.container = container;
    this.gridSize = gridSize;
    this.theme = theme;

    this.calculateGridDimensions();

    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);

    // Renderer setup
    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    this.renderer = new THREE.WebGLRenderer({ antialias: !isHeadless, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Studio Environment map using RoomEnvironment
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const envTexture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;

    // Lighting rig
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.keyLight.castShadow = !isHeadless;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 30;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    const shadowD = 5;
    this.keyLight.shadow.camera.left = -shadowD;
    this.keyLight.shadow.camera.right = shadowD;
    this.keyLight.shadow.camera.top = shadowD;
    this.keyLight.shadow.camera.bottom = -shadowD;
    this.keyLight.position.set(5, 10, 6);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    this.rimLight.position.set(-6, 4, -6);
    this.scene.add(this.rimLight);

    // Groups
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    this.cellSlotsGroup = new THREE.Group();
    this.boardGroup.add(this.cellSlotsGroup);

    this.tilesGroup = new THREE.Group();
    this.boardGroup.add(this.tilesGroup);

    this.particlesGroup = new THREE.Group();
    this.scene.add(this.particlesGroup);

    // Radial contact shadow under board
    this.contactShadowPlane = this.createRadialContactShadow();
    this.scene.add(this.contactShadowPlane);

    // Build board geometry & materials
    this.applyTheme(this.theme);
    this.buildBoard();
    this.setCameraPreset(this.cameraPreset, true);

    // Bind event listeners
    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerdown', this.onPointerDown);

    // Warm up shaders
    this.renderer.compile(this.scene, this.camera);

    // Start render loop
    this.tick();
  }

  private calculateGridDimensions() {
    this.cellSize = (this.BOARD_PHYSICAL_SIZE - (this.gridSize + 1) * this.cellGap) / this.gridSize;
  }

  private createRadialContactShadow(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(this.BOARD_PHYSICAL_SIZE * 1.5, this.BOARD_PHYSICAL_SIZE * 1.5);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.01;
    return mesh;
  }

  /**
   * Builds the multi-part procedural board tray:
   * 1. Tray base plinth
   * 2. Outer beveled retaining rails
   * 3. Individual recessed cell slot beds
   */
  public buildBoard() {
    // Clear old slots
    while (this.cellSlotsGroup.children.length > 0) {
      const child = this.cellSlotsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.cellSlotsGroup.remove(child);
    }

    const themeConfig = THEMES[this.theme];
    const boardHalf = this.BOARD_PHYSICAL_SIZE / 2;

    // 1. Base plinth
    const baseGeo = new THREE.BoxGeometry(this.BOARD_PHYSICAL_SIZE + 0.35, 0.45, this.BOARD_PHYSICAL_SIZE + 0.35);
    const baseMat = new THREE.MeshStandardMaterial({
      color: themeConfig.boardBase,
      roughness: 0.4,
      metalness: this.theme === 'cyberpunk' || this.theme === 'midnight' ? 0.3 : 0.05,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.225;
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    this.cellSlotsGroup.add(baseMesh);

    // 2. Beveled outer border rails (4 rim pieces)
    const rimMat = new THREE.MeshStandardMaterial({
      color: themeConfig.boardRim,
      roughness: 0.3,
      metalness: 0.4,
    });
    const rimHeight = 0.22;
    const rimThickness = 0.18;
    const rimLen = this.BOARD_PHYSICAL_SIZE + 0.35;

    // North & South rails
    const railGeoNS = new THREE.BoxGeometry(rimLen, rimHeight, rimThickness);
    const northRail = new THREE.Mesh(railGeoNS, rimMat);
    northRail.position.set(0, rimHeight / 2, -boardHalf - rimThickness / 2);
    northRail.castShadow = true;
    northRail.receiveShadow = true;
    this.cellSlotsGroup.add(northRail);

    const southRail = new THREE.Mesh(railGeoNS, rimMat);
    southRail.position.set(0, rimHeight / 2, boardHalf + rimThickness / 2);
    southRail.castShadow = true;
    southRail.receiveShadow = true;
    this.cellSlotsGroup.add(southRail);

    // East & West rails
    const railGeoEW = new THREE.BoxGeometry(rimThickness, rimHeight, rimLen);
    const eastRail = new THREE.Mesh(railGeoEW, rimMat);
    eastRail.position.set(boardHalf + rimThickness / 2, rimHeight / 2, 0);
    eastRail.castShadow = true;
    eastRail.receiveShadow = true;
    this.cellSlotsGroup.add(eastRail);

    const westRail = new THREE.Mesh(railGeoEW, rimMat);
    westRail.position.set(-boardHalf - rimThickness / 2, rimHeight / 2, 0);
    westRail.castShadow = true;
    westRail.receiveShadow = true;
    this.cellSlotsGroup.add(westRail);

    // 3. Grid Cell Slots (recessed pedestals with smooth bevels)
    const slotGeo = new THREE.BoxGeometry(this.cellSize, 0.06, this.cellSize);
    const slotMat = new THREE.MeshStandardMaterial({
      color: themeConfig.cellSlot,
      roughness: 0.5,
      metalness: 0.1,
    });

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const slot = new THREE.Mesh(slotGeo, slotMat);
        const { x, z } = this.gridToWorld(r, c);
        slot.position.set(x, 0.03, z);
        slot.receiveShadow = true;
        // User data for raycasting empty slot click
        slot.userData = { isSlot: true, row: r, col: c };
        this.cellSlotsGroup.add(slot);
      }
    }
  }

  /**
   * Maps grid row/col to 3D world space (X, Z) centered at 0
   */
  public gridToWorld(row: number, col: number): { x: number; z: number } {
    const totalSpan = this.BOARD_PHYSICAL_SIZE - this.cellGap * 2;
    const startOffset = -totalSpan / 2 + this.cellSize / 2;
    const step = this.cellSize + this.cellGap;

    const x = startOffset + col * step;
    const z = startOffset + row * step;

    return { x, z };
  }

  /**
   * Generates rounded beveled tile geometry with high poly count for 8K mode
   */
  private createTileGeometry(size: number, thickness: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const half = size / 2;
    const radius = size * 0.14;

    shape.moveTo(-half + radius, -half);
    shape.lineTo(half - radius, -half);
    shape.absarc(half - radius, -half + radius, radius, -Math.PI / 2, 0, false);
    shape.lineTo(half, half - radius);
    shape.absarc(half - radius, half - radius, radius, 0, Math.PI / 2, false);
    shape.lineTo(-half + radius, half);
    shape.absarc(-half + radius, half - radius, radius, Math.PI / 2, Math.PI, false);
    shape.lineTo(-half, -half + radius);
    shape.absarc(-half + radius, -half + radius, radius, Math.PI, Math.PI * 1.5, false);

    const bevelSegments = this.is8KMode ? 10 : 3;
    const curveSegments = this.is8KMode ? 24 : 8;

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: thickness - 0.08,
      bevelEnabled: true,
      bevelSegments,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      curveSegments,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.rotateX(Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Create a single 3D Tile procedural mesh
   */
  private createTileObject(data: TileData): TileMeshInstance {
    const group = new THREE.Group();
    const themeConfig = THEMES[this.theme];
    const palette = themeConfig.tilePalette[data.value] || {
      bg: '#ffffff',
      text: '#000000',
      emissive: '#ffffff',
    };

    // Body: rounded beveled high-resolution procedural geometry
    const bodyGeo = this.createTileGeometry(this.cellSize * 0.94, this.tileThickness);
    
    // Body material (sides and bottom)
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.bg),
      roughness: palette.roughness !== undefined ? palette.roughness : 0.25,
      metalness: palette.metalness !== undefined ? palette.metalness : (data.value >= 1024 ? 0.6 : 0.05),
      clearcoat: data.value >= 256 ? 0.8 : 0.2,
      clearcoatRoughness: 0.1,
      emissive: palette.emissive ? new THREE.Color(palette.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: data.value >= 1024 ? 0.35 : 0.05,
    });

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.position.y = this.tileThickness / 2;
    group.add(bodyMesh);

    // Top face with high-DPI procedural number canvas texture
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const texture = getTileCanvasTexture(data.value, this.theme, maxAnisotropy, this.is8KMode);

    const topGeo = new THREE.PlaneGeometry(this.cellSize * 0.94, this.cellSize * 0.94);
    const topMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.15,
      metalness: palette.metalness !== undefined ? palette.metalness : (data.value >= 1024 ? 0.4 : 0.05),
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.y = this.tileThickness + 0.002;
    group.add(topMesh);

    // Initial position
    const fromR = data.prevRow !== undefined ? data.prevRow : data.row;
    const fromC = data.prevCol !== undefined ? data.prevCol : data.col;
    const { x: startX, z: startZ } = this.gridToWorld(fromR, fromC);
    const { x: targetX, z: targetZ } = this.gridToWorld(data.row, data.col);

    const currentPos = new THREE.Vector3(startX, 0.05, startZ);
    const targetPos = new THREE.Vector3(targetX, 0.05, targetZ);
    group.position.copy(currentPos);

    // Scale animation
    const scale = new THREE.Vector3(data.isNew ? 0.01 : 1, data.isNew ? 0.01 : 1, data.isNew ? 0.01 : 1);
    const targetScale = new THREE.Vector3(1, 1, 1);
    group.scale.copy(scale);

    group.userData = { tileId: data.id, value: data.value, row: data.row, col: data.col };
    bodyMesh.userData = group.userData;
    topMesh.userData = group.userData;

    this.tilesGroup.add(group);

    return {
      id: data.id,
      group,
      bodyMesh,
      topMesh,
      currentPos,
      targetPos,
      scale,
      targetScale,
      isMerging: !!data.justMerged,
      value: data.value,
    };
  }

  /**
   * Syncs 3D scene tile instances with application logic state
   */
  public syncTiles(tiles: TileData[]) {
    const activeIds = new Set<string>();

    for (const t of tiles) {
      activeIds.add(t.id);
      const existing = this.tileInstances.get(t.id);

      if (existing) {
        // Update target position
        const { x, z } = this.gridToWorld(t.row, t.col);
        existing.targetPos.set(x, 0.05, z);
        existing.group.userData.row = t.row;
        existing.group.userData.col = t.col;

        // If value changed or merged
        if (existing.value !== t.value) {
          existing.value = t.value;
          existing.group.userData.value = t.value;

          // Update textures & materials
          const themeConfig = THEMES[this.theme];
          const palette = themeConfig.tilePalette[t.value] || { bg: '#ffffff', text: '#000000' };
          const bodyMat = existing.bodyMesh.material as THREE.MeshPhysicalMaterial;
          bodyMat.color.set(palette.bg);
          if (palette.emissive) {
            bodyMat.emissive.set(palette.emissive);
            bodyMat.emissiveIntensity = t.value >= 1024 ? 0.35 : 0.05;
          }

          const topMat = existing.topMesh.material as THREE.MeshStandardMaterial;
          const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
          topMat.map = getTileCanvasTexture(t.value, this.theme, maxAnisotropy);
          topMat.needsUpdate = true;

          // Trigger merge pop animation
          existing.scale.set(1.3, 0.7, 1.3);
          existing.targetScale.set(1, 1, 1);

          // Emit merge particles!
          this.emitMergeParticles(existing.targetPos, t.value);
        }
      } else {
        // Create new tile
        const instance = this.createTileObject(t);
        this.tileInstances.set(t.id, instance);

        if (t.justMerged) {
          instance.scale.set(1.35, 0.65, 1.35);
          instance.targetScale.set(1, 1, 1);
          this.emitMergeParticles(instance.targetPos, t.value);
        }
      }
    }

    // Remove obsolete tiles with a quick fade-shrink
    for (const [id, instance] of this.tileInstances.entries()) {
      if (!activeIds.has(id)) {
        this.tilesGroup.remove(instance.group);
        instance.bodyMesh.geometry.dispose();
        (instance.bodyMesh.material as THREE.Material).dispose();
        instance.topMesh.geometry.dispose();
        (instance.topMesh.material as THREE.Material).dispose();
        this.tileInstances.delete(id);
      }
    }
  }

  /**
   * Procedural 3D particle bursts on merges and hammer destruction
   */
  public emitMergeParticles(pos: THREE.Vector3, value: number, isExplosion: boolean = false) {
    const themeConfig = THEMES[this.theme];
    const palette = themeConfig.tilePalette[value] || { bg: '#ffffff' };
    const count = isExplosion ? 24 : (value >= 1024 ? 20 : 10);
    const particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const particleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.emissive || palette.bg),
      emissive: new THREE.Color(palette.emissive || palette.bg),
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      mesh.position.copy(pos);
      mesh.position.y += 0.3;

      const angle = Math.random() * Math.PI * 2;
      const speed = (isExplosion ? 3.5 : 2.0) + Math.random() * 2.5;
      const upVel = (isExplosion ? 4.0 : 2.5) + Math.random() * 3.0;

      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        upVel,
        Math.sin(angle) * speed
      );

      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );

      this.particlesGroup.add(mesh);
      this.particles.push({
        mesh,
        vel,
        rotVel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  /**
   * Tilt board tactically in direction of move
   */
  public tiltBoard(direction: MoveDirection) {
    const amount = 0.09;
    if (direction === 'up') this.targetBoardRot.x = -amount;
    if (direction === 'down') this.targetBoardRot.x = amount;
    if (direction === 'left') this.targetBoardRot.y = -amount;
    if (direction === 'right') this.targetBoardRot.y = amount;

    // Reset back smoothly
    setTimeout(() => {
      this.targetBoardRot.set(0, 0);
    }, 120);
  }

  /**
   * Switch camera angle preset - steep angles from above
   */
  public setCameraPreset(preset: CameraPreset, immediate: boolean = false) {
    this.cameraPreset = preset;

    if (preset === 'iso') {
      // Much more from above (steep elevation ~65°)
      this.targetCamPos.set(0, 9.8, 4.8);
      this.targetCamLook.set(0, 0, 0);
    } else if (preset === 'topdown') {
      // Pure Top-Down bird's eye view
      this.targetCamPos.set(0, 11.2, 0.05);
      this.targetCamLook.set(0, 0, 0);
    } else if (preset === 'cinematic') {
      // Elevated dynamic 3D angle
      this.targetCamPos.set(3.8, 7.8, 5.8);
      this.targetCamLook.set(0, 0.1, 0);
    }

    if (immediate) {
      this.camera.position.copy(this.targetCamPos);
      this.camera.lookAt(this.targetCamLook);
    }
  }

  /**
   * Toggle 8K Ultra Graphics rendering mode (supersampling, sharp shadows, and high-poly models)
   */
  public set8KMode(enabled: boolean) {
    this.is8KMode = enabled;
    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    const pixelRatio = isHeadless
      ? 1
      : enabled
      ? Math.min((window.devicePixelRatio || 1) * 1.6, 3.0)
      : Math.min(window.devicePixelRatio || 1, 2.0);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.toneMappingExposure = enabled ? 1.25 : 1.15;
    this.keyLight.intensity = enabled ? 2.4 : 2.0;

    // Hot-swap all active tile 3D geometries and canvas textures to maximal resolution
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    for (const [, instance] of this.tileInstances.entries()) {
      instance.bodyMesh.geometry.dispose();
      instance.bodyMesh.geometry = this.createTileGeometry(this.cellSize * 0.94, this.tileThickness);

      const topMat = instance.topMesh.material as THREE.MeshStandardMaterial;
      topMat.map = getTileCanvasTexture(instance.value, this.theme, maxAnisotropy, enabled);
      topMat.needsUpdate = true;
    }
  }

  /**
   * Switch visual theme
   */
  public applyTheme(theme: VisualTheme) {
    this.theme = theme;
    const config = THEMES[theme];

    this.scene.background = new THREE.Color(config.background);
    this.scene.fog = new THREE.FogExp2(config.background, 0.025);

    this.hemiLight.color.set(config.ambientLight);
    this.keyLight.color.set(config.keyLight);

    this.buildBoard();

    // Refresh active tiles
    for (const [, instance] of this.tileInstances.entries()) {
      const palette = config.tilePalette[instance.value] || { bg: '#ffffff', text: '#000000' };
      const bodyMat = instance.bodyMesh.material as THREE.MeshPhysicalMaterial;
      bodyMat.color.set(palette.bg);
      if (palette.emissive) {
        bodyMat.emissive.set(palette.emissive);
      }

      const topMat = instance.topMesh.material as THREE.MeshStandardMaterial;
      const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
      topMat.map = getTileCanvasTexture(instance.value, theme, maxAnisotropy);
      topMat.needsUpdate = true;
    }
  }

  /**
   * Change grid size (3x3, 4x4, 5x5, 6x6)
   */
  public setGridSize(size: GridSize) {
    this.gridSize = size;
    this.calculateGridDimensions();

    // Clear existing tiles in 3D
    for (const [, instance] of this.tileInstances.entries()) {
      this.tilesGroup.remove(instance.group);
      instance.bodyMesh.geometry.dispose();
      (instance.bodyMesh.material as THREE.Material).dispose();
      instance.topMesh.geometry.dispose();
      (instance.topMesh.material as THREE.Material).dispose();
    }
    this.tileInstances.clear();

    this.buildBoard();
  }

  // Pointer interactions
  private onPointerMove = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(x, y);

    // Subtle parallax tilt
    this.mouseParallax.set(x * 0.04, -y * 0.04);
  };

  private onPointerDown = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(x, y);

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.boardGroup.children, true);

    for (const hit of intersects) {
      // Check if tile was clicked
      if (hit.object.userData && hit.object.userData.tileId) {
        if (this.onTileClick) {
          this.onTileClick(hit.object.userData.tileId, hit.object.userData.value);
        }
        return;
      }
      // Check if empty slot was clicked
      if (hit.object.userData && hit.object.userData.isSlot) {
        if (this.onCellClick) {
          this.onCellClick(hit.object.userData.row, hit.object.userData.col);
        }
        return;
      }
    }
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Main 60fps render tick with exponential damping kinematics
   */
  private tick = () => {
    this.animFrameId = requestAnimationFrame(this.tick);

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Clamp dt for 60fps stability

    // 1. Damped camera movement
    const camDamp = 1 - Math.exp(-6 * dt);
    this.camera.position.lerp(this.targetCamPos, camDamp);
    this.camera.lookAt(this.targetCamLook);

    // 2. Damped board rotation (tilt + parallax)
    const rotDamp = 1 - Math.exp(-12 * dt);
    this.currentBoardRot.x = THREE.MathUtils.damp(
      this.currentBoardRot.x,
      this.targetBoardRot.x + this.mouseParallax.y,
      12,
      dt
    );
    this.currentBoardRot.y = THREE.MathUtils.damp(
      this.currentBoardRot.y,
      this.targetBoardRot.y + this.mouseParallax.x,
      12,
      dt
    );
    this.boardGroup.rotation.x = this.currentBoardRot.x;
    this.boardGroup.rotation.z = -this.currentBoardRot.y;

    // 3. Smooth kinematic tile positions and scales
    const moveDamp = 1 - Math.exp(-18 * dt);
    const scaleDamp = 1 - Math.exp(-14 * dt);

    for (const [, instance] of this.tileInstances.entries()) {
      instance.currentPos.lerp(instance.targetPos, moveDamp);
      instance.group.position.copy(instance.currentPos);

      instance.scale.lerp(instance.targetScale, scaleDamp);
      instance.group.scale.copy(instance.scale);
    }

    // 4. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particlesGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Gravity & position
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.rotVel.x * dt;
      p.mesh.rotation.y += p.rotVel.y * dt;
      p.mesh.rotation.z += p.rotVel.z * dt;

      // Scale down over lifetime
      const scale = 1 - (p.life / p.maxLife);
      p.mesh.scale.setScalar(Math.max(0.01, scale));
    }

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Cleanup resources on unmount
   */
  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerdown', this.onPointerDown);

    // Dispose all meshes & textures
    this.tileInstances.clear();
    this.pmremGenerator.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
