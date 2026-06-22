import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("初期画面にタイトルと注意書きを表示する", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "ラブリーゴーストライター風 予言紙" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/非公式ファン作品です/)).toBeInTheDocument();
    expect(screen.getByText(/重要な判断には使用しないでください/)).toBeInTheDocument();
  });

  it("生成前は結果領域を表示せず、生成後に4週分と再生成ボタンを表示する", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole("heading", { name: "四週の予言" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/名前/), "ミナ");
    await user.type(screen.getByLabelText(/生年月日/), "1995-04-12");
    await user.type(screen.getByLabelText(/相談テーマ/), "仕事の進め方");
    await user.type(screen.getByLabelText(/今月の気分/), "落ち着いている");
    await user.click(screen.getByRole("button", { name: "予言を生成する" }));

    expect(screen.getByRole("heading", { name: "四週の予言" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "第1週" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "第2週" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "第3週" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "第4週" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再生成する" })).toBeInTheDocument();
  });
});
