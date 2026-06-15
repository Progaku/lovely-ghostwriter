import { describe, expect, it } from "vitest";
import { createRandom, generateSeed } from "../index";
import type { ProphecyInput } from "../types";

/** テストで使う有効な入力値 */
const baseInput: ProphecyInput = {
  name: "ミナ",
  birthDate: new Date(1995, 3, 12),
  gender: "女性",
  theme: "仕事の進め方",
  mood: "落ち着いている",
};

/** 指定した乱数関数から検証用の数列を取り出す */
function takeRandomValues(random: () => number): number[] {
  return [random(), random(), random(), random(), random()];
}

describe("generateSeed", () => {
  it("同じ入力では同じseedを生成する", () => {
    expect(generateSeed(baseInput)).toBe(generateSeed({ ...baseInput }));
  });

  it("trim後の入力値をseedに反映する", () => {
    const paddedInput: ProphecyInput = {
      ...baseInput,
      name: "  ミナ  ",
      theme: "\n仕事の進め方\t",
      mood: "　落ち着いている　",
    };

    expect(generateSeed(paddedInput)).toBe(generateSeed(baseInput));
  });

  it("入力が変わるとseedが変わり得る", () => {
    const changedInput: ProphecyInput = {
      ...baseInput,
      theme: "人間関係の距離感",
    };

    expect(generateSeed(changedInput)).not.toBe(generateSeed(baseInput));
  });
});

describe("createRandom", () => {
  it("同じseedとsaltでは同じ乱数列を返す", () => {
    const seed = generateSeed(baseInput);

    expect(takeRandomValues(createRandom(seed, 2))).toEqual(takeRandomValues(createRandom(seed, 2)));
  });

  it("randomSaltが変わると乱数列が変わり得る", () => {
    const seed = generateSeed(baseInput);

    expect(takeRandomValues(createRandom(seed, 1))).not.toEqual(takeRandomValues(createRandom(seed, 2)));
  });

  it("0以上1未満の値を返す", () => {
    const values = takeRandomValues(createRandom(generateSeed(baseInput), 0));

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});
