# Makeup Tagging App

メイク製品のタグ付け機能を持つSNSアプリケーション。ユーザーは自分のメイク写真を投稿し、使用した製品を画像上にタグ付けすることができます。

## 技術スタック

- **フロントエンド**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL, Prisma ORM
- **認証**: Clerk
- **ストレージ**: Supabase Storage

## 機能

- ユーザー認証（サインアップ、ログイン、プロフィール管理）
- 投稿の作成、編集、削除
- 画像へのメイク製品のタグ付け
- いいね、コメント機能
- ユーザーフォロー機能
- 製品、ブランド、カテゴリーの管理

## セットアップ

### 前提条件

- Node.js 18.x以上
- PostgreSQLデータベース
- Clerkアカウント
- Supabaseアカウント

### インストール

1. リポジトリをクローン

```bash
git clone <repository-url>
cd makeup-tagging
```

2. 依存関係をインストール

```bash
npm install
```

3. 環境変数の設定

`.env.example`ファイルを`.env`にコピーし、必要な環境変数を設定します。

```bash
cp .env.example .env
```

4. データベースのセットアップ

```bash
npm run prisma:migrate:dev
```

5. 開発サーバーの起動

```bash
npm run dev
```

## API エンドポイント

### ユーザー関連

- `GET /api/users` - ユーザー一覧を取得
- `PATCH /api/users` - 現在のユーザープロフィールを更新
- `GET /api/users/[username]` - 特定のユーザー情報を取得
- `POST /api/users/[username]/follow` - ユーザーをフォロー
- `DELETE /api/users/[username]/follow` - ユーザーのフォローを解除

### 投稿関連

- `GET /api/posts` - 投稿一覧を取得
- `POST /api/posts` - 新しい投稿を作成
- `GET /api/posts/[postId]` - 特定の投稿を取得
- `PATCH /api/posts/[postId]` - 投稿を更新
- `DELETE /api/posts/[postId]` - 投稿を削除
- `POST /api/posts/[postId]/like` - 投稿にいいねする
- `DELETE /api/posts/[postId]/like` - 投稿のいいねを解除
- `GET /api/posts/[postId]/comments` - 投稿のコメント一覧を取得
- `POST /api/posts/[postId]/comments` - 投稿にコメントを追加

### コメント関連

- `PATCH /api/comments/[commentId]` - コメントを更新
- `DELETE /api/comments/[commentId]` - コメントを削除

### 製品関連

- `GET /api/products` - 製品一覧を取得
- `POST /api/products` - 新しい製品を作成
- `GET /api/brands` - ブランド一覧を取得
- `POST /api/brands` - 新しいブランドを作成
- `GET /api/categories` - カテゴリー一覧を取得
- `POST /api/categories` - 新しいカテゴリーを作成

## ライセンス

MIT
