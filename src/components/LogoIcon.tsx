import React from 'react';
import * as LucideIcons from 'lucide-react';

interface LogoIconProps {
  logoType: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function LogoIcon({ logoType, className, size = 24, style }: LogoIconProps) {
  const Icon = (LucideIcons as any)[logoType] || LucideIcons.ShieldCheck;
  return <Icon className={className} size={size} style={style} />;
}
