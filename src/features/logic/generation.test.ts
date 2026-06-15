import { describe, expect, it } from "vitest";

import { templateLineCatalog } from "../constants/templateLines";
import { createRandom, generateSeed } from "./random";
import { generateProphecy, renderTemplateLine, selectNextCandidate } from "./generation";
import type { ProphecyInput, TemplateLineCandidate } from "../types";

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
