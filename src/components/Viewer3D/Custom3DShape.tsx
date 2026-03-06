import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import type { Custom3DElement } from '../../types';

const FONT_URL = '/fonts/helvetiker_regular.typeface.json';

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

interface Custom3DShapeProps {
  element: Custom3DElement;
}

export const Custom3DShape = ({ element }: Custom3DShapeProps) => {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const geoRef = useRef<THREE.BufferGeometry | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Build text geometry
  useEffect(() => {
    let cancelled = false;
    const safeText = (element.text || 'TXT').slice(0, 5) || 'TXT';

    loadFont().then((font) => {
      if (cancelled) return;
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

      if (!cancelled) {
        geoRef.current?.dispose();
        geoRef.current = textGeo;
        setGeo(textGeo);
      } else {
        textGeo.dispose();
      }
    }).catch((err) => {
      console.error('Custom3DShape font load error:', err);
    });

    return () => { cancelled = true; };
  }, [element.text]);

  // Load texture
  useEffect(() => {
    if (!element.textureDataUrl) {
      textureRef.current?.dispose();
      textureRef.current = null;
      setTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    const tex = loader.load(element.textureDataUrl);
    textureRef.current?.dispose();
    textureRef.current = tex;
    setTexture(tex);
    return () => {
      tex.dispose();
    };
  }, [element.textureDataUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geoRef.current?.dispose();
      geoRef.current = null;
      textureRef.current?.dispose();
      textureRef.current = null;
    };
  }, []);

  if (!geo) {
    return (
      <mesh castShadow>
        <boxGeometry args={[1, 1, 0.4]} />
        <meshStandardMaterial color={element.color} wireframe />
      </mesh>
    );
  }

  return (
    <group>
      {/* Solid / textured mesh */}
      <mesh castShadow geometry={geo}>
        <meshStandardMaterial
          color={element.color}
          map={texture ?? undefined}
        />
      </mesh>

      {/* Wireframe overlay */}
      {element.wireframe && (
        <mesh geometry={geo}>
          <meshBasicMaterial
            color={element.wireframeColor || '#000000'}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
};
