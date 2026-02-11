"use client";

import { usersApi } from "@/app/api/users";
import { postsApi } from "@/app/api/posts";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { UserProfileDto } from "@/types/api";
import { FeedPostResponseDto } from "@/types/post";
import { PostCard } from "@/components/feed/PostCard";
import { Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { BasePageLayout } from "@/components/layout/BasePageLayout";

export default function UserProfilePage() {
  const { t } = useTranslation();
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersApi.getUserProfile(userId);
        setProfile(data.data);
      } catch (error) {
        console.error(error);
        toast.error(t("common.error_loading_profile"));
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) {
      fetchProfile();
    }
  }, [userId, t]);

  if (isLoading) {
    return (
      <BasePageLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BasePageLayout>
    );
  }

  if (!profile) {
    return (
      <BasePageLayout>
        <div className="container mx-auto max-w-4xl py-6">
          <p className="text-muted-foreground text-center">
            {t("users.error")}
          </p>
        </div>
      </BasePageLayout>
    );
  }

  return (
    <BasePageLayout>
      <div className="container mx-auto max-w-4xl space-y-6 py-6">
        <ProfileHeader
          profile={profile}
          actions={
            <Button asChild>
              <Link href={`/chat?userId=${profile.userId}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {t("users.message", "Message")}
              </Link>
            </Button>
          }
        />
        <UserPosts profile={profile} />
      </div>
    </BasePageLayout>
  );
}

interface UserPostsProps {
  readonly profile: UserProfileDto;
}

function UserPosts({ profile }: UserPostsProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<FeedPostResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsApi.getUserPosts(profile.userId);
        setPosts(data.posts);
      } catch (error) {
        console.error(error);
        toast.error(t("common.error_loading_posts"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [profile.userId, t]);

  const handleLike = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likesCount: isLiked ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {t("feed.noPosts", "No posts yet")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => handleLike(post.id)}
          hideAvatar
        />
      ))}
    </div>
  );
}
