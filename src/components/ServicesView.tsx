import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clipboard, Plus, Search, Edit2, Trash2, AlertCircle, Sparkles, Check, Clock, DollarSign, X, Palette
} from 'lucide-react';
import { Service, ProfessionalProfile } from '../types';
import { formatPrice } from '../utils';

interface ServicesViewProps {
  services: Service[];
  onUpdateServices: (s: Service[]) => void;
  profile?: ProfessionalProfile;
  isDark?: boolean;
}

export default function ServicesView({ services, onUpdateServices, profile, isDark = false }: ServicesViewProps) {
  const discountPercent = profile?.packageDiscount !== undefined ? profile.packageDiscount : 10;
  const discountMultiplier = (100 - discountPercent) / 100;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Custom alerts and confirmations state
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);
  };

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formDuration, setFormDuration] = useState(30);
  const [formPrice, setFormPrice] = useState(50);
  const [formColor, setFormColor] = useState('#0ea5e9');
  const [formMaterials, setFormMaterials] = useState('');
  const [formIsPackage, setFormIsPackage] = useState(false);
  const [formPackageItems, setFormPackageItems] = useState<string[]>([]);

  // Colors preset palette
  const COLOR_PALETTE = ['#0ea5e9', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b', '#ef4444'];

  // Handle opening form for Create
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormName('');
    setFormDuration(30);
    setFormPrice(50);
    setFormColor('#0ea5e9');
    setFormMaterials('');
    setFormIsPackage(false);
    setFormPackageItems([]);
    setShowFormModal(true);
  };

  // Handle opening form for Edit
  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormName(service.name);
    setFormDuration(service.duration);
    setFormPrice(service.price);
    setFormColor(service.color || '#0ea5e9');
    setFormMaterials(service.materials || '');
    setFormIsPackage(service.isPackage || false);
    setFormPackageItems(service.packageItems || []);
    setShowFormModal(true);
  };

  // Save Service handler
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerAlert('O nome do serviço é obrigatório.', 'error');
      return;
    }
    if (formDuration <= 0) {
      triggerAlert('A duração deve ser maior que zero minutos.', 'error');
      return;
    }
    if (formPrice < 0) {
      triggerAlert('O preço do serviço não pode ser negativo.', 'error');
      return;
    }

    const serviceData: Service = {
      id: editingService?.id || 's_' + Date.now(),
      name: formName.trim(),
      duration: formDuration,
      price: formPrice,
      color: formColor,
      materials: formMaterials.trim() || undefined,
      isPackage: formIsPackage,
      packageItems: formIsPackage ? formPackageItems : undefined,
    };

    if (editingService) {
      const updated = services.map(s => s.id === editingService.id ? serviceData : s);
      onUpdateServices(updated);
      triggerAlert('Serviço atualizado com sucesso!', 'success');
    } else {
      onUpdateServices([...services, serviceData]);
      triggerAlert('Novo serviço cadastrado com sucesso!', 'success');
    }

    setShowFormModal(false);
  };

  // Delete Service handler
  const handleDeleteService = (id: string) => {
    if (services.length <= 1) {
      triggerAlert('Você precisa ter pelo menos um serviço cadastrado no catálogo.', 'error');
      return;
    }
    setServiceToDelete(id);
  };

  // Filter services list
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services;
    const term = searchTerm.toLowerCase();
    return services.filter(s => s.name.toLowerCase().includes(term));
  }, [services, searchTerm]);

  return (
    <div className="space-y-4" id="services-tab-root">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 leading-tight">Catálogo de Serviços</h2>
          <span className="text-xs text-slate-500 font-mono">
            {services.length} serviços cadastrados no catálogo
          </span>
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="bg-slate-950 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          id="btn-add-service"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar serviço por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700' 
              : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-slate-850'
          } rounded-xl pl-10 pr-4 py-2.5 text-xs transition-all shadow-sm`}
        />
      </div>

      {/* SERVICES LIST */}
      {filteredServices.length === 0 ? (
        <div className={`${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'
        } rounded-2xl p-10 text-center border shadow-sm space-y-2`}>
          <Clipboard className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-slate-200'} mx-auto`} />
          <h3 className={`font-display font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} text-sm`}>Nenhum serviço correspondente</h3>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'} max-w-xs mx-auto`}>Tente ajustar o termo de pesquisa ou cadastre um novo serviço acima.</p>
        </div>
      ) : (
        <div className={`${
          isDark ? 'bg-zinc-900 border-zinc-850 divide-zinc-800/65' : 'bg-white border-slate-100 divide-slate-100'
        } rounded-2xl border shadow-sm divide-y overflow-hidden`}>
          {filteredServices.map((service) => (
            <div 
              key={service.id} 
              className={`p-4 flex items-center justify-between ${isDark ? 'hover:bg-zinc-850/40' : 'hover:bg-slate-50/20'} text-left transition-all group`}
            >
              <div className="flex items-center gap-3">
                <span 
                  className={`w-3.5 h-3.5 rounded-full shrink-0 border ${isDark ? 'border-zinc-700' : 'border-slate-200'}`} 
                  style={{ backgroundColor: service.color || '#0ea5e9' }} 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-sm block`}>{service.name}</span>
                    {service.isPackage && (
                      <span className={`${
                        isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-200'
                      } text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide`}>
                        ★ Pacote
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
                        {service.duration} min
                      </span>
                    </div>
                    {service.isPackage && service.packageItems && service.packageItems.length > 0 && (
                      <div className={`text-[10px] ${
                        isDark ? 'text-zinc-400 bg-amber-950/20 border-amber-900/30' : 'text-slate-500 bg-amber-50/20 border-amber-100/50'
                      } rounded-lg px-2 py-0.5 max-w-fit flex items-center gap-1`}>
                        <span className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Itens inclusos:</span>
                        <span>
                          {services
                            .filter(s => service.packageItems?.includes(s.id))
                            .map(s => s.name)
                            .join(', ') || 'Serviços associados'}
                        </span>
                      </div>
                    )}
                    {service.materials && (
                      <div className={`text-[10px] ${
                        isDark ? 'text-zinc-400 bg-zinc-950/60 border-zinc-800' : 'text-slate-500 bg-slate-50 border-slate-100'
                      } rounded-lg px-2 py-0.5 max-w-fit flex items-center gap-1`}>
                        <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Materiais:</span>
                        <span className="truncate">{service.materials}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm`}>
                  R$ {formatPrice(service.price)}
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEdit(service)}
                    className={`p-2 text-slate-400 ${isDark ? 'hover:text-indigo-450 hover:bg-zinc-800' : 'hover:text-indigo-600 hover:bg-indigo-50/50'} rounded-xl transition-all cursor-pointer`}
                    title="Editar Serviço"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className={`p-2 text-slate-400 ${isDark ? 'hover:text-red-400 hover:bg-red-500/10' : 'hover:text-red-600 hover:bg-red-55'} rounded-xl transition-all cursor-pointer`}
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL (CADASTRO / EDIÇÃO DE SERVIÇO) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              className={`${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-zinc-950/30' : 'bg-white border-slate-100 text-slate-700 shadow-2xl'
              } rounded-2xl border p-6 max-w-md w-full mx-4 relative`}
            >
              <button
                onClick={() => setShowFormModal(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'} transition-all cursor-pointer`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-zinc-950 text-indigo-400' : 'bg-slate-50 text-slate-700'}`}>
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>
                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                  </h3>
                  <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Definições do Catálogo
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveService} className={`space-y-4 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                <div>
                  <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                    Nome do Serviço <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Corte de Cabelo Masculino"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-800'
                    } rounded-xl px-3 py-2 text-xs focus:outline-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                      Duração Estimada <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Minutos)</span>
                    </label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${isDark ? 'text-zinc-550' : 'text-slate-400'} font-mono`}>
                        <Clock className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formDuration}
                        onChange={(e) => setFormDuration(Number(e.target.value))}
                        className={`w-full ${
                          isDark 
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-700' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-800'
                        } rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                      Preço <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Valor R$)</span>
                    </label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${isDark ? 'text-zinc-500' : 'text-slate-400'} font-semibold font-mono text-[11px]`}>
                        R$
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className={`w-full ${
                          isDark 
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-700' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-800'
                        } rounded-xl pl-8 pr-3 py-2 text-xs font-mono focus:outline-none`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                    Etiqueta Colorida
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5 py-1">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                          formColor === color ? (isDark ? 'border-white scale-110 shadow-sm' : 'border-slate-800 scale-110 shadow-sm') : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}

                    {/* Custom Color Option */}
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const picker = document.getElementById('custom-color-picker');
                          if (picker) {
                            picker.click();
                          }
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                          !COLOR_PALETTE.includes(formColor)
                            ? (isDark ? 'border-white scale-110 shadow-sm' : 'border-slate-800 scale-110 shadow-sm')
                            : (isDark ? 'border-zinc-700 hover:border-zinc-550' : 'border-slate-200 hover:border-slate-400')
                        }`}
                        style={{ 
                          background: !COLOR_PALETTE.includes(formColor) 
                            ? formColor 
                            : 'linear-gradient(135deg, #ef4444 0%, #3b82f6 50%, #10b981 100%)' 
                        }}
                        title="Cor Personalizada"
                      >
                        <Palette className={`w-3.5 h-3.5 ${!COLOR_PALETTE.includes(formColor) ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : (isDark ? 'text-zinc-400' : 'text-slate-700')}`} />
                      </button>
                      <input
                        id="custom-color-picker"
                        type="color"
                        value={COLOR_PALETTE.includes(formColor) ? '#3b82f6' : formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CONFIGURAÇÃO DE PACOTE (KIT DE SERVIÇOS) */}
                <div className={`${isDark ? 'bg-zinc-950/65 border-zinc-800' : 'bg-slate-50 border-slate-150'} p-3 rounded-xl border space-y-2.5`}>
                  <label className={`flex items-center gap-2.5 font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'} cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={formIsPackage}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormIsPackage(checked);
                        if (checked && formPackageItems.length === 0) {
                          // Try to set some default first item if none selected
                          const nonPkg = services.filter(s => !s.isPackage && s.id !== editingService?.id);
                          if (nonPkg.length > 0) {
                            setFormPackageItems([nonPkg[0].id]);
                            setFormDuration(nonPkg[0].duration);
                            setFormPrice(Math.round(nonPkg[0].price * discountMultiplier * 100) / 100);
                          }
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Este serviço é um Kit / Pacote?</span>
                  </label>

                  {formIsPackage && (
                    <div className="space-y-2 pl-6 animate-fade-in text-[11px]">
                      <span className={`${isDark ? 'text-zinc-400' : 'text-slate-500'} font-medium block`}>Selecione quais serviços compõem este pacote:</span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {services
                          .filter(s => !s.isPackage && s.id !== editingService?.id)
                          .map(s => {
                            const isChecked = formPackageItems.includes(s.id);
                            return (
                              <label key={s.id} className={`flex items-center gap-2 ${isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'} cursor-pointer`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    let updated;
                                    if (isChecked) {
                                      updated = formPackageItems.filter(id => id !== s.id);
                                    } else {
                                      updated = [...formPackageItems, s.id];
                                    }
                                    setFormPackageItems(updated);
                                    
                                    // Dynamically calculate and suggest combined price and duration
                                    const selectedServices = services.filter(ser => updated.includes(ser.id));
                                    const totalDur = selectedServices.reduce((acc, ser) => acc + ser.duration, 0);
                                    const totalPri = selectedServices.reduce((acc, ser) => acc + ser.price, 0);
                                    
                                    setFormDuration(totalDur);
                                    // Offer a smart configurable discount on packages by default!
                                    setFormPrice(Math.round(totalPri * discountMultiplier * 100) / 100);
                                  }}
                                  className="w-3.5 h-3.5 rounded text-indigo-500 border-slate-300"
                                />
                                <span>{s.name} (R$ {formatPrice(s.price)})</span>
                              </label>
                            );
                          })}
                      </div>
                      <span className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-400'} block italic`}>
                        * A duração e o preço são sugeridos automaticamente com base nos itens selecionados (aplicando desconto de {discountPercent}%). Você pode editá-los livremente acima se desejar.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                    Materiais Utilizados <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Opcional)</span>
                  </label>
                  <textarea
                    placeholder="Ex: Descartáveis, Toalha higienizada, Creme hidratante pós-barba..."
                    value={formMaterials}
                    onChange={(e) => setFormMaterials(e.target.value)}
                    rows={2}
                    className={`w-full ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-650 focus:border-zinc-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-800'
                    } rounded-xl px-3 py-2 text-xs resize-none focus:outline-none`}
                  />
                </div>

                <div className={`flex gap-3 pt-3.5 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className={`flex-1 py-2.5 rounded-xl border ${
                      isDark ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    } font-bold text-xs cursor-pointer text-center transition-all`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-xl ${
                      isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } font-bold text-xs cursor-pointer text-center transition-all shadow-md active:scale-98`}
                  >
                    Salvar Serviço
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM ALERTS & TOASTS */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full mx-4"
          >
            <div className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : alertMessage.type === 'error'
                ? 'bg-red-50 border-red-100 text-red-800'
                : 'bg-indigo-50 border-indigo-100 text-indigo-800'
            }`}>
              {alertMessage.type === 'success' ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              ) : alertMessage.type === 'error' ? (
                <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-xs font-semibold">{alertMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE SERVICE CONFIRMATION MODAL */}
      <AnimatePresence>
        {serviceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-zinc-950/40' : 'bg-white border-slate-100 text-slate-700 shadow-2xl'
              } rounded-2xl border p-6 max-w-sm w-full mx-4 text-center space-y-4`}
            >
              <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-red-950/40 text-red-400' : 'bg-red-100 text-red-600'} flex items-center justify-center mx-auto animate-pulse`}>
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-950'}`}>Excluir Serviço?</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'} leading-relaxed`}>
                  Tem certeza que deseja excluir este serviço do catálogo? Agendamentos passados com este serviço não serão afetados, mas ele não estará disponível para novas reservas.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setServiceToDelete(null)}
                  className={`flex-1 py-2 px-4 rounded-xl border ${
                    isDark ? 'border-zinc-800 text-zinc-450 hover:bg-zinc-800 hover:text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  } text-xs font-semibold cursor-pointer transition-all`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onUpdateServices(services.filter(s => s.id !== serviceToDelete));
                    setServiceToDelete(null);
                    triggerAlert('Serviço excluído do catálogo com sucesso!', 'success');
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
