"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Queryのプロバイダーコンポーネント
 * アプリケーション全体でReact Queryを使用できるようにする
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // クライアントコンポーネントでのみQueryClientを作成するためにuseStateを使用
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1分間はデータをstaleとみなさない
        refetchOnWindowFocus: false, // ウィンドウフォーカス時に再フェッチしない
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
