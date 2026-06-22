import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiPromptPanel } from "./AiPromptPanel";
import type { AiPromptPanelProps } from "./AiPromptPanel";

/** AI用プロンプトパネルの表示テストに使う既定props */
const defaultProps: AiPromptPanelProps = {
  aiPrompt: "AI用プロンプト本文\n第1週: 静かな鍵が向きを変える",
  copyStatus: { state: "idle" },
  onCopy: vi.fn(),
};

/** AiPromptPanelを既定propsで描画する */
function renderAiPromptPanel(props?: Partial<AiPromptPanelProps>) {
  const mergedProps = {
    ...defaultProps,
    ...props,
  };

  render(<AiPromptPanel {...mergedProps} />);

  return mergedProps;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AiPromptPanel", () => {
  it("AI用プロンプトを選択可能な複数行本文として表示する", () => {
    renderAiPromptPanel();

    const promptBody = screen.getByRole("textbox", { name: "AI用プロンプト本文" });

    expect(screen.getByRole("heading", { name: "AI用プロンプト" })).toBeInTheDocument();
    expect(promptBody).toHaveValue(defaultProps.aiPrompt);
    expect(promptBody).toHaveAttribute("readonly");
  });

  it("コピーボタンのクリックを親へ通知する", async () => {
    const user = userEvent.setup();
    const props = renderAiPromptPanel();

    await user.click(screen.getByRole("button", { name: "AI用プロンプトをコピーする" }));

    expect(props.onCopy).toHaveBeenCalledTimes(1);
  });

  it("コピー失敗時は手動コピー案内と本文を表示し続ける", () => {
    renderAiPromptPanel({
      copyStatus: {
        state: "error",
        message: "コピーできませんでした。本文を選択して手動でコピーしてください",
      },
    });

    expect(screen.getByText("コピーできませんでした。本文を選択して手動でコピーしてください。")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "AI用プロンプト本文" })).toHaveValue(
      defaultProps.aiPrompt,
    );
  });
});
