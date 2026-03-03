import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import type { EngravedBlockParams } from '../../types';

const TARGET_TEXT_SIZE = 0.3; // target letter height in units
const BASE_BLOCK_DEPTH = 1;   // depth (Z) of the block
const FLOAT_GAP = 0.35;       // gap between cube top and text bottom

const OUTER_GLOW_SCALE = 1.1;  // scale of outermost glow halo
const INNER_GLOW_SCALE = 1.05; // scale of inner glow halo

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
  // Text geometry is centered at origin; this is the world position of that center
  textCenter: [number, number, number];
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

  const text      = validateText(params.text);
  const font      = params.font    ?? 'helvetiker';
  const thickness = Math.max(0.05, Math.min(0.3,  params.depth   ?? 0.12));
  const padding   = Math.max(0.05, Math.min(0.2,  params.padding ?? 0.1));

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

      // Block sized to fit the text with padding
      const blockW = Math.max(1, textW + 2 * padding);
      const blockH = Math.max(1, textH + 2 * padding);
      const blockGeo = new THREE.BoxGeometry(blockW, blockH, BASE_BLOCK_DEPTH);

      // -- 3D floating text geometry --
      const textGeo = new TextGeometry(text, {
        font: loadedFont,
        size: TARGET_TEXT_SIZE,
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.012,
        bevelSegments: 4,
      });
      textGeo.computeBoundingBox();
      const tbb = textGeo.boundingBox!;
      const tW = tbb.max.x - tbb.min.x;
      const tH = tbb.max.y - tbb.min.y;

      // Center the geometry at its own midpoint so glow scaling works correctly
      textGeo.translate(-tbb.min.x - tW / 2, -tbb.min.y - tH / 2, -thickness / 2);
      textGeo.computeVertexNormals();

      // Text floats above the cube, centered horizontally
      const textCenter: [number, number, number] = [
        0,
        blockH / 2 + FLOAT_GAP + tH / 2,
        0,
      ];

      if (!cancelled) {
        stateRef.current?.blockGeo.dispose();
        stateRef.current?.textGeo.dispose();
        const newState = { blockGeo, textGeo, textCenter };
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
  }, [text, font, thickness, padding]);

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

      {/* Outer glow halo – large scale, very low opacity, no depth write */}
      <mesh
        geometry={blockState.textGeo}
        position={blockState.textCenter}
        scale={[OUTER_GLOW_SCALE, OUTER_GLOW_SCALE, 1.0]}
      >
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
      </mesh>

      {/* Inner glow halo */}
      <mesh
        geometry={blockState.textGeo}
        position={blockState.textCenter}
        scale={[INNER_GLOW_SCALE, INNER_GLOW_SCALE, 1.0]}
      >
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {/* Core floating text – white with strong emissive glow */}
      <mesh castShadow geometry={blockState.textGeo} position={blockState.textCenter}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.2}
          metalness={0.0}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
};
