# ラブリーゴーストライター風 Webアプリ 詳細設計

## 1. 詳細設計の目的とスコープ

本書は `docs/requirements.md` と `docs/style-template-variations.md` を根拠に、React + Vite + TypeScript + Tailwind CSS + MUI で初期実装へ移れる粒度まで具体化する詳細設計である。

対象は、ユーザー入力から4週分の占い風四行詩を生成し、その内容を任意の生成AIへ貼り付けるためのAI用プロンプトを作るフロントエンド単体SPAである。バックエンド、DB、認証、外部AI API呼び出し、永続保存、履歴、共有、画像保存、SNS連携は初期スコープ外とする。

本アプリは個人利用または限定公開向けの非公式ファン作品である。公式画像、漫画コマ、アニメ素材、既存キャラクター画像は使用しない。UI、予言文、AI用プロンプトは日本語のみとする。

## 2. 要件整理

入力項目は以下とする。

| 項目 | 必須 | 形式 | 上限 | 備考 |
| --- | --- | --- | --- | --- |
| 名前 | 必須 | 文字列 | 50文字 | 空白のみは未入力扱い |
| 生年月日 | 必須 | `YYYY-MM-DD` | MUI Dateカレンダーに準拠 | 未来日はエラー |
| 性別 | 任意 | `男性` / `女性` / `その他` | - | - |
| 相談テーマ | 必須 | 文字列 | 255文字 | 長文は折り返す |
| 今月の気分 | 必須 | 文字列 | 255文字 | 候補選択と自由入力に対応 |

生成結果は1ヶ月分、4週分、各週1行とする。週番号は表示見出しで示し、詩本文には含めない。文体は象徴的、不穏、暗示的にするが、現実の危害、病気、死、犯罪、金銭損失などを断定的に予告しない。

AI用プロンプトはアプリ内で生成した4週分の予言、ユーザー入力、四行詩の解釈軸、出力条件、出力形式を含む。アプリ自身はAI APIを呼び出さず、ユーザーが本文をコピーして任意の生成AIへ貼り付ける方式とする。

## 3. 画面設計

画面は単一ページで構成する。上から、タイトル領域、入力フォーム、注意書き、生成結果領域を配置する。生成結果がない初期状態では結果領域を表示しない。

メイン画面は以下を表示する。

| 領域 | 表示内容 |
| --- | --- |
| タイトル | アプリ名または能力名を想起できる日本語タイトル、短い副題 |
| 入力フォーム | 名前、生年月日、性別、相談テーマ、今月の気分、気分候補、生成ボタン |
| 注意書き | 非公式ファン作品、娯楽用途、重要な判断には使わない旨 |

結果表示は以下を表示する。

| 領域 | 表示内容 |
| --- | --- |
| 予言紙面 | 第1週から第4週までの1行予言 |
| AI用プロンプト | 選択可能な複数行テキスト |
| 操作 | AI用プロンプトのコピー、再生成 |
| 一時通知 | コピー成功または失敗のSnackbar |

レスポンシブはモバイルファーストとする。スマートフォン幅では1カラム、デスクトップ幅では入力と結果を横並びにできる。ただし結果が長い場合は最大幅を設け、行間と折り返しを優先する。

## 4. コンポーネント設計

| コンポーネント | 責務 | 主なprops / event | MUI | Tailwind |
| --- | --- | --- | --- | --- |
| `App` | 全体状態管理、生成・再生成・コピー制御 | なし | `ThemeProvider`, `CssBaseline`, `Snackbar` | 背景、ページ最大幅、レスポンシブグリッド |
| `ProphecyForm` | 入力フォーム表示と変更通知 | `value`, `errors`, `canGenerate`, `onChange`, `onGenerate` | `TextField`, `Select`, `MenuItem`, `Button` | フォームの間隔、2カラム切替、幅 |
| `MoodSuggestions` | 気分候補の表示と入力欄への反映 | `suggestions`, `onSelect` | `Chip`, `Tooltip` | 折り返し、余白 |
| `Notice` | 最小限の注意書き | なし | `Alert` | 外側余白、紙面になじむ配置 |
| `ProphecyResult` | 結果全体の表示 | `result`, `onRegenerate`, `onCopy` | `Button`, `Divider` | 紙面風コンテナ、レイアウト |
| `ProphecyWeekList` | 4週分の予言を表示 | `weeks` | 必要に応じて `Divider` | 詩本文の組版、折り返し、行間 |
| `AiPromptPanel` | AI用プロンプト表示とコピー操作 | `aiPrompt`, `copyStatus`, `onCopy` | `TextField` multiline, `Button`, `Tooltip` | 最大高さ、折り返し、外側余白 |

