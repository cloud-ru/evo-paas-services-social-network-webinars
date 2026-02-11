import { postsApi } from "@/app/api/posts";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FeedPostResponseDto } from "@/types/post";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/users/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useTranslation } from "react-i18next";

interface PostCardProps {
  readonly post: FeedPostResponseDto;
  readonly onLike: () => void;
  readonly hideAvatar?: boolean;
}

export function PostCard({ post, onLike, hideAvatar }: PostCardProps) {
  const { t } = useTranslation();
  const likeMutation = useMutation({
    mutationFn: () => {
      if (post.isLiked) {
        return postsApi.unlikePost(post.id);
      } else {
        return postsApi.likePost(post.id);
      }
    },
    onSuccess: () => {
      onLike();
    },
    onError: (err) => {
      console.error("Failed to like post", err);
      toast.error(t("errors.default"));
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        {!hideAvatar && <UserAvatar user={post.author} />}
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {post.author.firstName} {post.author.lastName}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.files && post.files.length > 0 && (
          <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-md">
            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-muted relative flex h-[400px] w-full cursor-pointer items-center justify-center overflow-hidden">
                  <Image
                    src={post.files[0].url}
                    alt="Post attachment"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-[90vw] border-none bg-transparent p-0 shadow-none">
                <div className="relative flex h-[80vh] w-[80vw] items-center justify-center">
                  <Image
                    src={post.files[0].url}
                    alt="Post attachment preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2",
            post.isLiked && "text-red-500 hover:text-red-500"
          )}
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
        >
          <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />
          <span>{t("feed.likes", { count: post.likesCount })}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
