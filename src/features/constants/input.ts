import type { Gender } from "../types";

/** 入力フォームで選択できる性別 */
export const genderOptions = ["男性", "女性", "その他"] as const satisfies readonly Gender[];

/** 今月の気分入力を補助する候補 */
export const moodSuggestions = [
  "元気",
  "楽しい",
  "寂しい",
  "悲しい",
  "不安",
  "迷いがある",
  "前に進みたい",
  "疲れ気味",
  "落ち着いている",
  "静かに整えたい",
  "期待と不安が混ざっている",
  "区切りをつけたい",
  "苛立っている",
] as const;

/** 入力フィールドごとの最大文字数 */
export const inputMaxLengths = {
  /** 名前の最大文字数 */
  name: 50,
  /** 相談テーマの最大文字数 */
  theme: 255,
  /** 今月の気分の最大文字数 */
  mood: 255,
} as const;
