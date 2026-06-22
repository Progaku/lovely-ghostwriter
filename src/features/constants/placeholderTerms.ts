/** 予言本文の{name}へ差し込む呼び名 */
const prophecyNameTerms = [
  "迷い子",
  "小さな影",
  "夜明け前のひと",
  "しるしを持つ人",
  "白い余白",
  "月影の客人",
  "古い鍵の持ち主",
  "雨音を聞く人",
] as const;

/** 予言本文の{theme}へ差し込む象徴的な題 */
const prophecyThemeTerms = [
  "閉じかけた扉",
  "まだ名のない問い",
  "机上の地図",
  "ほどけかけた糸",
  "薄明の道",
  "封のない手紙",
  "鏡に映る余白",
  "静かな分かれ道",
] as const;

/** 予言本文の{mood}へ差し込む気配の語 */
const prophecyMoodTerms = [
  "静かなざわめき",
  "やわらかな霧",
  "半分だけ開いた窓",
  "遠い灯り",
  "雨上がりの余白",
  "薄い月明かり",
  "ほどける沈黙",
  "朝を待つ気配",
] as const;

/** 予言本文でユーザー入力の代わりに使う差し込み語の候補 */
export const prophecyPlaceholderTerms = {
  names: prophecyNameTerms,
  themes: prophecyThemeTerms,
  moods: prophecyMoodTerms,
} as const;
