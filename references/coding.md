# コーディング規約

## 目的

このドキュメントは、React + Vite + TypeScript でフロントエンド単体SPAを開発する際の共通規約を定める。特定プロダクトの仕様やドメイン判断は扱わず、実装品質、保守性、テスト容易性、アクセシビリティを安定させるための基準に集中する。

## 基本方針

- 読みやすさと予測しやすさを優先し、過度な抽象化を避ける。
- フレームワーク、ライブラリ、言語の標準的な使い方に沿う。
- UI、状態管理、ドメインロジック、外部I/Oの責務を分離する。
- 小さく安全に変更できる単位で実装する。
- 型、テスト、lint、formatを使ってレビュー時の認知負荷を下げる。
- 実装詳細ではなく、ユーザーから見える振る舞いを中心に検証する。

## 推奨ディレクトリ構成

```text
src/
  app/
    App.tsx
    providers/
    routes/
  assets/
  components/
    ui/
    layout/
  features/
    example/
      components/
      hooks/
      logic/
      types.ts
  hooks/
  lib/
  styles/
  test/
    setup.ts
  types/
```

- `app/` はアプリ全体の起点、provider、routing、テーマ設定を置く。
- `components/` は複数機能から再利用する汎用UIを置く。
- `features/` は機能単位のコンポーネント、hooks、ロジック、型をまとめる。
- `hooks/` は機能に依存しない汎用hookを置く。
- `lib/` は外部ライブラリの薄いラッパーや共通ユーティリティを置く。
- `test/` はテスト共通設定やrender helperを置く。
- 機能固有のものはできる限り `features/` 配下に閉じ込める。

## TypeScript

- `strict` を有効にする。
- `any` は原則使わない。必要な場合は理由が分かる局所的な範囲に留める。
- `unknown` を受け取ったら、使用前に型ガードやschema validationで絞り込む。
- 公開関数、複雑な関数、外部境界の関数は戻り値の型を明示する。
- Reactコンポーネントのpropsは `type` で定義する。
- 限定値は文字列unionまたは `as const` から導出する。
- optionalな値は `undefined` と `null` の扱いを統一する。通常は `undefined` を優先する。
- 型だけのimportは `import type` を使う。
- enumは必要性が明確な場合に限る。単純な選択肢はunion typeを優先する。
- 型エラーを `as` で抑え込まない。外部入力の境界で検証してから扱う。

```ts
const statusValues = ["idle", "loading", "success", "error"] as const;
type Status = (typeof statusValues)[number];
```

## React

- コンポーネントは関数コンポーネントで書く。
- 表示、イベント通知、状態管理、ビジネスロジックを混ぜすぎない。
- コンポーネント内に大きな計算や変換が増えたら、純粋関数またはcustom hookへ分離する。
- propsは必要最小限にし、boolean propsの増えすぎに注意する。
- 派生値はstateにしない。render中の計算または `useMemo` で導出する。
- `useEffect` は外部システムとの同期に使う。propsやstateから別stateを作る目的では使わない。
- イベントハンドラで完結する処理は `useEffect` に逃がさない。
- `React.memo`、`useCallback`、`useMemo` は実測または明確な再計算コストがある場合に使う。
- listの `key` には安定したIDを使う。配列indexは並び替えや追加削除がない静的リストに限る。
- componentファイルは原則として1ファイル1主要コンポーネントにする。
- `children` を受け取る共通レイアウトやラッパーは、責務が明確な名前にする。

```tsx
type UserCardProps = {
  name: string;
  description?: string;
  onSelect: () => void;
};

export function UserCard({ name, description, onSelect }: UserCardProps) {
  return (
    <button type="button" onClick={onSelect}>
      <span>{name}</span>
      {description ? <small>{description}</small> : null}
    </button>
  );
}
```

## 状態管理

- まずはReact標準の `useState`、`useReducer`、Context、custom hookで表現する。
- グローバル状態管理ライブラリは、複数画面や複数機能で共有される状態が明確になってから導入する。
- フォーム入力、モーダル開閉、選択状態など局所的な状態はコンポーネントまたはfeature内に閉じる。
- サーバー状態とクライアント状態を混同しない。
- URLで表現すべき状態はquery parameterやroutingに寄せる。
- reducerを使う場合は、action名をユーザー操作や状態遷移として読める名前にする。

## Vite

- 環境変数は `VITE_` prefixを付けたものだけをクライアントへ公開する。
- 秘密情報、APIキー、credentialをフロントエンドに埋め込まない。
- path aliasを使う場合は `vite.config.ts` と `tsconfig.json` の両方を揃える。
- build時に不要なpolyfillや大きな依存を追加しない。
- 依存追加前に、標準APIや既存依存で十分か確認する。
- Vite pluginは目的が明確なものだけを導入する。

## スタイリング

- デザインシステムまたは既存のスタイル方針を優先する。
- Tailwind CSSを使う場合、レイアウト、余白、レスポンシブ、状態表現に活用する。
- UIライブラリを使う場合、アクセシビリティやフォーム部品など得意領域を活かす。
- 同じ見た目を何度も書く場合は、共通コンポーネント化を検討する。
- CSS classの長大化で意図が読みづらい場合は、コンポーネント分割やスタイル関数を使う。
- レスポンシブは主要な幅で目視確認する。
- テキストの折り返し、overflow、focus表示、disabled表示を必ず確認する。
- 色だけで状態を伝えない。

