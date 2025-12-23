// Mock exchange rates for development - in production, these would come from a real API
const MOCK_EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  BTC: 0.000023, // Approximate value (0.000023 BTC per USD)
  ETH: 0.00038,  // Approximate value
  USDT: 1.00,
  USDC: 1.00,
  // Add more currencies as needed
};

export interface CurrencyConversionOptions {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: Record<string, number> = MOCK_EXCHANGE_RATES;

  private constructor() {}

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Convert amount from one currency to another
   */
  public convertCurrency(options: CurrencyConversionOptions): number {
    const { fromCurrency, toCurrency, amount } = options;

    // If both currencies are the same, return the original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Get exchange rates (relative to USD)
    const fromRate = this.exchangeRates[fromCurrency] || 1;
    const toRate = this.exchangeRates[toCurrency] || 1;

    // Convert via USD as base currency
    // First convert to USD, then to target currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;

    return convertedAmount;
  }

  /**
   * Format currency amount with proper symbol and decimal places
   */
  public formatCurrency(amount: number, currency: string): string {
    const currencySymbol = this.getCurrencySymbol(currency);
    
    // Format based on currency type
    if (['BTC', 'ETH'].includes(currency)) {
      // Cryptocurrencies typically have more decimal places
      return `${currencySymbol}${amount.toFixed(8)}`;
    } else {
      // Fiat currencies typically have 2 decimal places
      return `${currencySymbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Get currency symbol based on currency code
   */
  public getCurrencySymbol(currency: string): string {
    switch (currency.toUpperCase()) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'JPY':
        return '¥';
      case 'BTC':
        return '₿';
      case 'ETH':
        return 'Ξ';
      case 'USDT':
      case 'USDC':
        return '₮';
      default:
        return currency + ' '; // Fallback to currency code
    }
  }

  /**
   * Get all supported currencies
   */
  public getSupportedCurrencies(): string[] {
    return Object.keys(this.exchangeRates);
  }

  /**
   * Update exchange rates (in a real app, this would fetch from an API)
   */
  public updateExchangeRates(rates: Record<string, number>): void {
    this.exchangeRates = { ...this.exchangeRates, ...rates };
  }

  /**
   * Get exchange rate between two currencies
   */
  public getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const fromRate = this.exchangeRates[fromCurrency] || 1;
    const toRate = this.exchangeRates[toCurrency] || 1;

    // Calculate rate from fromCurrency to toCurrency
    return (toRate / fromRate);
  }
}

// Create a singleton instance
export const currencyService = CurrencyService.getInstance();