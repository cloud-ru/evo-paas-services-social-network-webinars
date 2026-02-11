"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authApi } from "@/app/api/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const t = useTranslation().t;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("auth.verifyEmail.error")); // Or a specific "Token missing" message
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmailByLink(token);
        setStatus("success");
        toast.success(t("auth.verifyEmail.success"));
      } catch (error: unknown) {
        setStatus("error");
        const msg =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (error as Error)?.message ||
          t("errors.default");
        setErrorMessage(msg);
        toast.error(msg);
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "verifying") {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{t("auth.verifyEmail.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
          <p className="text-muted-foreground mt-4">
            {t("auth.verifyEmail.verifying")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{t("auth.verifyEmail.title")}</CardTitle>
          <CardDescription className="text-green-600">
            {t("auth.verifyEmail.success")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            {t("auth.verifyEmail.loginLink")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>{t("auth.verifyEmail.title")}</CardTitle>
        <CardDescription className="text-destructive">
          {t("auth.verifyEmail.error")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{errorMessage}</p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => router.push("/auth/login")} variant="outline">
          {t("auth.verifyEmail.loginLink")}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
