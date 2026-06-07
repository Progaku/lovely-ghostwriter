import { describe, expect, it } from "vitest";
import { moodSuggestions, validateInput } from "../index";
import type { ProphecyInput } from "../types";

/** テストで使う有効な入力値 */
const validInput: ProphecyInput = {
  name: "ミナ",
  birthDate: new Date(1995, 3, 12),
  gender: "女性",
  theme: "仕事の進め方",
  mood: "落ち着いている",
};

describe("validateInput", () => {
  it("必須項目がすべて入力されていれば成功する", () => {
    expect(validateInput(validInput)).toEqual({
      isValid: true,
      errors: {},
    });
  });

  it("空白のみの必須項目を未入力扱いにする", () => {
    const result = validateInput({
      ...validInput,
      name: "   ",
      birthDate: null,
      theme: "\n\t",
      mood: "　",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      name: "名前を入力してください",
      birthDate: "生年月日を入力してください",
      theme: "相談テーマを入力してください",
      mood: "今月の気分を入力してください",
    });
  });

  it("上限を超える入力をエラーにする", () => {
    const result = validateInput({
      ...validInput,
      name: "名".repeat(51),
      theme: "悩".repeat(256),
      mood: "気".repeat(256),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      name: "50文字以内で入力してください",
      theme: "255文字以内で入力してください",
      mood: "255文字以内で入力してください",
    });
  });

  it("未来日の生年月日をエラーにする", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, "0"),
      String(tomorrow.getDate()).padStart(2, "0"),
    ].join("-");

    const result = validateInput({
      ...validInput,
      birthDate: new Date(`${futureDate}T00:00:00+09:00`),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.birthDate).toBe("正しい日付を入力してください");
  });

  it("不正な性別をエラーにする", () => {
    const result = validateInput({
      ...validInput,
      gender: "未回答",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.gender).toBe("性別の選択値が正しくありません");
  });

  it("性別が未入力をエラーにする", () => {
    const result = validateInput({
      ...validInput,
      gender: undefined,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.gender).toBe("性別の選択値が正しくありません");
  });
});

describe("moodSuggestions", () => {
  it("詳細設計で決定した気分候補を持つ", () => {
    expect(moodSuggestions).toEqual([
      "少し不安がある",
      "落ち着いている",
      "迷いがある",
      "前に進みたい",
      "疲れ気味",
      "静かに整えたい",
      "期待と不安が混ざっている",
      "区切りをつけたい",
    ]);
  });
});
