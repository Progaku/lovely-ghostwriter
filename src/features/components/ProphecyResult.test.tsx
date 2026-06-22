import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProphecyResult } from "./ProphecyResult";
import type { ProphecyResultProps } from "./ProphecyResult";

/** 表示テスト用の4週分の生成結果 */
const result = {
  weeks: [
    {
      weekNumber: 1,
      line: "閉じた窓辺で、古い鍵が静かに向きを変える",
      candidateId: "L1-01",
      profileId: "VP01",
      selectedTerms: {},
    },
    {
      weekNumber: 2,
      line: "机の端に残る印が、急がない順番を知らせる",
      candidateId: "L2-01",
      profileId: "VP01",
      selectedTerms: {},
    },
    {
      weekNumber: 3,
      line: "薄い紙の裏で、迷いは小さな灯へ折り返す",
      candidateId: "L3-01",
      profileId: "VP01",
      selectedTerms: {},
    },
    {
      weekNumber: 4,
      line: "最後の引き出しには、次の一歩だけが残される",
      candidateId: "L4-01",
      profileId: "VP01",
      selectedTerms: {},
    },
  ],
  interpretationAxis: "静かな順番として読む",
  aiPrompt: "AI用プロンプト",
} satisfies ProphecyResultProps["result"];

/** ProphecyResultを既定propsで描画する */
function renderProphecyResult(props?: Partial<ProphecyResultProps>) {
  const defaultProps: ProphecyResultProps = {
    result,
    onRegenerate: vi.fn(),
  };
  const mergedProps = {
    ...defaultProps,
    ...props,
  };

  render(<ProphecyResult {...mergedProps} />);

  return mergedProps;
}

afterEach(() => {
  cleanup();
});

describe("ProphecyResult", () => {
  it("4週分の予言本文と再生成ボタンを表示する", () => {
    renderProphecyResult();

    expect(screen.getByRole("heading", { name: "四行詩" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "4週分の予言" })).toBeInTheDocument();
    expect(screen.getByText("閉じた窓辺で、古い鍵が静かに向きを変える")).toBeInTheDocument();
    expect(screen.getByText("机の端に残る印が、急がない順番を知らせる")).toBeInTheDocument();
    expect(screen.getByText("薄い紙の裏で、迷いは小さな灯へ折り返す")).toBeInTheDocument();
    expect(screen.getByText("最後の引き出しには、次の一歩だけが残される")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再生成する" })).toBeInTheDocument();
  });

  it("再生成ボタンのクリックを親へ通知する", async () => {
    const user = userEvent.setup();
    const props = renderProphecyResult();

    await user.click(screen.getByRole("button", { name: "再生成する" }));

    expect(props.onRegenerate).toHaveBeenCalledTimes(1);
  });
});
