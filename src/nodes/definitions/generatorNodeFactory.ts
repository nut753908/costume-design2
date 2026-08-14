import type * as THREE from 'three';
import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asEnum, asNumber } from '../socketHelpers';

interface NumberFieldSpec<Id extends string = string> {
  id: Id;
  label: string;
  type?: 'number';
  default: number;
  /** 整数に丸め、下限3にクランプする(Lathe/リンググリッドの分割数である segments 用)。 */
  round?: boolean;
}

interface EnumFieldSpec<Id extends string = string, T extends string = string> {
  id: Id;
  label: string;
  type: 'enum';
  default: T;
}

type FieldSpec<Id extends string = string> = NumberFieldSpec<Id> | EnumFieldSpec<Id>;

type FieldValue<F> = F extends EnumFieldSpec<string, infer T> ? T : number;

type ParamsFromFields<F extends readonly FieldSpec[]> = {
  [Id in F[number]['id']]: FieldValue<Extract<F[number], { id: Id }>>;
};

type DataFromFields<F extends readonly FieldSpec[]> = Partial<ParamsFromFields<F>> & Record<string, unknown>;

/**
 * ガーメントジェネレーターノード(skirt/belt/hat/...)は「フィールドの値を解決して
 * build*Geometry へそのまま渡すだけ」という同じ形をしている。この関数がその共通部分
 * (data 型・DEFAULTS・inputs 配列・createDefaultData・evaluate)をフィールド仕様から
 * 機械的に組み立てて registerNodeType を呼ぶ。
 *
 * segments のように整数丸め+下限クランプが要るフィールドは `round: true`、
 * top/dress の angleSegments/heightSegments や sleeve の segments のように
 * ソケット化せずビルド関数へ渡すだけの固定値は `extra` を使う。
 */
export function defineGeneratorNode<
  const F extends readonly FieldSpec[],
  Extra extends Record<string, unknown> = Record<never, never>,
>(config: {
  type: string;
  label: string;
  fields: F;
  build: (params: ParamsFromFields<F> & Extra) => THREE.BufferGeometry;
  extra?: Extra;
}): void {
  const defaults = Object.fromEntries(config.fields.map((f) => [f.id, f.default])) as ParamsFromFields<F>;

  registerNodeType<DataFromFields<F>>({
    type: config.type,
    label: config.label,
    category: 'generator',
    inputs: config.fields.map((f) => ({ id: f.id, label: f.label, type: f.type ?? 'number' })),
    outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
    createDefaultData: () => ({ ...defaults }),
    evaluate: (inputs, data): Record<string, SocketValue> => {
      const resolved = {} as Record<string, number | string>;
      for (const field of config.fields) {
        const fallback = (data[field.id] as number | string | undefined) ?? field.default;
        if (field.type === 'enum') {
          resolved[field.id] = asEnum(inputs[field.id], fallback as string);
        } else {
          const value = asNumber(inputs[field.id], fallback as number);
          resolved[field.id] = field.round ? Math.max(3, Math.round(value)) : value;
        }
      }
      const geometry = config.build({ ...resolved, ...config.extra } as ParamsFromFields<F> & Extra);
      return { geometry: { type: 'geometry', value: geometry } };
    },
  });
}
