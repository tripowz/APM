import type { Database } from "@/lib/supabase/database.types";

export type PublicTableName = keyof Database["public"]["Tables"];

export type TableRow<TTableName extends PublicTableName> =
  Database["public"]["Tables"][TTableName]["Row"];

export type TableInsert<TTableName extends PublicTableName> =
  Database["public"]["Tables"][TTableName]["Insert"];

export type TableUpdate<TTableName extends PublicTableName> =
  Database["public"]["Tables"][TTableName]["Update"];

export function toTableRows<TTableName extends PublicTableName>(
  value: unknown
): TableRow<TTableName>[] {
  return (value ?? []) as TableRow<TTableName>[];
}

export function toMaybeTableRow<TTableName extends PublicTableName>(
  value: unknown
): TableRow<TTableName> | null {
  return (value ?? null) as TableRow<TTableName> | null;
}

export function toTableRow<TTableName extends PublicTableName>(
  value: unknown
): TableRow<TTableName> {
  return value as TableRow<TTableName>;
}

export function toSupabaseInsert<TTableName extends PublicTableName>(
  value: TableInsert<TTableName>
): TableInsert<TTableName> & never {
  return value as TableInsert<TTableName> & never;
}

export function toSupabaseUpdate<TTableName extends PublicTableName>(
  value: TableUpdate<TTableName>
): TableUpdate<TTableName> & never {
  return value as TableUpdate<TTableName> & never;
}

export function toSupabaseUpsert<TTableName extends PublicTableName>(
  value: TableInsert<TTableName> | TableInsert<TTableName>[]
): (TableInsert<TTableName> | TableInsert<TTableName>[]) & never {
  return value as (TableInsert<TTableName> | TableInsert<TTableName>[]) & never;
}
