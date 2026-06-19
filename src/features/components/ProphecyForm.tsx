import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { genderOptions, inputMaxLengths, moodSuggestions } from "../constants/input";
import type { Gender, ValidationErrors } from "../types";
import type { ValidatableProphecyInput } from "../logic/validation";
import { MoodSuggestions } from "./MoodSuggestions";

/** 予言入力フォームに渡す表示値と操作イベント */
export type ProphecyFormProps = {
  /** フォームに表示する入力値 */
  value: ValidatableProphecyInput;
  /** フィールドごとのバリデーションエラー */
  errors: ValidationErrors;
  /** 生成操作が可能かどうか */
  canGenerate: boolean;
  /** 入力値が変更されたときの通知 */
  onChange: (nextValue: ValidatableProphecyInput) => void;
  /** 生成ボタンが押されたときの通知 */
  onGenerate: () => void;
};

/** 予言生成前に必要なユーザー入力を受け取るフォーム */
export function ProphecyForm({
  value,
  errors,
  canGenerate,
  onChange,
  onGenerate,
}: ProphecyFormProps) {
  const birthDateValue = formatDateInputValue(value.birthDate);

  /** 文字列フィールドの変更を親へ伝える */
  function handleTextChange(fieldName: "name" | "theme" | "mood", nextValue: string): void {
    onChange({
      ...value,
      [fieldName]: nextValue,
    });
  }

  /** 生年月日入力の文字列をDateへ変換して親へ伝える */
  function handleBirthDateChange(nextValue: string): void {
    onChange({
      ...value,
      birthDate: parseDateInputValue(nextValue),
    });
  }

  /** 性別選択を任意入力として親へ伝える */
  function handleGenderChange(event: SelectChangeEvent<string>): void {
    const nextGender = event.target.value;
    onChange({
      ...value,
      gender: nextGender === "" ? undefined : (nextGender as Gender),
    });
  }

  /** 気分候補を自由入力欄へ反映する */
  function handleMoodSuggestionSelect(nextMood: string): void {
    onChange({
      ...value,
      mood: nextMood,
    });
  }

  /** 生成ボタンのクリックを親へ通知する */
  function handleGenerateClick(): void {
    if (canGenerate) {
      onGenerate();
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="名前"
          value={value.name}
          onChange={(event) => handleTextChange("name", event.target.value)}
          error={errors.name != null}
          helperText={errors.name ?? `${inputMaxLengths.name}文字以内で入力してください`}
          slotProps={{ htmlInput: { maxLength: inputMaxLengths.name } }}
          required
          fullWidth
        />

        <TextField
          label="生年月日"
          type="date"
          value={birthDateValue}
          onChange={(event) => handleBirthDateChange(event.target.value)}
          error={errors.birthDate != null}
          helperText={errors.birthDate ?? "未来日は入力できません"}
          slotProps={{ inputLabel: { shrink: true } }}
          required
          fullWidth
        />
      </div>

      <FormControl fullWidth error={errors.gender != null}>
        <InputLabel id="prophecy-gender-label">性別</InputLabel>
        <Select
          labelId="prophecy-gender-label"
          id="prophecy-gender"
          label="性別"
          value={value.gender ?? ""}
          onChange={handleGenderChange}
        >
          <MenuItem value="">未選択</MenuItem>
          {genderOptions.map((genderOption) => (
            <MenuItem key={genderOption} value={genderOption}>
              {genderOption}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{errors.gender ?? "任意項目です"}</FormHelperText>
      </FormControl>

      <TextField
        label="相談テーマ"
        value={value.theme}
        onChange={(event) => handleTextChange("theme", event.target.value)}
        error={errors.theme != null}
        helperText={errors.theme ?? `${inputMaxLengths.theme}文字以内で入力してください`}
        slotProps={{ htmlInput: { maxLength: inputMaxLengths.theme } }}
        required
        fullWidth
        multiline
        minRows={3}
      />

      <div className="space-y-3">
        <TextField
          label="今月の気分"
          value={value.mood}
          onChange={(event) => handleTextChange("mood", event.target.value)}
          error={errors.mood != null}
          helperText={errors.mood ?? `${inputMaxLengths.mood}文字以内で入力してください`}
          slotProps={{ htmlInput: { maxLength: inputMaxLengths.mood } }}
          required
          fullWidth
          multiline
          minRows={2}
        />

        <MoodSuggestions
          suggestions={moodSuggestions}
          selectedMood={value.mood}
          onSelect={handleMoodSuggestionSelect}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="contained"
          size="large"
          disabled={!canGenerate}
          onClick={handleGenerateClick}
        >
          予言を生成する
        </Button>
      </div>
    </div>
  );
}

/** Dateをdate inputで表示できるYYYY-MM-DDへ変換する */
function formatDateInputValue(birthDate?: Date | null): string {
  if (birthDate == null || Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const year = birthDate.getFullYear();
  const month = String(birthDate.getMonth() + 1).padStart(2, "0");
  const day = String(birthDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** date inputの値をローカル日付のDateへ変換する */
function parseDateInputValue(value: string): Date | null {
  if (value === "") {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
