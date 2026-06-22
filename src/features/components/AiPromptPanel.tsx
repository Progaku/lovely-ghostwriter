import { Alert, Button, TextField, Typography } from "@mui/material";
import type { CopyStatus } from "../types";

/** AI用プロンプト表示とコピー操作に必要な値と通知 */
export type AiPromptPanelProps = {
  /** 任意の生成AIへ貼り付けるためのプロンプト本文 */
  aiPrompt: string;
  /** コピー処理の結果表示状態 */
  copyStatus: CopyStatus;
  /** コピーボタンが押されたときの通知 */
  onCopy: () => void;
};

/** AI用プロンプトを選択可能な本文として表示し、コピー操作を提供する */
export function AiPromptPanel({ aiPrompt, copyStatus, onCopy }: AiPromptPanelProps) {
  const hasCopyError = copyStatus.state === "error";

  return (
    <section className="space-y-4" aria-labelledby="ai-prompt-heading">
      <div className="space-y-1">
        <Typography id="ai-prompt-heading" component="h3" variant="h5">
          AI用プロンプト
        </Typography>
        <Typography component="p" variant="body2" className="break-words text-stone-700">
          任意の生成AIに貼り付けるための本文です。
        </Typography>
      </div>

      {hasCopyError ? (
        <Alert severity="warning">
          コピーできませんでした。本文を選択して手動でコピーしてください。
        </Alert>
      ) : null}

      <TextField
        label="AI用プロンプト本文"
        value={aiPrompt}
        fullWidth
        multiline
        minRows={8}
        maxRows={14}
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
      />

      <div className="flex justify-end">
        <Button type="button" variant="contained" size="large" onClick={onCopy}>
          AI用プロンプトをコピーする
        </Button>
      </div>
    </section>
  );
}