フォーム部品はMUIコンポーネントを直接使用する。入力内部の見た目、アクセシビリティ、`disabled`、`error`、`helperText`、focus表示はMUIに寄せ、外側の配置、余白、最大幅、背景装飾はTailwindで担う。

## 5. 状態設計

`App` で以下の状態を持つ。

```ts
const [input, setInput] = useState<ProphecyInput>(initialInput);
const [randomSalt, setRandomSalt] = useState(0);
const [result, setResult] = useState<ProphecyResult | null>(null);
const [copyStatus, setCopyStatus] = useState<CopyStatus>({ state: "idle" });
```

バリデーション結果は `useMemo(() => validateInput(input), [input])` で導出する。生成ボタンの活性状態は `validation.isValid` から導出し、別stateとして保持しない。

AI用プロンプト本文は `ProphecyResult.aiPrompt` に含める。生成済み予言とAI用プロンプトが常に一致するよう、`generateProphecy(input, randomSalt)` の戻り値としてまとめて生成する。

カスタムフックは以下を想定する。

| Hook | 責務 |
| --- | --- |
| `useProphecyForm` | 入力更新、trim前提のバリデーション結果導出 |
| `useClipboard` | Clipboard API呼び出し、成功/失敗状態、Snackbar表示用状態 |

初期実装では状態が小さいため、グローバル状態管理ライブラリは使わない。

## 6. 型定義設計

```ts
export type Gender = "男性" | "女性" | "その他";

export type ProphecyInput = {
  name: string;
  birthDate: string;
  gender?: Gender;
  theme: string;
  mood: string;
};

export type WeekNumber = 1 | 2 | 3 | 4;

export type ProphecyWeek = {
  weekNumber: WeekNumber;
  line: string;
  candidateId: string;
  profileId: string;
  selectedTerms: SelectedLineTerms;
};

export type ProphecyResult = {
  weeks: ProphecyWeek[];
  interpretationAxis: string;
  aiPrompt: string;
};
```

テンプレート関連型は以下とする。

```ts
export type TemplateLineKey = "line1" | "line2" | "line3" | "line4";

export type TemplateLineCandidateRef = {
  lineKey: TemplateLineKey;
  candidateId: string;
};

export type TemplateLineCandidateMeta = {
  reading: string;
  promptFocus: string;
  caution: string;
};

export type TemplateLineCandidate = {
  candidateId: string;
  lineKey: TemplateLineKey;
  text: string;
  profileId: string;
  candidateMeta: TemplateLineCandidateMeta;
  nextCandidates?: TemplateLineCandidateRef[];
};

export type TemplateLineCatalog = Record<TemplateLineKey, TemplateLineCandidate[]>;

export type PromptMeta = {
  reading: string;
  promptFocus: string;
  caution: string;
  actionHint: string;
};

export type LineVocabularyProfile = {
  profileId: string;
  symbols: string[];
  places: string[];
  objects: string[];
  actions: string[];
  promptMeta: {
    focus: string;
    caution: string;
  };
};

export type TemplateLineMeta = {
  lineKey: TemplateLineKey;
  weekNumber: WeekNumber;
  role: string;
  axis: string;
  promptFocus: string;
  caution: string;
  actionLanding: string;
};

export type VocabularyPromptMeta = PromptMeta;

export type SelectedLineTerms = {
  symbol?: string;
  place?: string;
  object?: string;
  action?: string;
  toneHint?: string;
};

export type SelectedLine = {
  weekNumber: WeekNumber;
  candidate: TemplateLineCandidate;
  lineMeta: TemplateLineMeta;
  profile: LineVocabularyProfile;
  selectedTerms: SelectedLineTerms;
  renderedLine: string;
};
```

UI状態型は以下とする。

```ts
export type FieldName = keyof ProphecyInput;

export type ValidationErrors = Partial<Record<FieldName, string>>;

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationErrors;
};

export type CopyStatus =
  | { state: "idle" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };
```

## 7. 定数・テンプレートデータ設計

定数は `src/features/constants` 配下に分割する。

