'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SignalCard } from '@/components/SignalCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphastake.duckbot.dev';

interface Provider {
  authority: string;
  name: string;
  totalSignals: number;
  winningSignals: number;
  winRate: string;
  totalStakedSOL: string;
  totalEarnedSOL: string;
  totalSlashedSOL: string;
  reputationScore: number;
  createdAt: string;
}

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

export default function ProviderProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProvider() {
      try {
        const [providerRes, signalsRes] = await Promise.all([
          fetch(`${API_URL}/api/providers/${address}`),
          fetch(`${API_URL}/api/signals`),
        ]);

        if (!providerRes.ok) {
          setError('Provider not found');
          return;
        }

        const providerData = await providerRes.json();
        setProvider(providerData.provider);

        if (signalsRes.ok) {
          const signalsData = await signalsRes.json();
          // Filter signals for this provider
          const providerSignals = (signalsData.signals || []).filter(
            (s: Signal) => s.provider === address
          );
          setSignals(providerSignals);
        }
      } catch (err) {
        setError('Failed to fetch provider');
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      fetchProvider();
    }
  }, [address]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-40 bg-[#1f1f28] rounded-xl"></div>
        <div className="h-64 bg-[#1f1f28] rounded-xl"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">👤</div>
        <h1 className="text-2xl font-bold text-white mb-2">Provider Not Found</h1>
        <p className="text-zinc-400 mb-6">{error || 'This provider does not exist.'}</p>
        <Link href="/leaderboard" className="text-blue-400 hover:underline">
          ← Back to Leaderboard
        </Link>
      </div>
    );
  }

  const winRate = parseFloat(provider.winRate);
  const earned = parseFloat(provider.totalEarnedSOL);

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link href="/leaderboard" className="text-zinc-400 hover:text-white transition-colors">
        ← Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-3xl">
              {provider.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{provider.name}</h1>
            <div className="font-mono text-zinc-400 text-sm break-all">
              {provider.authority}
            </div>
            <div className="text-zinc-500 text-sm mt-2">
              Provider since {new Date(provider.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Reputation Badge */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-400 font-bold text-xl">{provider.reputationScore}</span>
            </div>
            <div className="text-zinc-500 text-xs">Reputation</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-5">
          <div className="text-zinc-500 text-sm mb-2">Win Rate</div>
          <div className={`text-2xl font-bold ${
            winRate >= 60 ? 'text-green-400' :
            winRate >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {provider.winRate}
          </div>
        </div>
        <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-5">
          <div className="text-zinc-500 text-sm mb-2">Total Signals</div>
          <div className="text-2xl font-bold text-white">
            <span className="text-green-400">{provider.winningSignals}</span>
            <span className="text-zinc-500">/</span>
            {provider.totalSignals}
          </div>
        </div>
        <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-5">
          <div className="text-zinc-500 text-sm mb-2">Total Staked</div>
          <div className="text-2xl font-bold text-white font-mono">
            {provider.totalStakedSOL} SOL
          </div>
        </div>
        <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-5">
          <div className="text-zinc-500 text-sm mb-2">Net Earnings</div>
          <div className={`text-2xl font-bold font-mono ${
            earned > 0 ? 'text-green-400' : earned < 0 ? 'text-red-400' : 'text-zinc-400'
          }`}>
            {earned > 0 ? '+' : ''}{provider.totalEarnedSOL} SOL
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Performance Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="text-zinc-500 text-sm mb-1">Total Earned</div>
            <div className="text-green-400 font-mono font-semibold">
              +{provider.totalEarnedSOL} SOL
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-sm mb-1">Total Slashed</div>
            <div className="text-red-400 font-mono font-semibold">
              -{provider.totalSlashedSOL} SOL
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-sm mb-1">Net P&L</div>
            <div className={`font-mono font-semibold ${
              earned > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {earned > 0 ? '+' : ''}{(earned - parseFloat(provider.totalSlashedSOL)).toFixed(2)} SOL
            </div>
          </div>
        </div>
      </div>

      {/* Provider's Signals */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Signals</h2>
        {signals.length === 0 ? (
          <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-8 text-center">
            <p className="text-zinc-400">No signals from this provider yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
