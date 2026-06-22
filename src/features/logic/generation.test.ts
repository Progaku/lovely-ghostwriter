import { describe, expect, it } from "vitest";

import { lineMetaByKey, templateLineCatalog } from "../constants/templateLines";
import { vocabularyProfiles } from "../constants/vocabulary";
import { createRandom, generateSeed } from "./random";
import {
  buildAiPrompt,
  buildInterpretationAxis,
  generateProphecy,
  renderTemplateLine,
  selectNextCandidate,
} from "./generation";
import type { ProphecyInput, ProphecyWeek, SelectedLine, TemplateLineCandidate } from "../types";

/** テストで使う有効な入力値 */
const baseInput: ProphecyInput = {
  name: "ミナ",
  birthDate: new Date(1995, 3, 12),
  gender: "女性",
  theme: "仕事の進め方",
  mood: "落ち着いている",
};

describe("generateProphecy", () => {
  it("常に4週分を週番号順に生成する", () => {
    const result = generateProphecy(baseInput, 0);

    expect(result.weeks).toHaveLength(4);
    expect(result.weeks.map((week) => week.weekNumber)).toEqual([1, 2, 3, 4]);
  });

  it("各週の本文を1行にし、候補ID、profileId、選択語彙を入れる", () => {
    const result = generateProphecy(baseInput, 1);

    for (const week of result.weeks) {
      expect(week.line).not.toMatch(/[\r\n]/);
      expect(week.line.length).toBeGreaterThan(0);
      expect(week.candidateId).toMatch(/^T\d{2}-L[1-4]-A$/);
      expect(week.profileId).toMatch(/^VP\d{2}$/);
      expect(week.selectedTerms).toEqual(
        expect.objectContaining({
          symbol: expect.any(String),
          place: expect.any(String),
          object: expect.any(String),
          action: expect.any(String),
        }),
      );
    }
  });

  it("同じ入力とsaltでは同じ結果を返す", () => {
    expect(generateProphecy(baseInput, 3)).toEqual(generateProphecy({ ...baseInput }, 3));
  });

  it("解釈軸とAI用プロンプトを生成結果へ含める", () => {
    const result = generateProphecy(baseInput, 0);

    expect(result.aiPrompt).toContain("【ユーザー入力】");
    expect(result.aiPrompt).toContain("【四行詩】");
    expect(result.aiPrompt).toContain("【四行詩の解釈軸】");
  });
});

describe("buildInterpretationAxis", () => {
  it("実際に選ばれた候補、profile、語彙だけを根拠に解釈軸を作る", () => {
    const selectedLine = createSelectedLine({
      candidateId: "T01-L1-A",
      profileId: "VP01",
      selectedTerms: {
        symbol: "紙",
        place: "机の端",
        object: "万年筆",
        action: "書き留める",
      },
    });

    const interpretationAxis = buildInterpretationAxis([selectedLine], baseInput);

    expect(interpretationAxis).toContain("「紙」はまだ書き換えられる記録");
    expect(interpretationAxis).toContain("「机の端」は手元で扱える範囲");
    expect(interpretationAxis).toContain("「万年筆」は言葉を残す道具");
    expect(interpretationAxis).toContain("「書き留める」を短くメモする");
    expect(interpretationAxis).not.toContain("「月」は感情の周期と揺れ");
    expect(interpretationAxis).not.toContain("成功失敗を断定する");
  });
});

