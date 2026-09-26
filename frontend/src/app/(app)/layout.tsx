import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { getActiveProvider } from "@/lib/api/providers";
import { getCurrentUser } from "@/lib/api/auth";

// The signed-in app: sidebar + top bar around every page.
// proxy.ts sends signed-out visitors to /login; getCurrentUser() confirms the session with the backend.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [user, provider] = await Promise.all([
    getCurrentUser(),
    getActiveProvider(),
  ]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[240px_1fr]">
      <AppSidebar />
      <div className="flex min-w-0 flex-col">
        <AppTopbar user={user} provider={provider} />
        <main id="main" className="flex-1 px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
