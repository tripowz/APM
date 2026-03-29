import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { toMaybeTableRow, toSupabaseUpsert } from "@/lib/supabase/tables";
import type { ExchangeRateSnapshot } from "@/lib/types/domain";

export type ExchangeRateRow = Database["public"]["Tables"]["exchange_rates"]["Row"];
type ExchangeRateInsert = Database["public"]["Tables"]["exchange_rates"]["Insert"];

function isMissingExchangeRatesSchema(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    error.message?.includes("exchange_rates") === true &&
      error.message?.includes("schema cache") === true
  );
}

export async function getLatestUsdToUzsRate(): Promise<ExchangeRateSnapshot | null> {
  const supabase = await createClient();
  const { data: rateResult, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("base_currency", "USD")
    .eq("quote_currency", "UZS")
    .order("rate_date", { ascending: false })
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (isMissingExchangeRatesSchema(error)) {
    return null;
  }

  if (error) {
    throw new Error(`Failed to load exchange rate: ${error.message}`);
  }

  const rate = toMaybeTableRow<"exchange_rates">(rateResult);

  if (!rate) {
    return null;
  }

  return {
    rate: Number(rate.rate),
    rateDate: rate.rate_date,
    source: rate.source
  };
}

export async function upsertExchangeRate(input: {
  rate: number;
  rateDate: string;
  source: string;
}) {
  const supabase = await createClient();
  const payload: ExchangeRateInsert = {
    base_currency: "USD",
    quote_currency: "UZS",
    rate: input.rate,
    rate_date: input.rateDate,
    source: input.source
  };

  const { error } = await supabase
    .from("exchange_rates")
    .upsert(toSupabaseUpsert<"exchange_rates">(payload), {
      onConflict: "base_currency,quote_currency,rate_date,source"
    });

  if (isMissingExchangeRatesSchema(error)) {
    throw new Error(
      "Таблица курсов exchange_rates пока недоступна в Supabase. Примените миграцию v1.1 и обновите schema cache."
    );
  }

  if (error) {
    throw new Error(`Failed to save exchange rate: ${error.message}`);
  }
}
