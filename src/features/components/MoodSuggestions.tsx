import { Chip, Tooltip, Typography } from "@mui/material";

/** 今月の気分候補を表示するコンポーネントのprops */
export type MoodSuggestionsProps = {
  /** 表示する気分候補の一覧 */
  suggestions: readonly string[];
  /** 現在入力欄に入っている気分 */
  selectedMood: string;
  /** 候補が選択されたときの通知 */
  onSelect: (suggestion: string) => void;
};

/** 今月の気分入力を補助する候補チップ群 */
export function MoodSuggestions({
  suggestions,
  selectedMood,
  onSelect,
}: MoodSuggestionsProps) {
  return (
    <div className="min-w-0 space-y-2" aria-labelledby="mood-suggestions-label">
      <Typography id="mood-suggestions-label" component="p" variant="body2">
        気分候補
      </Typography>
      <div className="flex min-w-0 flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const isSelected = selectedMood === suggestion;

          return (
            <Tooltip key={suggestion} title={`今月の気分に「${suggestion}」を入れる`} describeChild>
              <Chip
                label={suggestion}
                onClick={() => onSelect(suggestion)}
                variant={isSelected ? "filled" : "outlined"}
                color={isSelected ? "primary" : "default"}
                className="max-w-full"
              />
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
