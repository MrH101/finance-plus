import React, { createContext, useContext, useMemo, useState } from 'react';
import { RatesService, Currency } from '../services/analyticsService';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (amount: number, to: Currency) => Promise<number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  const value = useMemo<CurrencyContextType>(() => ({
    currency,
    setCurrency,
    convert: async (amount: number, to: Currency) => {
      return RatesService.convert(amount, currency, to);
    },
  }), [currency]);

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}; 