| 定数 | 内容 |
| --- | --- |
| `templateLineCatalog` | `line1` から `line4` の行候補カタログ |
| `lineMetaByKey` | 週番号ごとの役割、解釈軸、注意、着地点 |
| `vocabularyProfiles` | profileIdごとの象徴語、場所語、道具語、行動語、promptMeta |
| `vocabularyPromptMeta` | 語彙ごとのreading、promptFocus、caution、actionHint |
| `moodSuggestions` | 今月の気分候補 |
| `aiPromptTemplate` | 共通AI用プロンプト雛形 |

テンプレートは4行セットではなく、必ず行候補カタログとして保持する。`line1` は第1週、`line2` は第2週、`line3` は第3週、`line4` は第4週に固定し、行番号の入れ替えはしない。

`templateLineCatalog` の各候補には `candidateId`、`profileId`、`candidateMeta`、必要に応じて `nextCandidates` を持たせる。`nextCandidates` には自然につながる次週候補だけを列挙し、全候補ランダム選択を避ける。

気分候補は、要件にある自由入力を妨げない補助値として扱う。例: `少し不安がある`、`落ち着いている`、`迷いがある`、`前に進みたい`、`疲れ気味`、`静かに整えたい`。

## 8. 予言生成ロジック詳細

生成処理は `generateProphecy(input, randomSalt)` を入口とする。戻り値は `ProphecyResult` で、4週分の詩、解釈軸、AI用プロンプトを同時に返す。

処理順は以下とする。

1. `validateInput(input)` 済みの入力だけを受け取る。
2. `generateSeed(input)` で入力由来の数値seedを作る。
3. `createRandom(seed, randomSalt)` で疑似乱数関数を作る。
4. `selectWeek1Candidate(input, random)` で第1週候補を選ぶ。
5. 第2週から第4週は `selectNextCandidate(previousCandidate, lineKey, input, random)` で選ぶ。
6. 各候補に対して `selectVocabulary(profile, input, random)` で差し込み語を選ぶ。
7. `renderTemplateLine(candidate, selectedTerms, input)` で1行へ描画する。
8. `buildInterpretationAxis(selectedWeeks, input)` を作る。
9. `buildAiPrompt(input, weeks, interpretationAxis)` を作る。

疑似コード:

```ts
function generateSeed(input: ProphecyInput): number {
  const source = [
    input.name.trim(),
    input.birthDate,
    input.gender ?? "",
    input.theme.trim(),
    input.mood.trim(),
  ].join("|");
  return hashStringToUint32(source);
}

function createRandom(seed: number, randomSalt: number): () => number {
  return mulberry32(hashNumber(seed ^ randomSalt));
}

function selectWeek1Candidate(input: ProphecyInput, random: Random): TemplateLineCandidate {
  const candidates = templateLineCatalog.line1;
  return pickHighestScore(candidates, { input, lineKey: "line1", random });
}

function selectNextCandidate(
  previous: TemplateLineCandidate,
  lineKey: TemplateLineKey,
  input: ProphecyInput,
  random: Random,
): TemplateLineCandidate {
  const refs = previous.nextCandidates?.filter((ref) => ref.lineKey === lineKey) ?? [];
  const referenced = refs
    .map((ref) => findCandidate(ref))
    .filter(Boolean);

  const candidates = referenced.length > 0
    ? referenced
    : buildFallbackCandidates(previous, lineKey, input);

  return pickHighestScore(candidates, { input, lineKey, previous, random });
}

function selectVocabulary(
  profile: LineVocabularyProfile,
  input: ProphecyInput,
  random: Random,
): SelectedLineTerms {
  return {
    symbol: pickByInputAffinity(profile.symbols, input, random),
    place: pickByInputAffinity(profile.places, input, random),
    object: pickByInputAffinity(profile.objects, input, random),
    action: pickByInputAffinity(profile.actions, input, random),
    toneHint: profile.promptMeta.focus,
  };
}

function renderTemplateLine(
  candidate: TemplateLineCandidate,
  selectedTerms: SelectedLineTerms,
  input: ProphecyInput,
): string {
  return candidate.text
    .replaceAll("{name}", input.name.trim())
    .replaceAll("{theme}", input.theme.trim())
    .replaceAll("{mood}", input.mood.trim())
    .replaceAll("{symbol}", selectedTerms.symbol ?? "")
    .replaceAll("{place}", selectedTerms.place ?? "")
    .replaceAll("{object}", selectedTerms.object ?? "")
    .replaceAll("{action}", selectedTerms.action ?? "")
    .replaceAll("{toneHint}", selectedTerms.toneHint ?? "")
    .replace(/\r?\n/g, " ")
    .trim();
}

function generateProphecy(input: ProphecyInput, randomSalt: number): ProphecyResult {
  const random = createRandom(generateSeed(input), randomSalt);
  const selectedWeeks = selectAndRenderFourWeeks(input, random);
  const interpretationAxis = buildInterpretationAxis(selectedWeeks, input);
  return {
    weeks: selectedWeeks.map(toProphecyWeek),
    interpretationAxis,
    aiPrompt: buildAiPrompt(input, selectedWeeks, interpretationAxis),
  };
}
```

