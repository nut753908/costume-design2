import type { SocketType } from '../nodes/types';

export const SOCKET_COLORS: Record<SocketType, string> = {
  number: '#4c8bf5',
  color: '#e2568c',
  geometry: '#3aa676',
  material: '#e0a83a',
  points: '#2bb4c4',
};

/** 選択できるすべてのソケット型。`SOCKET_COLORS` が `Record<SocketType, …>` で全型を網羅するため、型を追加すると自動でここにも入る。 */
export const SOCKET_TYPES = Object.keys(SOCKET_COLORS) as SocketType[];
