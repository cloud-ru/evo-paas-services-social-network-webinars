"use client";

import "@/lib/i18n";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { UserStatusUpdater } from "./users/UserStatusUpdater";

export function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <UserStatusUpdater />
        {children}
      </ThemeProvider>
    </QueryProvider>
  );
}