`pickHighestScore` は最高スコア候補を選ぶ。同点の場合のみ `random()` を使ってタイブレークする。これにより、入力値との関連性を優先しつつ、再生成時の揺らぎを確保する。

## 9. 解釈軸生成ロジック詳細

`interpretationAxis` は固定分類名ではなく、実際に選ばれた候補と語彙から生成する。優先順位は以下とする。

1. その行に割り当てられた `LineVocabularyProfile.promptMeta`
2. 候補単位の `TemplateLineCandidateMeta`
3. 行番号ごとの `TemplateLineMeta`
4. 選ばれた語彙の `VocabularyPromptMeta`
5. ユーザー入力の `theme` と `mood`

週ごとの解釈には、第何週か、`lineMeta.role`、`candidateMeta.reading`、実際に選ばれた語彙の読み、助言で中心にする焦点、避けるべき断定や煽り、小さな行動への落とし込みを含める。

疑似コード:

```ts
function buildSelectedLineTerms(
  candidate: TemplateLineCandidate,
  profile: LineVocabularyProfile,
  input: ProphecyInput,
  random: Random,
): SelectedLineTerms {
  return selectVocabulary(profile, input, random);
}

function buildWeeklyInterpretation(selected: SelectedLine): string {
  const vocabularyReadings = getVocabularyReadings(selected.selectedTerms);
  return [
    `第${selected.weekNumber}週は、${selected.lineMeta.role}として読む。`,
    `候補文は、${selected.candidate.candidateMeta.reading}として扱う。`,
    `詩中の語彙は、${vocabularyReadings}の比喩として扱う。`,
    `助言では${selected.profile.promptMeta.focus}、${selected.lineMeta.promptFocus}、${selected.candidate.candidateMeta.promptFocus}を中心にする。`,
    `注意点は${selected.profile.promptMeta.caution}、${selected.lineMeta.caution}、${selected.candidate.candidateMeta.caution}に従う。`,
    `行動は${selected.lineMeta.actionLanding}程度の小さな一手へ落とす。`,
  ].join("");
}

function buildMonthlyInterpretation(selectedWeeks: SelectedLine[], input: ProphecyInput): string {
  return `全体として、第1週の入口から始まり、第2週で条件や順番を見直し、第3週で「${input.mood.trim()}」を読み替え、第4週で小さな行動へ着地する流れとして読む。相談テーマ「${input.theme.trim()}」については、実際に選ばれた語彙と行候補だけを根拠に解釈する。`;
}

function buildInterpretationAxis(selectedWeeks: SelectedLine[], input: ProphecyInput): string {
  return [
    ...selectedWeeks.map(buildWeeklyInterpretation),
    buildMonthlyInterpretation(selectedWeeks, input),
  ].join("\n");
}
```

解釈軸には、実際に選ばれていない語彙、未来の断定、相手の気持ちの断定、成功失敗の断定を含めない。

## 10. AI用プロンプト生成ロジック詳細

AI用プロンプトは相談テーマごとに出し分けず、共通雛形を1つだけ使う。

含める内容は以下とする。

| セクション | 内容 |
| --- | --- |
| ユーザー入力 | 名前、生年月日、性別、相談テーマ、今月の気分 |
| 四行詩 | 第1週から第4週の生成済み予言 |
| 四行詩の解釈軸 | `buildInterpretationAxis` の結果 |
| 出力条件 | 日本語、根拠、断定回避、専門家相談など |
| 出力形式 | 4項目の番号付き形式 |

生成する本文:

