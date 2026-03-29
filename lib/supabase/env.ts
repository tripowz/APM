type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

function readEnv(key: string) {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function getPublicSupabaseEnvErrorMessage() {
  return [
    "Supabase public environment variables are missing.",
    "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local for local development or to the Vercel project settings for production.",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is also supported as a compatibility alias."
  ].join(" ");
}

export function getSupabasePublicEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? null;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    null;

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url,
    publishableKey
  };
}

export function hasSupabasePublicEnv() {
  return getSupabasePublicEnv() !== null;
}

export function getSupabaseUrl() {
  const publicEnv = getSupabasePublicEnv();

  if (!publicEnv) {
    throw new Error(getPublicSupabaseEnvErrorMessage());
  }

  return publicEnv.url;
}

export function getSupabasePublishableKey() {
  const publicEnv = getSupabasePublicEnv();

  if (!publicEnv) {
    throw new Error(getPublicSupabaseEnvErrorMessage());
  }

  return publicEnv.publishableKey;
}

export function getServiceRoleKey() {
  if (typeof window !== "undefined") {
    return null;
  }

  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function hasServiceRoleKey() {
  return getServiceRoleKey() !== null;
}

export function requireServiceRoleKey() {
  const value = getServiceRoleKey();

  if (!value) {
    throw new Error(
      "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. This key is only required for server-only admin actions such as in-app user creation and demo seeding."
    );
  }

  return value;
}
