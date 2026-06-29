import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1分間はキャッシュを新鮮とみなす
      gcTime: 1000 * 60 * 10,    // 10分後にキャッシュを破棄
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
