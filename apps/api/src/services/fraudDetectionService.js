// Fraud detection system for identifying suspicious activities
const { User, Transaction, Project, Dispute } = require('../db/sequelizeModels');
const { logger } = require('../middleware/logging');
const { auditService } = require('./auditService');

class FraudDetectionService {
  constructor() {
    this.fraudRules = [
      this.checkHighFrequencyTransactions,
      this.checkUnusualAmounts,
      this.checkMultipleFailures,
      this.checkNewAccountAbuse,
      this.checkGeolocationAnomalies
    ];
    
    this.suspiciousActivityThreshold = parseInt(process.env.FRAUD_THRESHOLD) || 5;
    this.enabled = process.env.FRAUD_DETECTION_ENABLED !== 'false';
  }

  // Main method to check if an activity is potentially fraudulent
  async checkForFraud(activityType, data, context = {}) {
    if (!this.enabled) {
      return { isFraud: false, riskScore: 0, reasons: [] };
    }

    try {
      const results = await Promise.all(
        this.fraudRules.map(rule => rule.call(this, activityType, data, context))
      );

      const flaggedResults = results.filter(result => result.flagged);
      const totalRiskScore = flaggedResults.reduce((sum, result) => sum + result.riskScore, 0);

      const isFraud = totalRiskScore >= this.suspiciousActivityThreshold;
      const reasons = flaggedResults.map(result => result.reason);

      if (isFraud) {
        logger.warn('FRAUD ALERT: Suspicious activity detected', {
          activityType,
          userId: data.userId || context.userId,
          riskScore: totalRiskScore,
          reasons,
          totalRiskScore,
          threshold: this.suspiciousActivityThreshold
        });

        // Log fraud alert to audit trail
        await auditService.logEvent(
          'FRAUD_ALERT',
          data.userId || context.userId,
          activityType,
          data.entityId || context.entityId,
          {
            riskScore: totalRiskScore,
            reasons,
            activityData: data,
            context
          }
        );
      }

      return {
        isFraud,
        riskScore: totalRiskScore,
        reasons,
        details: flaggedResults
      };
    } catch (error) {
      logger.error('Error in fraud detection system', { error: error.message });
      return { isFraud: false, riskScore: 0, reasons: [] };
    }
  }

  // Rule 1: Check for high frequency transactions
  async checkHighFrequencyTransactions(activityType, data, context) {
    if (activityType !== 'payment' && activityType !== 'transaction') {
      return { flagged: false, riskScore: 0, reason: null };
    }

    const userId = data.userId || context.userId;
    if (!userId) return { flagged: false, riskScore: 0, reason: null };

    try {
      // Check for multiple transactions from same user in short time period
      const timeWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
      const timeThreshold = new Date(Date.now() - timeWindow);

      const { Op } = require('sequelize');

      const recentTransactions = await Transaction.count({
        where: {
          from: userId,
          createdAt: { [Op.gte]: timeThreshold }
        }
      });

      if (recentTransactions > 5) { // More than 5 transactions in 15 minutes
        return {
          flagged: true,
          riskScore: 3,
          reason: `High frequency of ${recentTransactions} transactions in 15 minutes`
        };
      }

      return { flagged: false, riskScore: 0, reason: null };
    } catch (error) {
      logger.error('Error in high frequency check', { error: error.message });
      return { flagged: false, riskScore: 0, reason: null };
    }
  }

  // Rule 2: Check for unusual amounts
  async checkUnusualAmounts(activityType, data, context) {
    if (!data.amount) return { flagged: false, riskScore: 0, reason: null };

    // Define unusual amount thresholds based on activity type
    let threshold;
    switch (activityType) {
      case 'payment':
      case 'deposit':
        threshold = 1000000; // $10,000 in cents
        break;
      case 'milestone_release':
        threshold = 500000; // $5,000 in cents
        break;
      default:
        threshold = 500000; // $5,000 in cents
    }

    if (data.amount > threshold) {
      return {
        flagged: true,
        riskScore: 4,
        reason: `Unusually high amount of $${(data.amount / 100).toFixed(2)}`
      };
    }

    return { flagged: false, riskScore: 0, reason: null };
  }

