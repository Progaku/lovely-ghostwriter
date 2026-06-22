import { genderOptions, inputMaxLengths } from "../constants/input";
import type { ProphecyInput, ValidationErrors, ValidationResult } from "../types";

/** バリデーション対象として受け取るフォーム入力 */
export type ValidatableProphecyInput = Omit<ProphecyInput, "birthDate" | "gender"> & {
  /** 未選択またはDate Calendarから渡された生年月日 */
  birthDate?: Date | null;
  /** 未選択またはUIから渡された性別値 */
  gender?: string;
};

/** 予言生成フォームの入力値を検証する */
export function validateInput(input: ValidatableProphecyInput): ValidationResult {
  const errors: ValidationErrors = {};
  const nameError = validateRequiredText(input.name, {
    requiredMessage: "名前を入力してください",
    maxLength: inputMaxLengths.name,
    maxLengthMessage: "50文字以内で入力してください",
  });
  if (nameError != null) {
    errors.name = nameError;
  }

  const birthDateError = validateBirthDate(input.birthDate);
  if (birthDateError != null) {
    errors.birthDate = birthDateError;
  }

  const genderError = validateGender(input.gender);
  if (genderError != null) {
    errors.gender = genderError;
  }

  const themeError = validateRequiredText(input.theme, {
    requiredMessage: "相談テーマを入力してください",
    maxLength: inputMaxLengths.theme,
    maxLengthMessage: "255文字以内で入力してください",
  });
  if (themeError != null) {
    errors.theme = themeError;
  }

  const moodError = validateRequiredText(input.mood, {
    requiredMessage: "今月の気分を入力してください",
    maxLength: inputMaxLengths.mood,
    maxLengthMessage: "255文字以内で入力してください",
  });
  if (moodError != null) {
    errors.mood = moodError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/** 必須文字列の空白のみと最大文字数を検証する */
function validateRequiredText(
  value: string,
  options: {
    /** 未入力時に返すメッセージ */
    requiredMessage: string;
    /** 許容する最大文字数 */
    maxLength: number;
    /** 最大文字数を超えたときに返すメッセージ */
    maxLengthMessage: string;
  },
): string | undefined {
  if (value.trim().length === 0) {
    return options.requiredMessage;
  }

  if (value.length > options.maxLength) {
    return options.maxLengthMessage;
  }

  return undefined;
}

/** 生年月日の未入力と未来日を検証する */
function validateBirthDate(birthDate?: Date | null): string | undefined {
  if (birthDate == null) {
    return "生年月日を入力してください";
  }

  if (Number.isNaN(birthDate.getTime())) {
    return "正しい日付を入力してください";
  }

  if (birthDate.getTime() >= getTodayInJst().getTime()) {
    return "未来日は選択できません";
  }

  return undefined;
}

/** 性別が許可された選択値かどうかを検証する */
function validateGender(gender?: string): string | undefined {
  if (gender == null || gender === "") {
    return undefined;
  }

  if (!genderOptions.some((genderOption) => genderOption === gender)) {
    return "性別の選択値が正しくありません";
  }

  return undefined;
}

/** 日本時間での今日をDateで返す */
function getTodayInJst(): Date {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
}
