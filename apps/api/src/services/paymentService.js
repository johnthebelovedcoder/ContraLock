const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  // Enhanced error handling wrapper
  async handleStripeError(error, operation) {
    logger.error(`Stripe ${operation} error:`, {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      statusCode: error.statusCode,
    });

    // Map Stripe-specific error codes to user-friendly messages
    let userMessage = 'An unexpected error occurred during payment processing';
    if (error.type === 'StripeCardError') {
      userMessage = error.message;
    } else if (error.code === 'card_declined') {
      userMessage = 'Your card was declined. Please use a different payment method.';
    } else if (error.code === 'insufficient_funds') {
      userMessage = 'Your card has insufficient funds.';
    } else if (error.code === 'expired_card') {
      userMessage = 'Your card has expired.';
    } else if (error.code === 'incorrect_cvc') {
      userMessage = 'Incorrect card security code.';
    } else if (error.code === 'processing_error') {
      userMessage = 'An error occurred while processing your card. Please try again.';
    }

    const paymentError = new Error(userMessage);
    paymentError.originalError = error;
    paymentError.stripeError = {
      type: error.type,
      code: error.code,
      param: error.param,
      message: error.message,
      statusCode: error.statusCode
    };

    throw paymentError;
  }

  // Create a payment intent for client deposits
  async createPaymentIntent(amount, currency = 'usd', description = 'Project deposit', paymentMethodId, customerId, metadata = {}, paymentMethodType = null) {
    try {
      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // For crypto payments, we might not have a payment method ID yet
      if (!paymentMethodId && !paymentMethodType) {
        throw new Error('Payment method ID or payment method type is required');
      }

      // Convert amount to smallest currency unit based on currency
      let amountInSmallestUnit;
      switch (currency.toUpperCase()) {
        case 'JPY':
          // JPY has no decimal places (0 decimal places)
          amountInSmallestUnit = Math.round(amount);
          break;
        case 'BTC':
          // Bitcoin uses 8 decimal places (satoshi)
          amountInSmallestUnit = Math.round(amount * 100000000);
          break;
        case 'ETH':
          // Ethereum uses 18 decimal places (wei)
          amountInSmallestUnit = Math.round(amount * 1000000000000000000);
          break;
        default:
          // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
          amountInSmallestUnit = Math.round(amount * 100);
      }

      // Build payment intent parameters
      const params = {
        amount: amountInSmallestUnit,
        currency,
        description,
        customer: customerId,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
        },
      };

      // Different handling for crypto vs traditional payments
      if (paymentMethodType === 'crypto') {
        // For crypto payments, use payment method types that include crypto
        params.payment_method_types = ['card', 'crypto'];
        params.confirm = false; // Don't auto-confirm for crypto, let user complete the process
        params.capture_method = 'automatic';

        // Add automatic payment methods for crypto
        params.automatic_payment_methods = {
          enabled: true,
        };
      } else {
        // Traditional payment method
        if (!paymentMethodId) {
          throw new Error('Payment method ID is required for non-crypto payments');
        }
        params.payment_method = paymentMethodId;
        params.confirm = true;
        params.capture_method = 'automatic'; // Immediately capture funds into Stripe Connect

        // Add automatic payment methods if needed
        params.automatic_payment_methods = {
          enabled: true,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(params);

      logger.info('Payment intent created successfully', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethodType
      });

      return paymentIntent;
    } catch (error) {
      await this.handleStripeError(error, 'createPaymentIntent');
    }
  }

  // Create a customer in Stripe
  async createCustomer(email, name, paymentMethodId, metadata = {}) {
    try {
      if (!email || !name) {
        throw new Error('Email and name are required');
      }

      const customer = await stripe.customers.create({
        email,
        name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
        },
      });

      logger.info('Stripe customer created successfully', {
        customerId: customer.id,
        email: customer.email,
      });

      return customer;
    } catch (error) {
      await this.handleStripeError(error, 'createCustomer');
    }
  }

  // Create a connected account for freelancers (for payouts)
  async createConnectedAccount(accountData) {
    try {
      if (!accountData.email || !accountData.firstName || !accountData.lastName) {
        throw new Error('Email, first name, and last name are required');
      }

      const account = await stripe.accounts.create({
        country: accountData.country || 'US',
        type: 'custom',
        business_type: 'individual',
        individual: {
          first_name: accountData.firstName,
          last_name: accountData.lastName,
          email: accountData.email,
          address: {
            line1: accountData.addressLine1,
            city: accountData.city,
            postal_code: accountData.postalCode,
            state: accountData.state,
            country: accountData.country || 'US',
          },
          phone: accountData.phone,
          ssn_last_4: accountData.ssnLast4,
          dob: {
            day: accountData.dobDay,
            month: accountData.dobMonth,
            year: accountData.dobYear,
          },
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: accountData.ipAddress,
        },
        requested_capabilities: ['card_payments', 'transfers'],
        metadata: {
          createdAt: new Date().toISOString(),
          ...accountData.metadata,
        },
      });

      logger.info('Connected account created successfully', {
        accountId: account.id,
        email: account.email,
      });

      return account;
    } catch (error) {
      await this.handleStripeError(error, 'createConnectedAccount');
    }
  }

  // Perform transfer to freelancer's connected account
  async transferToFreelancer(amount, destinationAccountId, description = 'Project milestone payment', metadata = {}) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!destinationAccountId) {
        throw new Error('Destination account ID is required');
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: destinationAccountId,
        description,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
        },
      });

      logger.info('Transfer to freelancer completed successfully', {
        transferId: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
      });

      return transfer;
    } catch (error) {
      await this.handleStripeError(error, 'transferToFreelancer');
    }
  }

  // Create payout to external account
  async createPayout(amount, destination, currency = 'usd', metadata = {}) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!destination) {
        throw new Error('Destination is required');
      }

      const payout = await stripe.payouts.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        destination, // Bank account or debit card ID
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
        },
      });

      logger.info('Payout created successfully', {
        payoutId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        destination: payout.destination,
      });

      return payout;
    } catch (error) {
      await this.handleStripeError(error, 'createPayout');
    }
  }

  // Enhanced webhook verification with proper error handling
  async verifyWebhookSignature(payload, signature, secret = this.webhookSecret) {
    if (!secret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);

      logger.info('Webhook event verified successfully', {
        eventId: event.id,
        eventType: event.type,
        createdAt: new Date().toISOString(),
      });

      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // Enhanced refund method with better validation
  async refundPayment(paymentIntentId, amount = null, reason = null) {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }

      const refundParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        if (amount <= 0) {
          throw new Error('Refund amount must be greater than 0');
        }
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      if (reason) {
        refundParams.reason = reason;
      }

      const refund = await stripe.refunds.create(refundParams);

      logger.info('Refund created successfully', {
        refundId: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount,
        status: refund.status,
      });

      return refund;
    } catch (error) {
      await this.handleStripeError(error, 'refundPayment');
    }
  }

  // Retrieve payment intent details
  async retrievePaymentIntent(paymentIntentId) {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      logger.info('Payment intent retrieved successfully', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      await this.handleStripeError(error, 'retrievePaymentIntent');
    }
  }

  // Retrieve transfer details
  async retrieveTransfer(transferId) {
    try {
      if (!transferId) {
        throw new Error('Transfer ID is required');
      }

      const transfer = await stripe.transfers.retrieve(transferId);

      logger.info('Transfer retrieved successfully', {
        transferId: transfer.id,
        status: transfer.status,
      });

      return transfer;
    } catch (error) {
      await this.handleStripeError(error, 'retrieveTransfer');
    }
  }

  // Process webhook events
  async processWebhookEvent(event) {
    try {
      logger.info('Processing webhook event', {
        eventId: event.id,
        eventType: event.type,
        createdAt: new Date().toISOString(),
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          logger.info('Payment intent succeeded', {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
          });
          break;

        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          logger.error('Payment intent failed', {
            paymentIntentId: failedPaymentIntent.id,
            amount: failedPaymentIntent.amount,
            lastPaymentError: failedPaymentIntent.last_payment_error,
          });
          break;

        case 'charge.succeeded':
          const charge = event.data.object;
          logger.info('Charge succeeded', {
            chargeId: charge.id,
            amount: charge.amount,
            paymentIntentId: charge.payment_intent,
          });
          break;

        case 'charge.failed':
          const failedCharge = event.data.object;
          logger.error('Charge failed', {
            chargeId: failedCharge.id,
            amount: failedCharge.amount,
            reason: failedCharge.failure_code,
            paymentIntentId: failedCharge.payment_intent,
          });
          break;

        case 'transfer.created':
          const transfer = event.data.object;
          logger.info('Transfer created', {
            transferId: transfer.id,
            amount: transfer.amount,
            destination: transfer.destination,
          });
          break;

        case 'payout.paid':
        case 'payout.failed':
          const payout = event.data.object;
          logger.info(`Payout ${event.type.split('.')[1]}`, {
            payoutId: payout.id,
            amount: payout.amount,
            status: payout.status,
          });
          break;

        default:
          logger.info('Unhandled webhook event type', {
            eventType: event.type,
          });
          break;
      }

      return { success: true, eventType: event.type };
    } catch (error) {
      logger.error('Error processing webhook event', {
        eventId: event.id,
        eventType: event.type,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  // Create source for one-time payments (deprecated - using Payment Methods instead)
  async createSourceForPayment(sourceData) {
    try {
      if (!sourceData.number || !sourceData.exp_month || !sourceData.exp_year || !sourceData.cvc) {
        throw new Error('Card details are required');
      }

      const source = await stripe.sources.create({
        type: 'card',
        card: {
          number: sourceData.number,
          exp_month: sourceData.exp_month,
          exp_year: sourceData.exp_year,
          cvc: sourceData.cvc,
        },
        owner: {
          email: sourceData.email,
          name: sourceData.name,
        },
      });

      logger.info('Source created successfully', {
        sourceId: source.id,
        type: source.type,
      });

      return source;
    } catch (error) {
      await this.handleStripeError(error, 'createSourceForPayment');
    }
  }

  // Create payment method (modern approach)
  async createPaymentMethod(cardDetails, customerId = null) {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: cardDetails,
        ...(customerId && { customer: customerId }),
      });

      logger.info('Payment method created successfully', {
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
      });

      return paymentMethod;
    } catch (error) {
      await this.handleStripeError(error, 'createPaymentMethod');
    }
  }

  // Setup intent for saving payment methods
  async createSetupIntent(customerId, paymentMethodTypes = ['card']) {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        return_url: process.env.STRIPE_RETURN_URL || 'http://localhost:3000',
      });

      logger.info('Setup intent created successfully', {
        setupIntentId: setupIntent.id,
        paymentMethodTypes,
      });

      return setupIntent;
    } catch (error) {
      await this.handleStripeError(error, 'createSetupIntent');
    }
  }

  // Create a crypto payment intent specifically
  async createCryptoPaymentIntent(amount, currency = 'usd', description = 'Project deposit', customerId, metadata = {}) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
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
      await this.handleStripeError(error, 'createCryptoPaymentIntent');
    }
  }

  // Handle crypto payment webhook events
  async processCryptoWebhookEvent(event) {
    try {
      logger.info('Processing crypto payment webhook event', {
        eventId: event.id,
        eventType: event.type,
        createdAt: new Date().toISOString(),
      });

      switch (event.type) {
        case 'payment_intent.partially_funded':
          const paymentIntent = event.data.object;
          logger.info('Payment partially funded with crypto', {
            paymentIntentId: paymentIntent.id,
            amountReceived: paymentIntent.amount_received,
            amountRemaining: paymentIntent.amount,
          });
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
          // Handle with standard webhook processor
          return await this.processWebhookEvent(event);
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
}

module.exports = new PaymentService();