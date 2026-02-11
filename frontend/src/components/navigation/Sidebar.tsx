"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLogout } from "@/hooks/use-logout";

type SidebarProps = {
  readonly className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { logout, isLoading } = useLogout();

  const handleLogout = () => {
    if (globalThis.confirm?.(t("nav.logoutConfirmation"))) {
      logout();
    }
  };

  const items = [
    {
      href: "/",
      title: t("nav.home"),
      icon: Home,
    },
    {
      href: "/chat",
      title: t("nav.messages"),
      icon: MessageCircle,
    },
    {
      href: "/users",
      title: t("nav.users"),
      icon: Users,
    },
    {
      href: "/profile",
      title: t("nav.profile"),
      icon: User,
    },
  ];

  return (
    <div className={cn("bg-background min-h-screen border-r pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Social Network Demo
          </h2>
          <div className="space-y-1">
            {items.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoading ? t("nav.loggingOut") : t("nav.logout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
