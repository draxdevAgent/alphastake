import { Connection, PublicKey } from '@solana/web3.js';
export declare const PROGRAM_ID: PublicKey;
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
export declare class AlphaStakeSDK {
    private connection;
    private programId;
    constructor(connection: Connection, programId?: PublicKey);
    getConfigPDA(): [PublicKey, number];
    getProviderPDA(authority: PublicKey): [PublicKey, number];
    getSignalPDA(provider: PublicKey, signalIndex: number): [PublicKey, number];
    getVaultPDA(signal: PublicKey): [PublicKey, number];
    getSubscriptionPDA(signal: PublicKey, subscriber: PublicKey): [PublicKey, number];
    getProvider(authority: PublicKey): Promise<Provider | null>;
    getAllProviders(): Promise<Provider[]>;
    getSignal(signalPDA: PublicKey): Promise<Signal | null>;
    getActiveSignals(): Promise<Signal[]>;
    getLeaderboard(limit?: number): Promise<Provider[]>;
    private parseProviderAccount;
    private parseSignalAccount;
}
export default AlphaStakeSDK;
//# sourceMappingURL=index.d.ts.map