describe("buildAiPrompt", () => {
  it("必須セクション、ユーザー入力、4週分予言、出力形式を含める", () => {
    const weeks = createPromptWeeks();
    const aiPrompt = buildAiPrompt(baseInput, weeks, "第1週は、導入として読む");

    expect(aiPrompt).toContain("【ユーザー入力】");
    expect(aiPrompt).toContain("名前: ミナ");
    expect(aiPrompt).toContain("生年月日: 1995-04-12");
    expect(aiPrompt).toContain("性別: 女性");
    expect(aiPrompt).toContain("相談テーマ: 仕事の進め方");
    expect(aiPrompt).toContain("今月の気分: 落ち着いている");
    expect(aiPrompt).toContain("【四行詩】");
    for (const week of weeks) {
      expect(aiPrompt).toContain(`第${week.weekNumber}週: ${week.line}`);
    }
    expect(aiPrompt).toContain("【四行詩の解釈軸】");
    expect(aiPrompt).toContain("【出力形式】");
    expect(aiPrompt).toContain("1. 四行詩から読める今月の流れ");
    expect(aiPrompt).toContain("4. 注意したい思い込み");
  });

  it("性別未入力時は未入力と表示し、安全制約文言を含める", () => {
    const aiPrompt = buildAiPrompt(
      {
        ...baseInput,
        gender: undefined,
      },
      createPromptWeeks(),
      "第1週は、導入として読む",
    );

    expect(aiPrompt).toContain("性別: 未入力");
    expect(aiPrompt).toContain("占いや予言として断定せず、解釈の一例として提示する");
    expect(aiPrompt).toContain("医療、法律、金融など専門判断が必要な領域では、専門家への相談を促す");
    expect(aiPrompt).toContain("重要な判断には使わず、必要に応じて信頼できる人や専門家に相談する");
    expect(aiPrompt).toContain("相手の気持ち、未来の出来事、成功失敗を断定しない");
    expect(aiPrompt).not.toContain("相手の気持ちを断定する");
    expect(aiPrompt).not.toContain("未来を断定する");
    expect(aiPrompt).not.toContain("成功失敗を断定する");
  });
});

describe("selectNextCandidate", () => {
  it("nextCandidatesの参照先が切れている場合は同週候補へフォールバックする", () => {
    const brokenPreviousCandidate: TemplateLineCandidate = {
      ...templateLineCatalog.line1[0],
      nextCandidates: [{ lineKey: "line2", candidateId: "missing-candidate" }],
    };
    const random = createRandom(generateSeed(baseInput), 0);

    const selectedCandidate = selectNextCandidate(brokenPreviousCandidate, "line2", baseInput, random);

    expect(selectedCandidate.lineKey).toBe("line2");
    expect(templateLineCatalog.line2.some((candidate) => candidate.candidateId === selectedCandidate.candidateId)).toBe(
      true,
    );
  });

  it("参照切れ時は相談テーマに近い候補へ絞り、無関係な同週候補を選ばない", () => {
    const brokenPreviousCandidate = createCandidate({
      candidateId: "TEST-L1-BROKEN",
      lineKey: "line1",
      profileId: "VP99",
      promptFocus: "存在しない焦点",
      nextCandidates: [{ lineKey: "line2", candidateId: "missing-candidate" }],
    });
    const catalog = createCatalogForLine2([
      createCandidate({
        candidateId: "TEST-L2-UNRELATED",
        lineKey: "line2",
        profileId: "VP06",
        promptFocus: "選ぶ前の条件確認",
      }),
      createCandidate({
        candidateId: "TEST-L2-WORK",
        lineKey: "line2",
        profileId: "VP03",
        promptFocus: "手順とリズム",
      }),
    ]);

    const selectedCandidate = selectNextCandidate(brokenPreviousCandidate, "line2", baseInput, () => 0.99, catalog);

    expect(selectedCandidate.candidateId).toBe("TEST-L2-WORK");
  });

  it("近い候補が見つからない参照切れ時も全候補へ広げない", () => {
    const brokenPreviousCandidate = createCandidate({
      candidateId: "TEST-L1-UNKNOWN",
      lineKey: "line1",
      profileId: "VP99",
      promptFocus: "存在しない焦点",
      nextCandidates: [{ lineKey: "line2", candidateId: "missing-candidate" }],
    });
    const neutralInput: ProphecyInput = {
      ...baseInput,
      theme: "まだ言葉にならないこと",
      mood: "静か",
    };
    const catalog = createCatalogForLine2([
      createCandidate({ candidateId: "TEST-L2-A", lineKey: "line2", profileId: "VP40", promptFocus: "A" }),
      createCandidate({ candidateId: "TEST-L2-B", lineKey: "line2", profileId: "VP41", promptFocus: "B" }),
      createCandidate({ candidateId: "TEST-L2-C", lineKey: "line2", profileId: "VP42", promptFocus: "C" }),
      createCandidate({ candidateId: "TEST-L2-D", lineKey: "line2", profileId: "VP43", promptFocus: "D" }),
      createCandidate({ candidateId: "TEST-L2-E", lineKey: "line2", profileId: "VP44", promptFocus: "E" }),
    ]);

    const selectedCandidate = selectNextCandidate(brokenPreviousCandidate, "line2", neutralInput, () => 0.99, catalog);

    expect(selectedCandidate.candidateId).toBe("TEST-L2-C");
  });
});

