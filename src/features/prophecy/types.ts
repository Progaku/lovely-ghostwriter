/**
 * 入力フォームで扱える性別の選択値
 *
 * @note 未入力は undefined で表す
 */
export type Gender = "男性" | "女性" | "その他";

/** 予言結果で扱う週番号。1ヶ月分を4週に固定する */
export type WeekNumber = 1 | 2 | 3 | 4;

/** ユーザーが予言生成前に入力する情報 */
export type ProphecyInput = {
  /** 表示やseed生成に使うユーザー名 */
  name: string;
  /** ブラウザ日付入力から受け取る生年月日 */
  birthDate: string;
  /**
   * 任意入力の性別
   *
   * @note 未選択の場合は undefined
   */
  gender?: Gender;
  /** ユーザーが相談したいテーマ */
  theme: string;
  /** 今月の気分。候補選択または自由入力で指定する */
  mood: string;
};

/** テンプレート行へ差し込むために選ばれた象徴語や行動語 */
export type SelectedLineTerms = {
  /** 予言行の中心になる象徴語 */
  symbol?: string;
  /** 予言行の舞台や場面を示す場所語 */
  place?: string;
  /** 予言行に差し込む道具や物の語 */
  object?: string;
  /** 助言や変化の方向を暗示する行動語 */
  action?: string;
  /** 文体やAI用プロンプトの焦点を補助する調子のヒント */
  toneHint?: string;
};

/** 生成済みの週ごとの予言行と、その生成根拠になる候補情報 */
export type ProphecyWeek = {
  /** 1から4までの週番号 */
  weekNumber: WeekNumber;
  /** ユーザーへ表示する1行の予言文 */
  line: string;
  /** 使用したテンプレート候補のID */
  candidateId: string;
  /** 使用した語彙プロファイルのID */
  profileId: string;
  /** 予言行へ差し込まれた語彙 */
  selectedTerms: SelectedLineTerms;
};

/** 4週分の予言、解釈軸、コピー用AIプロンプトをまとめた生成結果 */
export type ProphecyResult = {
  /** 第1週から第4週までの予言行 */
  weeks: ProphecyWeek[];
  /** 4行全体から組み立てた解釈の軸 */
  interpretationAxis: string;
  /** 任意の生成AIへ貼り付けるためのプロンプト本文 */
  aiPrompt: string;
};

/** テンプレート候補を週ごとに分類する行キー */
export type TemplateLineKey = "line1" | "line2" | "line3" | "line4";

/** 次週へ自然につなげる候補を参照するための軽量な識別情報 */
export type TemplateLineCandidateRef = {
  /** 参照先候補が属する行キー */
  lineKey: TemplateLineKey;
  /** 参照先候補のID */
  candidateId: string;
};

/** テンプレート候補がAI用プロンプトへ渡す解釈補助情報 */
export type TemplateLineCandidateMeta = {
  /** 候補行の読み取り方 */
  reading: string;
  /** AI用プロンプトで重視させる焦点 */
  promptFocus: string;
  /** 断定や不安の煽りを避けるための注意点 */
  caution: string;
};

/** 予言の1行を生成するためのテンプレート候補 */
export type TemplateLineCandidate = {
  /** テンプレート候補を一意に識別するID */
  candidateId: string;
  /** 候補が属する行キー */
  lineKey: TemplateLineKey;
  /** 差し込み語を含む予言文テンプレート */
  text: string;
  /** 候補に対応する語彙プロファイルのID */
  profileId: string;
  /** 候補行の解釈補助情報 */
  candidateMeta: TemplateLineCandidateMeta;
  /** 次週へ自然につなげられる候補参照 */
  nextCandidates?: TemplateLineCandidateRef[];
};

/** 行キーごとにテンプレート候補を保持するカタログ */
export type TemplateLineCatalog = Record<TemplateLineKey, TemplateLineCandidate[]>;

