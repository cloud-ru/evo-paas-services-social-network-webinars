"use client";

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postsApi } from "@/app/api/posts";

interface CreatePostModalProps {
  readonly trigger: React.ReactNode;
}

export function CreatePostModal({ trigger }: CreatePostModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useMutation({
    mutationFn: () => postsApi.createPost(content, files),
    onSuccess: () => {
      toast.success(t("createPost.success"));
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      setOpen(false);
      setContent("");
      setFiles([]);
    },
    onError: () => {
      toast.error(t("createPost.error"));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast.error(t("createPost.contentRequired"));
      return;
    }
    createPostMutation.mutate();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
      const validFiles = newFiles.filter((file) => allowedTypes.has(file.type));

      if (validFiles.length !== newFiles.length) {
        toast.error(t("createPost.invalidFileType"));
      }

      setFiles((prev) => [...prev, ...validFiles]);
    }
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setContent("");
      setFiles([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("createPost.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={t("createPost.contentPlaceholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={createPostMutation.isPending}
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="bg-muted flex items-center gap-2 rounded-md px-3 py-1.5 text-sm"
                >
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={createPostMutation.isPending}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              {t("createPost.attachFiles")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button type="submit" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("createPost.submitting")}
                </>
              ) : (
                t("createPost.submit")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
