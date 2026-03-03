import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { CSG } from 'three-csg-ts';
import type { EngravedBlockParams } from '../../types';

const TARGET_TEXT_SIZE = 0.3; // target letter height in units
const BASE_BLOCK_DEPTH = 1;   // depth (Z) of the block

const FONT_URLS: Record<NonNullable<EngravedBlockParams['font']>, string> = {
  helvetiker: '/fonts/helvetiker_regular.typeface.json',
  optimer:    '/fonts/optimer_regular.typeface.json',
  gentilis:   '/fonts/gentilis_regular.typeface.json',
};

const fontCache = new Map<string, Font>();

async function loadFont(fontId: EngravedBlockParams['font']): Promise<Font> {
  if (fontCache.has(fontId)) {
    return fontCache.get(fontId)!;
  }
  const url = FONT_URLS[fontId];
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${url}`);
  const json = await response.json();
  const loader = new FontLoader();
  const font = loader.parse(json);
  fontCache.set(fontId, font);
  return font;
}

function validateText(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  // Truncate to 24 characters first (at a word boundary when possible)
  const charLimited = trimmed.length > 24 ? trimmed.substring(0, 24).replace(/\s+\S*$/, '') || trimmed.substring(0, 24) : trimmed;
  // Then limit to 3 words
  const words = charLimited.split(' ');
  const result = words.slice(0, 3).join(' ');
  return result || 'DB';
}

interface EngravedBlockMeshProps {
  params: EngravedBlockParams;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
}

export const EngravedBlock = ({
  params,
  color,
  emissive = '#000000',
  emissiveIntensity = 0,
}: EngravedBlockMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  const text   = validateText(params.text);
  const font   = params.font    ?? 'helvetiker';
  const depth  = Math.max(0.01, Math.min(0.2,  params.depth   ?? 0.08));
  const padding= Math.max(0.05, Math.min(0.2,  params.padding ?? 0.1));
  const face   = params.face    ?? 'front';

  useEffect(() => {
    let cancelled = false;

    loadFont(font).then((loadedFont) => {
      if (cancelled) return;

      // -- build text geometry to measure it --
      const measureGeo = new TextGeometry(text, {
        font: loadedFont,
        size: TARGET_TEXT_SIZE,
        depth: 0.001,
        bevelEnabled: false,
      });
      measureGeo.computeBoundingBox();
      const bb = measureGeo.boundingBox!;
      const textW = bb.max.x - bb.min.x;
      const textH = bb.max.y - bb.min.y;
      measureGeo.dispose();

      // -- compute block face dimensions --
      const faceW = textW + 2 * padding;
      const faceH = textH + 2 * padding;

      // Width / Height / BlockDepth depend on which face the text is placed on
      let blockW: number, blockH: number, blockD: number;
      if (face === 'front' || face === 'back') {
        blockW = Math.max(1, faceW);
        blockH = Math.max(1, faceH);
        blockD = BASE_BLOCK_DEPTH;
      } else if (face === 'left' || face === 'right') {
        blockW = BASE_BLOCK_DEPTH;
        blockH = Math.max(1, faceH);
        blockD = Math.max(1, faceW);
      } else {
        // top / bottom
        blockW = Math.max(1, faceW);
        blockH = BASE_BLOCK_DEPTH;
        blockD = Math.max(1, textH + 2 * padding);
      }

      // -- block mesh (material color doesn't affect geometry, use white) --
      const blockGeo = new THREE.BoxGeometry(blockW, blockH, blockD);
      const blockMesh = new THREE.Mesh(
        blockGeo,
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      blockMesh.updateMatrixWorld(true);

      // -- text geometry (actual engraving depth) --
      const textGeo = new TextGeometry(text, {
        font: loadedFont,
        size: TARGET_TEXT_SIZE,
        depth: depth + 0.001, // slight extra so it punches through
        bevelEnabled: false,
      });
      textGeo.computeBoundingBox();
      const tbb = textGeo.boundingBox!;
      const tW = tbb.max.x - tbb.min.x;
      const tH = tbb.max.y - tbb.min.y;

      const textMesh = new THREE.Mesh(
        textGeo,
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );

      // Position text centred on the chosen face
      const eps = 0.001;
      switch (face) {
        case 'front':
          textMesh.position.set(-tW / 2, -tH / 2, blockD / 2 - depth + eps);
          break;
        case 'back':
          textMesh.rotation.y = Math.PI;
          textMesh.position.set(tW / 2, -tH / 2, -(blockD / 2 - depth + eps));
          break;
        case 'left':
          textMesh.rotation.y = -Math.PI / 2;
          textMesh.position.set(-(blockW / 2 - depth + eps), -tH / 2, tW / 2);
          break;
        case 'right':
          textMesh.rotation.y = Math.PI / 2;
          textMesh.position.set(blockW / 2 - depth + eps, -tH / 2, -tW / 2);
          break;
        case 'top':
          textMesh.rotation.x = -Math.PI / 2;
          textMesh.position.set(-tW / 2, blockH / 2 - depth + eps, tH / 2);
          break;
        case 'bottom':
          textMesh.rotation.x = Math.PI / 2;
          textMesh.position.set(-tW / 2, -(blockH / 2 - depth + eps), -tH / 2);
          break;
      }

      textMesh.updateMatrixWorld(true);

      // -- CSG subtraction --
      try {
        const result = CSG.subtract(blockMesh, textMesh);
        result.geometry.computeVertexNormals();
        result.geometry.computeBoundingBox();
        result.geometry.computeBoundingSphere();

        if (!cancelled) {
          setGeometry(result.geometry.clone());
        }
      } catch (e) {
        console.error('EngravedBlock CSG error:', e);
        // Fallback: plain box
        if (!cancelled) {
          setGeometry(new THREE.BoxGeometry(blockW, blockH, blockD));
        }
      }

      // cleanup intermediate geometries
      blockGeo.dispose();
      textGeo.dispose();
    }).catch((err) => {
      console.error('EngravedBlock font load error:', err);
      if (!cancelled) {
        setGeometry(new THREE.BoxGeometry(1, 1, BASE_BLOCK_DEPTH));
      }
    });

    return () => { cancelled = true; };
  }, [text, font, depth, padding, face]);

  if (!geometry) {
    // Loading placeholder
    return (
      <mesh castShadow>
        <boxGeometry args={[1, 1, BASE_BLOCK_DEPTH]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} castShadow geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
};
