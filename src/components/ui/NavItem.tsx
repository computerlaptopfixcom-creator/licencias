import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
}

export function NavItem({ active, icon: Icon, label, onClick, color }: NavItemProps) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-xl sm:rounded-2xl transition-all font-bold",
      active ? "bg-white/10 text-white shadow-inner" : "text-white/70 hover:text-white hover:bg-white/5 active:scale-95"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-blue-500" : "text-white/70 group-hover:text-white")} style={active && color ? { color } : {}} />
      <span className="text-sm">{label}</span>
    </button>
  );
}

export function MobileNavItem({ active, icon: Icon, label, onClick, color }: NavItemProps) {
  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center justify-center w-full h-full transition-all gap-1 relative",
      active ? "text-blue-500" : "text-white/40 hover:text-white/70"
    )} style={active && color ? { color } : {}}>
      {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full shadow-lg" style={{ backgroundColor: color || '#3b82f6', boxShadow: `0 0 10px ${color || '#3b82f6'}80` }} />}
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-1", active && "scale-110 drop-shadow-md")} />
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}
