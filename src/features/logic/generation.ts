import { lineMetaByKey, templateLineCatalog } from "../constants/templateLines";
import { vocabularyProfiles, vocabularyPromptMeta } from "../constants/vocabulary";
import { createRandom, generateSeed } from "./random";
import type {
  LineVocabularyProfile,
  ProphecyInput,
  ProphecyResult,
  ProphecyWeek,
  SelectedLine,
  SelectedLineTerms,
  TemplateLineCandidate,
  TemplateLineCatalog,
  TemplateLineKey,
  VocabularyCategory,
  VocabularyPromptMeta,
  WeekNumber,
} from "../types";

/** 候補選択で入力との近さを判定するための分類 */
type AffinityRule = {
  /** 入力値に含まれると加点対象になる語 */
  inputKeywords: readonly string[];
  /** 加点対象にする語彙プロファイルID */
  profileIds: readonly string[];
};

/** 候補選択時に避ける方向へ重み付けする注意語 */
const avoidedRiskWords = [
  "危害",
  "病気",
  "死",
  "事故",
  "犯罪",
  "破産",
  "金銭",
  "医療",
  "法律",
  "金融",
  "成功保証",
  "相手の気持ち",
  "容姿評価",
] as const;

/** 週番号順に選ぶ行キー */
const orderedLineKeys = ["line1", "line2", "line3", "line4"] as const satisfies readonly TemplateLineKey[];

/** 行キーに対応する週番号 */
const weekNumberByLineKey = {
  line1: 1,
  line2: 2,
  line3: 3,
  line4: 4,
} as const satisfies Record<TemplateLineKey, WeekNumber>;

/** 入力語と語彙プロファイルの近さを表す軽量な分類 */
const affinityRules = [
  {
    inputKeywords: ["仕事", "作業", "締切", "勉強", "予定", "時間"],
    profileIds: ["VP03", "VP10", "VP19", "VP31"],
  },
  {
    inputKeywords: ["恋", "人間関係", "友人", "家族", "連絡", "返信"],
    profileIds: ["VP05", "VP11", "VP22", "VP27", "VP28"],
  },
  {
    inputKeywords: ["不安", "疲", "迷", "落ち着", "気持ち"],
    profileIds: ["VP04", "VP08", "VP17", "VP21", "VP26"],
  },
  {
    inputKeywords: ["整理", "片付", "情報", "学", "調べ"],
    profileIds: ["VP01", "VP07", "VP12", "VP24", "VP32"],
  },
  {
    inputKeywords: ["選", "進", "変", "始", "区切"],
    profileIds: ["VP06", "VP13", "VP15", "VP18", "VP25", "VP29"],
  },
] as const satisfies readonly AffinityRule[];

/** 参照切れフォールバックで無制限な全候補選択を避けるための上限 */
const fallbackCandidateLimit = 3;

/** profileIdから語彙プロファイルを引くためのMap */
const vocabularyProfileById: Map<string, LineVocabularyProfile> = new Map(
  vocabularyProfiles.map((profile) => [profile.profileId, profile]),
);

/** 語彙とカテゴリからプロンプト用メタ情報を引くためのMap */
const vocabularyPromptMetaByKey: Map<string, VocabularyPromptMeta> = new Map(
  vocabularyPromptMeta.map((meta) => [buildVocabularyMetaKey(meta.word, meta.category), meta]),
);

/** 4週分の予言を生成する */
export function generateProphecy(input: ProphecyInput, randomSalt: number): ProphecyResult {
  const random = createRandom(generateSeed(input), randomSalt);
  const selectedLines = selectAndRenderFourWeeks(input, random);
  const weeks = selectedLines.map(toProphecyWeek);
  const interpretationAxis = buildInterpretationAxis(selectedLines, input);

  return {
    weeks,
    interpretationAxis,
    aiPrompt: buildAiPrompt(input, weeks, interpretationAxis),
  };
}

/** 第1週の候補を入力値と安全寄りの重み付けで選ぶ */
export function selectWeek1Candidate(
  input: ProphecyInput,
  random: () => number,
  catalog: TemplateLineCatalog = templateLineCatalog,
): TemplateLineCandidate {
  return pickHighestScore(catalog.line1, {
    random,
    getScore: (candidate) => calculateCandidateScore(candidate, input),
  });
}

