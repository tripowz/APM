import { Users } from "lucide-react";

import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import { InviteUserForm } from "@/components/settings/invite-user-form";
import { UserRoleForm } from "@/components/settings/user-role-form";
import {
  requireAuthenticatedUser
} from "@/lib/auth/session";
import {
  DEFAULT_SETTINGS,
  getSettings,
  type SettingsRow
} from "@/lib/data/settings";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";
import { listUsers, type UserRow } from "@/lib/data/users";
import { hasServiceRoleKey } from "@/lib/supabase/env";
import type { CurrentAppUser } from "@/lib/types/app";

export default async function SettingsPage() {
  const currentUser: CurrentAppUser = await requireAuthenticatedUser();
  const [settings, usersResult, preferences] = await Promise.all([
    getSettings().catch((): SettingsRow | null => null),
    listUsers().catch((): UserRow[] => []),
    getAppPreferences()
  ]);
  const users: UserRow[] = usersResult;
  const currentUserId = currentUser.id;
  const canManageUsers = currentUser.role === "owner";
  const inAppInvitesEnabled = hasServiceRoleKey();
  const locale = preferences.locale;
  const messages = getMessages(locale);

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="settings-workspace-refresh"
        tables={["settings", "users"]}
      />

      <PageHeader
        eyebrow={messages.settings.eyebrow}
        title={messages.settings.title}
        description={messages.settings.description}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title={messages.settings.profileTitle}
          description={messages.settings.profileDesc}
          actions={
            <StatusBadge tone="success">
              {settings?.currency ?? DEFAULT_SETTINGS.currency}
            </StatusBadge>
          }
        >
          <BusinessSettingsForm
            initialValues={{
              business_name: settings?.business_name ?? DEFAULT_SETTINGS.business_name,
              currency: settings?.currency ?? DEFAULT_SETTINGS.currency,
              timezone: settings?.timezone ?? DEFAULT_SETTINGS.timezone
            }}
            locale={locale}
          />
        </SectionCard>

        <SectionCard
          title={messages.settings.addUserTitle}
          description={messages.settings.addUserDesc}
          actions={
            <StatusBadge tone={inAppInvitesEnabled ? "success" : "warning"}>
              {inAppInvitesEnabled
                ? messages.settings.inAppEnabled
                : messages.settings.manualFallback}
            </StatusBadge>
          }
        >
          <InviteUserForm
            enabled={canManageUsers && inAppInvitesEnabled}
            locale={locale}
            disabledReason={
              !canManageUsers
                ? messages.settings.onlyOwner
                : messages.settings.serviceRoleHint
            }
          />
        </SectionCard>
      </div>

      <SectionCard
        title={messages.settings.teamTitle}
        description={messages.settings.teamDesc}
        actions={<StatusBadge tone="info">{users.length}</StatusBadge>}
      >
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={messages.settings.noUsersTitle}
            description={messages.settings.noUsersDescription}
          />
        ) : (
          <div className="grid gap-4">
            {users.map((user: UserRow) => {
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
                            {user.role === "owner" ? messages.app.owner : messages.app.member}
                          </StatusBadge>
                          {isCurrentUser ? (
                            <StatusBadge tone="success">{messages.settings.currentUser}</StatusBadge>
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
                        locale={locale}
                        helperText={
                          isCurrentUser
                            ? messages.settings.onlyOwner
                            : messages.settings.teamDesc
                        }
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {messages.settings.onlyOwner}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
