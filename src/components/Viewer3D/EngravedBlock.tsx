import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
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

interface BlockState {
  blockGeo: THREE.BufferGeometry;
  textGeo: THREE.BufferGeometry;
  textPosition: [number, number, number];
  textRotation: [number, number, number];
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
  const [blockState, setBlockState] = useState<BlockState | null>(null);
  // Ref tracks the current state so we can dispose geometries when they change
  const stateRef = useRef<BlockState | null>(null);

  const text       = validateText(params.text);
  const font       = params.font    ?? 'helvetiker';
  // params.depth is repurposed here as text protrusion depth (not engraving depth)
  const protrusion = Math.max(0.05, Math.min(0.3,  params.depth   ?? 0.12));
  const padding    = Math.max(0.05, Math.min(0.2,  params.padding ?? 0.1));
  const face       = params.face    ?? 'front';

  useEffect(() => {
    let cancelled = false;

    loadFont(font).then((loadedFont) => {
      if (cancelled) return;

      // -- measure text to determine block dimensions --
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

      const blockGeo = new THREE.BoxGeometry(blockW, blockH, blockD);

      // -- 3D text that protrudes outward from the chosen face --
      const textGeo = new TextGeometry(text, {
        font: loadedFont,
        size: TARGET_TEXT_SIZE,
        depth: protrusion,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.015,
        bevelSegments: 4,
      });
      textGeo.computeBoundingBox();
      const tbb = textGeo.boundingBox!;
      const tW = tbb.max.x - tbb.min.x;
      const tH = tbb.max.y - tbb.min.y;
      textGeo.computeVertexNormals();

      // Position text centered on chosen face, letters pointing outward
      let textPosition: [number, number, number];
      let textRotation: [number, number, number];

      switch (face) {
        case 'back':
          textPosition = [tW / 2, -tH / 2, -(blockD / 2)];
          textRotation = [0, Math.PI, 0];
          break;
        case 'left':
          textPosition = [-(blockW / 2), -tH / 2, tW / 2];
          textRotation = [0, -Math.PI / 2, 0];
          break;
        case 'right':
          textPosition = [blockW / 2, -tH / 2, -tW / 2];
          textRotation = [0, Math.PI / 2, 0];
          break;
        case 'top':
          textPosition = [-tW / 2, blockH / 2, tH / 2];
          textRotation = [-Math.PI / 2, 0, 0];
          break;
        case 'bottom':
          textPosition = [-tW / 2, -(blockH / 2), -tH / 2];
          textRotation = [Math.PI / 2, 0, 0];
          break;
        default: // front
          textPosition = [-tW / 2, -tH / 2, blockD / 2];
          textRotation = [0, 0, 0];
      }

      if (!cancelled) {
        // Dispose the previous geometries before storing the new ones
        stateRef.current?.blockGeo.dispose();
        stateRef.current?.textGeo.dispose();
        const newState = { blockGeo, textGeo, textPosition, textRotation };
        stateRef.current = newState;
        setBlockState(newState);
      } else {
        blockGeo.dispose();
        textGeo.dispose();
      }
    }).catch((err) => {
      console.error('EngravedBlock font load error:', err);
    });

    return () => { cancelled = true; };
  }, [text, font, protrusion, padding, face]);

  // Dispose geometries on unmount
  useEffect(() => {
    return () => {
      stateRef.current?.blockGeo.dispose();
      stateRef.current?.textGeo.dispose();
      stateRef.current = null;
    };
  }, []);

  if (!blockState) {
    // Loading placeholder
    return (
      <mesh castShadow>
        <boxGeometry args={[1, 1, BASE_BLOCK_DEPTH]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>
    );
  }

  return (
    <group>
      {/* The cube */}
      <mesh castShadow geometry={blockState.blockGeo}>
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Raised 3D text on the face – gold with emissive glow so it stands out */}
      <mesh
        castShadow
        geometry={blockState.textGeo}
        position={blockState.textPosition}
        rotation={blockState.textRotation}
      >
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ff8800"
          emissiveIntensity={0.55}
          metalness={0.45}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};
