import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProphecyForm } from "./ProphecyForm";
import type { ProphecyFormProps } from "./ProphecyForm";

/** テスト用の有効なフォーム入力 */
const validValue = {
  name: "ミナ",
  birthDate: new Date(1995, 3, 12),
  gender: undefined,
  theme: "仕事の進め方",
  mood: "落ち着いている",
} satisfies ProphecyFormProps["value"];

/** ProphecyFormを最小限の既定propsで描画する */
function renderProphecyForm(props?: Partial<ProphecyFormProps>) {
  const defaultProps: ProphecyFormProps = {
    value: validValue,
    errors: {},
    canGenerate: true,
    onChange: vi.fn(),
    onGenerate: vi.fn(),
  };

  const mergedProps = {
    ...defaultProps,
    ...props,
  };

  render(<ProphecyForm {...mergedProps} />);

  return mergedProps;
}

afterEach(() => {
  cleanup();
});

describe("ProphecyForm", () => {
  it("必須項目が入力済みで性別未入力でも生成操作ができる", async () => {
    const user = userEvent.setup();
    const props = renderProphecyForm({
      value: {
        ...validValue,
        gender: undefined,
      },
      canGenerate: true,
    });

    const generateButton = screen.getByRole("button", { name: "予言を生成する" });

    expect(generateButton).toBeEnabled();
    await user.click(generateButton);
    expect(props.onGenerate).toHaveBeenCalledTimes(1);
  });

  it("canGenerateがfalseのとき生成ボタンをdisabledにする", () => {
    renderProphecyForm({
      canGenerate: false,
    });

    expect(screen.getByRole("button", { name: "予言を生成する" })).toBeDisabled();
  });

  it("エラー表示とhelper textを日本語で表示する", () => {
    renderProphecyForm({
      value: {
        name: "",
        birthDate: null,
        gender: undefined,
        theme: "",
        mood: "",
      },
      errors: {
        name: "名前を入力してください",
        birthDate: "生年月日を入力してください",
        theme: "相談テーマを入力してください",
        mood: "今月の気分を入力してください",
      },
      canGenerate: false,
    });

    expect(screen.getByText("名前を入力してください")).toBeInTheDocument();
    expect(screen.getByText("生年月日を入力してください")).toBeInTheDocument();
    expect(screen.getByText("相談テーマを入力してください")).toBeInTheDocument();
    expect(screen.getByText("今月の気分を入力してください")).toBeInTheDocument();
  });

  it("入力変更を親へ通知する", async () => {
    const user = userEvent.setup();
    const props = renderProphecyForm({
      value: {
        ...validValue,
        name: "",
      },
    });

    await user.type(screen.getByLabelText(/名前/), "ミ");

    expect(props.onChange).toHaveBeenLastCalledWith({
      ...validValue,
      name: "ミ",
    });
  });

  it("気分候補を選ぶと今月の気分へ反映する", async () => {
    const user = userEvent.setup();
    const props = renderProphecyForm({
      value: {
        ...validValue,
        mood: "",
      },
    });

    await user.click(screen.getByRole("button", { name: "前に進みたい" }));

    expect(props.onChange).toHaveBeenCalledWith({
      ...validValue,
      mood: "前に進みたい",
    });
  });
});
