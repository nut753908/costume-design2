import * as THREE from 'three';
import { getToonGradientTexture } from './gradientTexture';

export function createToonMaterial(color: THREE.ColorRepresentation): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradientTexture(),
  });
}
