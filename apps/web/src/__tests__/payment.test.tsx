import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedDepositForm } from '@/components/payments/EnhancedDepositForm';
import { CurrencySelector } from '@/components/payments/CurrencySelector';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { currencyService } from '@/lib/services/currencyService';
import { walletService } from '@/lib/services/walletService';
import { cryptoSecurityService } from '@/lib/services/cryptoSecurityService';

// Mock the services
vi.mock('@/lib/services/currencyService', () => ({
  currencyService: {
    convert: vi.fn(),
    getExchangeRate: vi.fn(),
    formatAmount: vi.fn(),
    getSupportedCurrencies: vi.fn(),
    isCurrencySupported: vi.fn(),
    getCurrencyInfo: vi.fn(),
  },
  SUPPORTED_CURRENCIES: [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, type: 'fiat' },
    { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, type: 'fiat' },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimals: 8, type: 'crypto' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimals: 18, type: 'crypto' },
  ],
}));

vi.mock('@/lib/services/walletService', () => ({
  walletService: {
    connectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    getConnectedWallet: vi.fn(),
    isConnected: vi.fn(),
    addWalletListener: vi.fn(),
    sendTransaction: vi.fn(),
    signMessage: vi.fn(),
    getBalance: vi.fn(),
    switchNetwork: vi.fn(),
    addNetwork: vi.fn(),
  },
}));

vi.mock('@/lib/services/cryptoSecurityService', () => ({
  cryptoSecurityService: {
    performSecurityCheck: vi.fn(),
    validateAddress: vi.fn(),
    sanitizeAddress: vi.fn(),
    isHighRiskAddress: vi.fn(),
    generateSecurityReport: vi.fn(),
    monitorTransaction: vi.fn(),
    verifySignature: vi.fn(),
  },
}));

// Mock the payment store
vi.mock('@/lib/store', async () => {
  const actual = await vi.importActual('@/lib/store');
  return {
    ...actual,
    usePaymentStore: vi.fn(() => ({
      depositFunds: vi.fn(),
    })),
  };
});

