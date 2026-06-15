import type { ProphecyInput } from "../types";

/** 0以上1未満の値を返す疑似乱数関数 */
export type Random = () => number;

/** hash計算で使うFNV-1aの32bitオフセット基準値 */
const fnvOffsetBasis = 0x811c9dc5;

/** hash計算で使うFNV-1aの32bit素数 */
const fnvPrime = 0x01000193;

/** seedとsaltを混ぜるための32bit定数 */
const saltMixConstant = 0x9e3779b9;

/** ユーザー入力から疑似乱数の初期値に使う32bit seedを生成する */
export function generateSeed(input: ProphecyInput): number {
  return hashStringToUint32(
    [
      input.name.trim(),
      formatBirthDate(input.birthDate),
      input.gender ?? "",
      input.theme.trim(),
      input.mood.trim(),
    ].join("|"),
  );
}

/** seedと再生成用saltから決定的な疑似乱数関数を生成する */
export function createRandom(seed: number, randomSalt: number): Random {
  let state = mixSeedAndSalt(seed, randomSalt);

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** 文字列をFNV-1aで32bit unsigned integerへ変換する */
function hashStringToUint32(source: string): number {
  let hash = fnvOffsetBasis;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, fnvPrime) >>> 0;
  }

  return hash >>> 0;
}

/** Dateの年月日だけをseed用の安定した文字列に変換する */
function formatBirthDate(birthDate: Date): string {
  const year = String(birthDate.getFullYear()).padStart(4, "0");
  const month = String(birthDate.getMonth() + 1).padStart(2, "0");
  const day = String(birthDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** seedとsaltを32bit unsigned integerとして混ぜ合わせる */
function mixSeedAndSalt(seed: number, randomSalt: number): number {
  const normalizedSeed = seed >>> 0;
  const normalizedSalt = Math.trunc(randomSalt) >>> 0;
  const saltHash = Math.imul(normalizedSalt ^ (normalizedSalt >>> 16), saltMixConstant) >>> 0;

  return (normalizedSeed ^ saltHash) >>> 0;
}
