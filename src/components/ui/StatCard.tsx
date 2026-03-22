import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'emerald' | 'purple';
  subtitle: string;
}

export function StatCard({ title, value, color, subtitle }: StatCardProps) {
  const themes = {
    blue: "border-blue-500/10 text-blue-500",
    emerald: "border-emerald-500/10 text-emerald-500",
    purple: "border-purple-500/10 text-purple-500"
  };
  
  return (
    <div className={cn("bg-[#111] border rounded-[2rem] p-5 sm:p-8", themes[color])}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{title}</span>
      <div className="text-4xl sm:text-6xl font-black text-white mt-2 mb-2">{value}</div>
      <span className="text-xs font-bold opacity-30">{subtitle}</span>
    </div>
  );
}
