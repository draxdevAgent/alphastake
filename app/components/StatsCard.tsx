'use client';

interface Props {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, change, icon }: Props) {
  const isPositive = change?.startsWith('+');
  
  return (
    <div className="bg-[#111117] border border-[#1f1f28] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-400 text-sm">{title}</span>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {change && (
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
