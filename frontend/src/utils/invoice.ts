export interface InvoiceNumberConfig {
  prefix: string; // e.g., INV-
  pad: number;    // e.g., 6 -> INV-000123
}

export function generateInvoiceNumber(lastSequence: number, cfg: InvoiceNumberConfig): string {
  const next = lastSequence + 1;
  const padded = next.toString().padStart(cfg.pad, '0');
  return `${cfg.prefix}${padded}`;
}

// Fiscalization placeholder: integrate with fiscal device or gateway
export interface FiscalPayload {
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  currency: string;
  items: Array<{ description: string; qty: number; unitPrice: number; taxRate: number }>;
}

export interface FiscalizationResult {
  success: boolean;
  fiscalCode?: string;
  qrData?: string;
  raw?: any;
}

export async function sendToFiscalDevice(payload: FiscalPayload): Promise<FiscalizationResult> {
  // TODO: integrate with device/service provider
  return { success: true, fiscalCode: 'FISCAL-CODE-PLACEHOLDER', qrData: 'QR-PLACEHOLDER' };
} 