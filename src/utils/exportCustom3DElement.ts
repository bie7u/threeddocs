/**
 * Exports a Custom3DElement to a binary GLB file.
 *
 * The geometry and materials are built off-screen using the same parameters as
 * the live Custom3DShape renderer, so the exported model matches exactly what
 * the user sees in the preview canvas.
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import type { Custom3DElement } from '../types';

const FONT_URL = '/fonts/helvetiker_regular.typeface.json';

// Re-use the same font cache as Custom3DShape to avoid double downloads.
const fontCache = new Map<string, Font>();

async function loadFont(): Promise<Font> {
  if (fontCache.has(FONT_URL)) return fontCache.get(FONT_URL)!;
  const response = await fetch(FONT_URL);
  if (!response.ok) throw new Error(`Failed to fetch font: ${FONT_URL}`);
  const json = await response.json();
  const loader = new FontLoader();
  const font = loader.parse(json);
  fontCache.set(FONT_URL, font);
  return font;
}

/**
 * Builds a Three.js scene from `element` and exports it as a GLB `File`.
 * Uses the same geometry parameters as `Custom3DShape` so the exported model
 * matches the in-app preview exactly.
 */
export async function exportCustom3DElementToGlb(element: Custom3DElement): Promise<File> {
  // ── 1. Font ─────────────────────────────────────────────────────────────────
  const font = await loadFont();

  // ── 2. Geometry (identical to Custom3DShape) ─────────────────────────────
  const safeText = (element.text || 'TXT').slice(0, 5) || 'TXT';
  const textGeo = new TextGeometry(safeText, {
    font,
    size: 0.5,
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 4,
  });
  textGeo.computeBoundingBox();
  const bb = textGeo.boundingBox!;
  const cx = (bb.max.x - bb.min.x) / 2;
  const cy = (bb.max.y - bb.min.y) / 2;
  textGeo.translate(-bb.min.x - cx, -bb.min.y - cy, -0.15);
  textGeo.computeVertexNormals();

  // ── 3. Material ──────────────────────────────────────────────────────────
  let texture: THREE.Texture | undefined;
  if (element.textureDataUrl) {
    texture = await new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader().load(element.textureDataUrl!, resolve, undefined, reject);
    });
  }

  const material = new THREE.MeshStandardMaterial({
    color: element.color,
    ...(texture ? { map: texture } : {}),
  });

  // ── 4. Scene ─────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(textGeo, material));

  if (element.wireframe) {
    scene.add(
      new THREE.Mesh(
        textGeo,
        new THREE.MeshBasicMaterial({
          color: element.wireframeColor || '#000000',
          wireframe: true,
        }),
      ),
    );
  }

  // ── 5. Export ────────────────────────────────────────────────────────────
  const exporter = new GLTFExporter();
  const glbBuffer = await exporter.parseAsync(scene, { binary: true }) as ArrayBuffer;

  // ── 6. Cleanup ───────────────────────────────────────────────────────────
  textGeo.dispose();
  material.dispose();
  texture?.dispose();

  // ── 7. Return as File ────────────────────────────────────────────────────
  // Replace any character that is not filename-safe (including spaces) with _.
  const safeName = element.name.replace(/[^a-zA-Z0-9_\-.]/g, '_');
  return new File([glbBuffer], `${safeName}.glb`, { type: 'model/gltf-binary' });
}
