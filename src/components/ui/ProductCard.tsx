import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

interface ProductCardProps {
  product: string;
  stock: number;
  price?: number;
  onClick: () => void;
}

export function ProductCard({ product, stock, price, onClick }: ProductCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-[#111] border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6 group shadow-2xl">
      <div className="flex justify-between items-start">
        <h4 className="text-2xl font-black">{product}</h4>
        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20"><Package className="w-6 h-6" /></div>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Disponibilidad</span>
          <span className="text-4xl font-black text-blue-500">{stock} <span className="text-xs opacity-40">Uds</span></span>
        </div>
        <div className="flex flex-col items-end gap-3">
          {price && (
            <span className="text-sm font-black text-white/60 italic">${price} USD</span>
          )}
          <button onClick={onClick} className="bg-white text-black px-6 py-3 rounded-xl font-black hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-white/20">Reclamar 1</button>
        </div>
      </div>
    </motion.div>
  );
}
