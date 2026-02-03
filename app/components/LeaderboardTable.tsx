'use client';

import Link from 'next/link';

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

interface Props {
  providers: Provider[];
  loading?: boolean;
}

export function LeaderboardTable({ providers, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl overflow-hidden">
        <div className="animate-pulse p-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-4">
              <div className="h-10 bg-[#1f1f28] rounded w-12"></div>
              <div className="h-10 bg-[#1f1f28] rounded flex-1"></div>
              <div className="h-10 bg-[#1f1f28] rounded w-24"></div>
              <div className="h-10 bg-[#1f1f28] rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-12 text-center">
        <div className="text-zinc-400 text-lg">No providers yet</div>
        <p className="text-zinc-500 mt-2">Be the first to register and publish signals!</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111117] border border-[#1f1f28] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f1f28]">
              <th className="text-left px-6 py-4 text-zinc-400 text-sm font-medium">Rank</th>
              <th className="text-left px-6 py-4 text-zinc-400 text-sm font-medium">Provider</th>
              <th className="text-right px-6 py-4 text-zinc-400 text-sm font-medium">Win Rate</th>
              <th className="text-right px-6 py-4 text-zinc-400 text-sm font-medium">Signals</th>
              <th className="text-right px-6 py-4 text-zinc-400 text-sm font-medium">Total Staked</th>
              <th className="text-right px-6 py-4 text-zinc-400 text-sm font-medium">Earnings</th>
              <th className="text-right px-6 py-4 text-zinc-400 text-sm font-medium">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr 
                key={provider.authority} 
                className="border-b border-[#1f1f28] hover:bg-[#1f1f28]/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <RankBadge rank={provider.rank} />
                </td>
                <td className="px-6 py-4">
                  <Link 
                    href={`/providers/${provider.authority}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {provider.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{provider.name}</div>
                      <div className="text-zinc-500 text-xs font-mono">
                        {provider.authority.slice(0, 8)}...
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-semibold ${
                    parseFloat(provider.winRate) >= 60 ? 'text-green-400' :
                    parseFloat(provider.winRate) >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {provider.winRate}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-white">
                  <span className="text-green-400">{provider.winningSignals}</span>
                  <span className="text-zinc-500">/</span>
                  <span>{provider.totalSignals}</span>
                </td>
                <td className="px-6 py-4 text-right text-white font-mono">
                  {provider.totalStakedSOL} SOL
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-mono ${
                    parseFloat(provider.totalEarnedSOL) > 0 ? 'text-green-400' : 'text-zinc-400'
                  }`}>
                    {parseFloat(provider.totalEarnedSOL) > 0 ? '+' : ''}{provider.totalEarnedSOL} SOL
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-[#1f1f28] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${Math.min(provider.reputationScore, 100)}%` }}
                      />
                    </div>
                    <span className="text-zinc-400 text-sm w-8">{provider.reputationScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
        <span className="text-black font-bold text-sm">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-zinc-300 to-zinc-400 rounded-full flex items-center justify-center">
        <span className="text-black font-bold text-sm">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
        <span className="text-black font-bold text-sm">3</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 bg-[#1f1f28] rounded-full flex items-center justify-center">
      <span className="text-zinc-400 font-medium text-sm">{rank}</span>
    </div>
  );
}
