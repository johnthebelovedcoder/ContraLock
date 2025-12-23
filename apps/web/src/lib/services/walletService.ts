// Wallet service for cryptocurrency integration and platform wallet
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletAccount {
  address: string;
  balance: string;
  chainId: number;
  name?: string;
}

export interface TransactionRequest {
  from: string;
  to: string;
  value: string; // Amount in wei for ETH or smallest unit for other tokens
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface ConnectedWallet {
  provider: any;
  account: WalletAccount;
  chainId: number;
  walletType: 'metamask' | 'coinbase' | 'walletconnect' | 'other';
}

export interface PlatformWallet {
  _id: string;
  userId: string;
  balance: number; // in cents
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  lockedBalance: number; // in cents
  totalDeposited: number; // in cents
  totalWithdrawn: number; // in cents
  createdAt: string;
  updatedAt: string;
  availableBalance: number; // in cents
  totalBalance: number; // in cents
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  type: string;
  amount: number; // in cents
  currency: string;
  fromWallet: string | null;
  toWallet: string | null;
  relatedEntity: string | null;
  relatedEntityId: string | null;
  description: string;
  status: string;
  fees: string | null;
  processedAt: string | null;
  failureReason: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  availableBalance: number; // in cents
  totalBalance: number; // in cents
  lockedBalance: number; // in cents
  currency: string;
}

export class WalletService {
  private connectedWallet: ConnectedWallet | null = null;
  private listeners: Array<(wallet: ConnectedWallet | null) => void> = [];

  /**
   * Connect to a cryptocurrency wallet
   * @param walletType The type of wallet to connect to
   * @returns Promise that resolves to the connected wallet information
   */
  async connectWallet(walletType: 'metamask' | 'coinbase' | 'walletconnect' | 'other' = 'metamask'): Promise<ConnectedWallet> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Wallet connection is only available in browser environments');
    }

    // Check for Ethereum provider (MetaMask, Coinbase Wallet, etc.)
    if (!window.ethereum) {
      throw new Error('No crypto wallet found. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Get current chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });

      // Get account balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      });

      const account: WalletAccount = {
        address: accounts[0],
        balance: balance,
        chainId: parseInt(chainIdHex, 16), // Convert hex to decimal
      };

      // Determine wallet type based on provider properties
      let detectedWalletType: ConnectedWallet['walletType'] = 'other';
      if (window.ethereum.isMetaMask) {
        detectedWalletType = 'metamask';
      } else if (window.ethereum.isCoinbaseWallet) {
        detectedWalletType = 'coinbase';
      } else if (window.ethereum.isWalletConnect) {
        detectedWalletType = 'walletconnect';
      }

      this.connectedWallet = {
        provider: window.ethereum,
        account,
        chainId: parseInt(chainIdHex, 16),
        walletType: detectedWalletType,
      };

      // Set up event listeners for account and chain changes
      this.setupEventListeners();

      // Notify listeners of the connection
      this.notifyListeners(this.connectedWallet);

      return this.connectedWallet;
    } catch (error: any) {
      if (error.code === 4001) {
        // User rejected request
        throw new Error('User rejected wallet connection request');
      } else {
        throw new Error(`Failed to connect wallet: ${error.message}`);
      }
    }
  }

  /**
   * Disconnect the currently connected wallet
   */
  disconnectWallet(): void {
    this.connectedWallet = null;
    this.notifyListeners(null);
  }

  /**
   * Get the currently connected wallet information
   * @returns The connected wallet information or null if not connected
   */
  getConnectedWallet(): ConnectedWallet | null {
    return this.connectedWallet;
  }

  /**
   * Check if a crypto wallet is currently connected
   * @returns True if a wallet is connected, false otherwise
   */
  isConnected(): boolean {
    return this.connectedWallet !== null;
  }

