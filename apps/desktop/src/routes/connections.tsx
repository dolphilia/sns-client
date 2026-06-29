import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/profile/FollowButton";
import { useAuthStore } from "@/stores/authStore";
import { agent } from "@/lib/agent";
import { cn } from "@/lib/utils";
import type { AppBskyActorDefs } from "@atproto/api";

type TabKey = "follows" | "followers" | "oneway";

const PAGE_SIZE = 50;
const RELATIONSHIP_BATCH_SIZE = 30;

const tabs: { key: TabKey; label: string }[] = [
  { key: "follows", label: "フォロー" },
  { key: "followers", label: "フォロワー" },
  { key: "oneway", label: "片思い" },
];

function getFollowedByDid(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const relationship = value as {
    $type?: string;
    did?: unknown;
    followedBy?: unknown;
  };
  if (relationship.$type !== "app.bsky.graph.defs#relationship") return null;
  if (typeof relationship.did !== "string") return null;
  if (typeof relationship.followedBy !== "string") return null;
  return relationship.did;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function fetchOnewayPage(actor: string, cursor?: string) {
  const followsRes = await agent.app.bsky.graph.getFollows({
    actor,
    limit: PAGE_SIZE,
    cursor,
  });

  const follows = followsRes.data.follows;
  const relationshipResponses = await Promise.all(
    chunkArray(follows, RELATIONSHIP_BATCH_SIZE).map((profiles) =>
      agent.app.bsky.graph.getRelationships({
        actor,
        others: profiles.map((profile) => profile.did),
      })
    )
  );

  const followedByDidSet = new Set(
    relationshipResponses
      .flatMap((response) => response.data.relationships)
      .map(getFollowedByDid)
      .filter((did): did is string => Boolean(did))
  );

  return {
    profiles: follows.filter((profile) => !followedByDidSet.has(profile.did)),
    scannedCount: follows.length,
    cursor: followsRes.data.cursor,
  };
}

async function fetchAllOnewayProfiles(actor: string) {
  const profiles: AppBskyActorDefs.ProfileView[] = [];
  let scannedCount = 0;
  let cursor: string | undefined;

  do {
    const page = await fetchOnewayPage(actor, cursor);
    profiles.push(...page.profiles);
    scannedCount += page.scannedCount;
    cursor = page.cursor;
  } while (cursor);

  return { profiles, scannedCount };
}

function ProfileRow({ profile }: { profile: AppBskyActorDefs.ProfileView }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={profile.avatar} alt={profile.displayName ?? profile.handle} />
        <AvatarFallback>
          {(profile.displayName ?? profile.handle).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {profile.displayName ?? profile.handle}
        </p>
        <p className="truncate text-xs text-muted-foreground">@{profile.handle}</p>
        {profile.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {profile.description}
          </p>
        )}
      </div>

      <FollowButton actor={profile} />
    </div>
  );
}

function ConnectionsPage() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;

  const [activeTab, setActiveTab] = useState<TabKey>("follows");
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const followsQuery = useInfiniteQuery({
    queryKey: ["connections", "follows", session.did],
    queryFn: ({ pageParam }) =>
      agent.app.bsky.graph.getFollows({
        actor: session.did,
        limit: PAGE_SIZE,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.data.cursor,
    enabled: activeTab === "follows",
  });

  const followersQuery = useInfiniteQuery({
    queryKey: ["connections", "followers", session.did],
    queryFn: ({ pageParam }) =>
      agent.app.bsky.graph.getFollowers({
        actor: session.did,
        limit: PAGE_SIZE,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.data.cursor,
    enabled: activeTab === "followers",
  });

  const onewayQuery = useQuery({
    queryKey: ["connections", "oneway", session.did],
    queryFn: () => fetchAllOnewayProfiles(session.did),
    enabled: activeTab === "oneway",
  });

  const follows = useMemo(
    () => followsQuery.data?.pages.flatMap((page) => page.data.follows) ?? [],
    [followsQuery.data]
  );
  const followers = useMemo(
    () => followersQuery.data?.pages.flatMap((page) => page.data.followers) ?? [],
    [followersQuery.data]
  );
  const oneway = useMemo(
    () => onewayQuery.data?.profiles ?? [],
    [onewayQuery.data]
  );
  const onewayScannedCount = useMemo(
    () => onewayQuery.data?.scannedCount ?? 0,
    [onewayQuery.data]
  );

  const activeStatus =
    activeTab === "follows"
      ? followsQuery
      : activeTab === "followers"
        ? followersQuery
        : onewayQuery;
  const activePagedQuery =
    activeTab === "follows"
      ? followsQuery
      : activeTab === "followers"
        ? followersQuery
        : null;

  const visibleProfiles =
    activeTab === "follows"
      ? follows
      : activeTab === "followers"
        ? followers
        : oneway;
  const hasNextPage = activePagedQuery?.hasNextPage;
  const isFetchingNextPage = activePagedQuery?.isFetchingNextPage;
  const fetchNextPage = activePagedQuery?.fetchNextPage;

  useEffect(() => {
    const root = scrollRootRef.current;
    const target = loadMoreRef.current;
    if (!root || !target || !hasNextPage || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root,
        rootMargin: "480px 0px",
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold">繋がり</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              必要な分だけ少しずつ読み込みます
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => activeStatus.refetch()}
            disabled={activeStatus.isRefetching}
          >
            {activeStatus.isRefetching ? "更新中..." : "更新"}
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cn(
                "rounded px-2 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div ref={scrollRootRef} className="flex-1 overflow-y-auto">
        {activeStatus.isLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            読み込み中...
          </div>
        )}

        {activeStatus.error && (
          <div className="px-4 py-6 text-sm text-destructive">
            繋がり一覧の取得に失敗しました
          </div>
        )}

        {!activeStatus.isLoading && !activeStatus.error && activeTab === "oneway" && (
          <div className="border-b border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            片思いは、自分はフォローしているが、相手は自分をフォローしていない状態です。
            {onewayScannedCount > 0 && (
              <span className="mt-1 block">
                フォロー中の {onewayScannedCount} 件を確認済みです。
              </span>
            )}
          </div>
        )}

        {!activeStatus.isLoading && !activeStatus.error && visibleProfiles.length === 0 && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            表示できるアカウントがありません
          </div>
        )}

        {visibleProfiles.map((profile) => (
          <ProfileRow key={profile.did} profile={profile} />
        ))}

        {!activeStatus.isLoading && !activeStatus.error && activeTab !== "oneway" && (
          <div ref={loadMoreRef} className="flex justify-center py-6">
            {activePagedQuery?.hasNextPage ? (
              <Button
                variant="outline"
                onClick={() => activePagedQuery.fetchNextPage()}
                disabled={activePagedQuery.isFetchingNextPage}
              >
                {activePagedQuery.isFetchingNextPage ? "読み込み中..." : "もっと読む"}
              </Button>
            ) : (
              visibleProfiles.length > 0 && (
                <p className="text-xs text-muted-foreground">すべて表示しました</p>
              )
            )}
          </div>
        )}

        {!activeStatus.isLoading &&
          !activeStatus.error &&
          activeTab === "oneway" &&
          visibleProfiles.length > 0 && (
            <div className="flex justify-center py-6">
              <p className="text-xs text-muted-foreground">すべて確認しました</p>
            </div>
          )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/connections")({ component: ConnectionsPage });
