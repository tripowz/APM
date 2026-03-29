import { createClient } from "@supabase/supabase-js";

import { createBankUzExchangeRateProvider } from "../lib/exchange-rate-provider";
import type { Database } from "../lib/supabase/database.types";
import { getSupabaseUrl, requireServiceRoleKey } from "../lib/supabase/env";

async function main() {
  const provider = createBankUzExchangeRateProvider();
  const rate = await provider.getLatestUsdToUzsRate();

  const supabase = createClient<Database>(
    getSupabaseUrl(),
    requireServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { error } = await supabase.from("exchange_rates").upsert(
    {
      base_currency: "USD",
      quote_currency: "UZS",
      rate: rate.rate,
      rate_date: rate.rateDate,
      source: rate.source
    },
    {
      onConflict: "base_currency,quote_currency,rate_date,source"
    }
  );

  if (error) {
    throw new Error(`Failed to save exchange rate: ${error.message}`);
  }

  console.log(
    `Saved USD/UZS rate ${rate.rate} for ${rate.rateDate} from ${rate.source}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
