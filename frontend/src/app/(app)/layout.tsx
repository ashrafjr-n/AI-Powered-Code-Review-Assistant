import { AppRail } from "@/components/app/app-rail";
import { AppTopbar } from "@/components/app/app-topbar";
import { getActiveProvider, getDemoStatus } from "@/lib/api/providers";
import { getCurrentUser } from "@/lib/api/auth";

// The signed-in app: a full-width top bar (logo, page context, model, account) and an
// icon rail on the left. `context` is a parallel-route slot (@context) filled by pages
// like the workspace with their own header info (back link, project name…).
// proxy.ts sends signed-out visitors to /login; getCurrentUser() confirms the session with the backend.
export default async function AppLayout({
  children,
  context,
}: LayoutProps<"/">) {
  const [user, provider, demo] = await Promise.all([
    getCurrentUser(),
    getActiveProvider(),
    getDemoStatus(),
  ]);

  return (
    <div className="min-h-dvh">
      <AppTopbar user={user} provider={provider} demo={demo}>
        {context}
      </AppTopbar>
      <div className="lg:grid lg:grid-cols-[64px_minmax(0,1fr)]">
        <AppRail />
        <main id="main" className="min-w-0 px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