/** 直前候補のnextCandidatesを優先し、参照切れ時は同週候補からフォールバックして選ぶ */
export function selectNextCandidate(
  previousCandidate: TemplateLineCandidate,
  lineKey: TemplateLineKey,
  input: ProphecyInput,
  random: () => number,
  catalog: TemplateLineCatalog = templateLineCatalog,
): TemplateLineCandidate {
  const referencedCandidates = (previousCandidate.nextCandidates ?? [])
    .filter((ref) => ref.lineKey === lineKey)
    .map((ref) => findCandidate(catalog, ref.lineKey, ref.candidateId))
    .filter((candidate): candidate is TemplateLineCandidate => candidate != null);
  const candidates =
    referencedCandidates.length > 0
      ? referencedCandidates
      : buildFallbackCandidates(catalog, previousCandidate, lineKey, input);

  return pickHighestScore(candidates, {
    random,
    getScore: (candidate) => calculateCandidateScore(candidate, input, previousCandidate),
  });
}

/** テンプレート変数を置換し、描画済み本文を必ず1行に整える */
export function renderTemplateLine(
  candidate: TemplateLineCandidate,
  selectedTerms: SelectedLineTerms,
  input: ProphecyInput,
): string {
  return candidate.text
    .replace(/\{name\}/g, input.name.trim())
    .replace(/\{theme\}/g, input.theme.trim())
    .replace(/\{mood\}/g, input.mood.trim())
    .replace(/\{week\}/g, String(weekNumberByLineKey[candidate.lineKey]))
    .replace(/\{symbol\}/g, selectedTerms.symbol ?? "")
    .replace(/\{place\}/g, selectedTerms.place ?? "")
    .replace(/\{object\}/g, selectedTerms.object ?? "")
    .replace(/\{action\}/g, selectedTerms.action ?? "")
    .replace(/\{toneHint\}/g, selectedTerms.toneHint ?? "")
    .replace(/\{adviceNuance\}/g, selectedTerms.adviceNuance ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** 4週分の候補、語彙、描画済み本文を組み立てる */
function selectAndRenderFourWeeks(input: ProphecyInput, random: () => number): SelectedLine[] {
  const selectedLines: SelectedLine[] = [];
  let previousCandidate: TemplateLineCandidate | undefined;

  for (const lineKey of orderedLineKeys) {
    const candidate =
      previousCandidate == null
        ? selectWeek1Candidate(input, random)
        : selectNextCandidate(previousCandidate, lineKey, input, random);
    const profile = getVocabularyProfile(candidate.profileId);
    const selectedTerms = selectVocabulary(profile, input, random);
    const renderedLine = renderTemplateLine(candidate, selectedTerms, input);

    selectedLines.push({
      weekNumber: weekNumberByLineKey[lineKey],
      candidate,
      lineMeta: lineMetaByKey[lineKey],
      profile,
      selectedTerms,
      renderedLine,
    });
    previousCandidate = candidate;
  }

  return selectedLines;
}

/** 語彙プロファイルから各差し込み語を選ぶ */
function selectVocabulary(profile: LineVocabularyProfile, input: ProphecyInput, random: () => number): SelectedLineTerms {
  return {
    symbol: pickTerm(profile.symbols, input, random),
    place: pickTerm(profile.places, input, random),
    object: pickTerm(profile.objects, input, random),
    action: pickTerm(profile.actions, input, random),
    toneHint: pickTerm(profile.toneHints, input, random),
    adviceNuance: pickTerm(profile.adviceNuances, input, random),
  };
}

/** 入力に近い語を優先し、同点時だけ乱数で選ぶ */
function pickTerm(terms: readonly string[], input: ProphecyInput, random: () => number): string | undefined {
  if (terms.length === 0) {
    return undefined;
  }

  return pickHighestScore(
    terms.map((term) => ({ term, score: calculateTermScore(term, input) })),
    {
      random,
      getScore: (termScore) => termScore.score,
    },
  ).term;
}

/** 候補一覧から最高スコアを選び、同点のみ乱数で揺らす */
function pickHighestScore<T>(
  items: readonly T[],
  options: {
    /** 同点を安定的に崩すための疑似乱数関数 */
    random: () => number;
    /** 候補ごとのスコア計算 */
    getScore: (item: T) => number;
  },
): T {
  if (items.length === 0) {
    throw new Error("選択可能な候補がありません");
  }

  const scoredItems = items.map((item) => ({
    item,
    score: options.getScore(item),
  }));
  const highestScore = Math.max(...scoredItems.map((item) => item.score));
  const tiedItems = scoredItems.filter((item) => item.score === highestScore);
  const selectedIndex = Math.floor(options.random() * tiedItems.length);

  return tiedItems[selectedIndex].item;
}

/** 候補と入力、直前候補、安全制約の近さからスコアを計算する */
function calculateCandidateScore(
  candidate: TemplateLineCandidate,
  input?: ProphecyInput,
  previousCandidate?: TemplateLineCandidate,
): number {
  const profile = getVocabularyProfile(candidate.profileId);
  const source = [
    candidate.text,
    candidate.candidateMeta.reading,
    candidate.candidateMeta.promptFocus,
    candidate.candidateMeta.caution,
    profile.purpose,
    profile.promptMeta.focus,
    profile.promptMeta.caution,
  ].join(" ");
  const profileAffinity = input == null ? 0 : calculateProfileAffinity(candidate.profileId, input);
  const continuationBonus = previousCandidate?.profileId === candidate.profileId ? 3 : 0;
  const promptFocusBonus = previousCandidate?.candidateMeta.promptFocus === candidate.candidateMeta.promptFocus ? 1 : 0;
  const riskPenalty = countAvoidedRiskWords(source) * 2;

  return profileAffinity + continuationBonus + promptFocusBonus - riskPenalty;
}

/** 語とユーザー入力の近さからスコアを計算する */
function calculateTermScore(term: string, input: ProphecyInput): number {
  const inputText = normalizeInputText(input);
  return inputText.includes(term) ? 2 : 0;
}

/** 入力値に近い語彙プロファイルを加点する */
function calculateProfileAffinity(profileId: string, input: ProphecyInput): number {
  const inputText = normalizeInputText(input);

  return affinityRules.reduce((score, rule) => {
    const hasKeyword = rule.inputKeywords.some((keyword) => inputText.includes(keyword));
    const hasProfile = rule.profileIds.some((ruleProfileId) => ruleProfileId === profileId);

    return hasKeyword && hasProfile ? score + 4 : score;
  }, 0);
}

/** 候補文章や注意書きに含まれる回避語の数を数える */
function countAvoidedRiskWords(source: string): number {
  return avoidedRiskWords.filter((word) => source.includes(word)).length;
}

/** 入力値を候補スコアリング用の1文字列へ正規化する */
function normalizeInputText(input: ProphecyInput): string {
  return [input.name, input.gender ?? "", input.theme, input.mood].map((value) => value.trim()).join(" ");
}

/** candidateIdから候補を取得する */
function findCandidate(
  catalog: TemplateLineCatalog,
  lineKey: TemplateLineKey,
  candidateId: string,
): TemplateLineCandidate | undefined {
  return catalog[lineKey].find((candidate) => candidate.candidateId === candidateId);
}

/** 参照切れ時に直前候補と近い同週候補へ絞り込む */
function buildFallbackCandidates(
  catalog: TemplateLineCatalog,
  previousCandidate: TemplateLineCandidate,
  lineKey: TemplateLineKey,
  input: ProphecyInput,
): TemplateLineCandidate[] {
  const lineCandidates = catalog[lineKey];
  const sameProfileCandidates = lineCandidates.filter((candidate) => candidate.profileId === previousCandidate.profileId);

  if (sameProfileCandidates.length > 0) {
    return sameProfileCandidates;
  }

  const relatedProfileIds = getRelatedProfileIds(previousCandidate.profileId);
  const relatedProfileCandidates = lineCandidates.filter((candidate) => relatedProfileIds.has(candidate.profileId));

  if (relatedProfileCandidates.length > 0) {
    return relatedProfileCandidates;
  }

  const sameFocusCandidates = lineCandidates.filter(
    (candidate) => candidate.candidateMeta.promptFocus === previousCandidate.candidateMeta.promptFocus,
  );

  if (sameFocusCandidates.length > 0) {
    return sameFocusCandidates;
  }

  const inputAffinityCandidates = lineCandidates.filter((candidate) => calculateProfileAffinity(candidate.profileId, input) > 0);

  if (inputAffinityCandidates.length > 0) {
    return inputAffinityCandidates;
  }

  return pickTopFallbackCandidates(lineCandidates, input, previousCandidate);
}

/** 同じ入力分類に属する語彙プロファイルIDを集める */
function getRelatedProfileIds(profileId: string): Set<string> {
  return affinityRules.reduce((profileIds, rule) => {
    if (rule.profileIds.some((ruleProfileId) => ruleProfileId === profileId)) {
      for (const ruleProfileId of rule.profileIds) {
        profileIds.add(ruleProfileId);
      }
    }

    return profileIds;
  }, new Set<string>());
}

/** 最後のフォールバックでもスコア上位だけに絞り、全候補へ広げない */
function pickTopFallbackCandidates(
  lineCandidates: readonly TemplateLineCandidate[],
  input: ProphecyInput,
  previousCandidate: TemplateLineCandidate,
): TemplateLineCandidate[] {
  return [...lineCandidates]
    .sort(
      (firstCandidate, secondCandidate) =>
        calculateCandidateScore(secondCandidate, input, previousCandidate) -
        calculateCandidateScore(firstCandidate, input, previousCandidate),
    )
    .slice(0, fallbackCandidateLimit);
}

/** profileIdが存在しない場合はデフォルトprofileへフォールバックする */
function getVocabularyProfile(profileId: string): LineVocabularyProfile {
  return vocabularyProfileById.get(profileId) ?? vocabularyProfiles[0];
}

/** 内部表現の選択済み行を公開用の週結果へ変換する */
function toProphecyWeek(selectedLine: SelectedLine): ProphecyWeek {
  return {
    weekNumber: selectedLine.weekNumber,
    line: selectedLine.renderedLine,
    candidateId: selectedLine.candidate.candidateId,
    profileId: selectedLine.profile.profileId,
    selectedTerms: selectedLine.selectedTerms,
  };
}

/** 選択済み行をもとに4週全体の解釈軸を作る */
export function buildInterpretationAxis(selectedLines: readonly SelectedLine[], input: ProphecyInput): string {
  const weeklyAxes = selectedLines.map((selectedLine) =>
    [
      `第${selectedLine.weekNumber}週は、${selectedLine.lineMeta.role}として読む`,
      `候補ID ${selectedLine.candidate.candidateId}、profileId ${selectedLine.profile.profileId} を根拠にする`,
      `候補文は、${selectedLine.candidate.candidateMeta.reading}として扱う`,
      `詩中の語彙は、${buildVocabularyInterpretation(selectedLine.selectedTerms)}として扱う`,
      `助言では${selectedLine.profile.promptMeta.focus}、${selectedLine.lineMeta.promptFocus}、${selectedLine.candidate.candidateMeta.promptFocus}を中心にする`,
      `注意点は${selectedLine.profile.promptMeta.caution}、${selectedLine.lineMeta.caution}、${selectedLine.candidate.candidateMeta.caution}に従う`,
      `行動は${buildActionFrame(selectedLine)}へ落とす`,
    ].join("。"),
  );
  const monthlyAxis = [
    `全体として、${selectedLines.map((selectedLine) => selectedLine.lineMeta.axis).join("から")}`,
    `という流れとして読む`,
    `相談テーマ「${input.theme.trim()}」と今月の気分「${input.mood.trim()}」については、実際に選ばれた語彙と行候補だけを根拠に解釈する`,
  ].join("");

  return [...weeklyAxes, monthlyAxis].join("\n");
}

/** 任意の生成AIへ貼り付けるための日本語プロンプトを作る */
export function buildAiPrompt(
  input: ProphecyInput,
  weeks: readonly ProphecyWeek[],
  interpretationAxis: string,
): string {
  return [
    "あなたは日本語で、占い風の四行詩を現実的な助言に読み替えるアシスタントです。",
    "以下のユーザー入力と四行詩を読み取り、相談テーマに関係する助言を返してください。",
    "",
    "【ユーザー入力】",
    `名前: ${input.name.trim()}`,
    `生年月日: ${formatBirthDate(input.birthDate)}`,
    `性別: ${input.gender ?? "未入力"}`,
    `相談テーマ: ${input.theme.trim()}`,
    `今月の気分: ${input.mood.trim()}`,
    "",
    "【四行詩】",
    formatWeeksForPrompt(weeks),
    "",
    "【四行詩の解釈軸】",
    interpretationAxis,
    "",
    "【出力条件】",
    "- 日本語で出力する",
    "- 四行詩の内容を助言の根拠として扱う",
    "- 四行詩の解釈軸を、読み替えの観点として扱う",
    "- ユーザーの相談テーマに直接関係する助言を返す",
    "- 不穏さを煽らず、次に取れる小さな行動へ落とし込む",
    "- 占いや予言として断定せず、解釈の一例として提示する",
    "- 医療、法律、金融など専門判断が必要な領域では、専門家への相談を促す",
    "- 重要な判断には使わず、必要に応じて信頼できる人や専門家に相談する",
    "- 相手の気持ち、未来の出来事、成功失敗を断定しない",
    "",
    "【出力形式】",
    "1. 四行詩から読める今月の流れ",
    "2. 相談テーマへの解釈",
    "3. 今週からできる小さな行動",
    "4. 注意したい思い込み",
  ].join("\n");
}

/** 選択された語彙だけをプロンプト向けの読みへ変換する */
function buildVocabularyInterpretation(selectedTerms: SelectedLineTerms): string {
  const interpretations = [
    buildTermInterpretation("symbol", selectedTerms.symbol),
    buildTermInterpretation("place", selectedTerms.place),
    buildTermInterpretation("object", selectedTerms.object),
    buildTermInterpretation("action", selectedTerms.action),
  ].filter((interpretation): interpretation is string => interpretation != null);

  return interpretations.length > 0 ? interpretations.join("、") : "差し込まれた語彙なし";
}

/** 選択語彙1つを語彙メタ情報つきの説明へ変換する */
function buildTermInterpretation(category: VocabularyCategory, word?: string): string | undefined {
  if (word == null) {
    return undefined;
  }

  const meta = vocabularyPromptMetaByKey.get(buildVocabularyMetaKey(word, category));
  if (meta == null) {
    return `「${word}」`;
  }

  return `「${word}」は${meta.reading}`;
}

/** 行動語、profile、行メタ情報から小さな行動の着地点を作る */
function buildActionFrame(selectedLine: SelectedLine): string {
  const actionMeta = selectedLine.selectedTerms.action
    ? vocabularyPromptMetaByKey.get(buildVocabularyMetaKey(selectedLine.selectedTerms.action, "action"))
    : undefined;
  const actionHint = actionMeta?.actionHint ?? selectedLine.profile.promptMeta.actionFrame;

  return `「${selectedLine.selectedTerms.action ?? "小さな行動"}」を${actionHint}の目安にして、${selectedLine.lineMeta.actionLanding}程度の小さな一手`;
}

/** 語彙メタ情報Mapのキーを作る */
function buildVocabularyMetaKey(word: string, category: VocabularyCategory): string {
  return `${category}:${word}`;
}

/** 週ごとの予言をプロンプト用の複数行へ整える */
function formatWeeksForPrompt(weeks: readonly ProphecyWeek[]): string {
  return weeks.map((week) => `第${week.weekNumber}週: ${week.line}`).join("\n");
}

/** Dateの年月日をユーザー向けの安定した文字列に変換する */
function formatBirthDate(birthDate: Date): string {
  const year = String(birthDate.getFullYear()).padStart(4, "0");
  const month = String(birthDate.getMonth() + 1).padStart(2, "0");
  const day = String(birthDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
