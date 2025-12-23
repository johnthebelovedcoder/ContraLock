const express = require('express');
const stripeService = require('../services/paymentService');
const authenticateToken = require('../middleware/auth');
const { Transaction } = require('../models/modelManager');
const { User, Project } = require('../models/modelManager'); // Import models to update project/transaction status

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeService.verifyWebhookSignature(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Process the webhook event
    const result = await stripeService.processWebhookEvent(event);
    
    // Handle specific event types that require database updates
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;
        
      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;
        
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
        
      case 'payout.paid':
      case 'payout.failed':
        await handlePayoutEvent(event);
        break;
        
      default:
        // Log unhandled event types
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Send response
    res.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// Helper function to handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Update transaction status in database
    const transaction = await Transaction.findOne({
      where: { providerTransactionId: paymentIntent.id }
    });
    
    if (transaction) {
      transaction.status = 'COMPLETED';
      await transaction.save();
      
      // Update project escrow status if this was a deposit
      if (transaction.type === 'DEPOSIT' && transaction.projectId) {
        const project = await Project.findById(transaction.projectId);
        if (project) {
          project.escrow.status = 'HELD';
          await project.save();
        }
      }
    }
    
    console.log(`Payment intent ${paymentIntent.id} marked as completed in database`);
  } catch (error) {
    console.error('Error updating transaction for payment intent succeeded:', error);
  }
}

// Helper function to handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    // Update transaction status in database
    const transaction = await Transaction.findOne({
      where: { providerTransactionId: paymentIntent.id }
    });
    
    if (transaction) {
      transaction.status = 'FAILED';
      await transaction.save();
      
      // Update project status if needed
      if (transaction.type === 'DEPOSIT' && transaction.projectId) {
        const project = await Project.findById(transaction.projectId);
        if (project) {
          project.status = 'AWAITING_DEPOSIT'; // Keep in deposit state
          await project.save();
        }
      }
    }
    
    console.log(`Payment intent ${paymentIntent.id} marked as failed in database`);
  } catch (error) {
    console.error('Error updating transaction for payment intent failed:', error);
  }
}

// Helper function to handle charge succeeded
async function handleChargeSucceeded(charge) {
  try {
    // Update transaction for the charge
    const transaction = await Transaction.findOne({
      where: { providerTransactionId: charge.id }
    });
    
    if (transaction) {
      transaction.status = 'COMPLETED';
      await transaction.save();
    }
    
    console.log(`Charge ${charge.id} marked as completed in database`);
  } catch (error) {
    console.error('Error updating transaction for charge succeeded:', error);
  }
}

// Helper function to handle charge failed
async function handleChargeFailed(charge) {
  try {
    // Update transaction for the failed charge
    const transaction = await Transaction.findOne({
      where: { providerTransactionId: charge.id }
    });
    
    if (transaction) {
      transaction.status = 'FAILED';
      await transaction.save();
    }
    
    console.log(`Charge ${charge.id} marked as failed in database`);
  } catch (error) {
    console.error('Error updating transaction for charge failed:', error);
  }
}

// Helper function to handle transfer created
async function handleTransferCreated(transfer) {
  try {
    // Update transaction related to the transfer
    const transaction = await Transaction.findOne({
      where: { providerTransactionId: transfer.id }
    });
    
    if (transaction) {
      transaction.status = 'COMPLETED';
      await transaction.save();
      
      // Update project escrow status if this was a milestone release
      if (transaction.type === 'MILESTONE_RELEASE' && transaction.projectId) {
        const project = await Project.findById(transaction.projectId);
        if (project) {
          project.escrow.totalReleased = project.escrow.totalReleased + transfer.amount;
          project.escrow.remaining = project.escrow.remaining - transfer.amount;
          await project.save();
        }
      }
    }
    
    console.log(`Transfer ${transfer.id} marked as completed in database`);
  } catch (error) {
    console.error('Error updating transaction for transfer created:', error);
  }
}

// Helper function to handle payout events
async function handlePayoutEvent(event) {
  try {
    const payout = event.data.object;
    
    // Update any related transaction records
    const transactions = await Transaction.find({
      where: { providerTransactionId: payout.id }
    });
    
    for (const transaction of transactions) {
      if (event.type === 'payout.paid') {
        transaction.status = 'COMPLETED';
      } else if (event.type === 'payout.failed') {
        transaction.status = 'FAILED';
      }
      await transaction.save();
    }
    
    console.log(`Payout ${payout.id} status updated in database: ${event.type.split('.')[1]}`);
  } catch (error) {
    console.error('Error updating transaction for payout event:', error);
  }
}

module.exports = router;