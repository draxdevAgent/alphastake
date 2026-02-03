import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'ALPHA1111111111111111111111111111111111111111');

// Demo stats for hackathon (on-chain integration pending US-001)
const DEMO_STATS = {
  totalProviders: 3,
  totalSignals: 12,
  activeSignals: 4,
  totalStakedSOL: '2.50',
  totalEarnedSOL: '0.85',
  averageWinRate: '67.5%',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if program is deployed (will fail gracefully if not)
    const connection = new Connection(RPC_URL, 'confirmed');
    const programInfo = await connection.getAccountInfo(PROGRAM_ID);
    
    if (!programInfo) {
      // Program not deployed yet - return demo stats
      return res.json({
        ...DEMO_STATS,
        network: 'devnet',
        programDeployed: false,
        note: 'Demo data - on-chain program deployment pending',
      });
    }

    // In production: fetch real stats from on-chain accounts
    // For now, return demo stats with program deployed flag
    return res.json({
      ...DEMO_STATS,
      network: 'devnet',
      programDeployed: true,
      programId: PROGRAM_ID.toString(),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.json({
      ...DEMO_STATS,
      network: 'devnet',
      programDeployed: false,
      note: 'Demo data - RPC error',
    });
  }
}
