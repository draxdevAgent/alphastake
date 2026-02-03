import type { VercelRequest, VercelResponse } from '@vercel/node';

// Demo leaderboard for hackathon
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  return res.json({
    leaderboard: DEMO_LEADERBOARD.slice(0, limit),
    total: DEMO_LEADERBOARD.length,
    note: 'Demo data - on-chain integration pending',
  });
}
