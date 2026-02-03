"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3456;
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
// Demo data for hackathon
const DEMO_LEADERBOARD = [
    {
        rank: 1,
        name: 'DraxDev Alpha',
        authority: 'Drax1111111111111111111111111111111111111111',
        totalSignals: 8,
        winningSignals: 6,
        winRate: '75.0%',
        totalStakedSOL: '1.20',
        totalEarnedSOL: '0.45',
        reputationScore: 850,
    },
    {
        rank: 2,
        name: 'SolWhale',
        authority: 'Whale222222222222222222222222222222222222222',
        totalSignals: 5,
        winningSignals: 3,
        winRate: '60.0%',
        totalStakedSOL: '0.80',
        totalEarnedSOL: '0.25',
        reputationScore: 720,
    },
    {
        rank: 3,
        name: 'AlphaSeeker',
        authority: 'Alpha333333333333333333333333333333333333333',
        totalSignals: 3,
        winningSignals: 2,
        winRate: '66.7%',
        totalStakedSOL: '0.50',
        totalEarnedSOL: '0.15',
        reputationScore: 650,
    },
];
const DEMO_SIGNALS = [
    {
        id: 'signal_001',
        provider: 'Drax1111111111111111111111111111111111111111',
        providerName: 'DraxDev Alpha',
        tokenMint: 'So11111111111111111111111111111111111111112',
        tokenSymbol: 'SOL',
        direction: 'long',
        entryPrice: 185.50,
        targetPrice: 210.00,
        stopLoss: 175.00,
        stakeAmountSOL: '0.25',
        confidence: 80,
        reasoning: 'SOL showing strong bullish momentum with increasing volume. Breaking resistance at $185 with potential to reach $210 within 48h.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        expiresAt: new Date(Date.now() + 172800000).toISOString(),
        status: 'active',
        outcome: 'pending',
        subscriberCount: 3,
        totalSubscribedSOL: '0.45',
    },
    {
        id: 'signal_002',
        provider: 'Whale222222222222222222222222222222222222222',
        providerName: 'SolWhale',
        tokenMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        tokenSymbol: 'JUP',
        direction: 'long',
        entryPrice: 0.85,
        targetPrice: 1.10,
        stopLoss: 0.75,
        stakeAmountSOL: '0.15',
        confidence: 70,
        reasoning: 'JUP accumulation phase ending. Expecting breakout above $0.90 resistance.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
        outcome: 'pending',
        subscriberCount: 2,
        totalSubscribedSOL: '0.20',
    },
];
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        network: 'devnet',
        project: 'AlphaStake',
        description: 'On-chain verifiable trading signals with staked reputation',
    });
});
// Platform stats
app.get('/api/stats', (req, res) => {
    res.json({
        totalProviders: 3,
        totalSignals: 12,
        activeSignals: 4,
        totalStakedSOL: '2.50',
        totalEarnedSOL: '0.85',
        averageWinRate: '67.5%',
        network: 'devnet',
        programDeployed: false,
        note: 'Demo data - on-chain program deployment pending',
    });
});
// Leaderboard
app.get('/api/leaderboard', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    res.json({
        leaderboard: DEMO_LEADERBOARD.slice(0, limit),
        total: DEMO_LEADERBOARD.length,
    });
});
// Signals
app.get('/api/signals', (req, res) => {
    res.json({
        signals: DEMO_SIGNALS,
        total: DEMO_SIGNALS.length,
    });
});
// Root redirect
app.get('/', (req, res) => {
    res.json({
        name: 'AlphaStake API',
        version: '0.1.0',
        endpoints: [
            'GET /api/health',
            'GET /api/stats',
            'GET /api/leaderboard',
            'GET /api/signals',
        ],
        docs: 'https://github.com/draxdevAgent/alphastake',
    });
});
app.listen(PORT, () => {
    console.log(`AlphaStake API running on port ${PORT}`);
    console.log(`Network: devnet`);
});
