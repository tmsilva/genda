import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Briefcase, Clock, Clipboard, Sparkles, Smartphone, 
  ShieldCheck, LogOut, ChevronRight, Check, Plus, Trash2, 
  Download, Upload, RefreshCw, MessageSquare, AlertCircle, Save, X, Cloud, CloudOff, Mail, Lock,
  Sun, Moon
} from 'lucide-react';
import { ProfessionalProfile, Service, MessageTemplate, ThemeOption, WorkingDay } from '../types';
import { THEME_OPTIONS } from '../data';
import { formatPhone } from '../utils';

interface SettingsViewProps {
  profile: ProfessionalProfile;
  services: Service[];
  messageTemplates: MessageTemplate[];
  onUpdateProfile: (p: ProfessionalProfile) => void;
  onUpdateServices: (s: Service[]) => void;
  onUpdateTemplates: (t: MessageTemplate[]) => void;
  onExportFullData: () => void;
  onImportFullData: (jsonStr: string) => void;
  onClearAllData: () => Promise<void> | void;
  user?: any;
  isCloudSyncing?: boolean;
  onLoginGoogle?: () => Promise<void> | void;
  onLogout?: () => Promise<void> | void;
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onRegisterEmail?: (email: string, password: string, displayName: string) => Promise<void>;
}

type SettingsSection = 'profile' | 'hours' | 'templates' | 'theme' | 'backup';

