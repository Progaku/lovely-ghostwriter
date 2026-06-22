import { useMemo, useState } from "react";
import { Alert, CssBaseline, Paper, ThemeProvider, Typography } from "@mui/material";
import { ProphecyResult } from "../features/components/ProphecyResult";
import { genderOptions, generateProphecy, ProphecyForm, validateInput } from "../features";
import type {
  Gender,
  ProphecyInput,
  ProphecyResult as ProphecyResultData,
  ValidatableProphecyInput,
} from "../features";
import { theme } from "./theme";

/** 初期表示時の空フォーム値 */
const initialInput: ValidatableProphecyInput = {
  name: "",
  birthDate: null,
  gender: undefined,
  theme: "",
  mood: "",
};

/** アプリ全体の画面と入力状態を管理する */
export function App() {
  const [input, setInput] = useState<ValidatableProphecyInput>(initialInput);
  const [result, setResult] = useState<ProphecyResultData | null>(null);
  const [randomSalt, setRandomSalt] = useState(0);
  const validation = useMemo(() => validateInput(input), [input]);

  function handleGenerate(): void {
    if (!validation.isValid || input.birthDate == null) {
      return;
    }

    const nextRandomSalt = randomSalt + 1;
    setRandomSalt(nextRandomSalt);
    setResult(generateProphecy(toProphecyInput(input), nextRandomSalt));
  }

  function handleRegenerate(): void {
    handleGenerate();
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="min-h-screen bg-stone-900 px-4 py-10 text-stone-900">
        <Paper component="section" elevation={8} className="mx-auto max-w-4xl space-y-8 p-6 sm:p-10">
          <header className="space-y-2 text-center">
            <Typography component="h1" variant="h3">
              ラブリーゴーストライター
            </Typography>
            <Typography component="p" variant="body1">
              一ヶ月の気配を四行詩に映します。
            </Typography>
          </header>

          <Alert severity="info">
            本アプリは非公式ファン作品です。娯楽用途として楽しみ、重要な判断には使用しないでください。
          </Alert>

          <ProphecyForm
            value={input}
            errors={validation.errors}
            canGenerate={validation.isValid}
            onChange={setInput}
            onGenerate={handleGenerate}
          />

          {result != null ? <ProphecyResult result={result} onRegenerate={handleRegenerate} /> : null}
        </Paper>
      </main>
    </ThemeProvider>
  );
}

/** 検証済みフォーム値を生成ロジック用の入力へ変換する */
function toProphecyInput(input: ValidatableProphecyInput): ProphecyInput {
  return {
    name: input.name,
    birthDate: input.birthDate ?? new Date(),
    gender: toGender(input.gender),
    theme: input.theme,
    mood: input.mood,
  };
}

/** UI由来の任意文字列を許可済みの性別だけに絞り込む */
function toGender(gender?: string): Gender | undefined {
  return genderOptions.find((genderOption) => genderOption === gender);
}
