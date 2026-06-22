import { Button, Divider, Typography } from "@mui/material";
import type { ProphecyResult as ProphecyResultData } from "../types";
import { ProphecyWeekList } from "./ProphecyWeekList";

/** 予言結果表示に渡す生成結果と操作 */
export type ProphecyResultProps = {
  /** 生成済みの4週分の予言結果 */
  result: ProphecyResultData;
  /** 再生成ボタンが押されたときの通知 */
  onRegenerate: () => void;
};

/** 生成後の予言紙面と再生成操作を表示する */
export function ProphecyResult({ result, onRegenerate }: ProphecyResultProps) {
  return (
    <section
      className="space-y-6 rounded-md border border-stone-300 bg-stone-50/80 p-5 shadow-inner sm:p-6"
      aria-labelledby="prophecy-result-heading"
    >
      <div className="space-y-2">
        <Typography id="prophecy-result-heading" component="h2" variant="h4">
          四行詩
        </Typography>
        <Typography component="p" variant="body2" className="break-words text-stone-700">
          紙面に落ちた言葉は、週ごとの見出しとして読み進めてください。
        </Typography>
      </div>

      <Divider />

      <ProphecyWeekList weeks={result.weeks} />

      <div className="flex justify-end pt-2">
        <Button type="button" variant="outlined" size="large" onClick={onRegenerate}>
          再生成する
        </Button>
      </div>
    </section>
  );
}
