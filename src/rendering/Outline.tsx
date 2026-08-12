import { useMemo } from 'react';
import * as THREE from 'three';

interface OutlineProps {
  geometry: THREE.BufferGeometry;
  color?: THREE.ColorRepresentation;
  /** hull に加算される割合スケール。例: 0.035 -> 1.035倍のスケールでレンダリングされる。 */
  thickness?: number;
}

/** インバーテッドハル(法線を反転させた拡大複製)アウトライン: メッシュを裏面のみで複製し、わずかに拡大したもの。 */
export function Outline({ geometry, color = '#181818', thickness = 0.022 }: OutlineProps) {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }),
    [color],
  );

  return <mesh geometry={geometry} material={material} scale={1 + thickness} />;
}
