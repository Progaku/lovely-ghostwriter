import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateProphecy } from "../features";
import { App } from "./App";

vi.mock("../features", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features")>();

  return {
    ...actual,
    generateProphecy: vi.fn(actual.generateProphecy),
  };
});

/** Clipboard APIをテスト用のmockへ差し替える */
function mockClipboard(writeText: ReturnType<typeof vi.fn>): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText,
    },
  });
}

/** 必須項目を入力して予言結果を表示する */
async function generateResult(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText(/名前/), "ミナ");
  await user.type(screen.getByLabelText(/生年月日/), "1995-04-12");
  await user.type(screen.getByLabelText(/相談テーマ/), "仕事の進め方");
  await user.type(screen.getByLabelText(/今月の気分/), "落ち着いている");
  await user.click(screen.getByRole("button", { name: "予言を生成する" }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("App", () => {
  it("初期画面にタイトルと注意書きを表示する", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "ラブリーゴーストライター" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/非公式ファン作品です/)).toBeInTheDocument();
    expect(screen.getByText(/重要な判断には使用しないでください/)).toBeInTheDocument();
  });

  it("不正入力時は生成ボタンを押せず、生成処理を呼び出さない", () => {
    render(<App />);

    const generateButton = screen.getByRole("button", { name: "予言を生成する" });

    expect(generateButton).toBeDisabled();
    expect(generateProphecy).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "四行詩" })).not.toBeInTheDocument();
  });

  it("生成前は結果領域を表示せず、生成後に4週分と再生成ボタンを表示する", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole("heading", { name: "四行詩" })).not.toBeInTheDocument();

    await generateResult(user);

    expect(screen.getByRole("heading", { name: "四行詩" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "4週分の予言" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "AI用プロンプト本文" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再生成する" })).toBeInTheDocument();
  });

  it("再生成時にrandomSaltを更新して生成し直す", async () => {
    const user = userEvent.setup();
    render(<App />);

    await generateResult(user);
    await user.click(screen.getByRole("button", { name: "再生成する" }));

    expect(generateProphecy).toHaveBeenCalledTimes(2);
    expect(generateProphecy).toHaveBeenNthCalledWith(1, expect.any(Object), 1);
    expect(generateProphecy).toHaveBeenNthCalledWith(2, expect.any(Object), 2);
  });

  it("AI用プロンプトのコピー成功時に成功表示を出す", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<App />);

    await generateResult(user);
    await user.click(screen.getByRole("button", { name: "AI用プロンプトをコピーする" }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("【ユーザー入力】"));
    expect(await screen.findByText("AI用プロンプトをコピーしました")).toBeInTheDocument();
  });

  it("AI用プロンプトのコピー失敗時に結果と手動コピー可能な本文を残す", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));
    mockClipboard(writeText);
    render(<App />);

    await generateResult(user);
    await user.click(screen.getByRole("button", { name: "AI用プロンプトをコピーする" }));

    expect(await screen.findAllByText("コピーできませんでした。本文を選択して手動でコピーしてください")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "四行詩" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "4週分の予言" })).toBeInTheDocument();
    expect(
      (screen.getByRole("textbox", { name: "AI用プロンプト本文" }) as HTMLTextAreaElement)
        .value,
    ).toContain("【四行詩】");
  });
});