  /**
   * Add a listener for wallet connection/disconnection events
   * @param callback The callback function to call when wallet state changes
   * @returns A function to remove the listener
   */
  addWalletListener(callback: (wallet: ConnectedWallet | null) => void): () => void {
    this.listeners.push(callback);

    // Return a function to remove the listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Send a transaction from the connected wallet
   * @param transaction The transaction to send
   * @returns The transaction hash
   */
  async sendTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected. Please connect a wallet first.');
    }

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });

      return txHash;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected transaction');
      } else {
        throw new Error(`Failed to send transaction: ${error.message}`);
      }
    }
  }

  /**
   * Sign a message with the connected wallet
   * @param message The message to sign
   * @returns The signature
   */
  async signMessage(message: string): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected. Please connect a wallet first.');
    }

    try {
      // Convert message to hex if it's not already
      const messageHex = this.toHex(message);

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageHex, this.connectedWallet.account.address],
      });

      return signature;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected message signature');
      } else {
        throw new Error(`Failed to sign message: ${error.message}`);
      }
    }
  }

  /**
   * Get the balance of the connected wallet for a specific token
   * @param tokenAddress Optional token contract address (for ERC-20 tokens)
   * @returns The balance as a string
   */
  async getBalance(tokenAddress?: string): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected. Please connect a wallet first.');
    }

    try {
      if (tokenAddress) {
        // For ERC-20 tokens, we need to call the token contract
        // This is a simplified implementation - in reality you'd need to interact with the token contract
        throw new Error('Token balance retrieval not fully implemented');
      } else {
        // Get native token balance (ETH)
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [this.connectedWallet.account.address, 'latest'],
        });
        return balance;
      }
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Switch the network to a different chain
   * @param chainId The chain ID to switch to (in decimal)
   */
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected. Please connect a wallet first.');
    }

    try {
      const chainIdHex = '0x' + chainId.toString(16);

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        throw new Error(`Network with chainId ${chainId} not available. Please add it to your wallet.`);
      }
      throw new Error(`Failed to switch network: ${error.message}`);
    }
  }

  /**
   * Add a custom network to the wallet
   * @param network The network configuration
   */
  async addNetwork(network: {
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls?: string[];
  }): Promise<void> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected. Please connect a wallet first.');
    }

    try {
      const networkParams = {
        chainId: '0x' + network.chainId.toString(16),
        chainName: network.chainName,
        rpcUrls: network.rpcUrls,
        nativeCurrency: network.nativeCurrency,
        blockExplorerUrls: network.blockExplorerUrls,
      };

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkParams],
      });
    } catch (error: any) {
      throw new Error(`Failed to add network: ${error.message}`);
    }
  }

  // Platform Wallet Methods

  /**
   * Get the user's platform wallet
   * @returns The user's platform wallet
   */
  async getPlatformWallet(): Promise<PlatformWallet> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wallet');
    }

    return response.json();
  }

  /**
   * Get the user's platform wallet balance
   * @returns The user's wallet balance information
   */
  async getPlatformBalance(): Promise<WalletBalance> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/balance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }

    return response.json();
  }

  /**
   * Create a platform wallet for the user
   * @returns The created platform wallet
   */
  async createPlatformWallet(): Promise<PlatformWallet> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create wallet');
    }

    return response.json();
  }

  /**
   * Deposit funds to the platform wallet
   * @param amount The amount to deposit
   * @param source The source of the deposit
   * @param description Optional description
   * @param externalTransactionId Optional external transaction ID
   * @returns The deposit result
   */
  async depositToPlatformWallet(
    amount: number, 
    source: string, 
    description?: string, 
    externalTransactionId?: string
  ): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        amount, 
        source, 
        description, 
        externalTransactionId 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to deposit');
    }

    return response.json();
  }

  /**
   * Withdraw funds from the platform wallet
   * @param amount The amount to withdraw
   * @param destination The destination for the withdrawal
   * @param description Optional description
   * @param externalTransactionId Optional external transaction ID
   * @returns The withdrawal result
   */
  async withdrawFromPlatformWallet(
    amount: number, 
    destination: string, 
    description?: string, 
    externalTransactionId?: string
  ): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        amount, 
        destination, 
        description, 
        externalTransactionId 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to withdraw');
    }

    return response.json();
  }

  /**
   * Transfer funds between platform wallets
   * @param toUserId The ID of the user to transfer to
   * @param amount The amount to transfer
   * @param description Optional description
   * @returns The transfer result
   */
  async transferBetweenPlatformWallets(
    toUserId: string, 
    amount: number, 
    description?: string
  ): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        toUserId, 
        amount, 
        description 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to transfer');
    }

    return response.json();
  }

  /**
   * Get platform wallet transactions
   * @param type Optional transaction type filter
   * @param relatedEntity Optional related entity filter
   * @param relatedEntityId Optional related entity ID filter
   * @param limit Number of transactions to return
   * @param page Page number for pagination
   * @returns Array of wallet transactions
   */
  async getPlatformTransactions(
    type?: string, 
    relatedEntity?: string, 
    relatedEntityId?: string, 
    limit: number = 20, 
    page: number = 1
  ): Promise<WalletTransaction[]> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (relatedEntity) params.append('relatedEntity', relatedEntity);
    if (relatedEntityId) params.append('relatedEntityId', relatedEntityId);
    params.append('limit', limit.toString());
    params.append('page', page.toString());

    const response = await fetch(`/api/wallet/transactions?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return response.json();
  }

  /**
   * Lock funds in the platform wallet
   * @param amount The amount to lock
   * @param reason Optional reason for locking
   * @returns The updated wallet
   */
  async lockPlatformFunds(amount: number, reason?: string): Promise<PlatformWallet> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/lock-funds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        amount, 
        reason 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to lock funds');
    }

    return response.json();
  }

  /**
   * Unlock funds in the platform wallet
   * @param amount The amount to unlock
   * @returns The updated wallet
   */
  async unlockPlatformFunds(amount: number): Promise<PlatformWallet> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/unlock-funds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        amount 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to unlock funds');
    }

    return response.json();
  }

  /**
   * Refund funds to the platform wallet
   * @param amount The amount to refund
   * @param source The source of the refund
   * @param description Optional description
   * @returns The refund result
   */
  async refundToPlatformWallet(
    amount: number, 
    source: string, 
    description?: string
  ): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/wallet/refund', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        amount, 
        source, 
        description 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to process refund');
    }

    return response.json();
  }

  /**
   * Set up event listeners for account and chain changes
   */
  private setupEventListeners(): void {
    if (!window.ethereum) return;

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their account
        this.connectedWallet = null;
        this.notifyListeners(null);
      } else if (this.connectedWallet) {
        // Update account info
        this.connectedWallet.account.address = accounts[0];

        // Get new balance
        window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        }).then((balance: string) => {
          this.connectedWallet!.account.balance = balance;
          this.notifyListeners(this.connectedWallet);
        });
      }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainIdHex: string) => {
      if (this.connectedWallet) {
        this.connectedWallet.chainId = parseInt(chainIdHex, 16);
        this.connectedWallet.account.chainId = parseInt(chainIdHex, 16);
        this.notifyListeners(this.connectedWallet);
      }
    });

    // Listen for wallet disconnection
    window.ethereum.on('disconnect', () => {
      this.connectedWallet = null;
      this.notifyListeners(null);
    });
  }

  /**
   * Notify all listeners of wallet state changes
   */
  private notifyListeners(wallet: ConnectedWallet | null): void {
    for (const listener of this.listeners) {
      try {
        listener(wallet);
      } catch (error) {
        console.error('Error in wallet listener:', error);
      }
    }
  }

  /**
   * Convert a string to hex format
   */
  private toHex(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let hex = '0x';
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i].toString(16);
      hex += byte.length === 1 ? '0' + byte : byte;
    }
    return hex;
  }
}

export const walletService = new WalletService();