/** AI用プロンプトで使う読み取り、焦点、注意、行動ヒント */
export type PromptMeta = {
  /** 詩的表現を助言へ変換するための読み取り方 */
  reading: string;
  /** AI用プロンプトで重視させる焦点 */
  promptFocus: string;
  /** 断定や不安の煽りを避けるための注意点 */
  caution: string;
  /** ユーザーが次に取れる小さな行動の方向性 */
  actionHint: string;
};

/** 象徴語、場所語、道具語、行動語をまとめた語彙プロファイル */
export type LineVocabularyProfile = {
  /** 語彙プロファイルを一意に識別するID */
  profileId: string;
  /** 象徴的な名詞の候補 */
  symbols: string[];
  /** 場所や場面を表す語の候補 */
  places: string[];
  /** 道具や物を表す語の候補 */
  objects: string[];
  /** 行動や変化を表す語の候補 */
  actions: string[];
  /** 語彙プロファイル単位のAI用プロンプト補助情報 */
  promptMeta: {
    /** AI用プロンプトで重視させる焦点 */
    focus: string;
    /** 断定や不安の煽りを避けるための注意点 */
    caution: string;
  };
};

/** 各テンプレート行の役割、解釈軸、注意、助言の着地点 */
export type TemplateLineMeta = {
  /** メタ情報が対応する行キー */
  lineKey: TemplateLineKey;
  /** メタ情報が対応する週番号 */
  weekNumber: WeekNumber;
  /** 4週構成の中でその行が担う役割 */
  role: string;
  /** 解釈軸を組み立てるための観点 */
  axis: string;
  /** AI用プロンプトで重視させる焦点 */
  promptFocus: string;
  /** 断定や不安の煽りを避けるための注意点 */
  caution: string;
  /** 助言として着地させる行動の方向性 */
  actionLanding: string;
};

/** 語彙に紐づくAI用プロンプト補助情報 */
export type VocabularyPromptMeta = PromptMeta;

/** 候補、メタ情報、語彙、描画済み本文をまとめた選択済みの1行 */
export type SelectedLine = {
  /** 選択済み行が対応する週番号 */
  weekNumber: WeekNumber;
  /** 選択されたテンプレート候補 */
  candidate: TemplateLineCandidate;
  /** 選択された行に対応するメタ情報 */
  lineMeta: TemplateLineMeta;
  /** 選択された語彙プロファイル */
  profile: LineVocabularyProfile;
  /** テンプレートへ差し込まれた語彙 */
  selectedTerms: SelectedLineTerms;
  /** ユーザーへ表示する描画済みの予言文 */
  renderedLine: string;
};

/** 入力フォームのフィールド名 */
export type FieldName = keyof ProphecyInput;

/** 入力フィールドごとのバリデーションエラーメッセージ */
export type ValidationErrors = Partial<Record<FieldName, string>>;

/** 入力全体のバリデーション結果 */
export type ValidationResult = {
  /** すべての入力が生成可能な状態かどうか */
  isValid: boolean;
  /** フィールドごとのエラーメッセージ */
  errors: ValidationErrors;
};

/** AI用プロンプトのコピー操作状態を識別する値 */
export type CopyStatusState = "idle" | "success" | "error";

/** コピー操作前、または通知を出していない状態 */
export type CopyIdleStatus = {
  /** コピー操作状態の識別値 */
  state: "idle";
};

/** コピーに成功し、成功メッセージを表示できる状態 */
export type CopySuccessStatus = {
  /** コピー操作状態の識別値 */
  state: "success";
  /** ユーザーへ表示する成功メッセージ */
  message: string;
};

/** コピーに失敗し、失敗メッセージを表示できる状態 */
export type CopyErrorStatus = {
  /** コピー操作状態の識別値 */
  state: "error";
  /** ユーザーへ表示する失敗メッセージ */
  message: string;
};

/** AI用プロンプトのコピー操作状態 */
export type CopyStatus = CopyIdleStatus | CopySuccessStatus | CopyErrorStatus;
