'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphastake.duckbot.dev';

interface Signal {
  id: string;
  provider: string;
  tokenMint: string;
  direction: 'long' | 'short';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  stakeAmountSOL: string;
  confidence: number;
  reasoning: string;
  createdAt: string;
  expiresAt: string;
  resolvedAt: string | null;
  status: string;
  outcome: string;
  finalPrice: number;
  subscriberCount: number;
  totalSubscribedSOL: string;
}

export default function SignalDetailPage() {
  const params = useParams();
  const signalId = params.id as string;
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignal() {
      try {
        const res = await fetch(`${API_URL}/api/signals/${signalId}`);
        if (!res.ok) {
          setError('Signal not found');
          return;
        }
        const data = await res.json();
        setSignal(data.signal);
      } catch (err) {
        setError('Failed to fetch signal');
      } finally {
        setLoading(false);
      }
    }

    if (signalId) {
      fetchSignal();
    }
  }, [signalId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[#1f1f28] rounded w-48"></div>
        <div className="h-64 bg-[#1f1f28] rounded"></div>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-2">Signal Not Found</h1>
        <p className="text-zinc-400 mb-6">{error || 'This signal does not exist.'}</p>
        <Link href="/" className="text-blue-400 hover:underline">
          ← Back to Signals
        </Link>
      </div>
    );
  }

  const isLong = signal.direction === 'long';
  const isActive = signal.status === 'active';
  const isWin = signal.outcome === 'win';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
        ← Back to Signals
      </Link>

      {/* Signal Header */}
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg text-lg font-bold ${
              isLong 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {signal.direction.toUpperCase()}
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Token</div>
              <div className="text-white font-mono">{signal.tokenMint.slice(0, 8)}...</div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            isActive 
              ? 'bg-blue-500/20 text-blue-400' 
              : isWin 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
          }`}>
            {isActive ? '⏳ Active' : isWin ? '✅ Won' : '❌ Lost'}
          </div>
        </div>

        {/* Price Targets */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-zinc-500 text-xs mb-1">Entry Price</div>
            <div className="text-white font-mono text-xl">
              ${signal.entryPrice?.toFixed(2) || '-'}
            </div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-zinc-500 text-xs mb-1">Target</div>
            <div className="text-green-400 font-mono text-xl">
              ${signal.targetPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-zinc-500 text-xs mb-1">Stop Loss</div>
            <div className="text-red-400 font-mono text-xl">
              ${signal.stopLoss.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Stake & Confidence */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-zinc-500 text-xs mb-1">Provider Stake</div>
            <div className="text-white font-semibold text-lg">
              {signal.stakeAmountSOL} SOL
            </div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-zinc-500 text-xs mb-1">Confidence</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-[#1f1f28] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
              <span className="text-white font-semibold">{signal.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="mb-6">
          <div className="text-zinc-500 text-xs mb-2">Reasoning</div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <p className="text-zinc-300 leading-relaxed">{signal.reasoning}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-zinc-500 mb-1">Created</div>
            <div className="text-white">{new Date(signal.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Expires</div>
            <div className="text-white">{new Date(signal.expiresAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Subscribers</div>
            <div className="text-white">{signal.subscriberCount}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Total Subscribed</div>
            <div className="text-white">{signal.totalSubscribedSOL} SOL</div>
          </div>
        </div>
      </div>

      {/* Provider Link */}
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-zinc-500 text-sm mb-1">Signal Provider</div>
            <div className="font-mono text-white">{signal.provider}</div>
          </div>
          <Link 
            href={`/providers/${signal.provider}`}
            className="px-4 py-2 bg-[#1f1f28] text-white rounded-lg hover:bg-[#2f2f38] transition-colors"
          >
            View Profile →
          </Link>
        </div>
      </div>

      {/* Final Result (if resolved) */}
      {signal.resolvedAt && (
        <div className={`border rounded-xl p-6 ${
          isWin 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <h3 className="text-lg font-semibold mb-4">
            {isWin ? '🎉 Signal Hit Target!' : '📉 Signal Stopped Out'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-zinc-400 text-sm mb-1">Final Price</div>
              <div className={`font-mono text-xl ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                ${signal.finalPrice?.toFixed(2) || '-'}
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm mb-1">Resolved At</div>
              <div className="text-white">
                {new Date(signal.resolvedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
