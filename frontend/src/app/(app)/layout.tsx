import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { mockActiveProvider, mockUser } from "@/mocks/session";

// The signed-in app: sidebar + top bar around every page.
// Route protection (proxy.ts) comes in C1.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[240px_1fr]">
      <AppSidebar />
      <div className="flex min-w-0 flex-col">
        <AppTopbar user={mockUser} provider={mockActiveProvider} />
        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
