# Project Rules

This guide outlines the best practices, conventions, and standards for development using modern web technologies.

**Always adhere to these guidelines**


## Development Philosophy

- Write clean, maintainable, and scalable code
- Follow the principles of SOLID
- Prioritize functional and declarative programming patterns over imperative ones
- Emphasize type safety and static analysis
- Practice component-driven development

## Code Implementation Guidelines
### Code Style

- Eliminate unused variables
- Always handle error parameters in callbacks

### Naming Conventions

- Use PascalCase for:
  - Components
  - Type definitions
  - Interfaces
- Use kebab-case for:
  - Directory names (e.g., components/auth-wizard)
  - File names (e.g., user-profile.tsx)
- Use camelCase for:
  - Variables
  - Functions
  - Methods
  - Hooks
  - Properties
  - Props
- Use uppercase for:
  - Environment variables
  - Constants
  - Global settings
- Prefix boolean variables with a verb: isLoading, hasError, canSubmit
- Except for the following, use complete words instead of abbreviations:
  - err (error)
  - req (request)
  - res (response)
  - props (properties)
  - ref (reference)

### TypeScript Implementation

- Enable strict mode
- Follow verbatimModuleSyntax
- Use type guards to safely handle potential undefined or null values
- Use generics appropriately
- Use the unknown type appropriately
- Leverage TypeScript utility types (Partial, Pick, Omit) for cleaner and more reusable code
- Use mapped types to dynamically create variants of existing types
- Do not use TypeScript-specific syntaxes such as enum

### ES Modules

- When importing Node.js APIs, use the node: prefix (e.g., "node:fs")

### Data Modeling
- Create migration files as needed
- Create supabase/seed.ts simultaneously (ask users to `run npm run seed`)

### Unit Test


## Documentation
- Write TSDoc appropriately in Japanese
- Document all public functions, classes, methods, and interfaces
- Leave appropriate comments in Japanese
- Add examples where applicable
- Use complete sentences with appropriate punctuation
- Keep explanations clear and concise
- Use proper Markdown formatting
- Use appropriate code blocks
- Use proper links
- Use appropriate headings
- Use appropriate lists

## AI-Assisted Development Guidelines
### TDD
TDD を実施する。コードを生成するときは、それに対応するユニットテストを常に生成する。
コードを追加で修正したとき、`npm test` がパスすることを常に確認する。

```ts
function add(a: number, b: number) { return a + b }
test("1+2=3", () => {
  expect(add(1, 2)).toBe(3);
});
```

### コメントによる自己記述
各ファイルの冒頭にはコメントで仕様を記述する。

出力例
```ts
/**
 * 2点間のユークリッド距離を計算する
**/
type Point = { x: number; y: number; };
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
```

### In Source Testing
vitest で実装と同じファイルにユニットテストを書く。
出力例
```ts
export function distance(a: Point, b: Point): number {...}
if (import.meta.vitest) {
  const {test, expect} = import.meta.vitest;
  test("ユークリッド距離を計算する", () => {
    const result = distance({x: 0, y: 0}, {x: 3, y: 4});
    expect(distance(result)).toBe(5)
  });
}
```

### types.ts にドメイン型を集約
src/types.ts にアプリケーション内のドメインモデルを集約する。
その型がどのように使われるかを jsdoc スタイルのコメントで記述
```ts
/**
 * キャッシュのインターフェース抽象
 */
export type AsyncCache<T> = {
  get(): Promise<T | void>;
  has(): Promise<boolean>;
  set(value: T): Promise<void>;
}
```

### TS + 関数型ドメインモデリング
TypeScript で関数型ドメインモデリングを行う。class を使わず関数による実装を優先する。
代数的データでドメインをモデリングする。
出力例
````ts
type FetchResult<T, E> = {
  ok: true;
  data: T
} | {
  ok: false;
  error: E
}
```

## Git
- mainからブランチを切らない
- コミットは1つにまとめず、適切な粒度で分割して行う