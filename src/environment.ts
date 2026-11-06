import * as THREE from 'three';

export type SceneTheme = 'royal' | 'penthouse' | 'study' | 'tournament';

export interface SceneConfig {
  name: string;
  skybox: THREE.CanvasTexture;
  blurriness: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  ambientColor: number;
  ambientIntensity: number;
  keyColor: number;
  keyIntensity: number;
  keyPos: [number, number, number];
  fillColor: number;
  fillIntensity: number;
  rimColor: number;
  rimIntensity: number;
  tableColor: number;
  tableTexture: THREE.CanvasTexture;
  tableRoughness: number;
  tableMetalness: number;
  tableRimColor: number;
  playmatColor: number;
  boardLightSquareColor: number;
  boardDarkSquareColor: number;
  boardRoughness: number;
}

// Procedural Equirectangular 360-degree Panorama Generator
export function createSkyboxTexture(theme: SceneTheme): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (theme === 'royal') {
    // 1. ROYAL GRAND HALL: Arched windows + chandeliers + mahogany library
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0.0, '#1c1714');
    bgGrad.addColorStop(0.35, '#2e2520');
    bgGrad.addColorStop(0.5, '#423329');
    bgGrad.addColorStop(0.55, '#241a14');
    bgGrad.addColorStop(0.85, '#17120e');
    bgGrad.addColorStop(1.0, '#100c09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Arched Windows
    const startX = 260;
    const gap = 200;
    for (let i = 0; i < 3; i++) {
      const wx = startX + i * gap;
      const wy = 210;
      const winWidth = 140;
      const winHeight = 360;

      ctx.shadowColor = 'rgba(230, 245, 255, 0.4)';
      ctx.shadowBlur = 40;

      const skyGrad = ctx.createLinearGradient(wx, wy, wx, wy + winHeight);
      skyGrad.addColorStop(0.0, '#e8f4ff');
      skyGrad.addColorStop(0.4, '#ffffff');
      skyGrad.addColorStop(0.8, '#d4e8ff');
      skyGrad.addColorStop(1.0, '#b8d6f8');

      ctx.fillStyle = skyGrad;
      ctx.beginPath();
      ctx.arc(wx + winWidth / 2, wy + winWidth / 2, winWidth / 2, Math.PI, 0, false);
      ctx.lineTo(wx + winWidth, wy + winHeight);
      ctx.lineTo(wx, wy + winHeight);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#2b221b';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(wx + winWidth / 2, wy);
      ctx.lineTo(wx + winWidth / 2, wy + winHeight);
      ctx.stroke();

      for (let h = 1; h <= 3; h++) {
        const y = wy + (winHeight / 4) * h;
        ctx.beginPath();
        ctx.moveTo(wx, y);
        ctx.lineTo(wx + winWidth, y);
        ctx.stroke();
      }
    }

    // Chandeliers
    for (let i = 0; i < 3; i++) {
      const lx = 1180 + i * 240;
      const ly = 260;
      const lampGlow = ctx.createRadialGradient(lx, ly, 10, lx, ly, 180);
      lampGlow.addColorStop(0.0, 'rgba(255, 235, 180, 0.95)');
      lampGlow.addColorStop(0.2, 'rgba(255, 200, 120, 0.6)');
      lampGlow.addColorStop(0.6, 'rgba(210, 130, 50, 0.2)');
      lampGlow.addColorStop(1.0, 'rgba(150, 80, 20, 0.0)');
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(lx, ly, 180, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'penthouse') {
    // 2. MODERN STUDIO PENTHOUSE: City skyline at twilight through glass walls
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0.0, '#0c101a');
    bgGrad.addColorStop(0.35, '#192338');
    bgGrad.addColorStop(0.48, '#3d2b38');
    bgGrad.addColorStop(0.52, '#d47348'); // Sunset glow on horizon
    bgGrad.addColorStop(0.56, '#181b22'); // Floor horizon
    bgGrad.addColorStop(1.0, '#0b0c10'); // Dark polished concrete floor
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // City skyscraper silhouettes against twilight
    ctx.fillStyle = '#0f1420';
    for (let i = 0; i < 35; i++) {
      const sx = i * 60 + Math.sin(i) * 15;
      const sw = 35 + (i % 4) * 12;
      const sh = 100 + ((i * 73) % 180);
      ctx.fillRect(sx, 520 - sh, sw, sh);

      // Skyscraper illuminated window specks
      ctx.fillStyle = '#fce5b2';
      ctx.globalAlpha = 0.55;
      for (let wy = 520 - sh + 10; wy < 510; wy += 14) {
        for (let wx = sx + 4; wx < sx + sw - 4; wx += 8) {
          if (Math.sin(wx * wy) > 0.1) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#0f1420';
    }

    // Modern glass window mullions
    ctx.strokeStyle = '#1d222d';
    ctx.lineWidth = 8;
    for (let x = 0; x < width; x += 220) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 540);
      ctx.stroke();
    }
  } else if (theme === 'study') {
    // 3. WARM COZY STUDY: Brick fireplace + Green banker's lamp + dark oak
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0.0, '#140f0c');
    bgGrad.addColorStop(0.4, '#241a14');
    bgGrad.addColorStop(0.5, '#382418');
    bgGrad.addColorStop(0.55, '#1f140e');
    bgGrad.addColorStop(1.0, '#0f0a07');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing Fireplace on the left
    const fx = 450;
    const fy = 380;
    const fireGlow = ctx.createRadialGradient(fx, fy, 20, fx, fy, 280);
    fireGlow.addColorStop(0.0, 'rgba(255, 120, 30, 0.95)');
    fireGlow.addColorStop(0.3, 'rgba(255, 80, 10, 0.6)');
    fireGlow.addColorStop(0.7, 'rgba(180, 40, 5, 0.15)');
    fireGlow.addColorStop(1.0, 'rgba(100, 20, 0, 0.0)');
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(fx, fy, 280, 0, Math.PI * 2);
    ctx.fill();

    // Fireplace mantel & brick hearth
    ctx.fillStyle = '#1c130d';
    ctx.fillRect(fx - 120, fy - 60, 240, 180);
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.arc(fx, fy + 40, 45, 0, Math.PI * 2);
    ctx.fill();

    // Banker's Desk Lamp with Emerald Glass Shade on the right
    const bx = 1350;
    const by = 340;
    const lampGlow = ctx.createRadialGradient(bx, by, 10, bx, by, 220);
    lampGlow.addColorStop(0.0, 'rgba(120, 255, 160, 0.85)');
    lampGlow.addColorStop(0.3, 'rgba(30, 180, 90, 0.45)');
    lampGlow.addColorStop(0.7, 'rgba(10, 100, 50, 0.12)');
    lampGlow.addColorStop(1.0, 'rgba(0, 50, 20, 0.0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(bx, by, 220, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 4. TOURNAMENT ARENA: Neutral, anti-glare professional championship studio
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0.0, '#1e2229');
    bgGrad.addColorStop(0.4, '#282f3a');
    bgGrad.addColorStop(0.5, '#2e3745');
    bgGrad.addColorStop(0.55, '#1b2028');
    bgGrad.addColorStop(1.0, '#10141a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Soft large overhead diffused studio light banks
    for (let i = 0; i < 4; i++) {
      const sx = 260 + i * 420;
      const sy = 120;
      const bankGlow = ctx.createRadialGradient(sx, sy, 30, sx, sy, 220);
      bankGlow.addColorStop(0.0, 'rgba(255, 255, 255, 0.7)');
      bankGlow.addColorStop(0.5, 'rgba(235, 242, 255, 0.25)');
      bankGlow.addColorStop(1.0, 'rgba(200, 220, 255, 0.0)');
      ctx.fillStyle = bankGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, 220, 0, Math.PI * 2);
      ctx.fill();

      // Diffuser panel frame
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(sx - 90, sy - 30, 180, 60);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

// Procedural Tabletop Texture Generator
export function createTableTexture(theme: SceneTheme): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (theme === 'royal') {
    // Calacatta Gold polished marble
    ctx.fillStyle = '#f6f1e8';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 120 + Math.random() * 260;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, 'rgba(235, 222, 206, 0.45)');
      grad.addColorStop(1, 'rgba(246, 241, 232, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gold & amber veins
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = 'rgba(195, 155, 105, 0.35)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      let x = 60 + i * 140;
      let y = -20;
      ctx.moveTo(x, y);
      for (let s = 0; s < 16; s++) {
        x += (Math.random() - 0.45) * 85;
        y += 65;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (theme === 'penthouse') {
    // Modern Polished Ash Slate / Cast Terrazzo
    ctx.fillStyle = '#262930';
    ctx.fillRect(0, 0, size, size);

    // Fine mineral flecks
    ctx.fillStyle = '#424854';
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (theme === 'study') {
    // Figured Burl Walnut Wood
    ctx.fillStyle = '#301c13';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(20, 10, 5, 0.35)';
    for (let r = 20; r < 700; r += 24) {
      ctx.lineWidth = 4 + Math.sin(r) * 2;
      ctx.beginPath();
      ctx.arc(size * 0.4, size * 0.4, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Tournament regulation blond birchwood
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(200, 180, 150, 0.3)';
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + Math.sin(y * 0.1) * 3);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Full Scene Configurations with memory caching
const sceneConfigCache = new Map<SceneTheme, SceneConfig>();

export function getSceneConfig(theme: SceneTheme): SceneConfig {
  const cached = sceneConfigCache.get(theme);
  if (cached) {
    return cached;
  }

  const skybox = createSkyboxTexture(theme);
  const tableTexture = createTableTexture(theme);

  let config: SceneConfig;

  switch (theme) {
    case 'royal':
      config = {
        name: '皇家殿堂',
        skybox,
        blurriness: 0.22,
        hemiSky: 0xfff6ea,
        hemiGround: 0x483a2e,
        hemiIntensity: 1.3,
        ambientColor: 0xfff5e6,
        ambientIntensity: 0.7,
        keyColor: 0xffffff,
        keyIntensity: 1.5, // Softened from 2.0 to eliminate glare
        keyPos: [14, 25, 15],
        fillColor: 0xbddaff,
        fillIntensity: 0.9,
        rimColor: 0xffe2a3,
        rimIntensity: 1.2,
        tableColor: 0xffffff,
        tableTexture,
        tableRoughness: 0.2,
        tableMetalness: 0.02,
        tableRimColor: 0xd4af37, // Gold rim
        playmatColor: 0x184229, // Emerald baize
        boardLightSquareColor: 0xfbf6ec,
        boardDarkSquareColor: 0x543224,
        boardRoughness: 0.62 // Satin non-glare finish
      };
      break;

    case 'penthouse':
      config = {
        name: '摩天阁楼',
        skybox,
        blurriness: 0.18,
        hemiSky: 0xdde9f8,
        hemiGround: 0x242832,
        hemiIntensity: 1.2,
        ambientColor: 0xe6edf8,
        ambientIntensity: 0.65,
        keyColor: 0xffeedd,
        keyIntensity: 1.4,
        keyPos: [-14, 25, 15],
        fillColor: 0x90b4e0,
        fillIntensity: 1.0,
        rimColor: 0xd0e4ff,
        rimIntensity: 1.1,
        tableColor: 0xcccccc,
        tableTexture,
        tableRoughness: 0.35,
        tableMetalness: 0.1,
        tableRimColor: 0x94a3b8, // Brushed steel rim
        playmatColor: 0x1e2430, // Midnight blue mat
        boardLightSquareColor: 0xf0f3f6,
        boardDarkSquareColor: 0x334155,
        boardRoughness: 0.6
      };
      break;

    case 'study':
      config = {
        name: '静谧书斋',
        skybox,
        blurriness: 0.28,
        hemiSky: 0xffdfb8,
        hemiGround: 0x281810,
        hemiIntensity: 1.35,
        ambientColor: 0xffe5cc,
        ambientIntensity: 0.75,
        keyColor: 0xffc48c, // Warm fireplace glow
        keyIntensity: 1.4,
        keyPos: [12, 22, -14],
        fillColor: 0x85e6aa, // Green banker's lamp fill
        fillIntensity: 0.9,
        rimColor: 0xff9944,
        rimIntensity: 1.3,
        tableColor: 0xddbb99,
        tableTexture,
        tableRoughness: 0.3,
        tableMetalness: 0.05,
        tableRimColor: 0xbf8532, // Vintage bronze rim
        playmatColor: 0x193b26, // Classic green desk felt
        boardLightSquareColor: 0xfcf4e4,
        boardDarkSquareColor: 0x4a2c1d,
        boardRoughness: 0.65
      };
      break;

    case 'tournament':
      config = {
        name: '国际赛事',
        skybox,
        blurriness: 0.35,
        hemiSky: 0xf5f8fc,
        hemiGround: 0x363c46,
        hemiIntensity: 1.4,
        ambientColor: 0xf0f4fa,
        ambientIntensity: 0.8,
        keyColor: 0xffffff,
        keyIntensity: 1.2, // Pure diffused neutral light
        keyPos: [0, 26, 12],
        fillColor: 0xdde5f0,
        fillIntensity: 1.0,
        rimColor: 0xe6edf8,
        rimIntensity: 0.9,
        tableColor: 0xffffff,
        tableTexture,
        tableRoughness: 0.45,
        tableMetalness: 0.0,
        tableRimColor: 0x64748b, // Matte slate rim
        playmatColor: 0x244f38, // Regulation tournament green
        boardLightSquareColor: 0xf6efe2,
        boardDarkSquareColor: 0x415b49, // Tournament green/buff
        boardRoughness: 0.68 // Maximum anti-glare
      };
      break;
  }

  sceneConfigCache.set(theme, config);
  return config;
}
