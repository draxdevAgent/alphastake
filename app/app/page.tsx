'use client';

import { useEffect, useState } from 'react';
import { SignalCard } from '@/components/SignalCard';
import { StatsCard } from '@/components/StatsCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphastake.duckbot.dev';

interface Signal {
  id: string;
  provider: string;
  tokenMint: string;
  direction: 'long' | 'short';
  targetPrice: number;
  stopLoss: number;
  stakeAmountSOL: string;
  confidence: number;
  reasoning: string;
  createdAt: string;
  expiresAt: string;
  subscriberCount: number;
  totalSubscribedSOL: string;
}

interface Stats {
  totalProviders: number;
  totalSignals: number;
  activeSignals: number;
  totalStakedSOL: string;
  totalEarnedSOL: string;
  averageWinRate: string;
}

export default function HomePage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [signalsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/signals`),
          fetch(`${API_URL}/api/stats`),
        ]);

        if (signalsRes.ok) {
          const signalsData = await signalsRes.json();
          setSignals(signalsData.signals || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Stake-Verified
          </span>
          <br />
          Trading Signals
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
          Follow signals from providers who stake their own SOL. 
          Real skin in the game means better calls.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="#signals"
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            View Active Signals
          </a>
          <a 
            href="https://github.com/draxdevAgent/alphastake"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[#1f1f28] text-white font-semibold rounded-lg hover:bg-[#2f2f38] transition-colors"
          >
            Read the Docs
          </a>
        </div>
      </section>

      {/* Stats Grid */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Active Signals" value={stats.activeSignals} />
          <StatsCard title="Total Providers" value={stats.totalProviders} />
          <StatsCard title="Total Staked" value={`${stats.totalStakedSOL} SOL`} />
          <StatsCard title="Avg Win Rate" value={stats.averageWinRate} />
        </section>
      )}

      {/* Active Signals */}
      <section id="signals">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Active Signals</h2>
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live updates
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#111117] border border-[#1f1f28] rounded-xl p-5 animate-pulse">
                <div className="h-6 bg-[#1f1f28] rounded w-24 mb-4"></div>
                <div className="h-8 bg-[#1f1f28] rounded w-32 mb-4"></div>
                <div className="h-4 bg-[#1f1f28] rounded w-full mb-2"></div>
                <div className="h-4 bg-[#1f1f28] rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No active signals yet</h3>
            <p className="text-zinc-400">
              Be the first to publish a stake-verified signal!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="py-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Stake to Signal</h3>
            <p className="text-zinc-400 text-sm">
              Providers stake SOL on their predictions. More stake = more confidence.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Subscribe & Trade</h3>
            <p className="text-zinc-400 text-sm">
              Follow signals with your own stake. If the signal wins, you profit together.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Track & Earn</h3>
            <p className="text-zinc-400 text-sm">
              Build reputation with verifiable on-chain history. Good calls = real earnings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
