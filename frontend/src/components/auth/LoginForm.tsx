"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authApi } from "@/app/api/auth";
import { setTokens } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formSchema = z.object({
    email: z.string().email({ message: t("validation.email") }),
    password: z.string().min(1, { message: t("validation.required") }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const response = await authApi.login({
          email: values.email,
          password: values.password,
          deviceName: "Web Client",
        });

        if (response.success && response.data) {
          setTokens(response.data.accessToken, response.data.refreshToken);
        }

        toast.success(t("auth.login.successTitle"), {
          description: t("auth.login.successMessage"),
        });

        router.push("/");
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (error as Error)?.message ||
          t("errors.default");
        toast.error(errorMessage);
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.login.title")}</CardTitle>
        <CardDescription>{t("auth.login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.login.email")}</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.login.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("auth.login.submitting") : t("auth.login.submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col justify-center gap-2">
        <p className="text-muted-foreground text-sm">
          {t("auth.login.dontHaveAccount")}{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            {t("auth.login.register")}
          </Link>
        </p>
        <Link
          href="/auth/forgot-password"
          className="text-muted-foreground text-sm hover:underline"
        >
          {t("auth.login.forgotPassword")}
        </Link>
      </CardFooter>
    </Card>
  );
}
