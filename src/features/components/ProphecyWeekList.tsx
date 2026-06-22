import { Typography } from "@mui/material";
import type { ProphecyWeek } from "../types";

/** 4週分の予言リストに渡す表示データ */
export type ProphecyWeekListProps = {
  /** 第1週から第4週までの予言行 */
  weeks: readonly ProphecyWeek[];
};

/** 週番号を見出しに分けて4週分の予言を表示する */
export function ProphecyWeekList({ weeks }: ProphecyWeekListProps) {
  const orderedWeeks = [...weeks].sort((firstWeek, secondWeek) => firstWeek.weekNumber - secondWeek.weekNumber);

  return (
    <ol className="min-w-0 space-y-4" aria-label="4週分の予言">
      {orderedWeeks.map((week) => (
        <li key={week.weekNumber} className="min-w-0 space-y-3">
          <article className="min-w-0 border-l-2 border-[#8a6f43] pl-4">
            <Typography
              component="p"
              variant="body1"
              className="whitespace-pre-wrap break-words font-mono leading-8 text-stone-800 [overflow-wrap:anywhere]"
            >
              {week.line}
            </Typography>
          </article>
        </li>
      ))}
    </ol>
  );
}
