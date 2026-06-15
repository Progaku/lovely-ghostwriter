import { describe, expect, it } from "vitest";

import { templateLineCatalog } from "./templateLines";
import { vocabularyProfiles } from "./vocabulary";

import type { TemplateLineKey } from "../types";

/** テンプレートカタログで必ず扱う行キー */
const templateLineKeys = ["line1", "line2", "line3", "line4"] as const satisfies readonly TemplateLineKey[];

/** 行キーごとの次行キー */
const nextLineKeyByLineKey = {
  line1: "line2",
  line2: "line3",
  line3: "line4",
  line4: undefined,
} as const satisfies Record<TemplateLineKey, TemplateLineKey | undefined>;

describe("templateLineCatalog", () => {
  it("各lineKeyに選択可能な候補が存在する", () => {
    for (const lineKey of templateLineKeys) {
      expect(templateLineCatalog[lineKey].length).toBeGreaterThan(0);
    }
  });

  it("nextCandidatesの参照先候補IDが存在する", () => {
    const candidateIdsByLineKey = new Map(
      templateLineKeys.map((key) => [key, new Set(templateLineCatalog[key].map((candidate) => candidate.candidateId))]),
    );

    for (const lineKey of templateLineKeys) {
      for (const candidate of templateLineCatalog[lineKey]) {
        const nextCandidates = "nextCandidates" in candidate ? candidate.nextCandidates : [];

        for (const ref of nextCandidates) {
          expect(ref.lineKey).toBe(nextLineKeyByLineKey[lineKey]);
          expect(candidateIdsByLineKey.get(ref.lineKey)?.has(ref.candidateId)).toBe(true);
        }
      }
    }
  });

  it("各候補のprofileIdが語彙プロファイルとして存在する", () => {
    const profileIds = new Set(vocabularyProfiles.map((profile) => profile.profileId));

    for (const lineKey of templateLineKeys) {
      for (const candidate of templateLineCatalog[lineKey]) {
        expect(profileIds.has(candidate.profileId)).toBe(true);
      }
    }
  });
});
