import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { AppTopbar } from "@/components/app-shell/app-topbar";
import { PageContainer } from "@/components/shared/page-container";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getSettings, type SettingsRow } from "@/lib/data/settings";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AppLayout({ children }: AppLayoutProps) {
  const currentUser = await requireAuthenticatedUser();
  const settings: SettingsRow | null = await getSettings().catch(
    (): SettingsRow | null => null
  );

  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AppTopbar
            currentUser={currentUser}
            businessName={settings?.business_name ?? "Apartment Management"}
          />
          <main className="flex-1 px-3 pb-6 pt-4 sm:px-6 lg:px-8 lg:pb-8">
            <PageContainer>{children}</PageContainer>
          </main>
        </div>
      </div>
    </div>
  );
}
