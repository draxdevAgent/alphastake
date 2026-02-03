import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN } from 'bn.js';

// Program ID (will be updated after deployment)
export const PROGRAM_ID = new PublicKey('ALPHA1111111111111111111111111111111111111111');

export type SignalDirection = 'long' | 'short';
export type SignalStatus = 'active' | 'resolved' | 'cancelled';
export type SignalOutcome = 'pending' | 'targetHit' | 'stopHit' | 'expiredProfit' | 'expiredLoss';

export interface Provider {
  authority: PublicKey;
  name: string;
  totalSignals: number;
  winningSignals: number;
  totalStaked: number;
  totalEarned: number;
  totalSlashed: number;
  reputationScore: number;
  createdAt: number;
  winRate: number;
}

export interface Signal {
  publicKey: PublicKey;
  provider: PublicKey;
  tokenMint: PublicKey;
  direction: SignalDirection;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  stakeAmount: number;
  confidence: number;
  reasoning: string;
  createdAt: number;
  expiresAt: number;
  resolvedAt: number;
  status: SignalStatus;
  outcome: SignalOutcome;
  finalPrice: number;
  subscriberCount: number;
  totalSubscribed: number;
}

export interface Subscription {
  signal: PublicKey;
  subscriber: PublicKey;
  amount: number;
  subscribedAt: number;
  claimed: boolean;
}

export class AlphaStakeSDK {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey = PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  // === PDA Derivations ===

  getConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.programId
    );
  }

  getProviderPDA(authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('provider'), authority.toBuffer()],
      this.programId
    );
  }

  getSignalPDA(provider: PublicKey, signalIndex: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('signal'),
        provider.toBuffer(),
        new BN(signalIndex).toArrayLike(Buffer, 'le', 8),
      ],
      this.programId
    );
  }

  getVaultPDA(signal: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), signal.toBuffer()],
      this.programId
    );
  }

  getSubscriptionPDA(signal: PublicKey, subscriber: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('subscription'), signal.toBuffer(), subscriber.toBuffer()],
      this.programId
    );
  }

  // === Read Functions ===

  async getProvider(authority: PublicKey): Promise<Provider | null> {
    const [providerPDA] = this.getProviderPDA(authority);
    const account = await this.connection.getAccountInfo(providerPDA);
    if (!account) return null;
    
    // Parse account data (simplified - in production use Anchor IDL)
    return this.parseProviderAccount(account.data);
  }

  async getAllProviders(): Promise<Provider[]> {
    // In production, use getProgramAccounts with proper filters
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { dataSize: 8 + 32 + 36 + 8 + 8 + 8 + 8 + 8 + 2 + 8 + 1 }, // Provider account size
      ],
    });

    return accounts.map(({ pubkey, account }) => ({
      ...this.parseProviderAccount(account.data),
      publicKey: pubkey,
    }));
  }

  async getSignal(signalPDA: PublicKey): Promise<Signal | null> {
    const account = await this.connection.getAccountInfo(signalPDA);
    if (!account) return null;
    return this.parseSignalAccount(account.data, signalPDA);
  }

  async getActiveSignals(): Promise<Signal[]> {
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { dataSize: 8 + 32 + 32 + 1 + 8 + 8 + 8 + 8 + 1 + 504 + 8 + 8 + 8 + 1 + 1 + 8 + 4 + 8 + 1 },
      ],
    });

    const now = Math.floor(Date.now() / 1000);
    return accounts
      .map(({ pubkey, account }) => this.parseSignalAccount(account.data, pubkey))
      .filter(s => s.status === 'active' && s.expiresAt > now);
  }

  async getLeaderboard(limit: number = 20): Promise<Provider[]> {
    const providers = await this.getAllProviders();
    return providers
      .sort((a, b) => {
        // Sort by win rate, then by total signals
        const winRateA = a.totalSignals > 0 ? a.winningSignals / a.totalSignals : 0;
        const winRateB = b.totalSignals > 0 ? b.winningSignals / b.totalSignals : 0;
        if (winRateA !== winRateB) return winRateB - winRateA;
        return b.totalSignals - a.totalSignals;
      })
      .slice(0, limit)
      .map(p => ({
        ...p,
        winRate: p.totalSignals > 0 ? (p.winningSignals / p.totalSignals) * 100 : 0,
      }));
  }

  // === Helper Parsers (simplified) ===

  private parseProviderAccount(data: Buffer): Provider {
    // Skip discriminator (8 bytes)
    let offset = 8;
    
    const authority = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const nameLength = data.readUInt32LE(offset);
    offset += 4;
    const name = data.slice(offset, offset + nameLength).toString('utf8');
    offset += 32; // Fixed size for name field
    
    const totalSignals = data.readBigUInt64LE(offset);
    offset += 8;
    
    const winningSignals = data.readBigUInt64LE(offset);
    offset += 8;
    
    const totalStaked = data.readBigUInt64LE(offset);
    offset += 8;
    
    const totalEarned = data.readBigUInt64LE(offset);
    offset += 8;
    
    const totalSlashed = data.readBigUInt64LE(offset);
    offset += 8;
    
    const reputationScore = data.readUInt16LE(offset);
    offset += 2;
    
    const createdAt = Number(data.readBigInt64LE(offset));

    return {
      authority,
      name,
      totalSignals: Number(totalSignals),
      winningSignals: Number(winningSignals),
      totalStaked: Number(totalStaked) / LAMPORTS_PER_SOL,
      totalEarned: Number(totalEarned) / LAMPORTS_PER_SOL,
      totalSlashed: Number(totalSlashed) / LAMPORTS_PER_SOL,
      reputationScore,
      createdAt,
      winRate: Number(totalSignals) > 0 ? (Number(winningSignals) / Number(totalSignals)) * 100 : 0,
    };
  }

  private parseSignalAccount(data: Buffer, publicKey: PublicKey): Signal {
    // Simplified parser - in production use Anchor IDL
    let offset = 8;
    
    const provider = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const tokenMint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const directionByte = data.readUInt8(offset);
    offset += 1;
    const direction: SignalDirection = directionByte === 0 ? 'long' : 'short';
    
    const entryPrice = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const targetPrice = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const stopLoss = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const stakeAmount = Number(data.readBigUInt64LE(offset)) / LAMPORTS_PER_SOL;
    offset += 8;
    
    const confidence = data.readUInt8(offset);
    offset += 1;
    
    // Skip reasoning for now (variable length string)
    const reasoningLength = data.readUInt32LE(offset);
    offset += 4;
    const reasoning = data.slice(offset, offset + reasoningLength).toString('utf8');
    offset += 500; // Fixed buffer
    
    const createdAt = Number(data.readBigInt64LE(offset));
    offset += 8;
    
    const expiresAt = Number(data.readBigInt64LE(offset));
    offset += 8;
    
    const resolvedAt = Number(data.readBigInt64LE(offset));
    offset += 8;
    
    const statusByte = data.readUInt8(offset);
    offset += 1;
    const status: SignalStatus = ['active', 'resolved', 'cancelled'][statusByte] as SignalStatus;
    
    const outcomeByte = data.readUInt8(offset);
    offset += 1;
    const outcome: SignalOutcome = ['pending', 'targetHit', 'stopHit', 'expiredProfit', 'expiredLoss'][outcomeByte] as SignalOutcome;
    
    const finalPrice = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const subscriberCount = data.readUInt32LE(offset);
    offset += 4;
    
    const totalSubscribed = Number(data.readBigUInt64LE(offset)) / LAMPORTS_PER_SOL;

    return {
      publicKey,
      provider,
      tokenMint,
      direction,
      entryPrice,
      targetPrice,
      stopLoss,
      stakeAmount,
      confidence,
      reasoning,
      createdAt,
      expiresAt,
      resolvedAt,
      status,
      outcome,
      finalPrice,
      subscriberCount,
      totalSubscribed,
    };
  }
}

// Export for convenience
export default AlphaStakeSDK;
