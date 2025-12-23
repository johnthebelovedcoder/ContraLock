const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const paymentService = require('./paymentService'); // Import the payment service instance

class CryptoPaymentService {
  constructor() {
    this.paymentService = paymentService;
  }

  /**
   * Create a crypto payment intent for project deposits
   * @param {number} amount - Amount in original currency units
   * @param {string} currency - Currency code (default: 'usd')
   * @param {string} description - Description of the payment
   * @param {string} customerId - Stripe customer ID
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Payment intent object
   */
  async createCryptoPaymentIntent(amount, currency = 'usd', description = 'Project deposit', customerId, metadata = {}) {
    try {
      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // For USD, convert to cents; for other currencies, use appropriate decimal places
      let amountInSmallestUnit;
      switch (currency.toUpperCase()) {
        case 'BTC':
          // Bitcoin uses 8 decimal places (satoshi)
          amountInSmallestUnit = Math.round(amount * 100000000);
          break;
        case 'ETH':
          // Ethereum uses 18 decimal places (wei)
          amountInSmallestUnit = Math.round(amount * 1000000000000000000);
          break;
        case 'JPY':
          // JPY has no decimal places (0 decimal places)
          amountInSmallestUnit = Math.round(amount);
          break;
        default:
          // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
          amountInSmallestUnit = Math.round(amount * 100);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency,
        description,
        customer: customerId,
        payment_method_types: ['crypto'], // Only crypto payment methods
        capture_method: 'automatic',
        metadata: {
          ...metadata,
          paymentType: 'crypto',
          createdAt: new Date().toISOString(),
        },
      });

      logger.info('Crypto payment intent created successfully', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Error creating crypto payment intent:', error);
      throw error;
    }
  }

  /**
   * Process crypto payment confirmation
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Object} Confirmation result
   */
  async confirmCryptoPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'partially_funded') {
        logger.info('Crypto payment confirmed', {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
        });

        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
        };
      } else {
        return {
          success: false,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        };
      }
    } catch (error) {
      logger.error('Error confirming crypto payment:', error);
      throw error;
    }
  }

  /**
   * Handle crypto payment webhook events
   * @param {Object} event - Stripe event object
   * @returns {Object} Process result
   */
  async processCryptoWebhookEvent(event) {
    try {
      logger.info('Processing crypto payment webhook event', {
        eventId: event.id,
        eventType: event.type,
        createdAt: new Date().toISOString(),
      });

      switch (event.type) {
        case 'payment_intent.partially_funded':
          const partiallyFundedIntent = event.data.object;
          logger.info('Crypto payment partially funded', {
            paymentIntentId: partiallyFundedIntent.id,
            amountReceived: partiallyFundedIntent.amount_received,
            amountRemaining: partiallyFundedIntent.amount_remaining,
          });

          // Handle partially funded crypto payments
          // In Delivault context, we might want to hold until full amount is received
          break;

        case 'payment_intent.fully_funded':
          const fullyFundedIntent = event.data.object;
          logger.info('Crypto payment fully funded', {
            paymentIntentId: fullyFundedIntent.id,
            amountReceived: fullyFundedIntent.amount_received,
          });

          // Process the fully funded crypto payment
          break;

        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          logger.error('Crypto payment failed', {
            paymentIntentId: failedPaymentIntent.id,
            amount: failedPaymentIntent.amount,
            lastPaymentError: failedPaymentIntent.last_payment_error,
          });
          break;

        case 'payment_intent.canceled':
          const canceledPayment = event.data.object;
          logger.info('Crypto payment canceled', {
            paymentIntentId: canceledPayment.id,
            cancellationReason: canceledPayment.cancellation_reason,
          });
          break;

        default:
          logger.info('Unhandled crypto webhook event type', {
            eventType: event.type,
          });
          break;
      }

      return { success: true, eventType: event.type };
    } catch (error) {
      logger.error('Error processing crypto webhook event', {
        eventId: event.id,
        eventType: event.type,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Get supported crypto currencies
   * @returns {Array} List of supported cryptocurrencies
   */
  getSupportedCryptoCurrencies() {
    // These are the cryptocurrencies that Stripe currently supports
    return [
      'BTC',  // Bitcoin
      'ETH',  // Ethereum
      'USDC', // USD Coin
      'LTC',  // Litecoin
      'BCH',  // Bitcoin Cash
      'DOGE', // Dogecoin
    ];
  }

  /**
   * Calculate fees for crypto payments
   * In Delivault's model: 
   * - Client pays 1.9% (added to contract value) 
   * - Freelancer pays 3.6% (deducted from release)
   * @param {number} amount - Base amount in USD
   * @returns {Object} Fee breakdown
   */
  calculateCryptoFees(amount) {
    const clientFeePercent = 1.9;   // 1.9% from client (added to contract value)
    const freelancerFeePercent = 3.6; // 3.6% from freelancer (deducted on release)
    
    const clientFee = amount * (clientFeePercent / 100);
    const totalWithClientFee = amount + clientFee;
    
    return {
      originalAmount: amount,
      clientFee: clientFee,
      totalWithClientFee: totalWithClientFee,
      freelancerFeePercent: freelancerFeePercent,
      expectedFreelancerFee: (amount * freelancerFeePercent) / 100, // Based on original amount
      totalEffectiveFeePercent: clientFeePercent + freelancerFeePercent, // ~5.5%
    };
  }

  /**
   * Convert crypto amount to USD
   * @param {number} cryptoAmount - Amount in crypto
   * @param {string} cryptoCurrency - Cryptocurrency code
   * @param {number} exchangeRate - Exchange rate to USD
   * @returns {number} Amount in USD
   */
  convertCryptoToUSD(cryptoAmount, cryptoCurrency, exchangeRate) {
    // This would typically come from a real-time exchange rate API in production
    return cryptoAmount * exchangeRate;
  }

  /**
   * Process crypto payment for project deposit
   * @param {number} amount - Amount in original currency
   * @param {string} projectId - Project ID
   * @param {string} clientId - Client ID
   * @param {string} customerId - Stripe customer ID
   * @param {string} currency - Currency code (default: 'USD')
   * @returns {Object} Payment processing result
   */
  async processCryptoDeposit(amount, projectId, clientId, customerId, currency = 'USD') {
    try {
      // Calculate fees based on Delivault's split fee model
      // Note: fees are always in the base currency of the project
      const fees = this.calculateCryptoFees(amount);

      logger.info('Processing crypto deposit', {
        originalAmount: fees.originalAmount,
        clientFee: fees.clientFee,
        totalWithClientFee: fees.totalWithClientFee,
        projectId,
        clientId,
        currency,
      });

      // Create crypto payment intent
      const paymentIntent = await this.createCryptoPaymentIntent(
        fees.totalWithClientFee, // Amount with client fee added
        currency.toLowerCase(),
        `Crypto deposit for project: ${projectId}`,
        customerId,
        {
          projectId,
          clientId,
          originalAmount: fees.originalAmount,
          clientFee: fees.clientFee,
          currency,
        }
      );

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: fees.totalWithClientFee, // Total amount including client fee
        fees: fees,
        clientFee: fees.clientFee,
        originalProjectAmount: fees.originalAmount,
        clientFeePercent: 1.9,
        currency,
        paymentMethodType: 'crypto',
      };
    } catch (error) {
      logger.error('Error processing crypto deposit:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new CryptoPaymentService();