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

// 1つの FieldSpec を受け取り、その値の型を返す(enum なら default の文字列リテラル型、
// それ以外は number)。
type FieldValue<F> = F extends EnumFieldSpec<string, infer T> ? T : number;

// fields 配列(例: [{id:'torsoRadius', default:0.29}, {id:'necklineType', type:'enum', ...}])から
// { torsoRadius: number; necklineType: 'round' | ... } のような params オブジェクト型を組み立てる。
// `F[number]['id']` で id の合併型(キー集合)を作った後、各キーごとに `Extract<F[number], {id: Id}>`
// で元の FieldSpec に逆引きして値の型を決めている。
//
// 一見遠回りに見えるが、`[Field in F[number] as Field['id']]: FieldValue<Field>` のように
// F[number] を1回だけ辿ってキー remapping する簡潔な書き方は、F が(defineGeneratorNode 内部のように)
// まだ具体化されていないジェネリックのままだと同型写像(homomorphic mapped type)として
// 認識されず、下の DataFromFields の `Partial<...>` と噛み合わずコンパイルエラーになる
// (確認済み)。id ごとの逆引きは、その回避策としての形。
type ParamsFromFields<F extends readonly FieldSpec[]> = {
  [Id in F[number]['id']]: FieldValue<Extract<F[number], { id: Id }>>;
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
 * top/dress の angleSegments/heightSegments や sleeve の segments のように
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
    category: 'generator',
    inputs: config.fields.map((f) => ({ id: f.id, label: f.label, type: f.type ?? 'number' })),
    outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
    createDefaultData: () => ({ ...defaults }),
    evaluate: (inputs, data): Record<string, SocketValue> => {
      // ParamsFromFields<F> の精密な型が効くのは呼び出し側(fields/build の宣言)の境界だけ。
      // フィールドを汎用ループで回すこの内部では id が動的な文字列なので、以下は意図的に
      // 緩い型(Record<string, number | string>)で扱い、最後に build() へ渡す箇所でのみ
      // ParamsFromFields<F> & Extra へキャストし直す。
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
