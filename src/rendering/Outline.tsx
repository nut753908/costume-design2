import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface OutlineProps {
  geometry: THREE.BufferGeometry;
  color?: THREE.ColorRepresentation;
  /** hull に加算される割合スケール。例: 0.035 -> 1.035倍のスケールでレンダリングされる。 */
  thickness?: number;
}

/** インバーテッドハル(法線を反転させた拡大複製)アウトライン: メッシュを裏面のみで複製し、わずかに拡大したもの。
 *
 * geometry は呼び出し側(ToonMesh)が所有し dispose する共有オブジェクトなのでここでは
 * dispose しない。material はこのコンポーネント自身が useMemo で構築するので、
 * 差し替え/unmount 時に dispose する。 */
export function Outline({ geometry, color = '#181818', thickness = 0.022 }: OutlineProps) {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }),
    [color],
  );

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  return <mesh geometry={geometry} material={material} scale={1 + thickness} />;
}
