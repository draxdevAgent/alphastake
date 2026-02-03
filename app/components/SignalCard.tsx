'use client';

import Link from 'next/link';

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

interface Props {
  signal: Signal;
}

export function SignalCard({ signal }: Props) {
  const isLong = signal.direction === 'long';
  const timeLeft = getTimeLeft(signal.expiresAt);
  
  return (
    <Link href={`/signals/${signal.id}`}>
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-5 hover:border-[#3f3f48] transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isLong 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {signal.direction.toUpperCase()}
            </div>
            <span className="text-zinc-400 text-sm">
              {formatAddress(signal.tokenMint)}
            </span>
          </div>
          <div className="text-zinc-500 text-sm">
            {timeLeft}
          </div>
        </div>

        {/* Price Targets */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-zinc-500 text-xs mb-1">Target</div>
            <div className="text-green-400 font-mono text-lg">
              ${signal.targetPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs mb-1">Stop Loss</div>
            <div className="text-red-400 font-mono text-lg">
              ${signal.stopLoss.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Stake & Confidence */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">Staked:</span>
            <span className="text-white font-semibold">{signal.stakeAmountSOL} SOL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-[#1f1f28] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
            <span className="text-zinc-400 text-sm">{signal.confidence}%</span>
          </div>
        </div>

        {/* Reasoning Preview */}
        <p className="text-zinc-400 text-sm line-clamp-2 group-hover:text-zinc-300 transition-colors">
          {signal.reasoning}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1f1f28]">
          <div className="text-zinc-500 text-xs">
            {signal.subscriberCount} subscriber{signal.subscriberCount !== 1 ? 's' : ''}
          </div>
          <div className="text-zinc-500 text-xs">
            {signal.totalSubscribedSOL} SOL subscribed
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function getTimeLeft(expiresAt: string): string {
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    return `${Math.floor(hours / 24)}d left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}
