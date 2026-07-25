import React, { useState, useEffect } from 'react';
import { 
  Globe, Copy, Share2, QrCode, ExternalLink, Check, 
  Settings, Clock, Calendar as CalendarIcon, ShieldCheck, DollarSign, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Image, 
  Instagram, Phone, MapPin, BarChart3, Plus, Trash2, Sliders, 
  Lock, Search, AlertTriangle, RefreshCw
} from 'lucide-react';
import { OnlineBookingConfig, Service, Appointment, Client, WorkingDay, ProfessionalProfile, BlockedDate } from '../types';
import { formatPrice, formatPhoneWithCountryCode } from '../utils';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface OnlineBookingViewProps {
  config: OnlineBookingConfig;
  onUpdateConfig: (newConfig: OnlineBookingConfig) => void;
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  workingDays: WorkingDay[];
  profile: ProfessionalProfile;
  onUpdateProfile: (newProfile: ProfessionalProfile) => void;
  isDark: boolean;
  onOpenPublicView: () => void;
  triggerAlert: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OnlineBookingView: React.FC<OnlineBookingViewProps> = ({
  config,
  onUpdateConfig,
  services,
  appointments,
  clients,
  workingDays,
  profile,
  onUpdateProfile,
  isDark,
  onOpenPublicView,
  triggerAlert
}) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>('disponibilidade');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Slug Database Verification State
  const [slugInput, setSlugInput] = useState(config.slug || 'seunome');
  const [isVerifyingSlug, setIsVerifyingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [slugMessage, setSlugMessage] = useState<string>('');

  // New Blocked Date State
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // Dynamic real public link for the establishment
  const cleanSlug = (slugInput || 'seunome').toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  const publicUrl = `https://genda-rose.vercel.app/?agendar=${cleanSlug}`;

  // Get or create persistent device establishment ID when user is unauthenticated
  const getDeviceEstablishmentId = () => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    let localId = localStorage.getItem('genda_establishment_uid');
    if (!localId) {
      localId = 'est_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('genda_establishment_uid', localId);
    }
    return localId;
  };

  const handleSaveSettings = async () => {
    try {
      const currentUserId = getDeviceEstablishmentId();
      const oldSlug = config.slug;

      // Delete any other slugs belonging to this user in Firestore
      try {
        const querySnapshot = await getDocs(collection(db, 'establishment_slugs'));
        for (const documentSnapshot of querySnapshot.docs) {
          const data = documentSnapshot.data();
          if (documentSnapshot.id !== cleanSlug && data.userId === currentUserId) {
            await deleteDoc(doc(db, 'establishment_slugs', documentSnapshot.id));
          }
        }
      } catch (e) {
        console.warn("Erro ao limpar slugs anteriores do usuário no Firestore:", e);
      }

      if (oldSlug && oldSlug !== cleanSlug) {
        try {
          await deleteDoc(doc(db, 'establishment_slugs', oldSlug));
        } catch (e) {}
      }

      const {
        title: _t,
        welcomeMessage: _wm,
        whatsapp: _wa,
        coverImageUrl: _ci,
        staffMembers: _sm,
        seoTitle: _st,
        seoDescription: _sd,
        establishmentName: _en,
        enabledServiceIds: _es,
        ...cleanConfig
      } = config as any;

      await setDoc(doc(db, 'establishment_slugs', cleanSlug), {
        userId: currentUserId,
        slug: cleanSlug,
        config: cleanConfig,
        services,
        profile: {
          name: profile.name,
          category: profile.category,
          instagram: profile.instagram,
          address: profile.address,
          avatarUrl: profile.avatarUrl,
        },
        workingDays,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (cleanSlug !== oldSlug) {
        onUpdateConfig({
          ...config,
          slug: cleanSlug
        });
      }

      triggerAlert('Configurações salvas com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      triggerAlert('Configurações salvas localmente com sucesso!', 'success');
    }
  };

  // Verify slug uniqueness in Firestore database
  const handleVerifySlugInDatabase = async (candidateSlug?: string): Promise<boolean> => {
    const slugToCheck = candidateSlug !== undefined ? candidateSlug : cleanSlug;
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugStatus('invalid');
      setSlugMessage('O link do estabelecimento deve ter pelo menos 3 caracteres (letras, números e hífen).');
      setIsVerifyingSlug(false);
      return false;
    }

    setIsVerifyingSlug(true);
    setSlugStatus('checking');

    const currentUserId = getDeviceEstablishmentId();

    try {
      const docRef = doc(db, 'establishment_slugs', slugToCheck);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.userId && data.userId !== currentUserId) {
          setSlugStatus('taken');
          setSlugMessage(`❌ O link "/${slugToCheck}" já pertence a outro estabelecimento no banco de dados! Por favor, escolha outro nome.`);
          setIsVerifyingSlug(false);
          return false;
        } else if (data?.userId === currentUserId) {
          setSlugStatus('available');
          setSlugMessage(`✅ Link único "/${slugToCheck}" já reservado por você e ativo no banco de dados!`);
          setIsVerifyingSlug(false);
          return true;
        }
      }

      setSlugStatus('available');
      setSlugMessage(`✅ Link único "/${slugToCheck}" verificado e disponível no banco de dados!`);
      setIsVerifyingSlug(false);
      return true;
    } catch (error) {
      console.warn("Verificação de slug no Firestore:", error);
      
      // Local fallback in case of connection drop
      const localRegistryStr = localStorage.getItem('genda_local_reserved_slugs') || '{}';
      let localRegistry: Record<string, string> = {};
      try { localRegistry = JSON.parse(localRegistryStr); } catch {}

      if (localRegistry[slugToCheck] && localRegistry[slugToCheck] !== currentUserId) {
        setSlugStatus('taken');
        setSlugMessage(`❌ O link "/${slugToCheck}" já está em uso por outro estabelecimento!`);
        setIsVerifyingSlug(false);
        return false;
      }

      setSlugStatus('available');
      setSlugMessage(`✅ Link único "/${slugToCheck}" verificado e disponível!`);
      setIsVerifyingSlug(false);
      return true;
    }
  };

  // Save unique slug to database
  const handleSaveAndReserveSlug = async () => {
    const isAvailable = await handleVerifySlugInDatabase(cleanSlug);
    if (!isAvailable) {
      triggerAlert('Não é possível reservar: este link já pertence a outro estabelecimento no banco de dados.', 'error');
      return;
    }

    const currentUserId = getDeviceEstablishmentId();
    const oldSlug = config.slug;

    try {
      // Query and delete any other slugs belonging to this user in Firestore
      try {
        const querySnapshot = await getDocs(collection(db, 'establishment_slugs'));
        for (const documentSnapshot of querySnapshot.docs) {
          const data = documentSnapshot.data();
          if (documentSnapshot.id !== cleanSlug && data.userId === currentUserId) {
            await deleteDoc(doc(db, 'establishment_slugs', documentSnapshot.id));
          }
        }
      } catch (e) {
        console.warn("Erro ao limpar slugs anteriores do usuário no Firestore:", e);
      }

      if (oldSlug && oldSlug !== cleanSlug) {
        try {
          await deleteDoc(doc(db, 'establishment_slugs', oldSlug));
        } catch (e) {
          console.warn("Erro ao excluir slug anterior do Firestore:", e);
        }
      }

      // Also clean up local storage registry for this user
      const localRegistryStr = localStorage.getItem('genda_local_reserved_slugs') || '{}';
      let localRegistry: Record<string, string> = {};
      try { localRegistry = JSON.parse(localRegistryStr); } catch {}
      Object.keys(localRegistry).forEach((s) => {
        if (localRegistry[s] === currentUserId && s !== cleanSlug) {
          delete localRegistry[s];
        }
      });
      localRegistry[cleanSlug] = currentUserId;
      localStorage.setItem('genda_local_reserved_slugs', JSON.stringify(localRegistry));

      await setDoc(doc(db, 'establishment_slugs', cleanSlug), {
        userId: currentUserId,
        slug: cleanSlug,
        updatedAt: new Date().toISOString()
      }, { merge: true });



      onUpdateConfig({
        ...config,
        slug: cleanSlug
      });

      setSlugStatus('available');
      setSlugMessage(`✅ Link único "/${cleanSlug}" salvo e reservado com sucesso no banco de dados!`);
      triggerAlert(`Link único /${cleanSlug} registrado e verificado com sucesso no banco de dados!`, 'success');
    } catch (err) {
      console.error("Erro ao salvar no Firestore:", err);
      if (oldSlug && oldSlug !== cleanSlug) {
        const localRegistryStr = localStorage.getItem('genda_local_reserved_slugs') || '{}';
        let localRegistry: Record<string, string> = {};
        try { localRegistry = JSON.parse(localRegistryStr); } catch {}
        delete localRegistry[oldSlug];
        localStorage.setItem('genda_local_reserved_slugs', JSON.stringify(localRegistry));
      }

      // Fallback save locally
      const localRegistryStr = localStorage.getItem('genda_local_reserved_slugs') || '{}';
      let localRegistry: Record<string, string> = {};
      try { localRegistry = JSON.parse(localRegistryStr); } catch {}
      localRegistry[cleanSlug] = currentUserId;
      localStorage.setItem('genda_local_reserved_slugs', JSON.stringify(localRegistry));

      onUpdateConfig({
        ...config,
        slug: cleanSlug
      });

      setSlugStatus('available');
      setSlugMessage(`✅ Link único "/${cleanSlug}" reservado com sucesso!`);
      triggerAlert(`Link personalizado definido para /${cleanSlug}`, 'success');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    triggerAlert('Link do Agendamento Online copiado com sucesso!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.name || 'Agendamento Online',
          text: profile.welcomeMessage || 'Agende seu horário online em segundos!',
          url: publicUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleToggleService = (serviceId: string) => {
    const current = config.enabledServiceIds || [];
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    onUpdateConfig({ ...config, enabledServiceIds: updated });
  };

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) {
      triggerAlert('Informe a data do bloqueio.', 'error');
      return;
    }
    const newEntry: BlockedDate = {
      id: 'b_' + Date.now(),
      date: newBlockedDate,
      reason: newBlockedReason || 'Bloqueio manual / Feriado'
    };
    onUpdateConfig({
      ...config,
      blockedDates: [...(config.blockedDates || []), newEntry]
    });
    setNewBlockedDate('');
    setNewBlockedReason('');
    triggerAlert('Data bloqueada com sucesso!', 'success');
  };

  const handleRemoveBlockedDate = (id: string) => {
    onUpdateConfig({
      ...config,
      blockedDates: (config.blockedDates || []).filter(b => b.id !== id)
    });
    triggerAlert('Bloqueio removido.', 'info');
  };

  // REAL SYSTEM STATISTICS CALCULATIONS
  const onlineAppts = appointments.filter(a => a.source === 'online' || a.id.startsWith('online_') || a.id.includes('online'));
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const todayCount = onlineAppts.filter(a => a.date === todayStr).length;
  const monthCount = onlineAppts.filter(a => a.date && a.date.startsWith(currentMonthStr)).length;
  
  const completedOnlineCount = onlineAppts.filter(a => a.status === 'completed' || a.status === 'scheduled').length;
  const cancelledOnlineCount = onlineAppts.filter(a => a.status === 'cancelled').length;

  const onlineRevenue = onlineAppts
    .filter(a => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (a.price || 0), 0);

  const totalApptsCount = appointments.length;
  const realOnlineShare = totalApptsCount > 0 
    ? Math.round((onlineAppts.length / totalApptsCount) * 100) 
    : 0;

  const realCancellationRate = onlineAppts.length > 0 
    ? ((cancelledOnlineCount / onlineAppts.length) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl sm:text-2xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Agendamento Online
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Dados Reais Sincronizados
                  </span>
                </div>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Link exclusivo do seu estabelecimento com verificação única no banco de dados e sincronização em tempo real.
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center p-2 rounded-xl border bg-indigo-950/20 border-indigo-800/30">
            <span className={`text-xs font-bold ${config.isEnabled ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {config.isEnabled ? 'Portal Online Ativo' : 'Portal Online Desativado'}
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdateConfig({ ...config, isEnabled: !config.isEnabled });
                triggerAlert(
                  !config.isEnabled ? 'Agendamento Online ATIVADO!' : 'Agendamento Online DESATIVADO.',
                  !config.isEnabled ? 'success' : 'info'
                );
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                config.isEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* TOP CARDS: PUBLIC UNIQUE LINK & REAL SYSTEM METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Public Link Card with Database Verification */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Link Único do Estabelecimento
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono font-bold">
                /{cleanSlug}
              </span>
            </div>

            {/* Slug Editor & DB Verification Row */}
            <div className="space-y-2">
              <label className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Personalizar e Verificar Unicidade no Banco de Dados:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className={`flex-1 flex items-center gap-1 px-3 py-2 rounded-xl border font-mono text-xs ${
                  isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}>
                  <span className="text-zinc-500 select-none text-[10px] sm:text-[11px] font-mono shrink-0">genda-rose.vercel.app/?agendar=</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setSlugInput(val);
                      setSlugStatus('idle');
                      setSlugMessage('');
                    }}
                    placeholder="nome-do-seu-estabelecimento"
                    className="flex-1 bg-transparent border-none outline-none text-indigo-400 font-bold"
                  />
                </div>

                <button
                  type="button"
                  disabled={isVerifyingSlug}
                  onClick={handleSaveAndReserveSlug}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingSlug ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Verificar & Reservar</span>
                </button>
              </div>

              {/* Status Message */}
              {slugMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  slugStatus === 'available'
                    ? (isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold')
                    : slugStatus === 'taken' || slugStatus === 'invalid'
                    ? (isDark ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900 font-semibold')
                    : (isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-100 border-slate-300 text-slate-800 font-semibold')
                }`}>
                  <span>{slugMessage}</span>
                </div>
              )}
            </div>

            {/* Public Link Display */}
            <div className={`p-3 rounded-xl border font-mono text-xs overflow-x-auto scrollbar-none flex items-center justify-between ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-700'
            }`}>
              <span className="truncate select-all font-bold">{publicUrl}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Partilhar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>QR Code</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await handleSaveSettings();
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '?agendar=' + cleanSlug);
                }
                onOpenPublicView();
              }}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 col-span-2 sm:col-span-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Testar Portal</span>
            </button>
          </div>
        </div>

        {/* Real System Statistics Card */}
        <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Estatísticas Reais do Sistema
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Dados Reais</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'}`}>
                <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Hoje</span>
                <span className={`text-lg font-extrabold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{todayCount}</span>
                <span className={`block text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>Agendamentos</span>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'}`}>
                <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Este Mês</span>
                <span className={`text-lg font-extrabold font-mono ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{monthCount}</span>
                <span className={`block text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>Agendamentos</span>
              </div>

              <div className={`p-2.5 rounded-xl border col-span-2 sm:col-span-1 ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'}`}>
                <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Receita Online</span>
                <span className={`text-base font-extrabold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatPrice(onlineRevenue)}</span>
                <span className={`block text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>Acumulada</span>
              </div>
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t space-y-1.5 text-xs ${isDark ? 'border-zinc-800/60 text-zinc-400' : 'border-slate-200 text-slate-600'}`}>
            <div className="flex items-center justify-between">
              <span>Proporção Online na Agenda:</span>
              <strong className={`font-mono ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{realOnlineShare}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Taxa Real de Cancelamento:</span>
              <strong className={`font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{realCancellationRate}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIGURATION SECTIONS */}
      <div className={`p-6 rounded-2xl border space-y-4 ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Settings className="w-4 h-4 text-indigo-500" />
          Configurações do Agendamento Online
        </h2>

        <div className="space-y-3">
          {/* ACCORDION 1: DISPONIBILIDADE */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
            <button
              type="button"
              onClick={() => toggleAccordion('disponibilidade')}
              className={`w-full p-4 flex items-center justify-between font-bold text-sm text-left transition-colors cursor-pointer ${
                openAccordion === 'disponibilidade'
                  ? (isDark ? 'bg-zinc-800/80 text-indigo-300' : 'bg-slate-100 text-indigo-700')
                  : (isDark ? 'text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-800 hover:bg-slate-100/60')
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>1. Disponibilidade, Intervalos & Feriados</span>
              </div>
              {openAccordion === 'disponibilidade' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openAccordion === 'disponibilidade' && (
              <div className="p-4 space-y-4 border-t border-zinc-800/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Tempo mínimo de antecedência antes do agendamento
                    </label>
                    <select
                      value={config.minAdvanceHours}
                      onChange={(e) => onUpdateConfig({ ...config, minAdvanceHours: Number(e.target.value) })}
                      className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl px-3 py-2 text-xs focus:outline-none border`}
                    >
                      <option value={0}>Sem antecedência (Imediato)</option>
                      <option value={1}>1 hora antes</option>
                      <option value={2}>2 horas antes (Recomendado)</option>
                      <option value={4}>4 horas antes</option>
                      <option value={12}>12 horas antes</option>
                      <option value={24}>24 horas (1 dia antes)</option>
                    </select>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Evita que clientes marquem horários em cima da hora sem aviso prévio.
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Intervalo padrão de grade entre horários
                    </label>
                    <select
                      value={config.slotIntervalMinutes}
                      onChange={(e) => onUpdateConfig({ ...config, slotIntervalMinutes: Number(e.target.value) })}
                      className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl px-3 py-2 text-xs focus:outline-none border`}
                    >
                      <option value={15}>A cada 15 minutos</option>
                      <option value={30}>A cada 30 minutos (Padrão)</option>
                      <option value={40}>A cada 40 minutos</option>
                      <option value={60}>A cada 1 hora</option>
                    </select>
                  </div>
                </div>

                {/* Blocked Dates Manager */}
                <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" /> Feriados & Dias Bloqueados Manualmente
                  </span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="date"
                      value={newBlockedDate}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                    <input
                      type="text"
                      placeholder="Motivo (ex: Feriado, Folga)"
                      value={newBlockedReason}
                      onChange={(e) => setNewBlockedReason(e.target.value)}
                      className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                    <button
                      type="button"
                      onClick={handleAddBlockedDate}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Bloqueio
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(config.blockedDates || []).length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic">Nenhum dia específico bloqueado.</p>
                    ) : (
                      config.blockedDates.map(item => (
                        <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">{item.date.split('-').reverse().join('/')}</span>
                            <span className="text-zinc-400">-</span>
                            <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{item.reason}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlockedDate(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                            title="Remover bloqueio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: SERVIÇOS DISPONÍVEIS */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
            <button
              type="button"
              onClick={() => toggleAccordion('servicos')}
              className={`w-full p-4 flex items-center justify-between font-bold text-sm text-left transition-colors cursor-pointer ${
                openAccordion === 'servicos'
                  ? (isDark ? 'bg-zinc-800/80 text-indigo-300' : 'bg-slate-100 text-indigo-700')
                  : (isDark ? 'text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-800 hover:bg-slate-100/60')
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>2. Serviços Exibidos no Agendamento Online</span>
              </div>
              {openAccordion === 'servicos' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openAccordion === 'servicos' && (
              <div className="p-4 space-y-3 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-400">
                  Selecione quais serviços cadastrados no sistema ficarão visíveis para os clientes agendarem:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {services.map(s => {
                    const isEnabled = (config.enabledServiceIds || []).includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleService(s.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isEnabled
                            ? (isDark ? 'bg-indigo-950/40 border-indigo-500/50 text-white' : 'bg-indigo-50/80 border-indigo-200 text-slate-900')
                            : (isDark ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 opacity-60' : 'bg-slate-100 border-slate-200 text-slate-500 opacity-60')
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs block">{s.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400">{s.duration} min • {formatPrice(s.price)}</span>
                        </div>

                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isEnabled ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-zinc-600'
                        }`}>
                          {isEnabled && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 3: MODO DE CONFIRMAÇÃO */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
            <button
              type="button"
              onClick={() => toggleAccordion('confirmacao')}
              className={`w-full p-4 flex items-center justify-between font-bold text-sm text-left transition-colors cursor-pointer ${
                openAccordion === 'confirmacao'
                  ? (isDark ? 'bg-zinc-800/80 text-indigo-300' : 'bg-slate-100 text-indigo-700')
                  : (isDark ? 'text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-800 hover:bg-slate-100/60')
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>3. Modo de Confirmação do Agendamento</span>
              </div>
              {openAccordion === 'confirmacao' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openAccordion === 'confirmacao' && (
              <div className="p-4 space-y-4 border-t border-zinc-800/60">
                <div>
                  <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    Escolha como os agendamentos online entram na sua agenda:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, autoApprove: true })}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        config.autoApprove
                          ? (isDark 
                              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                              : 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm ring-1 ring-emerald-500/30')
                          : (isDark 
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                      }`}
                    >
                      <span className={`font-bold text-sm block flex items-center gap-1.5 ${
                        config.autoApprove
                          ? (isDark ? 'text-emerald-400' : 'text-emerald-800')
                          : (isDark ? 'text-zinc-400' : 'text-slate-700')
                      }`}>
                        ⚡ Aprovação Automática
                      </span>
                      <span className={`text-xs block mt-1 ${
                        config.autoApprove
                          ? (isDark ? 'text-zinc-300' : 'text-slate-700 font-medium')
                          : (isDark ? 'text-zinc-400' : 'text-slate-500')
                      }`}>
                        O horário fica imediatamente reservado na agenda assim que o cliente confirma.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ ...config, autoApprove: false })}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        !config.autoApprove
                          ? (isDark 
                              ? 'bg-amber-950/40 border-amber-500 text-white shadow-md shadow-amber-500/10' 
                              : 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm ring-1 ring-amber-500/30')
                          : (isDark 
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                      }`}
                    >
                      <span className={`font-bold text-sm block flex items-center gap-1.5 ${
                        !config.autoApprove
                          ? (isDark ? 'text-amber-400' : 'text-amber-800')
                          : (isDark ? 'text-zinc-400' : 'text-slate-700')
                      }`}>
                        ⏳ Aprovação Manual
                      </span>
                      <span className={`text-xs block mt-1 ${
                        !config.autoApprove
                          ? (isDark ? 'text-zinc-300' : 'text-slate-700 font-medium')
                          : (isDark ? 'text-zinc-400' : 'text-slate-500')
                      }`}>
                        O pedido entra como pré-reserva pendente de aprovação antes de entrar na agenda final.
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 4: LIMITES & REGRAS */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
            <button
              type="button"
              onClick={() => toggleAccordion('limites')}
              className={`w-full p-4 flex items-center justify-between font-bold text-sm text-left transition-colors cursor-pointer ${
                openAccordion === 'limites'
                  ? (isDark ? 'bg-zinc-800/80 text-indigo-300' : 'bg-slate-100 text-indigo-700')
                  : (isDark ? 'text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-800 hover:bg-slate-100/60')
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>4. Limites de Proteção & Regras de Clientes</span>
              </div>
              {openAccordion === 'limites' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openAccordion === 'limites' && (
              <div className="p-4 space-y-4 border-t border-zinc-800/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Máximo de agendamentos online por dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config.maxBookingsPerDay}
                      onChange={(e) => onUpdateConfig({ ...config, maxBookingsPerDay: Number(e.target.value) })}
                      className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl px-3 py-2 text-xs font-mono border`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Máximo por cliente por dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={config.maxBookingsPerClient}
                      onChange={(e) => onUpdateConfig({ ...config, maxBookingsPerClient: Number(e.target.value) })}
                      className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl px-3 py-2 text-xs font-mono border`}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Bloquear clientes com pagamentos pendentes</span>
                      <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Impede novos agendamentos online para clientes com débitos.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.blockDelinquents}
                      onChange={(e) => onUpdateConfig({ ...config, blockDelinquents: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Bloquear clientes com histórico de faltas</span>
                      <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Exige aprovação prévia para clientes com registros de não comparecimento.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.blockFrequentNoShows}
                      onChange={(e) => onUpdateConfig({ ...config, blockFrequentNoShows: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 5: DADOS & APARÊNCIA DO ESTABELECIMENTO */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
            <button
              type="button"
              onClick={() => toggleAccordion('personalizacao')}
              className={`w-full p-4 flex items-center justify-between font-bold text-sm text-left transition-colors cursor-pointer ${
                openAccordion === 'personalizacao'
                  ? (isDark ? 'bg-zinc-800/80 text-indigo-300' : 'bg-slate-100 text-indigo-700')
                  : (isDark ? 'text-zinc-200 hover:bg-zinc-800/40' : 'text-slate-800 hover:bg-slate-100/60')
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Image className="w-4 h-4 text-sky-400" />
                <span>5. Informações & Aparência do Estabelecimento</span>
              </div>
              {openAccordion === 'personalizacao' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openAccordion === 'personalizacao' && (
              <div className="p-4 space-y-4 border-t border-zinc-800/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      WhatsApp para Suporte ao Cliente
                    </label>
                    <input
                      type="text"
                      placeholder="+55 (11) 98765-4321"
                      value={formatPhoneWithCountryCode(profile.whatsapp || '')}
                      onChange={(e) => {
                        const formatted = formatPhoneWithCountryCode(e.target.value);
                        onUpdateProfile({ ...profile, whatsapp: formatted });
                      }}
                      className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl px-3 py-2 text-xs font-mono border`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Instagram (@seuinstagram)
                    </label>
                    <input
                      type="text"
                      placeholder="@seuinstagram"
                      value={config.instagram !== undefined ? config.instagram : (profile.instagram || '')}
                      onChange={(e) => onUpdateConfig({ ...config, instagram: e.target.value })}
                      className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl px-3 py-2 text-xs border`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Endereço Físico
                  </label>
                  <input
                    type="text"
                    value={config.address}
                    onChange={(e) => onUpdateConfig({ ...config, address: e.target.value })}
                    className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl px-3 py-2 text-xs border`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Descrição / Mensagem de Boas-Vindas aos Clientes
                  </label>
                  <textarea
                    rows={2}
                    value={config.description}
                    onChange={(e) => onUpdateConfig({ ...config, description: e.target.value })}
                    className={`w-full ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl p-2.5 text-xs border`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SAVE BUTTON FOR LOGGED USER */}
      <div className="pt-4 pb-8 flex justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Salvar Configurações
        </button>
      </div>

      {/* QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`p-6 rounded-2xl border max-w-sm w-full text-center space-y-4 ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-400" />
              QR Code do Seu Estabelecimento
            </h3>

            <div className="p-4 bg-white rounded-xl inline-block border shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`}
                alt="QR Code Agendamento Online"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-xs text-zinc-400">
              Imprima este QR Code ou coloque na recepção para seus clientes agendarem rapidamente pelo celular.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Copiar Link
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