```text
あなたは日本語で、占い風の四行詩を現実的な助言に読み替えるアシスタントです。
以下のユーザー入力と四行詩を読み取り、相談テーマに関係する助言を返してください。

【ユーザー入力】
名前: {name}
生年月日: {birthDate}
性別: {gender}
相談テーマ: {theme}
今月の気分: {mood}

【四行詩】
{weeks}

【四行詩の解釈軸】
{interpretationAxis}

【出力条件】
- 日本語で出力する
- 四行詩の内容を助言の根拠として扱う
- 四行詩の解釈軸を、読み替えの観点として扱う
- ユーザーの相談テーマに直接関係する助言を返す
- 不穏さを煽らず、次に取れる小さな行動へ落とし込む
- 占いや予言として断定せず、解釈の一例として提示する
- 医療、法律、金融など専門判断が必要な領域では、専門家への相談を促す
- 相手の気持ち、未来の出来事、成功失敗を断定しない

【出力形式】
1. 四行詩から読める今月の流れ
2. 相談テーマへの解釈
3. 今週からできる小さな行動
4. 注意したい思い込み
```

週の出力は `第1週: ...` の形式でプロンプトに含めるが、詩本文の `line` 自体には週番号を混ぜない。

## 11. 入力バリデーション設計

`validateInput(input): ValidationResult` で以下を確認する。

| 項目 | 条件 | エラーメッセージ |
| --- | --- | --- |
| 名前 | trim後1文字以上、50文字以下 | 名前を入力してください / 50文字以内で入力してください |
| 生年月日 | 空でない、日付として解釈可能、未来日でない | 生年月日を入力してください / 正しい日付を入力してください |
| 性別 | 許可値 | 性別の選択値が正しくありません |
| 相談テーマ | trim後1文字以上、255文字以下 | 相談テーマを入力してください / 255文字以内で入力してください |
| 今月の気分 | trim後1文字以上、255文字以下 | 今月の気分を入力してください / 255文字以内で入力してください |

生成ボタンは `validation.isValid === true` のときだけ活性化する。エラーはMUI `TextField` の `error` と `helperText` で表示する。

長い入力への対策として、フォーム欄は `maxLength` を設定し、相談テーマと今月の気分は複数行入力にする。表示側はTailwindの `break-words`、`whitespace-pre-wrap`、`leading-relaxed`、`max-w-*` を使い、ボタン内テキストは折り返しまたは十分な横幅を確保する。

## 12. コピー機能設計

コピー処理は `navigator.clipboard.writeText(result.aiPrompt)` を使う。成功時は `copyStatus` を `success` にし、MUI `Snackbar` で `AI用プロンプトをコピーしました` と表示する。

失敗時は `copyStatus` を `error` にし、`コピーできませんでした。本文を選択して手動でコピーしてください` と表示する。AI用プロンプト本文は常にMUI `TextField` の multiline か `textarea` 相当で選択可能にし、Clipboard APIが使えないブラウザや権限エラーでも手動コピーできる状態を保つ。

`Snackbar` は数秒で自動的に閉じる。エラー時も生成済み結果は消さない。

## 13. デザイン詳細

ビジュアル方針は「古い占い紙面」とする。紙、インク、タイプライター、古い机上、自動筆記、暗めで静かな雰囲気を使うが、公式素材には依存しない。

全体背景は暗い木机を想起する落ち着いた色にし、中央に古い紙面風のコンテナを置く。紙面は薄い生成り色、控えめな枠線、淡い影、インク色の本文で構成する。装飾はCSSの背景色、境界線、影、疑似的な質感に留める。

Tailwind CSS と MUI の責務分担:

| 領域 | 優先 |
| --- | --- |
| 入力内部、ラベル、エラー、focus、disabled | MUI |
| 入力部品の外側余白、横幅、グリッド | Tailwind |
| ボタンの基本状態、アクセシビリティ | MUI |
| ボタン配置、レスポンシブ折り返し | Tailwind |
| ページ背景、紙面風の枠、影、余白 | Tailwind |
| カラーパレット、角丸、フォント | MUI Theme |
| 詩本文の行間、字間、折り返し、最大幅 | Tailwind |

MUI Themeでは以下を設定する。

- `palette.primary`: インク色に近い暗色
- `palette.secondary`: 古い紙に合う控えめな差し色
- `shape.borderRadius`: 8px以下
- `typography.fontFamily`: 日本語UIに適したシステムフォント。詩本文にはタイプライター風に見える等幅系を補助的に使う
- `components`: `MuiButton`、`MuiTextField`、`MuiChip` のhover、focus、disabledを統一

スマートフォン幅ではすべて1カラムにし、フォーム要素は画面幅いっぱいに近い幅で表示する。デスクトップ幅では入力フォームと結果表示を2カラムにできるが、AI用プロンプトは読みやすさを優先して横幅と最大高さを制限する。

## 14. エラーハンドリング設計

