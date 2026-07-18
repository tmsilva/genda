import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Shield, Mail, Key, User, Briefcase, Clock, Sparkles, Check, ChevronRight, ChevronLeft, Plus, Trash2, Smartphone, Globe, AlertTriangle, Palette, Upload, X, Cloud, RefreshCw } from 'lucide-react';
import { Service, WorkingDay, ProfessionalProfile, ThemeOption } from '../types';
import { THEME_OPTIONS, DEFAULT_SERVICES, DEFAULT_WORKING_DAYS } from '../data';
import { formatPhone, formatPrice } from '../utils';
import Logo from './Logo';

interface OnboardingProps {
  onComplete: (
    profile: ProfessionalProfile, 
    services: Service[], 
    pendingAuth?: { email: string; password?: string; name: string }
  ) => void;
  onQuickStart: () => void;
  onLoginGoogle?: () => Promise<void> | void;
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onRegisterEmail?: (email: string, password: string, displayName: string) => Promise<void>;
  user?: any;
  isCloudSyncing?: boolean;
}

export default function Onboarding({ 
  onComplete, 
  onQuickStart,
  onLoginGoogle,
  onLoginEmail,
  onRegisterEmail,
  user,
  isCloudSyncing = false
}: OnboardingProps) {
  // 0: Welcome, 1: Login, 2: Prof Data, 3: Working Hours, 4: Services Catalog, 5: Personalization
  const [step, setStep] = useState<number>(0);
  
  // Terms & Privacy Acceptance
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pending email/password for offline onboarding registration sequence
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      if (!isRegistering) {
        if (onLoginEmail) {
          await onLoginEmail(email, password);
        }
      } else {
        if (!authDisplayName.trim()) {
          setAuthError('Por favor, informe seu nome.');
          setIsLoading(false);
          return;
        }
        if (!acceptTerms) {
          setAuthError('Você precisa aceitar os Termos de Uso e Política de Privacidade para criar uma conta.');
          setIsLoading(false);
          return;
        }
        
        // Save registration details to register at the end of the onboarding
        setPendingEmail(email);
        setPendingPassword(password);
      }
      
      // Successful login or deferred register transition
      if (isRegistering) {
        setProfName(authDisplayName);
        setCategory('');
        setAvatarUrl('');
        setCountryCode('+55');
        setWhatsapp('');
        setWorkingDays(JSON.parse(JSON.stringify(DEFAULT_WORKING_DAYS)));
        setServices([]);
        setSelectedThemeId('elegant-dark');
        setStep(2); // Go to profile creation step
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = 'Erro ao realizar autenticação. Tente novamente.';
      if (err.code === 'auth/wrong-password' || err.message?.includes('wrong-password')) {
        friendlyMessage = 'Senha incorreta. Verifique sua senha e tente novamente.';
      } else if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found')) {
        friendlyMessage = 'Usuário não encontrado com este e-mail.';
      } else if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
        friendlyMessage = 'Este e-mail já está em uso por outra conta.';
      } else if (err.code === 'auth/invalid-email' || err.message?.includes('invalid-email')) {
        friendlyMessage = 'Formato de e-mail inválido.';
      } else if (err.code === 'auth/weak-password' || err.message?.includes('weak-password')) {
        friendlyMessage = 'A senha deve conter no mínimo 6 caracteres.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      setAuthError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2.1: Prof Data
  const [profName, setProfName] = useState('');
  const [category, setCategory] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsapp, setWhatsapp] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400; // Optimal size for high quality avatar/logo (typically < 40KB)
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress as JPEG with 70% quality
            setAvatarUrl(compressedUrl);
          } else {
            setAvatarUrl(e.target.result as string);
          }
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 2.2: Working Hours
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>(JSON.parse(JSON.stringify(DEFAULT_WORKING_DAYS)));

  // Step 2.3: Service Catalog
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState(50);
  const [newServiceColor, setNewServiceColor] = useState('#0ea5e9');

  // Step 2.4: Personalization
  const [selectedThemeId, setSelectedThemeId] = useState('elegant-dark');
  const [offlineEnabled, setOfflineEnabled] = useState(true);

  // Common categories list
  const CATEGORIES = [
    'Barbearia',
    'Manicure / Pedicure',
    'Estética & Cosmética',
    'Psicologia & Terapia',
    'Personal Trainer',
    'Consultoria / Advocacia',
    'Aulas Particulares',
    'Outros Serviços'
  ];

  const COLORS = [
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ef4444', // Red
  ];

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!profName.trim()) {
        setValidationError('Por favor, informe o seu nome ou o nome do negócio.');
        return;
      }
      if (!category.trim()) {
        setValidationError('Por favor, informe a categoria ou ramo de atuação.');
        return;
      }
      if (!whatsapp.trim()) {
        setValidationError('Por favor, informe o seu número de WhatsApp.');
        return;
      }
      setValidationError('');
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(0);
      return;
    }
    setStep((prev) => prev - 1);
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    const newS: Service = {
      id: 's_custom_' + Date.now(),
      name: newServiceName,
      duration: newServiceDuration,
      price: newServicePrice,
      color: newServiceColor,
    };
    setServices([...services, newS]);
    setNewServiceName('');
    // reset defaults or toggle input
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleFinish = () => {
    const finalProfile: ProfessionalProfile = {
      name: profName,
      category: category,
      avatarUrl: avatarUrl || undefined,
      whatsapp: whatsapp ? `${countryCode} ${whatsapp}` : undefined,
      workingDays: workingDays,
      themeId: selectedThemeId,
      isOfflineModeEnabled: offlineEnabled,
    };

    // Services will be only those registered or empty if skipped
    if (pendingEmail && pendingPassword) {
      onComplete(finalProfile, services, {
        email: pendingEmail,
        password: pendingPassword,
        name: profName
      });
    } else {
      onComplete(finalProfile, services);
    }
  };

  const toggleDayWorking = (dayIndex: number) => {
    setWorkingDays(workingDays.map(wd => {
      if (wd.dayOfWeek === dayIndex) {
        return { ...wd, isWorking: !wd.isWorking };
      }
      return wd;
    }));
  };

  const updateDayHours = (dayIndex: number, field: 'startTime' | 'endTime' | 'lunchStart' | 'lunchEnd', value: string) => {
    setWorkingDays(workingDays.map(wd => {
      if (wd.dayOfWeek === dayIndex) {
        return { ...wd, [field]: value };
      }
      return wd;
    }));
  };

  const currentTheme = THEME_OPTIONS.find(t => t.id === selectedThemeId) || THEME_OPTIONS[0];

  const getThemeStyles = () => {
    switch (selectedThemeId) {
      case 'elegant-dark':
        return {
          bg: 'bg-zinc-950 text-zinc-100',
          cardBg: 'bg-zinc-900/80 border-zinc-800/80',
          glow1: 'bg-indigo-500/10',
          glow2: 'bg-purple-500/10',
          accentText: 'text-indigo-400',
          accentBorder: 'border-indigo-500/20',
          buttonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25',
          inputBorder: 'focus:border-indigo-500',
          tagBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          buttonSecondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700',
        };
      case 'slate':
        return {
          bg: 'bg-slate-950 text-slate-100',
          cardBg: 'bg-slate-900/80 border-slate-800/80',
          glow1: 'bg-slate-500/10',
          glow2: 'bg-slate-400/10',
          accentText: 'text-slate-400',
          accentBorder: 'border-slate-700/25',
          buttonPrimary: 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/25',
          inputBorder: 'focus:border-slate-500',
          tagBg: 'bg-slate-800 text-slate-400 border-slate-700',
          buttonSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-950 text-emerald-50',
          cardBg: 'bg-emerald-900/60 border-emerald-800/80',
          glow1: 'bg-emerald-500/15',
          glow2: 'bg-teal-500/10',
          accentText: 'text-emerald-400',
          accentBorder: 'border-emerald-500/20',
          buttonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25',
          inputBorder: 'focus:border-emerald-500',
          tagBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          buttonSecondary: 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-700',
        };
      case 'ocean':
        return {
          bg: 'bg-sky-950 text-sky-50',
          cardBg: 'bg-sky-900/60 border-sky-800/80',
          glow1: 'bg-sky-500/15',
          glow2: 'bg-blue-500/10',
          accentText: 'text-sky-400',
          accentBorder: 'border-sky-500/20',
          buttonPrimary: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/25',
          inputBorder: 'focus:border-sky-500',
          tagBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          buttonSecondary: 'bg-sky-800 hover:bg-sky-700 text-sky-100 border-sky-700',
        };
      case 'orchid':
        return {
          bg: 'bg-purple-950 text-purple-50',
          cardBg: 'bg-purple-900/60 border-purple-800/80',
          glow1: 'bg-purple-500/15',
          glow2: 'bg-pink-500/10',
          accentText: 'text-purple-400',
          accentBorder: 'border-purple-500/20',
          buttonPrimary: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/25',
          inputBorder: 'focus:border-purple-500',
          tagBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          buttonSecondary: 'bg-purple-800 hover:bg-purple-700 text-purple-100 border-purple-700',
        };
      default:
        return {
          bg: 'bg-slate-900 text-slate-100',
          cardBg: 'bg-slate-950/80 border-slate-800/80',
          glow1: 'bg-indigo-500/10',
          glow2: 'bg-purple-500/10',
          accentText: 'text-indigo-400',
          accentBorder: 'border-indigo-500/20',
          buttonPrimary: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25',
          inputBorder: 'focus:border-indigo-500',
          tagBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          buttonSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
        };
    }
  };

  const ts = getThemeStyles();

  return (
    <div className={`min-h-screen theme-${selectedThemeId} ${ts.bg} flex flex-col justify-between p-4 md:p-8 font-sans transition-all duration-500 selection:bg-indigo-500 selection:text-white`}>
      {/* Background ambient glow elements */}
      <div className={`absolute top-0 left-0 w-96 h-96 ${ts.glow1} rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-500`} />
      <div className={`absolute bottom-0 right-0 w-96 h-96 ${ts.glow2} rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-500`} />


      {/* Top Bar with Logo */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-2">
        <Logo variant="full" size="sm" />

        {step > 0 && step < 6 && (
          <button 
            onClick={onQuickStart}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-700/60 transition-all cursor-pointer"
          >
            Pular e Usar Demo ⚡
          </button>
        )}
      </div>

      {/* Card Form Area */}
      <div className="flex-1 flex items-center justify-center my-6 md:my-10">
        <div className={`w-full max-w-lg ${ts.cardBg} backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 relative transition-all duration-500`}>
          
          <AnimatePresence mode="wait">
            {/* SCREEN 1.1 - WELCOME */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center space-y-6 py-6"
                id="onboarding-welcome"
              >
                <div className="relative flex justify-center items-center py-4">
                  <Logo variant="full" size="xl" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-display font-bold tracking-tight text-white md:text-4xl">
                    Seja bem-vindo ao Genda
                  </h1>
                  <p className="text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
                    Sua agenda profissional, simples, com dados locais e completa para impulsionar seu trabalho autônomo.
                  </p>
                </div>

                <div className="w-full pt-4 space-y-3">
                  <button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    Começar
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={onQuickStart}
                    className="w-full bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 font-medium py-2 px-6 rounded-xl transition-all border border-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Entrar com Dados Demonstrativos ⚡
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 1.2 - LOGIN/CADASTRO */}
            {step === 1 && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 text-left"
                id="onboarding-auth"
              >
                <div className="space-y-2 text-center">
                  <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    Sincronização e Backup
                  </span>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white pt-2">
                    Como deseja salvar seus dados?
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Escolha uma forma de sincronizar sua agenda na nuvem ou continue localmente.
                  </p>
                </div>

                {user ? (
                  /* USER IS ALREADY AUTHENTICATED STATE */
                  <div className="space-y-5 bg-slate-950/40 border border-slate-800 p-5 rounded-2xl text-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                      {isCloudSyncing ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      ) : (
                        <Check className="w-6 h-6 animate-pulse" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">
                        {isCloudSyncing ? 'Sincronizando Dados...' : 'Conta Vinculada com Sucesso!'}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isCloudSyncing ? (
                          'Buscando seus agendamentos e configurações salvos na nuvem...'
                        ) : (
                          <>
                            Seus dados serão sincronizados automaticamente na nuvem usando a conta: <br />
                            <span className="font-mono text-indigo-400 mt-1 block">{user.email}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {!isCloudSyncing && (
                      <div className="pt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 font-semibold py-2.5 rounded-xl border border-slate-800 transition-all text-xs cursor-pointer"
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-md"
                        >
                          Próximo Passo
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* AUTHENTICATION FORMS */
                  <div className="space-y-4">
                    {/* Google Auth Button */}
                    <button
                      type="button"
                      onClick={onLoginGoogle}
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-slate-50 text-slate-900 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
                    >
                      <Cloud className="w-4 h-4 text-indigo-600" />
                      Entrar com Conta Google
                    </button>

                    <div className="relative flex items-center justify-center py-1">
                      <span className="absolute inset-x-0 h-px bg-slate-800/80"></span>
                      <span className="relative px-3 text-[10px] font-mono text-slate-500 bg-slate-900">OU USE SEU E-MAIL</span>
                    </div>

                    <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                      {/* Form Header Tabs */}
                      <div className="flex border-b border-slate-800/50 pb-1.5 gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegistering(false);
                            setAuthError('');
                          }}
                          className={`pb-1 text-xs font-bold transition-all relative cursor-pointer ${
                            !isRegistering 
                              ? 'text-indigo-400 border-b-2 border-indigo-500' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Já tenho conta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegistering(true);
                            setAuthError('');
                          }}
                          className={`pb-1 text-xs font-bold transition-all relative cursor-pointer ${
                            isRegistering 
                              ? 'text-indigo-400 border-b-2 border-indigo-500' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Criar nova conta
                        </button>
                      </div>

                      {authError && (
                        <div className="p-2.5 rounded-lg bg-red-950/20 text-red-300 border border-red-900/30 text-[11px] font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        {isRegistering && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Nome Completo</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                                <User className="w-3.5 h-3.5" />
                              </span>
                              <input
                                type="text"
                                required
                                value={authDisplayName}
                                onChange={(e) => setAuthDisplayName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full text-xs rounded-lg pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Endereço de E-mail</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                              <Mail className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="seu@email.com"
                              className="w-full text-xs rounded-lg pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Senha de Acesso</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                              <Key className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                              className="w-full text-xs rounded-lg pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {isRegistering && (
                        <div className="flex items-start gap-2.5 mt-3 px-1">
                          <input
                            id="terms-accepted"
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-0.5 w-4 h-4 shrink-0 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 accent-indigo-600 cursor-pointer"
                          />
                          <label htmlFor="terms-accepted" className="text-[11px] text-slate-400 leading-tight select-none">
                            Li e concordo com os{' '}
                            <button
                              type="button"
                              onClick={() => setShowTermsModal(true)}
                              className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0 inline align-baseline"
                            >
                              Termos de Uso e Política de Privacidade
                            </button>
                            . *
                          </label>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm mt-3"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isRegistering ? (
                          'Criar Minha Conta'
                        ) : (
                          'Entrar e Sincronizar'
                        )}
                      </button>
                    </form>

                    <div className="pt-2 flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full py-2 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-300 font-medium rounded-xl border border-slate-800 transition-all text-xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        Continuar Sem Conta (Modo Local)
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={handleBack}
                        className="w-full py-1.5 text-[11px] text-slate-500 hover:text-slate-400 text-center cursor-pointer transition-colors"
                      >
                        Voltar para tela de início
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN 2.1 - DADOS DO PROFISSIONAL */}
            {step === 2 && (
              <motion.div
                key="prof-data"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
                id="onboarding-profile"
              >
                <div className="space-y-2 text-center">
                  <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    Configuração Inicial • Passo 1 de 4
                  </span>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white pt-2">
                    Conte sobre você
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Esses dados serão usados nos cabeçalhos da sua agenda e faturas.
                  </p>
                </div>

                <div className="space-y-4">
                  <AnimatePresence>
                    {validationError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-xs">{validationError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Seu Nome ou Nome do Negócio *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={profName}
                        onChange={(e) => {
                          setProfName(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="Ex: Pedro Barber, Dra. Ana Clinica"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria / Ramo de Atuação *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="Ex: Barbearia, Psicologia, Manicure, Advocacia"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Seu WhatsApp *</label>
                    <div className="flex gap-2">
                      <div className="w-24 shrink-0 relative">
                        <input
                          type="text"
                          list="onboarding-country-codes"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          placeholder="+55"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all text-center font-medium"
                        />
                        <datalist id="onboarding-country-codes">
                          <option value="+55">🇧🇷 Brasil (+55)</option>
                          <option value="+351">🇵🇹 Portugal (+351)</option>
                          <option value="+1">🇺🇸 EUA (+1)</option>
                          <option value="+54">🇦🇷 Argentina (+54)</option>
                          <option value="+34">🇪🇸 Espanha (+34)</option>
                          <option value="+44">🇬🇧 Reino Unido (+44)</option>
                          <option value="+598">🇺🇾 Uruguai (+598)</option>
                          <option value="+56">🇨🇱 Chile (+56)</option>
                          <option value="+57">🇨🇴 Colômbia (+57)</option>
                          <option value="+52">🇲🇽 México (+52)</option>
                        </datalist>
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <Smartphone className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={whatsapp}
                          onChange={(e) => {
                            setWhatsapp(formatPhone(e.target.value));
                            if (validationError) setValidationError('');
                          }}
                          placeholder="Ex: (11) 99999-9999"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Usado para receber alertas de novos agendamentos e faturamentos mesmo se o app estiver fechado.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Foto de Perfil / Logo</label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl">
                      {/* Preview of current photo / Initials */}
                      <div className="flex flex-col items-center justify-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl h-24">
                        {avatarUrl ? (
                          <div className="relative group w-14 h-14">
                            <img 
                              src={avatarUrl} 
                              alt="Avatar" 
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-full object-cover border border-slate-700 shadow-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profName || 'G')}`;
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md cursor-pointer transition-colors flex items-center justify-center"
                              title="Remover Foto"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-lg font-bold">
                            {profName ? profName.slice(0, 2).toUpperCase() : 'G'}
                          </div>
                        )}
                        <span className="text-[9px] text-slate-500 mt-1 font-medium">Prévia</span>
                      </div>

                      {/* Dual Upload / URL Controls */}
                      <div className="md:col-span-2 space-y-2.5">
                        {/* Drag-and-drop file upload */}
                        <div 
                          className="border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/30 transition-all rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 group relative"
                          onClick={() => document.getElementById('onboarding-file-upload')?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-950/20');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-950/20');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-950/20');
                            const files = e.dataTransfer.files;
                            if (files && files[0]) {
                              handleFile(files[0]);
                            }
                          }}
                        >
                          <input 
                            type="file" 
                            id="onboarding-file-upload" 
                            accept="image/*" 
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                handleFile(files[0]);
                              }
                            }}
                            className="hidden" 
                          />
                          <Upload className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors mb-0.5" />
                          <span className="text-[10px] font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">
                            Fazer upload de imagem
                          </span>
                          <span className="text-[8px] text-slate-500">Clique ou arraste o arquivo aqui</span>
                        </div>

                        {/* Direct URL Input alternative */}
                        <div className="relative">
                          <input
                            type="text"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="Ou cole o link da foto (URL)..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 pr-7"
                          />
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-2.5 rounded-xl border border-slate-800 transition-all text-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer text-sm"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2.2 - HORÁRIO DE FUNCIONAMENTO */}
            {step === 3 && (
              <motion.div
                key="working-hours"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
                id="onboarding-hours"
              >
                <div className="space-y-2 text-center">
                  <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    Configuração Inicial • Passo 2 de 4
                  </span>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white pt-2">
                    Horário de Trabalho
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Selecione quais dias você atende e defina sua jornada padrão.
                  </p>
                </div>

                {/* Day Rows scroll area to prevent overflow */}
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {workingDays.map((wd) => {
                    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    return (
                      <div 
                        key={wd.dayOfWeek}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          wd.isWorking 
                            ? 'bg-slate-900/80 border-slate-800' 
                            : 'bg-slate-950/40 border-slate-900 opacity-60'
                        }`}
                      >
                        {/* Day Toggle & Name */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleDayWorking(wd.dayOfWeek)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                              wd.isWorking 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {wd.isWorking ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </button>
                          <span className={`text-xs font-medium ${wd.isWorking ? 'text-white' : 'text-slate-500'}`}>
                            {weekdayNames[wd.dayOfWeek]}
                          </span>
                        </div>

                        {/* Working hours selects */}
                        {wd.isWorking ? (
                          <div className="flex items-center gap-1 text-xs">
                            <input
                              type="text"
                              value={wd.startTime}
                              onChange={(e) => updateDayHours(wd.dayOfWeek, 'startTime', e.target.value)}
                              className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-mono focus:border-indigo-500"
                              placeholder="09:00"
                            />
                            <span className="text-slate-600">às</span>
                            <input
                              type="text"
                              value={wd.endTime}
                              onChange={(e) => updateDayHours(wd.dayOfWeek, 'endTime', e.target.value)}
                              className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-mono focus:border-indigo-500"
                              placeholder="18:00"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-600 pr-2">Folga</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-2.5 rounded-xl border border-slate-800 transition-all text-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer text-sm"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2.3 - CATALOGO DE SERVICOS */}
            {step === 4 && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
                id="onboarding-services"
              >
                <div className="space-y-2 text-center">
                  <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    Configuração Inicial • Passo 3 de 4
                  </span>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white pt-2">
                    Catálogo de Serviços
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Cadastre pelo menos 1 serviço que você oferece.
                  </p>
                </div>

                {/* Form to add single service */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Nome do Serviço</label>
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Ex: Corte de Cabelo, Limpeza de Pele"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Duração (Minutos)</label>
                      <input
                        type="number"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">Preço Sugerido (R$)</label>
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Colors selectors */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-400">Etiqueta Visual:</span>
                      <div className="flex items-center gap-1.5">
                        {COLORS.map(col => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setNewServiceColor(col)}
                            className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                              newServiceColor === col ? 'border-white scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}

                        {/* Custom Color Option */}
                        <div className="relative flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const picker = document.getElementById('onboarding-custom-color-picker');
                              if (picker) {
                                picker.click();
                              }
                            }}
                            className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                              !COLORS.includes(newServiceColor)
                                ? 'border-white scale-110'
                                : 'border-transparent hover:border-slate-500'
                            }`}
                            style={{ 
                              background: !COLORS.includes(newServiceColor) 
                                ? newServiceColor 
                                : 'linear-gradient(135deg, #ef4444 0%, #3b82f6 50%, #10b981 100%)' 
                            }}
                            title="Cor Personalizada"
                          >
                            <Palette className={`w-3 h-3 ${!COLORS.includes(newServiceColor) ? 'text-white drop-shadow-[0_0.5px_1px_rgba(0,0,0,0.6)]' : 'text-slate-400'}`} />
                          </button>
                          <input
                            id="onboarding-custom-color-picker"
                            type="color"
                            value={COLORS.includes(newServiceColor) ? '#3b82f6' : newServiceColor}
                            onChange={(e) => setNewServiceColor(e.target.value)}
                            className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddService}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Services List scroll area */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {services.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                      Nenhum serviço adicionado. Clique acima para cadastrar um serviço ou pule para preencher os padrões.
                    </div>
                  ) : (
                    services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-850 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-medium text-slate-200">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono">{s.duration} min</span>
                          <span className="font-semibold text-white font-mono">R$ {formatPrice(s.price)}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveService(s.id)}
                            className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-2.5 rounded-xl border border-slate-800 transition-all text-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer text-sm"
                  >
                    {services.length === 0 ? 'Pular e Continuar' : 'Próximo'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2.4 - PERSONALIZACAO */}
            {step === 5 && (
              <motion.div
                key="personalization"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
                id="onboarding-custom"
              >
                <div className="space-y-2 text-center">
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-all duration-500 ${ts.tagBg}`}>
                    Configuração Inicial • Passo 4 de 4
                  </span>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white pt-2">
                    Aparência & Conexão
                  </h2>
                  <p className={`text-xs transition-all duration-500 text-slate-400`}>
                    Escolha o visual do seu Genda e configure a sincronização offline.
                  </p>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-medium text-slate-400">Escolha o Tema do App</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = selectedThemeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedThemeId(theme.id)}
                          className={`p-3 rounded-xl border text-left transition-all duration-500 relative flex flex-col justify-between h-20 cursor-pointer ${
                            isSelected 
                              ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-md' 
                              : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/40 text-slate-400'
                          }`}
                        >
                          <span className="text-xs font-semibold">{theme.name}</span>
                          <div className="flex gap-1.5 mt-2">
                            {theme.id === 'elegant-dark' && (
                              <>
                                <span className="w-5 h-5 rounded-md block border border-zinc-800" style={{ backgroundColor: '#09090b' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#4f46e5' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#27272a' }} />
                              </>
                            )}
                            {theme.id === 'slate' && (
                              <>
                                <span className="w-5 h-5 rounded-md block border border-slate-700" style={{ backgroundColor: '#0f172a' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#64748b' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#f8fafc' }} />
                              </>
                            )}
                            {theme.id === 'emerald' && (
                              <>
                                <span className="w-5 h-5 rounded-md block border border-emerald-900" style={{ backgroundColor: '#065f46' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#10b981' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#ecfdf5' }} />
                              </>
                            )}
                            {theme.id === 'ocean' && (
                              <>
                                <span className="w-5 h-5 rounded-md block border border-sky-900" style={{ backgroundColor: '#075985' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#0ea5e9' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#f0f9ff' }} />
                              </>
                            )}
                            {theme.id === 'orchid' && (
                              <>
                                <span className="w-5 h-5 rounded-md block border border-purple-900" style={{ backgroundColor: '#6b21a8' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#a855f7' }} />
                                <span className="w-5 h-5 rounded-md block" style={{ backgroundColor: '#faf5ff' }} />
                              </>
                            )}
                          </div>
                          {isSelected && (
                            <span className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Offline Toggle */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 transition-all duration-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className={`w-4 h-4 ${ts.accentText} transition-all duration-500`} />
                      <span className="text-xs font-semibold text-white">Sincronização Offline Automática</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Todas as alterações feitas sem internet serão salvas no cache local e sincronizadas quando você reconectar.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={offlineEnabled} 
                      onChange={(e) => setOfflineEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleBack}
                    className={`flex-1 ${ts.buttonSecondary} font-medium py-2.5 rounded-xl border transition-all duration-500 text-sm flex items-center justify-center gap-1 cursor-pointer`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <button
                    onClick={handleFinish}
                    className={`flex-1 ${ts.buttonPrimary} font-medium py-2.5 rounded-xl transition-all duration-500 flex items-center justify-center gap-1 cursor-pointer text-sm`}
                  >
                    Finalizar Configuração
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Footer text */}
      <div className="w-full max-w-4xl mx-auto text-center text-slate-500 text-xs py-2 border-t border-slate-800/40">
        <p>© 2026 Genda. Desenvolvido em conformidade com a LGPD. Todos os seus dados são criptografados localmente.</p>
      </div>

      {/* Terms & Privacy LGPD Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Termos de Uso e LGPD
            </h3>
            <div className="space-y-3.5 text-xs text-slate-300 overflow-y-auto max-h-[280px] pr-2 scrollbar">
              <p className="font-semibold text-white">1. Proteção de Dados (LGPD)</p>
              <p>O Genda valoriza sua privacidade. Os dados de seus clientes, históricos de agendamento e informações financeiras são armazenados de forma segura e criptografados localmente em seu navegador / dispositivo.</p>
              
              <p className="font-semibold text-white">2. Sincronização em Nuvem</p>
              <p>Se você optar por ativar o backup em nuvem, seus dados serão sincronizados com servidores seguros de banco de dados para evitar perdas acidentais em caso de formatação de cache.</p>

              <p className="font-semibold text-white">3. Comunicação WhatsApp</p>
              <p>O Genda gera modelos de mensagens para agilizar sua comunicação. Nós não enviamos mensagens em massa automáticas sem sua aprovação prévia, respeitando as políticas do WhatsApp Business.</p>

              <p className="font-semibold text-white">4. Cancelamento e Portabilidade</p>
              <p>Você pode exportar a qualquer momento a totalidade de seus dados em formatos legíveis por máquina (JSON/CSV) diretamente nas configurações do seu perfil, exercendo o seu direito de portabilidade.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTermsModal(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Aceitar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