describe("renderTemplateLine", () => {
  it("変数を置換し、改行を取り除いて1行化する", () => {
    const candidate: TemplateLineCandidate = {
      candidateId: "TEST-L1-A",
      lineKey: "line1",
      text: "{name}\nの{theme}に{symbol}が残り、{action}",
      profileId: "VP01",
      candidateMeta: {
        reading: "テスト用の読み",
        promptFocus: "テスト用の焦点",
        caution: "断定しない",
      },
    };

    expect(
      renderTemplateLine(
        candidate,
        {
          symbol: "紙",
          action: "見直す",
        },
        baseInput,
      ),
    ).toBe("ミナ の仕事の進め方に紙が残り、見直す");
  });
});

/** テスト用候補を最小限の指定から組み立てる */
function createCandidate(options: {
  /** 候補ID */
  candidateId: string;
  /** 候補が属する行キー */
  lineKey: TemplateLineCandidate["lineKey"];
  /** 語彙プロファイルID */
  profileId: string;
  /** 候補の焦点 */
  promptFocus: string;
  /** 次候補参照 */
  nextCandidates?: TemplateLineCandidate["nextCandidates"];
}): TemplateLineCandidate {
  return {
    candidateId: options.candidateId,
    lineKey: options.lineKey,
    text: "{name}の{theme}に{symbol}が残り、{action}",
    profileId: options.profileId,
    candidateMeta: {
      reading: `${options.promptFocus}を読む`,
      promptFocus: options.promptFocus,
      caution: "断定しない",
    },
    nextCandidates: options.nextCandidates,
  };
}

/** line2の差し替えだけを行うテスト用カタログを作る */
function createCatalogForLine2(line2Candidates: TemplateLineCandidate[]) {
  return {
    ...templateLineCatalog,
    line2: line2Candidates,
  };
}

/** 解釈軸テスト用の選択済み行を作る */
function createSelectedLine(options: {
  /** 候補ID */
  candidateId: string;
  /** 語彙プロファイルID */
  profileId: string;
  /** 実際に選ばれた語彙 */
  selectedTerms: SelectedLine["selectedTerms"];
}): SelectedLine {
  const candidate = templateLineCatalog.line1.find((item) => item.candidateId === options.candidateId);
  const profile = vocabularyProfiles.find((item) => item.profileId === options.profileId);

  if (candidate == null || profile == null) {
    throw new Error("テスト用の候補またはprofileが見つかりません");
  }

  return {
    weekNumber: 1,
    candidate,
    lineMeta: lineMetaByKey.line1,
    profile,
    selectedTerms: options.selectedTerms,
    renderedLine: "ミナの名を、薄いインクがまだ覚えている",
  };
}

/** AI用プロンプトテスト用の4週分予言を作る */
function createPromptWeeks(): ProphecyWeek[] {
  return [
    createPromptWeek(1, "ミナの紙面に短い音が落ちる"),
    createPromptWeek(2, "仕事の進め方は一度だけ行頭へ戻される"),
    createPromptWeek(3, "落ち着いている文字は、静かな記録になる"),
    createPromptWeek(4, "最後の罫線を越える前に、手元の言葉を書き留めるとよい"),
  ];
}

/** AI用プロンプトテスト用の週ごとの予言を作る */
function createPromptWeek(weekNumber: ProphecyWeek["weekNumber"], line: string): ProphecyWeek {
  return {
    weekNumber,
    line,
    candidateId: `TEST-L${weekNumber}-A`,
    profileId: "VP01",
    selectedTerms: {
      symbol: "紙",
      place: "机の端",
      object: "万年筆",
      action: "書き留める",
    },
  };
}
