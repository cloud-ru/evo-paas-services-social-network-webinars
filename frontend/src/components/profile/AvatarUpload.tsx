import { usersApi } from "@/app/api/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/users/UserAvatar";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface AvatarUploadProps {
  readonly currentAvatarUrl: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly onUploadSuccess: (newUrl: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  firstName,
  lastName,
  onUploadSuccess,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("profile.avatar.error_size"));
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(t("profile.avatar.error_type"));
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const response = await usersApi.uploadAvatar(selectedFile);
      onUploadSuccess(response.avatarUrl);
      toast.success(t("profile.avatar.success"));
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
      toast.error(t("profile.avatar.error_upload"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          {t("profile.avatar.change")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("profile.avatar.upload_title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <UserAvatar
              user={{
                firstName,
                lastName,
                avatarUrl: previewUrl || currentAvatarUrl || null,
              }}
              className="h-32 w-32"
              fallbackClassName="text-4xl"
            />
          </div>
          <div className="mx-auto grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="avatar">{t("profile.avatar.select_image")}</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
