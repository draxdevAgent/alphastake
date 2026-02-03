'use client';

import { useEffect, useState } from 'react';
import { LeaderboardTable } from '@/components/LeaderboardTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphastake.duckbot.dev';

interface Provider {
  rank: number;
  name: string;
  authority: string;
  totalSignals: number;
  winningSignals: number;
  winRate: string;
  totalStakedSOL: string;
  totalEarnedSOL: string;
  reputationScore: number;
}

export default function LeaderboardPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setProviders(data.leaderboard || []);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          🏆 Provider Leaderboard
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Top signal providers ranked by win rate, earnings, and reputation. 
          All metrics are verified on-chain.
        </p>
      </div>

      <LeaderboardTable providers={providers} loading={loading} />

      {/* Explanation */}
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How Ranking Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="text-green-400 font-medium mb-2">Win Rate</h3>
            <p className="text-zinc-400">
              Percentage of signals that hit their target price before stop loss or expiry.
            </p>
          </div>
          <div>
            <h3 className="text-blue-400 font-medium mb-2">Total Staked</h3>
            <p className="text-zinc-400">
              Sum of all SOL staked across all signals. Higher stakes = higher confidence.
            </p>
          </div>
          <div>
            <h3 className="text-purple-400 font-medium mb-2">Reputation Score</h3>
            <p className="text-zinc-400">
              Composite score based on win rate, total signals, and consistency over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
