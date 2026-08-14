import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface OutlineProps {
  geometry: THREE.BufferGeometry;
}

const OUTLINE_COLOR: THREE.ColorRepresentation = '#181818';
/** hull に加算される割合スケール。例: 0.035 -> 1.035倍のスケールでレンダリングされる。 */
const OUTLINE_THICKNESS = 0.022;

/** インバーテッドハル(法線を反転させた拡大複製)アウトライン: メッシュを裏面のみで複製し、わずかに拡大したもの。
 *
 * geometry は呼び出し側(ToonMesh)が所有し dispose する共有オブジェクトなのでここでは
 * dispose しない。material はこのコンポーネント自身が useMemo で構築するので、
 * 差し替え/unmount 時に dispose する。 */
export function Outline({ geometry }: OutlineProps) {
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide }),
    [],
  );

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  return <mesh geometry={geometry} material={material} scale={1 + OUTLINE_THICKNESS} />;
}
