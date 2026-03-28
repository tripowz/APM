import { Users } from "lucide-react";

import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import { InviteUserForm } from "@/components/settings/invite-user-form";
import { UserRoleForm } from "@/components/settings/user-role-form";
import {
  requireAuthenticatedUser,
  type CurrentAppUser
} from "@/lib/auth/session";
import { getSettings, type SettingsRow } from "@/lib/data/settings";
import { listUsers, type UserRow } from "@/lib/data/users";
import { hasServiceRoleKey } from "@/lib/supabase/env";

export default async function SettingsPage() {
  const currentUser: CurrentAppUser = await requireAuthenticatedUser();
  const [settings, usersResult] = await Promise.all([
    getSettings().catch((): SettingsRow | null => null),
    listUsers()
  ]);
  const users: UserRow[] = usersResult;
  const currentUserId = currentUser.id;
  const canManageUsers = currentUser.role === "owner";
  const inAppInvitesEnabled = hasServiceRoleKey();

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="settings-workspace-refresh"
        tables={["settings", "users"]}
      />

      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage business defaults, team access, and the small operational details that keep this internal workspace consistent."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Workspace profile"
          description="Business name, display currency, and timezone used across the dashboard."
          actions={<StatusBadge tone="success">Live</StatusBadge>}
        >
          <BusinessSettingsForm
            initialValues={{
              business_name: settings?.business_name ?? "",
              currency: settings?.currency ?? "USD",
              timezone: settings?.timezone ?? "Asia/Tashkent"
            }}
          />
        </SectionCard>

        <SectionCard
          title="Add user"
          description="A small internal flow for onboarding another owner or member account."
          actions={
            <StatusBadge tone={inAppInvitesEnabled ? "success" : "warning"}>
              {inAppInvitesEnabled ? "In-app creation enabled" : "Manual fallback"}
            </StatusBadge>
          }
        >
          <InviteUserForm
            enabled={canManageUsers && inAppInvitesEnabled}
            disabledReason={
              !canManageUsers
                ? "Only the owner can add new users."
                : "Add SUPABASE_SERVICE_ROLE_KEY to enable in-app user creation. Until then, create the user in Supabase Auth and refresh this page."
            }
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Users"
        description="This MVP keeps user management intentionally simple: just owner and member roles."
        actions={<StatusBadge tone="info">{users.length} users</StatusBadge>}
      >
        <div className="grid gap-4">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className="rounded-2xl border border-border bg-surface-muted p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-foreground shadow-card">
                      <Users className="size-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {user.full_name}
                        </p>
                        <StatusBadge tone={user.role === "owner" ? "info" : "neutral"}>
                          {user.role}
                        </StatusBadge>
                        {isCurrentUser ? (
                          <StatusBadge tone="success">Current user</StatusBadge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  {canManageUsers ? (
                    <UserRoleForm
                      userId={user.id}
                      role={user.role}
                      disabled={isCurrentUser}
                      helperText={
                        isCurrentUser
                          ? "The current signed-in owner role stays fixed inside this MVP."
                          : "Update the role if responsibilities change."
                      }
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Role changes are limited to the owner account.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
