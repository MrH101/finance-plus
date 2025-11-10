// Zimbabwe payroll calculators: PAYE, AIDS Levy, NSSA (employee portion)
// These utilities are intentionally verbose and configurable to ease maintenance.

export type TaxBand = {
  upTo: number | null; // null means no upper cap (top band)
  rate: number; // decimal (e.g., 0.2 for 20%)
};

export interface ZwTaxConfig {
  // PAYE configuration
  annualBands: TaxBand[]; // Annualized brackets. We'll convert monthly by dividing by 12.
  annualTaxCredit: number; // Annualized tax credit (if applicable)

  // AIDS levy config
  aidsLevyRate: number; // typically 3% of PAYE

  // NSSA config (pension) — employee portion only here
  nssaRate: number; // decimal rate applied to pensionable earnings
  nssaMonthlyCap: number; // maximum pensionable earnings per month
}

export interface ZwTaxBreakdown {
  paye: number;
  aidsLevy: number;
  nssa: number; // employee portion
  totalDeductions: number;
  taxableIncomeMonthly: number;
}

// Default configuration (example values; update from finance team when needed)
// Bands are for demonstration. Adjust to current ZIMRA schedules for production.
export const defaultZwTaxConfig: ZwTaxConfig = {
  annualBands: [
    { upTo: 3600, rate: 0.0 },   // 0 - 3,600
    { upTo: 12000, rate: 0.2 },  // 3,601 - 12,000
    { upTo: 24000, rate: 0.25 }, // 12,001 - 24,000
    { upTo: 36000, rate: 0.3 },  // 24,001 - 36,000
    { upTo: 48000, rate: 0.35 }, // 36,001 - 48,000
    { upTo: null, rate: 0.4 },   // 48,001+
  ],
  annualTaxCredit: 0,
  aidsLevyRate: 0.03,
  nssaRate: 0.045,         // 4.5% employee portion example
  nssaMonthlyCap: 5000,    // pensionable cap per month example
};

function clampToBand(amount: number, lower: number, upper: number | null): number {
  if (amount <= lower) return 0;
  if (upper == null) return amount - lower;
  return Math.max(0, Math.min(amount, upper) - lower);
}

export function computeMonthlyPAYE(grossMonthly: number, config: ZwTaxConfig = defaultZwTaxConfig): number {
  // Convert monthly to annual for bracket computation
  const annual = grossMonthly * 12;
  let taxAnnual = 0;

  let lower = 0;
  for (const band of config.annualBands) {
    const upper = band.upTo ?? null;
    const taxableInBand = clampToBand(annual, lower, upper);
    taxAnnual += taxableInBand * band.rate;
    if (upper == null) break;
    lower = upper;
  }

  taxAnnual = Math.max(0, taxAnnual - config.annualTaxCredit);
  return taxAnnual / 12;
}

export function computeAidsLevyFromPAYE(payeMonthly: number, config: ZwTaxConfig = defaultZwTaxConfig): number {
  return payeMonthly * config.aidsLevyRate;
}

export function computeNssaEmployee(grossMonthly: number, config: ZwTaxConfig = defaultZwTaxConfig): number {
  const pensionable = Math.min(grossMonthly, config.nssaMonthlyCap);
  return pensionable * config.nssaRate;
}

export function computeZwPayrollDeductions(
  grossMonthly: number,
  config: ZwTaxConfig = defaultZwTaxConfig
): ZwTaxBreakdown {
  const paye = computeMonthlyPAYE(grossMonthly, config);
  const aidsLevy = computeAidsLevyFromPAYE(paye, config);
  const nssa = computeNssaEmployee(grossMonthly, config);

  const totalDeductions = paye + aidsLevy + nssa;
  return {
    paye,
    aidsLevy,
    nssa,
    totalDeductions,
    taxableIncomeMonthly: grossMonthly,
  };
} 