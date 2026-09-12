// src/services/walletService.ts
import { usePhantom } from '@/hooks/usePhantom';

export class WalletService {
  static async getBalance(connection: any, walletAddress: string): Promise<number> {
    try {
      const balance = await connection.getBalance(new (require('@solana/web3.js')).PublicKey(walletAddress));
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  static async getTokenAccounts(connection: any, walletAddress: string): Promise<any[]> {
    try {
      const PublicKey = require('@solana/web3.js').PublicKey;
      const publicKey = new PublicKey(walletAddress);
      const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJsyFbPVwwQQfyanvtQjZpTek8g'),
      });
      return accounts.value;
    } catch (error) {
      console.error('Failed to get token accounts:', error);
      return [];
    }
  }

  static async sendTransaction(signTransaction: any, transaction: any, connection: any): Promise<string> {
    try {
      const signedTransaction = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(txid);
      return txid;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }
}
