"use client";

import { Sidebar } from "@/components/navigation/Sidebar";

interface BasePageLayoutProps {
  readonly children: React.ReactNode;
  readonly showRightSidebar?: boolean;
  readonly rightSidebarContent?: React.ReactNode;
}

export function BasePageLayout({
  children,
  showRightSidebar = false,
  rightSidebarContent,
}: BasePageLayoutProps) {
  return (
    <div className="bg-background text-foreground flex min-h-screen">
      {/* Left Sidebar - Hidden on small screens, fixed width on larger */}
      <div className="hidden w-64 flex-shrink-0 md:block">
        <div className="fixed inset-y-0 w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`min-h-screen w-full flex-1 ${showRightSidebar ? "border-x" : ""}`}
      >
        {children}
      </main>

      {/* Right Sidebar (Optional) - Hidden on medium/small screens */}
      {showRightSidebar && rightSidebarContent && (
        <div className="hidden w-80 flex-shrink-0 p-4 lg:block">
          <div className="sticky top-4">{rightSidebarContent}</div>
        </div>
      )}
    </div>
  );
}
