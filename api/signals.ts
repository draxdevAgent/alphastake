import type { VercelRequest, VercelResponse } from '@vercel/node';

// Demo signals for hackathon
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
  {
    id: 'signal_003',
    provider: 'Drax1111111111111111111111111111111111111111',
    providerName: 'DraxDev Alpha',
    tokenMint: 'bonkKjzKSFh6fYq5X6U38rE8oa86KQTZfjwQ3j3K9Bb',
    tokenSymbol: 'BONK',
    direction: 'short',
    entryPrice: 0.0000285,
    targetPrice: 0.0000240,
    stopLoss: 0.0000310,
    stakeAmountSOL: '0.10',
    confidence: 65,
    reasoning: 'BONK showing weakness after failed rally. Expecting pullback to support levels.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    expiresAt: new Date(Date.now() + 43200000).toISOString(),
    status: 'active',
    outcome: 'pending',
    subscriberCount: 1,
    totalSubscribedSOL: '0.10',
  },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const status = req.query.status as string;
  let signals = DEMO_SIGNALS;
  
  if (status === 'active') {
    signals = DEMO_SIGNALS.filter(s => s.status === 'active');
  }

  return res.json({
    signals,
    total: signals.length,
    note: 'Demo data - on-chain integration pending',
  });
}
