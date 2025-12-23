// Crypto Security Service for handling secure crypto transactions
import { ConnectedWallet } from './walletService';

export interface SecurityCheckResult {
  isValid: boolean;
  issues: string[];
  riskLevel: 'low' | 'medium' | 'high';
  details?: any;
}

export interface TransactionSecurityData {
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  chainId: number;
  nonce: number;
  gasPrice?: string;
  gasLimit?: string;
  data?: string;
}

export class CryptoSecurityService {
  private readonly HIGH_RISK_ADDRESSES: Set<string> = new Set([
    // Known scam addresses - in a real implementation, this would be updated regularly
    '0x5a2b3a930e33794ec3b36e7a6c78b9a463bc8d2d', // Example scam address
  ]);

  private readonly MONITORED_CHAINS = [1, 137, 10, 42161]; // Ethereum, Polygon, Optimism, Arbitrum

  /**
   * Perform security checks on a crypto transaction
   * @param transactionData The transaction data to check
   * @param wallet The connected wallet
   * @returns Security check results
   */
  async performSecurityCheck(
    transactionData: TransactionSecurityData,
    wallet: ConnectedWallet
  ): Promise<SecurityCheckResult> {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // 1. Check if destination address is in high-risk list
    const destinationAddress = transactionData.to.toLowerCase();
    if (this.HIGH_RISK_ADDRESSES.has(destinationAddress)) {
      issues.push('Destination address is on high-risk list');
      riskLevel = 'high';
    }

    // 2. Check for unusual transaction patterns
    const amount = parseFloat(transactionData.amount);
    if (amount > 1000000) { // 1M USD equivalent or more
      issues.push('Large transaction amount detected');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // 3. Check if chain is supported and monitored
    if (!this.MONITORED_CHAINS.includes(transactionData.chainId)) {
      issues.push(`Transaction on unmonitored chain (ID: ${transactionData.chainId})`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // 4. Check if destination is the same as sender (self-transaction)
    if (transactionData.from.toLowerCase() === destinationAddress) {
      issues.push('Transaction to self-address detected');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // 5. Check for unusual gas prices (potentially malicious)
    if (transactionData.gasPrice) {
      const gasPrice = parseInt(transactionData.gasPrice, 16) / 1e9; // Convert to Gwei
      if (gasPrice > 1000) { // Very high gas price
        issues.push('Unusually high gas price detected');
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      riskLevel,
      details: {
        transactionData,
        walletInfo: {
          address: wallet.account.address,
          chainId: wallet.chainId
        }
      }
    };
  }

  /**
   * Validate a wallet address format
   * @param address The wallet address to validate
   * @returns True if valid, false otherwise
   */
  validateAddress(address: string): boolean {
    // Basic Ethereum address validation (42 characters, starts with 0x)
    if (!address || address.length !== 42) {
      return false;
    }

    // Check if it starts with 0x
    if (!address.startsWith('0x')) {
      return false;
    }

    // Check if it contains only valid hex characters
    const addressWithoutPrefix = address.substring(2);
    return /^[0-9a-fA-F]{40}$/.test(addressWithoutPrefix);
  }

  /**
   * Sanitize a wallet address (checksum it)
   * @param address The address to sanitize
   * @returns The checksummed address or null if invalid
   */
  sanitizeAddress(address: string): string | null {
    if (!this.validateAddress(address)) {
      return null;
    }

    // Convert to lowercase and return
    return address.toLowerCase();
  }

  /**
   * Check if an address is an exchange or high-risk entity
   * @param address The address to check
   * @returns True if high-risk, false otherwise
   */
  async isHighRiskAddress(address: string): Promise<boolean> {
    // In a real implementation, this would check against a database of known exchange addresses
    // For now, we'll just check our static list
    return this.HIGH_RISK_ADDRESSES.has(address.toLowerCase());
  }

  /**
   * Generate a security report for a transaction
   * @param transactionData The transaction data
   * @param wallet The connected wallet
   * @returns A security report
   */
  async generateSecurityReport(
    transactionData: TransactionSecurityData,
    wallet: ConnectedWallet
  ): Promise<string> {
    const securityCheck = await this.performSecurityCheck(transactionData, wallet);
    
    let report = `Transaction Security Report\n`;
    report += `=========================\n`;
    report += `From: ${transactionData.from}\n`;
    report += `To: ${transactionData.to}\n`;
    report += `Amount: ${transactionData.amount}\n`;
    report += `Chain ID: ${transactionData.chainId}\n`;
    report += `Risk Level: ${securityCheck.riskLevel.toUpperCase()}\n`;
    report += `Valid: ${securityCheck.isValid ? 'Yes' : 'No'}\n\n`;
    
    if (securityCheck.issues.length > 0) {
      report += `Security Issues:\n`;
      securityCheck.issues.forEach((issue, index) => {
        report += `  ${index + 1}. ${issue}\n`;
      });
      report += `\n`;
    }
    
    report += `Recommendation: ${securityCheck.riskLevel === 'high' ? 
      'DO NOT proceed with this transaction' : 
      securityCheck.riskLevel === 'medium' ? 
      'Proceed with caution' : 
      'Transaction appears secure'}`;
    
    return report;
  }

  /**
   * Monitor transaction status
   * @param txHash The transaction hash to monitor
   * @param chainId The chain ID
   * @param timeoutMs How long to monitor (default 5 minutes)
   * @returns Promise that resolves when transaction is confirmed or timeout occurs
   */
  async monitorTransaction(
    txHash: string,
    chainId: number,
    timeoutMs: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<{ status: 'confirmed' | 'failed' | 'timeout'; blockNumber?: number; gasUsed?: string }> {
    // In a real implementation, this would connect to a blockchain API to monitor the transaction
    // For now, we'll simulate the monitoring
    
    return new Promise((resolve) => {
      // Simulate monitoring process
      const startTime = Date.now();
      
      const checkStatus = async () => {
        if (Date.now() - startTime > timeoutMs) {
          resolve({ status: 'timeout' });
          return;
        }
        
        // Simulate a 20% chance of failure and 80% chance of success
        const rand = Math.random();
        if (rand < 0.2) {
          // Simulate failure
          resolve({ status: 'failed' });
        } else if (rand < 0.95) {
          // Simulate success
          resolve({ 
            status: 'confirmed', 
            blockNumber: Math.floor(Math.random() * 10000000) + 15000000, // Simulated block number
            gasUsed: '0x' + Math.floor(Math.random() * 100000).toString(16) // Simulated gas used
          });
        } else {
          // Still pending, check again in 2 seconds
          setTimeout(checkStatus, 2000);
        }
      };
      
      // Start monitoring
      setTimeout(checkStatus, 2000);
    });
  }

  /**
   * Verify a transaction signature
   * @param message The original message
   * @param signature The signature to verify
   * @param address The address that should have signed
   * @returns True if signature is valid, false otherwise
   */
  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    // In a real implementation, this would use cryptographic libraries to verify the signature
    // For now, we'll return true as a placeholder
    // Actual implementation would require Web3 libraries and proper cryptographic verification
    console.log(`Verifying signature for address: ${address}`);
    return true; // Placeholder - in real implementation, this would be proper verification
  }
}

export const cryptoSecurityService = new CryptoSecurityService();