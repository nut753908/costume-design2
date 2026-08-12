import type { SocketValue } from './types';

export function asNumber(v: SocketValue | undefined, fallback: number): number {
  return v?.type === 'number' ? v.value : fallback;
}

export function asEnum<T extends string>(v: SocketValue | undefined, fallback: T): T {
  return v?.type === 'enum' ? (v.value as T) : fallback;
}
