"use client";

import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "@/app/api/posts";
import { Loader2, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Feed() {
  const { t } = useTranslation();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["posts", "feed"],
    queryFn: ({ pageParam = 0 }) => postsApi.getPosts(10, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.length * 10;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  });

  if (status === "pending") {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-40 flex-col items-center justify-center space-y-4 text-center">
        <p className="text-muted-foreground">{t("errors.default")}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t("common.retry", "Try again")}
        </Button>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-6">
      <div className="flex flex-col space-y-4">
        <CreatePostModal
          trigger={
            <Button className="w-full gap-2" size="lg">
              <PenSquare className="h-5 w-5" />
              {t("createPost.title")}
            </Button>
          }
        />
      </div>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center">
            {t("feed.noPosts", "No posts yet")}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={() => refetch()} />
          ))
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("common.loading", "Loading...")}</span>
              </>
            ) : (
              <span>{t("feed.loadMore", "Load more")}</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
