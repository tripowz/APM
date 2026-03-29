import "server-only";

export type ExchangeRateProviderResult = {
  rate: number;
  rateDate: string;
  source: string;
};

export interface ExchangeRateProvider {
  getLatestUsdToUzsRate(): Promise<ExchangeRateProviderResult>;
}

function parseDecimal(raw: string) {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Could not parse exchange rate from bank.uz response.");
  }

  return value;
}

export function createBankUzExchangeRateProvider(
  endpoint = process.env.BANK_UZ_USD_UZS_ENDPOINT?.trim()
): ExchangeRateProvider {
  return {
    async getLatestUsdToUzsRate() {
      if (!endpoint) {
        throw new Error(
          "BANK_UZ_USD_UZS_ENDPOINT is missing. Add a bank.uz USD/UZS source URL to enable automatic daily rate sync."
        );
      }

      const response = await fetch(endpoint, {
        headers: {
          Accept: "text/html,application/json"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`bank.uz request failed with ${response.status}.`);
      }

      const body = await response.text();

      const isoDateMatch = body.match(/\d{4}-\d{2}-\d{2}/);
      const rateMatch =
        body.match(/USD[^0-9]{0,30}([0-9]+[.,][0-9]+)/i) ??
        body.match(/([0-9]+[.,][0-9]+)[^0-9]{0,30}UZS/i);

      if (!rateMatch) {
        throw new Error("Could not find a USD to UZS rate in the bank.uz response.");
      }

      return {
        rate: parseDecimal(rateMatch[1]),
        rateDate: isoDateMatch?.[0] ?? new Date().toISOString().slice(0, 10),
        source: "bank.uz"
      };
    }
  };
}

