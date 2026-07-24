import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Bell, CheckCircle2, Smartphone } from 'lucide-react';

interface InstallPWAProps {
  isDark?: boolean;
}

// Global interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWA({ isDark = true }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  useEffect(() => {
    // Check if already installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const isDismissed = localStorage.getItem('genda_pwa_dismissed');
    if (isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIOSDevice) {
      setIsIOS(true);
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        return permission;
      } catch (err) {
        console.warn('Erro ao solicitar permissão de notificação:', err);
      }
    }
    return 'default';
  };

  const handleInstallAndNotify = async () => {
    // Explicitly request notification permission first
    await requestNotificationPermission();

    // Trigger PWA install prompt if available
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
        }
      } catch (err) {
        console.error('Error during PWA install prompt:', err);
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('genda_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-[88px] left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-50"
        >
          <div className={`p-5 rounded-3xl shadow-2xl flex flex-col gap-4 border ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-start gap-3">
              <div className="flex gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    Instalar o Genda no Celular
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {isIOS 
                      ? 'Instale no iPhone e ative os lembretes: toque no botão Compartilhar e selecione "Adicionar à Tela de Início".'
                      : 'Tenha o app na tela inicial com acesso rápido, lembretes de agendamento por notificação e uso offline.'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleDismiss}
                className={`p-1.5 rounded-full transition-colors shrink-0 ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'
                }`}
                title="Agora não"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Permission Bar */}
            <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
              isDark ? 'bg-zinc-800/80 border border-zinc-700/60' : 'bg-slate-50 border border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-[11px] text-slate-600 dark:text-zinc-300">
                  {notificationPermission === 'granted'
                    ? 'Notificações ativadas com sucesso'
                    : 'Permitir notificações de lembretes'}
                </span>
              </div>
              {notificationPermission === 'granted' ? (
                <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              ) : (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                >
                  Permitir
                </button>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={handleDismiss}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors ${
                  isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Depois
              </button>

              <button
                onClick={handleInstallAndNotify}
                className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'Ativar Notificações' : 'Instalar & Notificar'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
