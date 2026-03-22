import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationsPanelProps {
  show: boolean;
  onClose: () => void;
  notifications: any[];
  onMarkAllRead: () => void;
}

// Security: sanitize HTML to prevent XSS — only allow safe formatting tags
function sanitizeHtml(html: string): string {
  let clean = html.replace(/<(script|iframe|object|embed|form|input|style|link|meta)[^>]*>[\s\S]*?<\/\1>/gi, '');
  clean = clean.replace(/<(script|iframe|object|embed|form|input|style|link|meta)[^>]*\/?>/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*\S+/gi, '');
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  clean = clean.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
  return clean;
}

export function NotificationsPanel({ show, onClose, notifications, onMarkAllRead }: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }}
          className="fixed top-0 bottom-0 left-0 lg:left-72 w-full sm:w-[22rem] bg-[#0a0a0a] border-r border-white/10 shadow-3xl z-[60] flex flex-col"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500 fill-blue-500/20" />
              <h3 className="font-black tracking-widest uppercase text-sm">Notificaciones</h3>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="text-center text-white/30 font-bold uppercase tracking-widest text-[10px] mt-10 px-8">
                No tienes notificaciones
              </div>
            ) : (
              [...notifications].reverse().slice(0, 20).map(n => (
                <div key={n.id} className={cn(
                  "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                  !n.read ? "bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5 translate-x-1" : "bg-white/[0.02] border-white/5 opacity-60"
                )}>
                  {!n.read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />}
                  <div className={cn(
                    "text-xs leading-snug mb-2 pr-4",
                    !n.read ? "font-bold text-white" : "font-medium text-white/50"
                  )} dangerouslySetInnerHTML={{ __html: sanitizeHtml(n.message) }} />
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    <span className="text-[9px] font-bold text-white/20 capitalize">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {unreadCount > 0 && (
            <div className="p-4 border-t border-white/10">
              <button 
                onClick={onMarkAllRead}
                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all"
              >
                Marcar como Leídas (Limpiar)
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
