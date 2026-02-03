import express from 'express';
import cors from 'cors';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AlphaStakeSDK, Signal, Provider } from '../sdk';

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PORT = process.env.PORT || 3000;

// Initialize SDK
const connection = new Connection(RPC_URL, 'confirmed');
const sdk = new AlphaStakeSDK(connection);

// In-memory cache for demo (use Redis in production)
const signalsCache: Map<string, Signal> = new Map();
const providersCache: Map<string, Provider> = new Map();

// === API Endpoints ===

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    network: RPC_URL.includes('devnet') ? 'devnet' : 'mainnet',
  });
});

// Get platform stats
app.get('/api/stats', async (req, res) => {
  try {
    const providers = await sdk.getAllProviders();
    const signals = await sdk.getActiveSignals();
    
    const totalStaked = providers.reduce((sum, p) => sum + p.totalStaked, 0);
    const totalEarned = providers.reduce((sum, p) => sum + p.totalEarned, 0);
    const avgWinRate = providers.length > 0 
      ? providers.reduce((sum, p) => sum + p.winRate, 0) / providers.length 
      : 0;

    res.json({
      totalProviders: providers.length,
      totalSignals: providers.reduce((sum, p) => sum + p.totalSignals, 0),
      activeSignals: signals.length,
      totalStakedSOL: totalStaked.toFixed(2),
      totalEarnedSOL: totalEarned.toFixed(2),
      averageWinRate: avgWinRate.toFixed(1) + '%',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const leaderboard = await sdk.getLeaderboard(limit);
    
    res.json({
      leaderboard: leaderboard.map((p, i) => ({
        rank: i + 1,
        name: p.name,
        authority: p.authority.toString(),
        totalSignals: p.totalSignals,
        winningSignals: p.winningSignals,
        winRate: p.winRate.toFixed(1) + '%',
        totalStakedSOL: p.totalStaked.toFixed(2),
        totalEarnedSOL: p.totalEarned.toFixed(2),
        reputationScore: p.reputationScore,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get active signals
app.get('/api/signals', async (req, res) => {
  try {
    const signals = await sdk.getActiveSignals();
    
    res.json({
      signals: signals.map(s => ({
        id: s.publicKey.toString(),
        provider: s.provider.toString(),
        tokenMint: s.tokenMint.toString(),
        direction: s.direction,
        targetPrice: s.targetPrice,
        stopLoss: s.stopLoss,
        stakeAmountSOL: s.stakeAmount.toFixed(4),
        confidence: s.confidence,
        reasoning: s.reasoning,
        createdAt: new Date(s.createdAt * 1000).toISOString(),
        expiresAt: new Date(s.expiresAt * 1000).toISOString(),
        subscriberCount: s.subscriberCount,
        totalSubscribedSOL: s.totalSubscribed.toFixed(4),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

// Get single signal
app.get('/api/signals/:id', async (req, res) => {
  try {
    const signalPDA = new PublicKey(req.params.id);
    const signal = await sdk.getSignal(signalPDA);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json({
      signal: {
        id: signal.publicKey.toString(),
        provider: signal.provider.toString(),
        tokenMint: signal.tokenMint.toString(),
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        targetPrice: signal.targetPrice,
        stopLoss: signal.stopLoss,
        stakeAmountSOL: signal.stakeAmount.toFixed(4),
        confidence: signal.confidence,
        reasoning: signal.reasoning,
        createdAt: new Date(signal.createdAt * 1000).toISOString(),
        expiresAt: new Date(signal.expiresAt * 1000).toISOString(),
        resolvedAt: signal.resolvedAt ? new Date(signal.resolvedAt * 1000).toISOString() : null,
        status: signal.status,
        outcome: signal.outcome,
        finalPrice: signal.finalPrice,
        subscriberCount: signal.subscriberCount,
        totalSubscribedSOL: signal.totalSubscribed.toFixed(4),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signal' });
  }
});

// Get provider profile
app.get('/api/providers/:authority', async (req, res) => {
  try {
    const authority = new PublicKey(req.params.authority);
    const provider = await sdk.getProvider(authority);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({
      provider: {
        authority: provider.authority.toString(),
        name: provider.name,
        totalSignals: provider.totalSignals,
        winningSignals: provider.winningSignals,
        winRate: provider.winRate.toFixed(1) + '%',
        totalStakedSOL: provider.totalStaked.toFixed(2),
        totalEarnedSOL: provider.totalEarned.toFixed(2),
        totalSlashedSOL: provider.totalSlashed.toFixed(2),
        reputationScore: provider.reputationScore,
        createdAt: new Date(provider.createdAt * 1000).toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// Get all providers
app.get('/api/providers', async (req, res) => {
  try {
    const providers = await sdk.getAllProviders();
    
    res.json({
      providers: providers.map(p => ({
        authority: p.authority.toString(),
        name: p.name,
        totalSignals: p.totalSignals,
        winRate: p.winRate.toFixed(1) + '%',
        reputationScore: p.reputationScore,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// === Demo Data Endpoints (for hackathon demo) ===

// Create demo signal (for testing without on-chain)
app.post('/api/demo/signals', (req, res) => {
  const { provider, tokenMint, direction, targetPrice, stopLoss, stakeAmount, confidence, reasoning } = req.body;
  
  const signalId = `demo_${Date.now()}`;
  const now = Math.floor(Date.now() / 1000);
  
  const signal: Signal = {
    publicKey: PublicKey.default,
    provider: new PublicKey(provider || PublicKey.default),
    tokenMint: new PublicKey(tokenMint || 'So11111111111111111111111111111111111111112'), // SOL
    direction: direction || 'long',
    entryPrice: 0,
    targetPrice: targetPrice || 100,
    stopLoss: stopLoss || 80,
    stakeAmount: stakeAmount || 0.1,
    confidence: confidence || 75,
    reasoning: reasoning || 'Demo signal',
    createdAt: now,
    expiresAt: now + 3600, // 1 hour
    resolvedAt: 0,
    status: 'active',
    outcome: 'pending',
    finalPrice: 0,
    subscriberCount: 0,
    totalSubscribed: 0,
  };

  signalsCache.set(signalId, signal);

  res.json({
    success: true,
    signalId,
    signal: {
      ...signal,
      publicKey: signalId,
      provider: signal.provider.toString(),
      tokenMint: signal.tokenMint.toString(),
    },
  });
});

// Get demo signals
app.get('/api/demo/signals', (req, res) => {
  const signals = Array.from(signalsCache.values());
  res.json({ signals });
});

// Start server
app.listen(PORT, () => {
  console.log(`AlphaStake API running on port ${PORT}`);
  console.log(`Network: ${RPC_URL.includes('devnet') ? 'devnet' : 'mainnet'}`);
});

export default app;
