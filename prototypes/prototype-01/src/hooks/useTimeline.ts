import { useInfiniteQuery } from "@tanstack/react-query";
import { agent } from "@/lib/agent";

const PAGE_SIZE = 30;

export function useTimeline() {
  return useInfiniteQuery({
    queryKey: ["timeline"],
    queryFn: ({ pageParam }) =>
      agent.getTimeline({ limit: PAGE_SIZE, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.cursor,
  });
}
