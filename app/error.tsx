'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

/**
 * グローバルエラーハンドラーコンポーネント
 * アプリケーション全体で発生した未捕捉のエラーを処理します。
 * @param error - 発生したエラーオブジェクト
 * @param reset - エラー境界をリセットし、再レンダリングを試みる関数
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをロギングサービスに記録するなど
    console.error('Unhandled Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            問題が発生しました (Something went wrong!)
          </h2>
          <p className="mb-6 text-muted-foreground">
            予期せぬエラーが発生しました。再試行してください。
            (An unexpected error occurred. Please try again.)
          </p>
          {/* エラーの詳細を開発モードでのみ表示する例 */}
          {process.env.NODE_ENV === 'development' && (
            <pre className="mb-6 p-4 bg-secondary text-secondary-foreground rounded-md overflow-auto max-w-full text-sm">
              {error?.message || 'No error message available.'}
              {error?.stack && `\n\nStack Trace:\n${error.stack}`}
              {error?.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          )}
          <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            再試行 (Try again)
          </Button>
        </div>
      </body>
    </html>
  );
}
