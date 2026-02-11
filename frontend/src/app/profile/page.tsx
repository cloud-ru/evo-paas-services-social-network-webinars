"use client";

import { usersApi } from "@/app/api/users";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserProfileDto } from "@/types/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BasePageLayout } from "@/components/layout/BasePageLayout";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersApi.getMe();
        setProfile(data.data);
      } catch (error) {
        console.error(error);
        toast.error(t("common.error_loading_profile"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [t]);

  const handleAvatarUpdate = (newUrl: string) => {
    if (profile) {
      setProfile({ ...profile, avatarUrl: newUrl });
    }
  };

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
    return null; // or redirect, handled by error toast or middleware
  }

  return (
    <BasePageLayout>
      <div className="container mx-auto max-w-4xl py-6">
        <ProfileHeader profile={profile} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <ProfileEditForm profile={profile} onUpdateSuccess={setProfile} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.avatar.title")}</CardTitle>
                <CardDescription>
                  {t("profile.avatar.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <AvatarUpload
                  currentAvatarUrl={profile.avatarUrl}
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  onUploadSuccess={handleAvatarUpdate}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BasePageLayout>
  );
}
