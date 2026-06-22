import { useMemo, useState } from "react";
import { Alert, CssBaseline, Paper, Snackbar, ThemeProvider, Typography } from "@mui/material";
import { ProphecyResult } from "../features/components/ProphecyResult";
import { genderOptions, generateProphecy, ProphecyForm, validateInput } from "../features";
import type {
  CopyStatus,
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
  const [copyStatus, setCopyStatus] = useState<CopyStatus>({ state: "idle" });
  const validation = useMemo(() => validateInput(input), [input]);

  function handleGenerate(): void {
    if (!validation.isValid || input.birthDate == null) {
      return;
    }

    const nextRandomSalt = randomSalt + 1;
    setRandomSalt(nextRandomSalt);
    setResult(generateProphecy(toProphecyInput(input), nextRandomSalt));
  }

  /** 生成済みAI用プロンプトをクリップボードへコピーする */
  async function handleCopyAiPrompt(): Promise<void> {
    if (result == null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.aiPrompt);
      setCopyStatus({ state: "success", message: "AI用プロンプトをコピーしました" });
    } catch {
      setCopyStatus({
        state: "error",
        message: "コピーできませんでした。本文を選択して手動でコピーしてください",
      });
    }
  }

  function handleRegenerate(): void {
    handleGenerate();
  }

  /** コピー結果の一時通知を閉じる */
  function handleCopySnackbarClose(): void {
    setCopyStatus({ state: "idle" });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="min-h-screen overflow-x-hidden bg-[#211d1a] bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:38px_38px] px-3 py-5 text-stone-900 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <Paper
          component="section"
          elevation={8}
          className="mx-auto w-full max-w-[calc(100vw-1.5rem)] overflow-hidden border border-[#c4b890] bg-[#f4ead2] shadow-2xl sm:max-w-6xl"
        >
          <div className="min-w-0 space-y-6 p-5 sm:p-8 lg:p-10">
            <header className="mx-auto min-w-0 max-w-3xl space-y-3 text-center">
              <Typography component="h1" variant="h3" className="break-words [overflow-wrap:anywhere]">
                <span className="block sm:inline">ラブリー</span>
                <span className="block sm:inline">ゴーストライター</span>
              </Typography>
              <Typography component="p" variant="body1" className="text-stone-700">
                一ヶ月の気配を四行詩に映します。
              </Typography>
            </header>

            <Alert severity="info" className="mx-auto w-full max-w-3xl">
              本アプリは非公式ファン作品です。娯楽用途として楽しみ、重要な判断には使用しないでください。
            </Alert>

            <div
              className={
                result == null
                  ? "mx-auto max-w-3xl"
                  : "grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start"
              }
            >
              <div className="min-w-0">
                <ProphecyForm
                  value={input}
                  errors={validation.errors}
                  canGenerate={validation.isValid}
                  onChange={setInput}
                  onGenerate={handleGenerate}
                />
              </div>

              {result != null ? (
                <div className="min-w-0">
                  <ProphecyResult
                    result={result}
                    copyStatus={copyStatus}
                    onCopy={handleCopyAiPrompt}
                    onRegenerate={handleRegenerate}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </Paper>

        <Snackbar
          open={copyStatus.state !== "idle"}
          autoHideDuration={4000}
          message={copyStatus.state === "idle" ? undefined : copyStatus.message}
          onClose={handleCopySnackbarClose}
        />
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