export default function SettingsView({
  profile,
  services,
  messageTemplates,
  onUpdateProfile,
  onUpdateServices,
  onUpdateTemplates,
  onExportFullData,
  onImportFullData,
  onClearAllData,
  user = null,
  isCloudSyncing = false,
  onLoginGoogle,
  onLogout,
  onLoginEmail,
  onRegisterEmail,
}: SettingsViewProps) {
  // Navigation
  const isDark = profile.isDarkMode ?? true;
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Authentication Form States
  const [authMethod, setAuthMethod] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (authMethod === 'login') {
        if (onLoginEmail) {
          await onLoginEmail(authEmail, authPassword);
        }
      } else {
        if (!authDisplayName.trim()) {
          setAuthError('Por favor, informe seu nome.');
          setIsAuthLoading(false);
          return;
        }
        if (onRegisterEmail) {
          await onRegisterEmail(authEmail, authPassword, authDisplayName);
        }
      }
      // Reset state on success
      setAuthEmail('');
      setAuthPassword('');
      setAuthDisplayName('');
      setShowEmailForm(false);
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
      setIsAuthLoading(false);
    }
  };
  
  // Profile edit states
  const [profName, setProfName] = useState(profile.name);
  const [category, setCategory] = useState(profile.category);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [packageDiscount, setPackageDiscount] = useState(profile.packageDiscount !== undefined ? profile.packageDiscount : 10);
  
  // Helper: Parse country code and number
  const initialPhoneData = (() => {
    const raw = profile.whatsapp || '';
    if (raw.startsWith('+')) {
      const spaceIdx = raw.indexOf(' ');
      if (spaceIdx !== -1) {
        return {
          code: raw.slice(0, spaceIdx),
          local: raw.slice(spaceIdx + 1)
        };
      }
    }
    return { code: '+55', local: raw };
  })();

  const [countryCode, setCountryCode] = useState(initialPhoneData.code);
  const [whatsapp, setWhatsapp] = useState(initialPhoneData.local);

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

  // Message templates edit states
  const [editingTemplates, setEditingTemplates] = useState<MessageTemplate[]>(JSON.parse(JSON.stringify(messageTemplates)));

  // Working days edit states
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>(() => {
    return profile.workingDays && profile.workingDays.length > 0 
      ? JSON.parse(JSON.stringify(profile.workingDays)) 
      : [];
  });

  // Keep states in sync with profile prop changes (e.g. from Cloud sync or imports)
  useEffect(() => {
    setProfName(profile.name);
    setCategory(profile.category);
    setAvatarUrl(profile.avatarUrl || '');
    
    const raw = profile.whatsapp || '';
    if (raw.startsWith('+')) {
      const spaceIdx = raw.indexOf(' ');
      if (spaceIdx !== -1) {
        setCountryCode(raw.slice(0, spaceIdx));
        setWhatsapp(raw.slice(spaceIdx + 1));
      } else {
        setCountryCode('+55');
        setWhatsapp(raw);
      }
    } else {
      setCountryCode('+55');
      setWhatsapp(raw);
    }

    if (profile.workingDays) {
      setWorkingDays(JSON.parse(JSON.stringify(profile.workingDays)));
    }
    setPackageDiscount(profile.packageDiscount !== undefined ? profile.packageDiscount : 10);
  }, [profile]);

  // Toggle day of week working status
  const toggleDayWorking = (dayOfWeek: number) => {
    setWorkingDays(workingDays.map(wd => {
      if (wd.dayOfWeek === dayOfWeek) {
        return { ...wd, isWorking: !wd.isWorking };
      }
      return wd;
    }));
  };

  // Update specific hour fields
  const updateDayHours = (dayOfWeek: number, field: 'startTime' | 'endTime' | 'lunchStart' | 'lunchEnd', value: string) => {
    setWorkingDays(workingDays.map(wd => {
      if (wd.dayOfWeek === dayOfWeek) {
        return { ...wd, [field]: value };
      }
      return wd;
    }));
  };

  // Save working hours handler
  const handleSaveHours = () => {
    onUpdateProfile({
      ...profile,
      workingDays,
    });
    triggerAlert('Horários de atendimento salvos com sucesso!', 'success');
  };

  // Synchronization simulation
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('Nuvem sincronizada com sucesso.');

  // Import error state
  const [importError, setImportError] = useState('');

  // Custom alerts and confirmations state
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);
  };

  // Handle Save profile details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: profName,
      category: category,
      avatarUrl: avatarUrl || undefined,
      whatsapp: whatsapp ? `${countryCode} ${whatsapp}` : undefined,
      packageDiscount: packageDiscount,
    });
    triggerAlert('Dados do perfil salvos com sucesso!', 'success');
  };

  // Handle Save templates
  const handleSaveTemplates = () => {
    onUpdateTemplates(editingTemplates);
    triggerAlert('Modelos de mensagem atualizados com sucesso!', 'success');
  };

  // Update single field of template in local state
  const handleTemplateChange = (id: string, body: string) => {
    setEditingTemplates(editingTemplates.map(t => {
      if (t.id === id) {
        return { ...t, body };
      }
      return t;
    }));
  };

  // Theme selection
  const handleSelectTheme = (id: string) => {
    onUpdateProfile({
      ...profile,
      themeId: id,
    });
  };

  // File import helper
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        // Basic validity check
        const parsed = JSON.parse(jsonStr);
        if (parsed.profile && parsed.services && parsed.clients && parsed.appointments) {
          onImportFullData(jsonStr);
          triggerAlert('Backup importado e restaurado com sucesso!', 'success');
          setImportError('');
        } else {
          setImportError('Formato de arquivo inválido. Verifique se o arquivo JSON foi gerado pelo Genda.');
        }
      } catch (err) {
        setImportError('Erro ao decodificar arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="settings-tab-root">
      
      {/* Sidebar navigation menu */}
      <div className={`lg:col-span-1 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-100 text-slate-700'} rounded-2xl p-2 lg:p-4 border shadow-sm flex flex-col justify-between lg:min-h-[400px] gap-6 text-xs font-semibold`}>
        
        <div className="flex flex-row lg:flex-col flex-nowrap overflow-x-auto scrollbar-none gap-2 lg:gap-1.5 pb-1 lg:pb-0">
          <button
            onClick={() => setActiveSection('profile')}
            className={`shrink-0 w-auto lg:w-full p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
              activeSection === 'profile' 
                ? (isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm') 
                : (isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-50 text-slate-700')
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            Perfil Profissional
          </button>

          <button
            onClick={() => setActiveSection('hours')}
            className={`shrink-0 w-auto lg:w-full p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
              activeSection === 'hours' 
                ? (isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm') 
                : (isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-50 text-slate-700')
            }`}
            id="btn-settings-hours"
          >
            <Clock className="w-4 h-4 shrink-0" />
            Horários de Atendimento
          </button>

          <button
            onClick={() => setActiveSection('templates')}
            className={`shrink-0 w-auto lg:w-full p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
              activeSection === 'templates' 
                ? (isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm') 
                : (isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-50 text-slate-700')
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            Mensagens do WhatsApp
          </button>

          <button
            onClick={() => setActiveSection('theme')}
            className={`shrink-0 w-auto lg:w-full p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
              activeSection === 'theme' 
                ? (isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm') 
                : (isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-50 text-slate-700')
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Aparência / Tema
          </button>

          <button
            onClick={() => setActiveSection('backup')}
            className={`shrink-0 w-auto lg:w-full p-2.5 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
              activeSection === 'backup' 
                ? (isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm') 
                : (isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-50 text-slate-700')
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            Backup & Sincronização
          </button>
        </div>

      </div>

      {/* Settings details display viewport */}
      <div className={`lg:col-span-3 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-100 text-slate-700'} rounded-2xl p-5 border shadow-sm min-h-[400px]`}>
        <AnimatePresence mode="wait">
          
          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <motion.form
              key="profile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleSaveProfile}
              className={`space-y-4 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}
            >
              <div>
                <h3 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Perfil Profissional</h3>
                <p className={isDark ? 'text-zinc-400' : 'text-slate-400'}>Edite as informações mostradas aos seus clientes em agendamentos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className={`block font-semibold mb-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Seu Nome / Razão Social</label>
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Ramo de Atuação</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Número de WhatsApp *</label>
                <div className="flex gap-2">
                  <div className="w-24 shrink-0 relative">
                    <input
                      type="text"
                      list="settings-country-codes"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="+55"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-center font-medium transition-colors ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    <datalist id="settings-country-codes">
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
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="Ex: (11) 99999-9999"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Necessário para receber alertas e notificações automáticas de agendamentos.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Desconto Padrão para Pacotes (%)</label>
                <div className="relative max-w-[200px]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={packageDiscount}
                    onChange={(e) => setPackageDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 pr-8"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 font-semibold font-mono text-xs">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  A porcentagem de desconto sugerida automaticamente ao criar/editar pacotes de serviços no catálogo.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Foto de Perfil / Logo</label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Preview of current photo / Initials */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl h-28">
                    {avatarUrl ? (
                      <div className="relative group w-16 h-16">
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
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
                      <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-500 text-xl font-bold">
                        {profName ? profName.slice(0, 2).toUpperCase() : 'G'}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1.5 font-medium">Prévia</span>
                  </div>

                  {/* Dual Upload / URL Controls */}
                  <div className="md:col-span-2 space-y-3">
                    {/* Drag-and-drop file upload */}
                    <div 
                      className="border-2 border-dashed border-slate-200 hover:border-slate-400 transition-all rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white group relative"
                      onClick={() => document.getElementById('settings-file-upload')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50/20');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20');
                        const files = e.dataTransfer.files;
                        if (files && files[0]) {
                          handleFile(files[0]);
                        }
                      }}
                    >
                      <input 
                        type="file" 
                        id="settings-file-upload" 
                        accept="image/*" 
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            handleFile(files[0]);
                          }
                        }}
                        className="hidden" 
                      />
                      <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors mb-1" />
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                        Fazer upload de imagem
                      </span>
                      <span className="text-[9px] text-slate-400">Clique ou arraste o arquivo aqui</span>
                    </div>

                    {/* Direct URL Input alternative */}
                    <div className="relative">
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Ou cole o link da imagem (URL) aqui..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs pr-8"
                      />
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </motion.form>
          )}

          {/* WORKING HOURS SECTION */}
          {activeSection === 'hours' && (
            <motion.div
              key="hours"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`space-y-4 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}
            >
              <div>
                <h3 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Horários de Atendimento</h3>
                <p className={isDark ? 'text-zinc-400' : 'text-slate-400'}>Configure os dias de trabalho e a jornada de atendimento da sua agenda</p>
              </div>

              <div className="space-y-3 pt-2">
                {workingDays.map((wd) => {
                  const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                  return (
                    <div 
                      key={wd.dayOfWeek}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        wd.isWorking 
                          ? (isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50/50 border-slate-200')
                          : (isDark ? 'bg-zinc-900 border-zinc-800 opacity-60' : 'bg-slate-50/20 border-slate-100 opacity-60')
                      }`}
                    >
                      {/* Day Toggle & Name */}
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => toggleDayWorking(wd.dayOfWeek)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            wd.isWorking 
                              ? (isDark ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 'bg-slate-950 border-slate-900 text-white shadow-sm')
                              : (isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300')
                          }`}
                        >
                          {wd.isWorking ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </button>
                        <div>
                          <span className={`text-xs font-bold block ${wd.isWorking ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-zinc-500' : 'text-slate-400')}`}>
                            {weekdayNames[wd.dayOfWeek]}
                          </span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>
                            {wd.isWorking ? 'Trabalha' : 'Folga'}
                          </span>
                        </div>
                      </div>

                      {/* Working hours inputs */}
                      {wd.isWorking ? (
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          {/* Core Hours */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Expediente:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={wd.startTime}
                                onChange={(e) => updateDayHours(wd.dayOfWeek, 'startTime', e.target.value)}
                                className={`w-14 border rounded-lg py-1 px-1.5 text-center font-mono text-xs focus:outline-none transition-colors ${
                                  isDark 
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-zinc-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:border-slate-800'
                                }`}
                                placeholder="09:00"
                              />
                              <span className={isDark ? 'text-zinc-400' : 'text-slate-400'}>às</span>
                              <input
                                type="text"
                                value={wd.endTime}
                                onChange={(e) => updateDayHours(wd.dayOfWeek, 'endTime', e.target.value)}
                                className={`w-14 border rounded-lg py-1 px-1.5 text-center font-mono text-xs focus:outline-none transition-colors ${
                                  isDark 
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-zinc-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:border-slate-800'
                                }`}
                                placeholder="18:00"
                              />
                            </div>
                          </div>

                          {/* Lunch Hours */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Almoço:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={wd.lunchStart || ''}
                                onChange={(e) => updateDayHours(wd.dayOfWeek, 'lunchStart', e.target.value)}
                                className={`w-14 border rounded-lg py-1 px-1.5 text-center font-mono text-xs focus:outline-none transition-colors ${
                                  isDark 
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-zinc-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:border-slate-800'
                                }`}
                                placeholder="12:00"
                              />
                              <span className={isDark ? 'text-zinc-400' : 'text-slate-400'}>às</span>
                              <input
                                type="text"
                                value={wd.lunchEnd || ''}
                                onChange={(e) => updateDayHours(wd.dayOfWeek, 'lunchEnd', e.target.value)}
                                className={`w-14 border rounded-lg py-1 px-1.5 text-center font-mono text-xs focus:outline-none transition-colors ${
                                  isDark 
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-zinc-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:border-slate-800'
                                }`}
                                placeholder="13:00"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center py-1.5 px-3 rounded-lg font-mono text-[10px] select-none ${
                          isDark ? 'bg-zinc-800/50 text-zinc-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                          Sem Expediente
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={`pt-3.5 border-t flex justify-end ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={handleSaveHours}
                  className={`font-semibold py-2 px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-98 ${
                    isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Salvar Horários
                </button>
              </div>
            </motion.div>
          )}

          {/* WHATSAPP MESSAGE TEMPLATES SECTION */}
          {activeSection === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`space-y-4 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}
            >
              <div>
                <h3 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Mensagens Automáticas</h3>
                <p className={isDark ? 'text-zinc-400' : 'text-slate-400'}>Edite as mensagens geradas ao compartilhar lembretes por WhatsApp</p>
              </div>

              {/* Tags info box */}
              <div className={`p-3 rounded-xl border text-xs flex gap-2 items-start ${isDark ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50/50 border-indigo-100 text-slate-700'}`}>
                <AlertCircle className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                <div className="space-y-1">
                  <span className={`font-bold block ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>Variáveis Inteligentes</span>
                  <p className={`leading-relaxed ${isDark ? 'text-indigo-200/80' : 'text-slate-700'}`}>Você pode utilizar variáveis dinâmicas em seus textos para preenchimento em tempo de envio. Utilize exatamente os formatos abaixo:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                    <span className={`border px-1.5 py-0.5 rounded ${isDark ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-300' : 'bg-white border-indigo-200 text-indigo-800'}`}>{"{nome}"}</span>
                    <span className={`border px-1.5 py-0.5 rounded ${isDark ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-300' : 'bg-white border-indigo-200 text-indigo-800'}`}>{"{data}"}</span>
                    <span className={`border px-1.5 py-0.5 rounded ${isDark ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-300' : 'bg-white border-indigo-200 text-indigo-800'}`}>{"{hora}"}</span>
                    <span className={`border px-1.5 py-0.5 rounded ${isDark ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-300' : 'bg-white border-indigo-200 text-indigo-800'}`}>{"{serviço}"}</span>
                  </div>
                </div>
              </div>

              {/* Templates Forms lists */}
              <div className="space-y-4 pt-1">
                {editingTemplates.map((t) => (
                  <div key={t.id} className={`p-4 border rounded-xl space-y-2 text-xs ${isDark ? 'bg-zinc-800/30 border-zinc-700/50' : 'bg-slate-50/50 border-slate-200/50'}`}>
                    <span className={`font-bold text-xs block ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</span>
                    <textarea
                      value={t.body}
                      onChange={(e) => handleTemplateChange(t.id, e.target.value)}
                      rows={3}
                      className={`w-full border rounded-xl p-3 focus:outline-none text-xs leading-relaxed font-sans transition-colors ${
                        isDark 
                          ? 'bg-zinc-900/50 border-zinc-700 text-zinc-300 focus:border-indigo-500' 
                          : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSaveTemplates}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Todos os Modelos
                </button>
              </div>
            </motion.div>
          )}

          {/* THEMES APPARENCE SECTION */}
          {activeSection === 'theme' && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 text-xs text-slate-700"
            >
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Tema e Aparência</h3>
                <p className="text-slate-400">Escolha o modo de exibição e a paleta de cores predominante do sistema</p>
              </div>

              {/* Categoria A: Modo de Exibição */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
                  Modo de Exibição
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateProfile({ ...profile, isDarkMode: false })}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-semibold transition-all cursor-pointer ${
                      !profile.isDarkMode
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600/10 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-4.5 h-4.5 text-amber-500" />
                    Modo Claro
                  </button>
                  <button
                    onClick={() => onUpdateProfile({ ...profile, isDarkMode: true })}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-semibold transition-all cursor-pointer ${
                      profile.isDarkMode
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-200 ring-1 ring-zinc-700/10 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="w-4.5 h-4.5 text-indigo-400" />
                    Modo Escuro
                  </button>
                </div>
              </div>

              {/* Categoria B: Temas de Cor do Sistema */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
                  Tema de Cor do Sistema
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = profile.themeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-24 cursor-pointer ${
                          isSelected 
                            ? (isDark 
                                ? 'bg-indigo-600/15 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20' 
                                : 'bg-slate-50 border-slate-900 shadow-sm ring-1 ring-slate-900/10') 
                            : (isDark 
                                ? 'bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900/60' 
                                : 'bg-white border-slate-200 hover:bg-slate-50/40')
                        }`}
                      >
                        <span className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{theme.name}</span>
                        
                        <div className="flex gap-1.5 mt-2">
                          {theme.id === 'elegant-dark' && (
                            <>
                              <span className={`w-5 h-5 rounded-md block border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`} style={{ backgroundColor: '#09090b' }} />
                              <span className="w-5 h-5 rounded-md block shadow-sm" style={{ backgroundColor: '#4f46e5' }} />
                            </>
                          )}
                          {theme.id === 'slate' && (
                            <>
                              <span className={`w-5 h-5 rounded-md block border ${isDark ? 'border-slate-800' : 'border-slate-200'}`} style={{ backgroundColor: '#0f172a' }} />
                              <span className="w-5 h-5 rounded-md block shadow-sm" style={{ backgroundColor: '#64748b' }} />
                            </>
                          )}
                          {theme.id === 'emerald' && (
                            <>
                              <span className={`w-5 h-5 rounded-md block border ${isDark ? 'border-stone-850' : 'border-emerald-100'}`} style={{ backgroundColor: '#065f46' }} />
                              <span className="w-5 h-5 rounded-md block shadow-sm" style={{ backgroundColor: '#10b981' }} />
                            </>
                          )}
                          {theme.id === 'ocean' && (
                            <>
                              <span className={`w-5 h-5 rounded-md block border ${isDark ? 'border-zinc-850' : 'border-sky-100'}`} style={{ backgroundColor: '#075985' }} />
                              <span className="w-5 h-5 rounded-md block shadow-sm" style={{ backgroundColor: '#0ea5e9' }} />
                            </>
                          )}
                          {theme.id === 'orchid' && (
                            <>
                              <span className={`w-5 h-5 rounded-md block border ${isDark ? 'border-zinc-850' : 'border-purple-100'}`} style={{ backgroundColor: '#6b21a8' }} />
                              <span className="w-5 h-5 rounded-md block shadow-sm" style={{ backgroundColor: '#a855f7' }} />
                            </>
                          )}
                          {theme.id === 'amber' && (
                            <>
                              <span className={`w-5 h-5 rounded-md block border ${isDark ? 'border-stone-850' : 'border-amber-100'}`} style={{ backgroundColor: '#b45309' }} />
                              <span className="w-5 h-5 rounded-md block shadow-sm" style={{ backgroundColor: '#f59e0b' }} />
                            </>
                          )}
                        </div>

                        {isSelected && (
                          <span className={`absolute top-3 right-3 rounded-full p-0.5 shadow-sm ${
                            isDark ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* BACKUP & SECURITY SECTION */}
          {activeSection === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5 text-xs text-slate-700"
            >
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Backup & Sincronização</h3>
                <p className="text-slate-400">Garanta a portabilidade e segurança total das suas agendas de atendimento</p>
              </div>

              {/* Google account connection & Sync status indicator */}
              {user ? (
                <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark 
                    ? 'bg-indigo-950/20 border-indigo-900/30' 
                    : 'bg-indigo-50/55 border-indigo-100/70'
                }`}>
                  <div className="space-y-1.5 text-left">
                    <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                      <Cloud className={`w-4 h-4 text-indigo-500 ${isCloudSyncing ? 'animate-pulse' : ''}`} />
                      <span className="text-xs">Sincronização em Nuvem Ativa</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed max-w-xl ${isDark ? 'text-indigo-200/70' : 'text-slate-600'}`}>
                      Seus dados estão sendo sincronizados com segurança e em tempo real. Conectado como <strong className={isDark ? 'text-indigo-200' : 'text-indigo-950'}>{user.displayName || user.email}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-all font-semibold text-[11px] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Desconectar Conta
                  </button>
                </div>
              ) : (
                <div className={`p-6 rounded-2xl border space-y-5 text-left ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-800' 
                    : 'bg-slate-50/60 border-slate-150'
                }`}>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                      <CloudOff className="w-4 h-4 text-slate-400" />
                      <span className="text-xs">Sincronização Desativada (Modo Local)</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed max-w-xl ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Sua agenda está sendo salva localmente neste dispositivo. Para garantir backup automático na nuvem, portabilidade entre dispositivos e acesso remoto seguro, crie ou acesse sua conta!
                    </p>
                  </div>

                  {/* Buttons for Google / Email toggle */}
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={onLoginGoogle}
                      disabled={isAuthLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-[11px] w-full"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      Sincronizar com Conta Google
                    </button>
                  </div>
                </div>
              )}

              {/* JSON export / import portal */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Portabilidade Integral (LGPD)</span>
                  <p className="text-[10px] text-slate-400">Baixe um arquivo criptografado com toda a sua base ou restaure em outra máquina</p>
                </div>

                {importError && (
                  <div className={`p-3 rounded-lg font-medium border ${
                    isDark 
                      ? 'bg-red-950/20 border-red-900/40 text-red-300' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {importError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Export Trigger */}
                  <button
                    onClick={onExportFullData}
                    className="p-3.5 border border-dashed border-slate-200 rounded-xl text-left hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-bold block text-slate-800">Exportar Todos os Dados</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Salva agenda e clientes em JSON</span>
                    </div>
                    <Download className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-all" />
                  </button>

                  {/* Import Trigger */}
                  <label className="p-3.5 border border-dashed border-slate-200 rounded-xl text-left hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer">
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportFileChange}
                      className="hidden" 
                    />
                    <div>
                      <span className="font-bold block text-slate-800">Importar / Restaurar Backup</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Selecione arquivo .json gerado</span>
                    </div>
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-all" />
                  </label>
                </div>
              </div>

              {/* Danger Zone: Clear Data */}
              <div className={`border rounded-xl p-4 space-y-3 ${
                isDark 
                  ? 'bg-red-950/20 border-red-900/40 text-red-200' 
                  : 'bg-red-50/40 border border-red-200/50'
              }`}>
                <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-red-300' : 'text-red-850'}`}>
                  <AlertCircle className={`w-4.5 h-4.5 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <span>Zona de Perigo</span>
                </div>
                <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Deseja iniciar sua agenda do zero? Esta opção exclui permanentemente todos os seus agendamentos, clientes cadastrados e catálogo de serviços. Essa ação não pode ser desfeita.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer text-xs shadow-sm hover:shadow-red-200/40"
                >
                  Excluir Agendamentos, Clientes e Serviços
                </button>
              </div>

              {/* LGPD Terms Footer */}
              <div className={`p-3.5 rounded-xl border text-[11px] leading-relaxed space-y-1 ${
                isDark 
                  ? 'bg-zinc-900/30 border-zinc-800/80 text-zinc-400' 
                  : 'bg-slate-50/50 border-slate-150/60 text-slate-500'
              }`}>
                <span className={`font-bold flex items-center gap-1.5 uppercase tracking-wider text-[9px] ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Privacidade LGPD Assegurada
                </span>
                <p>Nenhum dado cadastrado nesta agenda é transmitido a terceiros. A infraestrutura atende aos requisitos de privacidade e guarda de dados.</p>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* CUSTOM ALERTS & TOASTS */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white rounded-xl p-4 shadow-2xl border border-slate-800 flex items-center gap-3"
          >
            {alertMessage.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            ) : alertMessage.type === 'error' ? (
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-indigo-400" />
              </div>
            )}
            <div className="text-left">
              <p className="text-xs font-medium leading-normal">{alertMessage.text}</p>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white cursor-pointer ml-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* DELETE ALL DATA CONFIRMATION MODAL */}
        {showDeleteAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 max-w-sm w-full mx-4 shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-base text-slate-950">Apagar Todos os Dados?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Isso irá excluir permanentemente todos os seus agendamentos, clientes cadastrados e serviços do catálogo. Esta ação não poderá ser desfeita.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteAllConfirm(false);
                    try {
                      await onClearAllData();
                      triggerAlert('Todos os seus agendamentos, clientes e serviços foram removidos com sucesso!', 'success');
                    } catch (err) {
                      console.error(err);
                      triggerAlert('Ocorreu um erro ao excluir os dados.', 'error');
                    }
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