  // Rule 3: Check for multiple failures
  async checkMultipleFailures(activityType, data, context) {
    const userId = data.userId || context.userId;
    if (!userId) return { flagged: false, riskScore: 0, reason: null };

    try {
      // Count recent failed attempts
      const timeWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
      const timeThreshold = new Date(Date.now() - timeWindow);

      let failedCount = 0;
      
      // Check for failed transactions
      if (activityType === 'payment' || activityType === 'transaction') {
        const { Op } = require('sequelize');
        failedCount = await Transaction.count({
          where: {
            from: userId,
            status: 'FAILED',
            createdAt: { [Op.gte]: timeThreshold }
          }
        });
      }

      // Check for failed login attempts (would come from auth logs)
      // This is a simplified version - in real app you'd have auth logs

      if (failedCount > 3) {
        return {
          flagged: true,
          riskScore: 2,
          reason: `Multiple (${failedCount}) failed attempts in last 30 minutes`
        };
      }

      return { flagged: false, riskScore: 0, reason: null };
    } catch (error) {
      logger.error('Error in multiple failures check', { error: error.message });
      return { flagged: false, riskScore: 0, reason: null };
    }
  }

  // Rule 4: Check for new account abuse
  async checkNewAccountAbuse(activityType, data, context) {
    const userId = data.userId || context.userId;
    if (!userId) return { flagged: false, riskScore: 0, reason: null };

    try {
      const user = await User.findByPk(userId);
      if (!user) return { flagged: false, riskScore: 0, reason: null };

      const accountAge = new Date() - new Date(user.createdAt);
      const accountAgeInHours = accountAge / (1000 * 60 * 60);

      // If account is less than 24 hours old and making large transactions
      if (accountAgeInHours < 24 && data.amount && data.amount > 100000) { // $1,000 in cents
        return {
          flagged: true,
          riskScore: 3,
          reason: `New account (${Math.round(accountAgeInHours)} hours old) attempting large transaction`
        };
      }

      return { flagged: false, riskScore: 0, reason: null };
    } catch (error) {
      logger.error('Error in new account check', { error: error.message });
      return { flagged: false, riskScore: 0, reason: null };
    }
  }

  // Rule 5: Check for geolocation anomalies (simplified)
  async checkGeolocationAnomalies(activityType, data, context) {
    // This is a simplified check - in real implementation you'd:
    // 1. Store user's typical locations
    // 2. Compare current request location to historical locations
    // 3. Flag significant geolocation changes in short time periods

    // For now, we'll just check if there's suspicious location data
    if (context.ipAddress && context.previousLocations) {
      // Check if IP is from a known suspicious country/network
      // This would require a list of suspicious IPs/locations
      
      // For demo purposes, return no flag
      return { flagged: false, riskScore: 0, reason: null };
    }

    return { flagged: false, riskScore: 0, reason: null };
  }

  // Real-time fraud check for transactions
  async checkTransactionFraud(transactionData) {
    return await this.checkForFraud('payment', transactionData, {
      userId: transactionData.from,
      entityId: transactionData._id || transactionData.id
    });
  }

  // Real-time fraud check for user registration
  async checkRegistrationFraud(userData, context = {}) {
    return await this.checkForFraud('registration', userData, context);
  }

  // Real-time fraud check for login
  async checkLoginFraud(userData, context = {}) {
    return await this.checkForFraud('login', userData, context);
  }

  // Score a dispute for fraud potential
  async checkDisputeFraud(disputeData, context = {}) {
    return await this.checkForFraud('dispute', disputeData, context);
  }

  // Batch fraud check for multiple activities (useful for analysis)
  async batchCheckFraud(activities) {
    const results = await Promise.all(
      activities.map(activity => 
        this.checkForFraud(activity.type, activity.data, activity.context)
      )
    );

    return activities.map((activity, index) => ({
      ...activity,
      fraudCheck: results[index]
    }));
  }

  // Get fraud statistics for admin panel
  async getFraudStats() {
    if (!this.enabled) {
      return { enabled: false };
    }

    try {
      // Count fraud alerts in the last 24 hours
      const timeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // In real implementation, you'd have a fraud alerts table
      // For now, just return basic structure
      return {
        enabled: this.enabled,
        threshold: this.suspiciousActivityThreshold,
        rulesCount: this.fraudRules.length,
        last24Hours: 0, // Placeholder
        totalFlagged: 0, // Placeholder
        mostFlaggedActivity: 'N/A' // Placeholder
      };
    } catch (error) {
      logger.error('Error getting fraud stats', { error: error.message });
      return { enabled: false, error: error.message };
    }
  }
}

module.exports = new FraudDetectionService();
module.exports.FraudDetectionService = FraudDetectionService;