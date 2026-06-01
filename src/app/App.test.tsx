import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("初期画面にタイトルと注意書きを表示する", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "ラブリーゴーストライター風 予言紙" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/非公式ファン作品です/)).toBeInTheDocument();
    expect(screen.getByText(/重要な判断には使用しないでください/)).toBeInTheDocument();
  });
});