describe('Multi-Currency Payment System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock default return values
    vi.mocked(currencyService.convert).mockReturnValue(100);
    vi.mocked(currencyService.getSupportedCurrencies).mockReturnValue([
      { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, type: 'fiat' },
      { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, type: 'fiat' },
      { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimals: 8, type: 'crypto' },
      { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimals: 18, type: 'crypto' },
    ]);
    vi.mocked(currencyService.formatAmount).mockImplementation((amount, currency) => `${currency} ${amount}`);
    vi.mocked(walletService.getConnectedWallet).mockReturnValue(null);
    vi.mocked(walletService.isConnected).mockReturnValue(false);
  });

  describe('Currency Selector Component', () => {
    it('renders with default values', () => {
      render(
        <CurrencySelector
          selectedCurrency="USD"
          amount={100}
          onCurrencyChange={vi.fn()}
          onAmountChange={vi.fn()}
        />
      );

      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('allows currency selection', async () => {
      const onCurrencyChange = vi.fn();
      render(
        <CurrencySelector
          selectedCurrency="USD"
          amount={100}
          onCurrencyChange={onCurrencyChange}
          onAmountChange={vi.fn()}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.mouseDown(selectTrigger);

      const ethOption = screen.getByText('Ξ ETH (Ethereum)');
      fireEvent.click(ethOption);

      expect(onCurrencyChange).toHaveBeenCalledWith('ETH');
    });

    it('displays converted amount when showConversion is true', () => {
      render(
        <CurrencySelector
          selectedCurrency="USD"
          amount={100}
          onCurrencyChange={vi.fn()}
          onAmountChange={vi.fn()}
          showConversion={true}
        />
      );

      expect(screen.getByText(/Equivalent in USD/)).toBeInTheDocument();
    });
  });

  describe('Payment Method Selector Component', () => {
    it('renders with available methods', () => {
      const mockMethods = [
        {
          id: 'card-1',
          type: 'card',
          provider: 'Visa',
          details: '1234',
          isDefault: true,
        },
        {
          id: 'crypto-1',
          type: 'crypto',
          provider: 'MetaMask',
          details: '0x1234...',
          isDefault: false,
        },
      ];

      render(
        <PaymentMethodSelector
          selectedMethod={null}
          onMethodSelect={vi.fn()}
          availableMethods={mockMethods}
        />
      );

      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Visa •••• 1234')).toBeInTheDocument();
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
    });

    it('allows method selection', async () => {
      const onMethodSelect = vi.fn();
      const mockMethods = [
        {
          id: 'card-1',
          type: 'card',
          provider: 'Visa',
          details: '1234',
          isDefault: true,
        },
      ];

      render(
        <PaymentMethodSelector
          selectedMethod={null}
          onMethodSelect={onMethodSelect}
          availableMethods={mockMethods}
        />
      );

      const radio = screen.getByRole('radio', { name: /Visa •••• 1234/ });
      fireEvent.click(radio);

      expect(onMethodSelect).toHaveBeenCalledWith('card-1');
    });
  });

  describe('Enhanced Deposit Form Component', () => {
    it('renders the initial deposit form', () => {
      render(
        <EnhancedDepositForm
          projectId="test-project"
          projectTitle="Test Project"
          projectBudget={50000} // $500 in cents
          onDepositComplete={vi.fn()}
        />
      );

      expect(screen.getByText('Deposit Funds to Escrow')).toBeInTheDocument();
      expect(screen.getByText('Project: Test Project')).toBeInTheDocument();
      expect(screen.getByText('Required deposit: $500.00')).toBeInTheDocument();
    });

    it('allows amount input', async () => {
      render(
        <EnhancedDepositForm
          projectId="test-project"
          projectTitle="Test Project"
          projectBudget={50000}
          onDepositComplete={vi.fn()}
        />
      );

      // Initially shows amount step
      const amountInput = screen.getByRole('spinbutton', { name: /Amount/i });
      fireEvent.change(amountInput, { target: { value: '250' } });

      // Click continue to go to method selection
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      // Verify we moved to method selection
      await waitFor(() => {
        expect(screen.getByText('Select your preferred payment method')).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      render(
        <EnhancedDepositForm
          projectId="test-project"
          projectTitle="Test Project"
          projectBudget={50000}
          onDepositComplete={vi.fn()}
        />
      );

      // Set amount to 0 to trigger validation
      const amountInput = screen.getByRole('spinbutton', { name: /Amount/i });
      fireEvent.change(amountInput, { target: { value: '0' } });

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
      });
    });
  });

  describe('Currency Service', () => {
    it('converts between currencies correctly', () => {
      const result = currencyService.convert(100, 'USD', 'EUR');
      expect(currencyService.convert).toHaveBeenCalledWith(100, 'USD', 'EUR');
    });

    it('formats amounts correctly', () => {
      const result = currencyService.formatAmount(123.456, 'USD');
      expect(currencyService.formatAmount).toHaveBeenCalledWith(123.456, 'USD');
    });

    it('checks if currency is supported', () => {
      const result = currencyService.isCurrencySupported('BTC');
      expect(currencyService.isCurrencySupported).toHaveBeenCalledWith('BTC');
    });
  });

  describe('Wallet Service', () => {
    it('connects to wallet', async () => {
      const connectWallet = vi.fn().mockResolvedValue({
        provider: {},
        account: { address: '0x123', balance: '1000000000000000000', chainId: 1 },
        chainId: 1,
        walletType: 'metamask' as const,
      });
      
      vi.mocked(walletService.connectWallet).mockImplementation(connectWallet);

      await walletService.connectWallet('metamask');
      
      expect(connectWallet).toHaveBeenCalledWith('metamask');
    });

    it('checks connection status', () => {
      const isConnected = walletService.isConnected();
      expect(walletService.isConnected).toHaveBeenCalled();
    });
  });

  describe('Crypto Security Service', () => {
    it('performs security checks on transactions', async () => {
      const mockTransactionData = {
        from: '0x123',
        to: '0x456',
        amount: '1000000000000000000', // 1 ETH in wei
        timestamp: Date.now(),
        chainId: 1,
        nonce: 1,
      };
      
      const mockWallet = {
        provider: {},
        account: { address: '0x123', balance: '1000000000000000000', chainId: 1 },
        chainId: 1,
        walletType: 'metamask' as const,
      };
      
      const securityCheck = await cryptoSecurityService.performSecurityCheck(mockTransactionData, mockWallet);
      
      expect(securityCheck).toHaveProperty('isValid');
      expect(securityCheck).toHaveProperty('issues');
      expect(securityCheck).toHaveProperty('riskLevel');
    });

    it('validates wallet addresses', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      const isValid = cryptoSecurityService.validateAddress(validAddress);
      expect(isValid).toBe(true);
      
      const invalidAddress = 'invalid-address';
      const isInvalid = cryptoSecurityService.validateAddress(invalidAddress);
      expect(isInvalid).toBe(false);
    });
  });
});

// Integration test for the complete flow
describe('Multi-Currency Payment Integration', () => {
  it('completes a full payment flow', async () => {
    // This would test the complete flow of:
    // 1. Selecting currency
    // 2. Entering amount
    // 3. Selecting payment method
    // 4. Reviewing transaction
    // 5. Processing payment
    // 6. Showing success
    
    const onDepositComplete = vi.fn();
    
    render(
      <EnhancedDepositForm
        projectId="test-project"
        projectTitle="Integration Test Project"
        projectBudget={10000} // $100 in cents
        onDepositComplete={onDepositComplete}
      />
    );

    // Step 1: Amount selection (already on this step)
    const amountInput = screen.getByRole('spinbutton', { name: /Amount/i });
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    // Change currency to EUR
    const currencySelect = screen.getByRole('combobox');
    fireEvent.mouseDown(currencySelect);
    fireEvent.click(screen.getByText('€ EUR (Euro)'));
    
    // Click continue to go to method selection
    fireEvent.click(screen.getByText('Continue'));
    
    // Step 2: Method selection
    await waitFor(() => {
      expect(screen.getByText('Select your preferred payment method')).toBeInTheDocument();
    });
    
    // Select a payment method
    const cardMethod = screen.getByRole('radio', { name: /Visa ••••/ });
    fireEvent.click(cardMethod);
    
    // Click continue to go to review
    fireEvent.click(screen.getByText('Continue'));
    
    // Step 3: Review
    await waitFor(() => {
      expect(screen.getByText('Review your payment details')).toBeInTheDocument();
    });
    
    // Click confirm to process
    fireEvent.click(screen.getByText('Confirm & Pay'));
    
    // Wait for processing and success
    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });
    
    // Click to complete
    fireEvent.click(screen.getByText('Continue to Project'));
    
    expect(onDepositComplete).toHaveBeenCalled();
  });
});