入力エラーは生成前に検出し、生成処理を呼び出さない。通常操作では生成ボタンが非活性になるため、生成時に不正入力が渡った場合は開発時の防御として早期returnする。

テンプレート参照エラーは以下の方針で扱う。

| 事象 | 対応 |
| --- | --- |
| `nextCandidates` が空または未定義 | 現在週のフォールバック候補から選ぶ |
| `candidateId` 参照先がない | その参照を無視し、残った候補から選ぶ |
| profileIdが存在しない | デフォルトprofileを使い、開発時にconsole warning |
| 描画後に空行になる | 候補選択をやり直すか、同週フォールバック候補を使う |

コピー失敗はUI通知のみで扱い、手動コピー可能な本文表示を維持する。

## 15. テスト設計

単体テスト:

| 対象 | ケース |
| --- | --- |
| `validateInput` | 必須未入力、上限超過、不正な性別、未来日 |
| `generateSeed` | 同じ入力で同じseed、入力差分でseed変化 |
| `selectNextCandidate` | `nextCandidates` 優先、参照切れ時フォールバック |
| `renderTemplateLine` | 変数置換、改行除去、1行化 |
| `generateProphecy` | 常に4週分、各週1行、週番号順 |
| `buildInterpretationAxis` | 候補ID、profile、語彙、注意が反映される |
| `buildAiPrompt` | ユーザー入力、4週分、解釈軸、出力条件、出力形式を含む |

コンポーネントテスト:

| 対象 | ケース |
| --- | --- |
| `ProphecyForm` | 必須入力済みで生成ボタン活性、未入力で非活性 |
| `MoodSuggestions` | Chip選択で今月の気分欄に反映 |
| `ProphecyResult` | 4週分と再生成ボタンを表示 |
| `AiPromptPanel` | コピー操作で成功表示、失敗時は手動コピー案内 |

手動確認:

- スマートフォン幅でフォーム、ボタン、予言文、AI用プロンプトが崩れない。
- デスクトップ幅で紙面風の余白と読みやすさが保たれる。
- 長い名前、相談テーマ、気分でも表示がはみ出さない。
- 再生成で同じ入力でも異なる表現が出る場合がある。
- 入力を変えると候補選択や語彙が変わり得る。
- 危害、病気、死、犯罪、破産、金銭損失を断定する表現が出ない。

## 16. 初期スコープ外

以下は初期実装に含めない。

- AI API呼び出し
- APIキー管理
- サーバーサイド処理
- データベース保存
- 認証
- 多言語対応
- 結果の永続保存
- 履歴表示
- URL共有
- 画像保存
- SNS投稿
- 公式素材の利用

## 17. 実装順序

1. Vite + React + TypeScript の初期構成を作る。
2. Tailwind CSS、MUI、MUI Themeを導入する。
3. `types`、定数、バリデーション関数を作る。
4. `templateLineCatalog`、`lineMetaByKey`、`vocabularyProfiles`、`vocabularyPromptMeta` を定数化する。
5. seed、疑似乱数、候補選択、語彙選択、テンプレート描画を実装する。
6. 解釈軸生成とAI用プロンプト生成を実装する。
7. `App`、フォーム、気分候補、注意書き、結果表示、AIプロンプト欄を実装する。
8. コピー機能とSnackbarを実装する。
9. 単体テストとコンポーネントテストを追加する。
10. モバイル幅とデスクトップ幅で手動確認し、文字はみ出しと表示崩れを調整する。

## 18. 未決事項・確認事項

現時点で実装前に残す未決事項はない。以下を初期実装の決定事項とする。

- アプリ名は `ラブリーゴーストライター` とする。非公式ファン作品であることを注意書きで明示し、公式素材、公式画像、漫画コマ、アニメ素材、既存キャラクター画像は使用しない。
- 画面内の注意書きには `非公式ファン作品です。娯楽用途としてお楽しみください。重要な判断には使用しないでください。` を表示する。
- `style-template-variations.md` の行候補、行遷移、語彙プロファイル、語彙メタ情報は初期実装で全候補を定数化する。代表候補だけの段階投入は行わない。
- 気分候補は `少し不安がある`、`落ち着いている`、`迷いがある`、`前に進みたい`、`疲れ気味`、`静かに整えたい`、`期待と不安が混ざっている`、`区切りをつけたい` を初期値とする。自由入力は必ず維持する。
- テストランナーは Vitest、Reactコンポーネントテストは Testing Library、DOM環境は jsdom を使う。
- 手動確認対象の画面幅は 375px、768px、1280px とする。
