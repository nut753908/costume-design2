import type * as THREE from 'three';
import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asNumber } from '../socketHelpers';

interface FieldSpec<Id extends string = string> {
  id: Id;
  label: string;
  default: number;
  /** 整数に丸め、下限3にクランプする(Lathe/リンググリッドの分割数である segments 用)。 */
  round?: boolean;
}

// fields 配列(例: [{id:'torsoRadius', default:0.29}, ...])から
// { torsoRadius: number; ... } のような params オブジェクト型を組み立てる。
// `F[number]['id']` で id の合併型(キー集合)を作って、各キーの値を number にしている。
//
// 一見遠回りに見えるが、`[Field in F[number] as Field['id']]: number` のように
// F[number] を1回だけ辿ってキー remapping する簡潔な書き方は、F が(defineGeneratorNode 内部のように)
// まだ具体化されていないジェネリックのままだと同型写像(homomorphic mapped type)として
// 認識されず、下の DataFromFields の `Partial<...>` と噛み合わずコンパイルエラーになる
// (確認済み)。id の合併型からのキー生成は、その回避策としての形。
type ParamsFromFields<F extends readonly FieldSpec[]> = {
  [Id in F[number]['id']]: number;
};

// ノードの data(createDefaultData の返り値、updateNodeData で書き換わる)は params の
// 部分集合(未接続ソケットのフォールバック値のみ)を持てればよいので Partial にしている。
type DataFromFields<F extends readonly FieldSpec[]> = Partial<ParamsFromFields<F>> & Record<string, unknown>;

/**
 * ガーメントジェネレーターノード(skirt/belt/hat/...)は「フィールドの値を解決して
 * build*Geometry へそのまま渡すだけ」という同じ形をしている。この関数がその共通部分
 * (data 型・DEFAULTS・inputs 配列・createDefaultData・evaluate)をフィールド仕様から
 * 機械的に組み立てて registerNodeType を呼ぶ。
 *
 * segments のように整数丸め+下限クランプが要るフィールドは `round: true`、
 * capsuleGenerator の capSegments/radialSegments のように
 * ソケット化せずビルド関数へ渡すだけの固定値は `extra` を使う。
 */
export function defineGeneratorNode<
  // `const` を付けないと呼び出し側の fields 配列が `FieldSpec[]`(id: string)に広がってしまい、
  // 'torsoRadius' 等のリテラル id が失われて ParamsFromFields のキーが効かなくなる。
  const F extends readonly FieldSpec[],
  // extra を渡さないノード(skirt/belt/hat 等の大半)では Extra を空オブジェクト型にして、
  // ParamsFromFields<F> & Extra が ParamsFromFields<F> のままになるようにする。
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
    category: 'primitive',
    inputs: config.fields.map((f) => ({ id: f.id, label: f.label, type: 'number' as const, default: f.default })),
    outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
    createDefaultData: () => ({ ...defaults }),
    evaluate: (inputs, data): Record<string, SocketValue> => {
      const resolved = {} as Record<string, number>;
      for (const field of config.fields) {
        const value = asNumber(inputs[field.id], (data[field.id] as number | undefined) ?? field.default);
        resolved[field.id] = field.round ? Math.max(3, Math.round(value)) : value;
      }
      const geometry = config.build({ ...resolved, ...config.extra } as ParamsFromFields<F> & Extra);
      return { geometry: { type: 'geometry', value: geometry } };
    },
  });
}
