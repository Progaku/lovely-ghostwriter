import { useMemo, useState } from "react";
import { Alert, CssBaseline, Paper, ThemeProvider, Typography } from "@mui/material";
import { ProphecyForm, validateInput } from "../features";
import type { ValidatableProphecyInput } from "../features";
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
  const validation = useMemo(() => validateInput(input), [input]);

  function handleGenerate(): void {
    return undefined;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="min-h-screen bg-stone-900 px-4 py-10 text-stone-900">
        <Paper
          component="section"
          elevation={8}
          className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10"
        >
          <header className="space-y-2 text-center">
            <Typography component="h1" variant="h3">
              ラブリーゴーストライター風 予言紙
            </Typography>
            <Typography component="p" variant="body1">
              一ヶ月の気配を、四週の言葉に映します。
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
        </Paper>
      </main>
    </ThemeProvider>
  );
}