## アクセシビリティ

- button、input、select、textarea、dialogなど、用途に合うsemantic HTMLを使う。
- クリック可能なdivやspanを安易に作らない。
- 入力には対応するlabelを用意する。
- アイコンだけのボタンには `aria-label` を付ける。
- エラーメッセージは対象入力と関連付ける。
- keyboard操作で主要機能を使えるようにする。
- focus ringを消す場合は、代わりのfocus表示を用意する。
- 画像には意味に応じて適切な `alt` を付ける。装飾画像は空文字にする。
- loading、empty、error、disabledの状態を実装する。

## フォーム

- 入力値は制御コンポーネントとして扱うことを基本にする。
- 入力の生値と、送信用に正規化した値を混同しない。
- validationはUI表示と送信可否の両方から参照できる形にする。
- 送信時だけでなく、必要に応じて入力中にもエラーを分かりやすく表示する。
- 必須、最大長、形式、範囲などの制約は定数化する。
- ブラウザ標準のvalidationと独自validationを併用する場合は表示が矛盾しないようにする。

## データ取得と副作用

- fetchやstorageなどの外部I/Oは、コンポーネントから直接散らさず関数やhookに分離する。
- request中、成功、失敗、空結果の状態を明示的に扱う。
- 非同期処理はabortや古いresponseの扱いを考慮する。
- retryやpollingは必要性が明確な場合だけ実装する。
- エラーは握りつぶさず、ユーザー向け表示と開発者向けログを分けて考える。

## 命名

- コンポーネント名、型名は `PascalCase` にする。
- 関数、変数、hookは `camelCase` にする。
- hookは `use` で始める。
- 定数は通常 `camelCase`、環境設定や固定値の集合は必要に応じて `UPPER_SNAKE_CASE` にする。
- ファイル名はプロジェクト内で統一する。Reactコンポーネントは `PascalCase.tsx`、非コンポーネントは `camelCase.ts` を基本にする。
- 名前は役割を表す。`data`、`info`、`item` のような曖昧な名前は狭いscopeに限る。

## import / export

- 同一feature内の相対importは近い距離に留める。
- 深すぎる相対pathが増える場合はpath aliasを検討する。
- 循環依存を作らない。
- default exportとnamed exportはプロジェクト内で方針を統一する。迷う場合はnamed exportを優先する。
- barrel fileは依存関係が不透明になりやすいため、公開面が明確なディレクトリに限る。

## エラーハンドリング

- ユーザーが対処できるエラーは、次に取れる行動が分かる文面にする。
- 開発者向けの詳細情報をそのままUIに出さない。
- 例外を投げる関数と、Result型のように値で返す関数の方針を混在させすぎない。
- 外部入力や外部APIレスポンスは信頼しない。
- fallback UIを用意し、画面全体が壊れたままにならないようにする。

## テスト

- 純粋関数の単体テストを厚めに書く。
- Reactコンポーネントは Testing Library でユーザー操作と表示結果を検証する。
- 実装詳細、内部state、CSS class、UIライブラリのDOM構造に依存しない。
- `describe`、`it`、`expect`、`vi` は `vitest` から明示importする。
- DOM matcherは `@testing-library/jest-dom/vitest` をsetup fileで読み込む。
- user interactionは `@testing-library/user-event` を使う。
- timer、mock、stubを使ったテストは後片付けを行う。
- スナップショットは主要な検証手段にしない。
- バグ修正時は、再発を防ぐ最小限のテストを追加する。

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

```ts
// vitest.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
```

## パフォーマンス

- まず正しくシンプルに実装し、問題が見えた箇所を測定して最適化する。
- 大きなリストはvirtualizationを検討する。
- 高コストな計算は入力が変わったときだけ再計算する。
- 不要に大きな依存を追加しない。
- 画像やフォントはサイズ、形式、読み込みタイミングを確認する。
- bundle sizeに影響する変更ではbuild結果を確認する。

## セキュリティ

- ユーザー入力をHTMLとして直接挿入しない。
- `dangerouslySetInnerHTML` は原則使わない。必要な場合はsanitizeを必須にする。
- URL、redirect先、外部リンクは検証する。
- 外部リンクには必要に応じて `rel="noreferrer"` を付ける。
- secretをクライアントコード、リポジトリ、build artifactに含めない。
- 依存ライブラリの追加や更新では、メンテナンス状況と脆弱性を確認する。

## レビュー前チェック

- `npm run lint` または同等のlintが通る。
- `npm run test` または対象範囲のtestが通る。
- `npm run build` が通る。
- 主要な画面幅で表示が崩れていない。
- keyboard操作とfocus表示に問題がない。
- loading、empty、error、disabled状態を確認した。
- 不要なconsole、debug code、未使用コードが残っていない。
- 仕様変更を伴う場合は関連ドキュメントを更新した。

## 避けること

- コンポーネント内に大きなビジネスロジックを埋め込む。
- `useEffect` で派生stateを同期する。
- 型エラーを安易な `as` や `any` で隠す。
- UIライブラリの内部DOM構造に依存したテストを書く。
- 複数責務を持つ巨大なコンポーネントを作る。
- 根拠なくグローバル状態管理や大きな依存を追加する。
- アクセシビリティを後回しにする。
- エラーや空状態を未実装のままにする。
