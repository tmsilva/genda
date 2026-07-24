import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Bell, CheckCircle2, Smartphone, Share, MoreVertical, PlusSquare, ArrowUpRight } from 'lucide-react';

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
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  useEffect(() => {
    // Check if already installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://');
      
    if (isStandalone) return;

    // Detect User Agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|windows phone|mobile/.test(userAgent) || window.innerWidth < 768;
    
    setIsIOS(isIOSDevice);
    setIsMobile(isMobileDevice);

    // Capture Chrome / Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check dismissal history (allow re-prompting after 1 day or immediately on mobile)
    const dismissedAt = localStorage.getItem('genda_pwa_dismissed_time');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const shouldShow = !dismissedAt || (now - parseInt(dismissedAt, 10) > oneDay);

    if (shouldShow) {
      // Show prompt banner on mobile devices after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

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

  const handleInstallClick = async () => {
    // 1. Explicitly request notification permission
    await requestNotificationPermission();

    // 2. Trigger native PWA prompt if available
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted PWA installation');
          setShowPrompt(false);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.error('Error launching install prompt:', err);
      }
    }

    // 3. If native prompt unavailable (e.g. iOS or manual browser requirement), open step-by-step instructions modal
    setShowInstructionsModal(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('genda_pwa_dismissed_time', Date.now().toString());
  };

  if (!showPrompt && !showInstructionsModal) return null;

  return (
    <>
      {/* Floating Banner for Mobile/Desktop */}
      <AnimatePresence>
        {showPrompt && !showInstructionsModal && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[88px] left-3 right-3 md:left-auto md:right-8 md:bottom-8 md:w-96 z-50"
          >
            <div className={`p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col gap-3.5 border ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black/80' 
                : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
            }`}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <Smartphone className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                      Instalar o Genda no Celular
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {isIOS 
                        ? 'Toque para ver como adicionar à tela de início do seu iPhone e ativar lembretes.'
                        : 'Instale o app na sua tela inicial para acesso instantâneo, notificações de agendamentos e suporte offline.'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleDismiss}
                  className={`p-1.5 rounded-full transition-colors shrink-0 ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notification Permission Quick Bar */}
              <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
                isDark ? 'bg-zinc-800/80 border border-zinc-700/60' : 'bg-slate-50 border border-slate-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-medium text-[11px] truncate text-slate-600 dark:text-zinc-300">
                    {notificationPermission === 'granted'
                      ? 'Notificações ativadas'
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
                  className={`px-3.5 py-2 text-xs font-semibold rounded-full transition-colors ${
                    isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Agora não
                </button>

                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar no Celular</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Step-by-Step Installation Modal (For iOS / Browsers without auto-prompt) */}
      <AnimatePresence>
        {showInstructionsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 text-left ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Como Instalar o Genda</h3>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {isIOS ? 'Passo a passo no iPhone (Safari)' : 'Passo a passo no Android / Navegador'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isIOS ? (
                /* iOS Safari Instructions */
                <div className="space-y-3.5 text-xs">
                  <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1.5">
                        Toque no botão Compartilhar <Share className="w-4 h-4 text-indigo-400 inline" />
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Localizado no menu inferior do Safari no seu iPhone.
                      </p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1.5">
                        Selecione "Adicionar à Tela de Início" <PlusSquare className="w-4 h-4 text-indigo-400 inline" />
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Role as opções para baixo até encontrar o ícone de adição.
                      </p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">3</div>
                    <div>
                      <p className="font-bold text-sm">Toque em "Adicionar"</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        O ícone do Genda aparecerá na sua tela de início como um aplicativo nativo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / General Browser Instructions */
                <div className="space-y-3.5 text-xs">
                  <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">1</div>
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1.5">
                        Abra o menu do Navegador <MoreVertical className="w-4 h-4 text-indigo-400 inline" />
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Toque nos 3 pontinhos no canto superior direito do seu navegador (Chrome/Edge/Samsung).
                      </p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">2</div>
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1.5">
                        Toque em "Instalar aplicativo" ou "Adicionar à Tela Inicial"
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Confirme a instalação para ter o Genda como app nativo no celular.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
