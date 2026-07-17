import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Plus, Search, Phone, Mail, MapPin, Edit2, 
  Trash2, ChevronRight, Calendar, ArrowLeft, NotepadText, AlertCircle, Sparkles, Navigation, X, Check, Eye
} from 'lucide-react';
import { Client, Appointment, Service } from '../types';
import { formatPhone, formatPrice } from '../utils';

interface ClientsViewProps {
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  activeClientId: string | null;
  isDark?: boolean;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClientForBooking: (clientId: string) => void;
  onCloseDetails: () => void;
}

export default function ClientsView({
  clients,
  appointments,
  services,
  activeClientId,
  isDark = true,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClientForBooking,
  onCloseDetails
}: ClientsViewProps) {
  // Search & Screen States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(activeClientId);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [subTab, setSubTab] = useState<'list' | 'crm'>('list');

  // CRM Dashboard Calculations
  const crmMetrics = useMemo(() => {
    const today = new Date('2026-07-16'); // Today context
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const riskTemp: Array<{ id: string; name: string; details: string; phone: string; days: number }> = [];
    const vipTemp: Array<{ id: string; name: string; details: string; value: number }> = [];
    const novosTemp: Array<{ id: string; name: string; details: string; days: number }> = [];
    const recorrentesTemp: Array<{ id: string; name: string; details: string; count: number }> = [];

    // Read real database to add actual matching clients dynamically!
    clients.forEach(c => {
      const clientAppts = appointments.filter(a => a.clientId === c.id);
      if (clientAppts.length === 0) return;

      const sortedAppts = [...clientAppts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstAppt = sortedAppts[0];
      const latestAppt = sortedAppts[sortedAppts.length - 1];

      const latestDate = new Date(latestAppt.date);
      const daysSinceLast = Math.floor((today.getTime() - latestDate.getTime()) / MS_PER_DAY);

      // 1. Risk
      if (daysSinceLast >= 30 && !hasFutureAppointment(c.id)) {
        riskTemp.push({
          id: c.id,
          name: c.name,
          details: `Não agenda há ${daysSinceLast} dias.`,
          phone: c.phone,
          days: daysSinceLast
        });
      }

      // 2. VIP
      const totalSpend = clientAppts.reduce((sum, a) => sum + (a.price || 0), 0);
      if (totalSpend >= 100) {
        let stars = '★★★';
        if (totalSpend >= 300) stars = '★★★★★';
        else if (totalSpend >= 200) stars = '★★★★';
        
        vipTemp.push({
          id: c.id,
          name: c.name,
          details: stars,
          value: totalSpend
        });
      }

      // 3. New
      const firstDateObj = new Date(firstAppt.date);
      const daysSinceFirst = Math.floor((today.getTime() - firstDateObj.getTime()) / MS_PER_DAY);
      if (daysSinceFirst >= 0 && daysSinceFirst <= 15) {
        let desc = `Primeiro atendimento em ${firstAppt.date.split('-').reverse().join('/')}`;
        if (daysSinceFirst === 0) desc = 'Primeiro atendimento Hoje';
        if (daysSinceFirst === 1) desc = 'Primeiro atendimento Ontem';
        novosTemp.push({
          id: c.id,
          name: c.name,
          details: desc,
          days: daysSinceFirst
        });
      }

      // 4. Recorrentes
      if (clientAppts.length >= 2) {
        recorrentesTemp.push({
          id: c.id,
          name: c.name,
          details: `Veio ${clientAppts.length} vezes.`,
          count: clientAppts.length
        });
      }
    });

    // Sort risk descending (most neglected first)
    riskTemp.sort((a, b) => b.days - a.days);

    // Sort vip descending (highest value first)
    vipTemp.sort((a, b) => b.value - a.value);

    // Sort novos ascending (most recent first)
    novosTemp.sort((a, b) => a.days - b.days);

    // Sort recorrentes descending (most visits first)
    recorrentesTemp.sort((a, b) => b.count - a.count);

    // Map back to expected output types
    const risk = riskTemp.map(({ id, name, details, phone }) => ({ id, name, details, phone }));
    const vip = vipTemp.map(({ id, name, details, value }) => ({ id, name, details, value }));
    const novos = novosTemp.map(({ id, name, details }) => ({ id, name, details }));
    const recorrentes = recorrentesTemp.map(({ id, name, details }) => ({ id, name, details }));

    return { risk, vip, novos, recorrentes };
  }, [clients, appointments, services]);

  // Address Geolocation simulation loader
  const [isLocating, setIsLocating] = useState(false);

  // Custom alerts and confirmations state
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);
  };

  // Form states
  const [formName, setFormName] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('+55');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Handle opening form for Create
  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormName('');
    setFormCountryCode('+55');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    setShowFormModal(true);
  };

  // Handle opening form for Edit
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    
    const raw = client.phone || '';
    if (raw.startsWith('+')) {
      const spaceIdx = raw.indexOf(' ');
      if (spaceIdx !== -1) {
        setFormCountryCode(raw.slice(0, spaceIdx));
        setFormPhone(raw.slice(spaceIdx + 1));
      } else {
        setFormCountryCode('+55');
        setFormPhone(raw);
      }
    } else {
      setFormCountryCode('+55');
      setFormPhone(raw);
    }

    setFormEmail(client.email);
    setFormAddress(client.address);
    setFormNotes(client.notes);
    setShowFormModal(true);
  };

  // Save client
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerAlert('O nome completo é obrigatório.', 'error');
      return;
    }

    // Basic phone validation (at least 8 digits)
    const rawPhoneDigits = formPhone.replace(/\D/g, '');
    if (rawPhoneDigits.length < 8) {
      triggerAlert('Por favor, informe um número de telefone ou WhatsApp válido.', 'error');
      return;
    }

    const clientData: Client = {
      id: editingClient?.id || 'c_' + Date.now(),
      name: formName.trim(),
      phone: `${formCountryCode} ${formPhone.trim()}`,
      email: formEmail.trim(),
      address: formAddress.trim(),
      notes: formNotes.trim(),
    };

    if (editingClient) {
      onUpdateClient(clientData);
      triggerAlert('Dados do cliente atualizados com sucesso!', 'success');
    } else {
      onAddClient(clientData);
      triggerAlert('Novo cliente cadastrado com sucesso!', 'success');
    }

    setShowFormModal(false);
  };

  // Delete client handler
  const handleDeleteClient = (id: string) => {
    setClientToDelete(id);
  };

  // Simulate GPS search for address
  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    
    // Attempt standard browser geolocation with fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In real scenarios, we'd use reverse geocoding. 
          // We'll simulate a gorgeous responsive address resolution.
          setTimeout(() => {
            setFormAddress('Av. Paulista, 1500 - Bela Vista, São Paulo - SP (Localização via GPS)');
            setIsLocating(false);
          }, 1200);
        },
        (error) => {
          setTimeout(() => {
            setFormAddress('Rua das Américas, 410 - Centro, São Paulo - SP (Simulado)');
            setIsLocating(false);
          }, 1250);
        }
      );
    } else {
      setTimeout(() => {
        setFormAddress('Av. Brigadeiro Luís Antônio, 2300 - Bela Vista, São Paulo - SP');
        setIsLocating(false);
      }, 1000);
    }
  };

  // Synchronize when parent triggers client selection
  React.useEffect(() => {
    if (activeClientId) {
      setSelectedClientId(activeClientId);
    }
  }, [activeClientId]);

  // Clients sorted alphabetically and filtered
  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => {
        const query = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.email.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  // Determine if a client has any future/scheduled appointments
  const hasFutureAppointment = (clientId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return appointments.some(
      (appt) => appt.clientId === clientId && appt.status === 'scheduled' && appt.date >= todayStr
    );
  };

  // History list of appointments for selected client
  const clientHistory = useMemo(() => {
    if (!selectedClientId) return [];
    return appointments
      .filter((appt) => appt.clientId === selectedClientId)
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  }, [appointments, selectedClientId]);

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Service helper
  const getServiceName = (serviceId: string) => {
    return services.find((s) => s.id === serviceId)?.name || 'Serviço Removido';
  };

  return (
    <div className="space-y-4" id="clients-tab-root">
      
      <AnimatePresence mode="wait">
        {selectedClient ? (
          /* TELA 4.3 — FICHA DO CLIENTE & HISTÓRICO */
          <motion.div
            key="client-detail"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="space-y-4"
          >
            {/* Nav Back Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedClientId(null);
                  onCloseDetails();
                }}
                className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer text-slate-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
                  Ficha do Cliente
                </h2>
                <span className="text-[10px] uppercase font-mono text-slate-400">
                  Gerenciamento de Prontuário
                </span>
              </div>
            </div>

            {/* Profile Info Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-display font-black text-xl border border-indigo-100">
                    {selectedClient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
                      {selectedClient.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedClient.phone}</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(selectedClient)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-slate-700 transition-all cursor-pointer"
                    title="Editar Cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(selectedClient.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 transition-all cursor-pointer"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cadastral Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3.5 border-t border-slate-100 text-xs">
                {selectedClient.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedClient.email}</span>
                  </div>
                )}
                {selectedClient.address ? (
                  <div className="flex items-start gap-2 text-slate-600 col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedClient.address}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Nenhum endereço cadastrado.</span>
                )}
              </div>

              {/* Preferences & Notes box */}
              {selectedClient.notes && (
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/80 text-xs space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                    <NotepadText className="w-3.5 h-3.5 text-indigo-500" />
                    Preferências / Observações Importantes
                  </span>
                  <p className="text-slate-600 leading-relaxed font-sans">{selectedClient.notes}</p>
                </div>
              )}

              {/* Dynamic Action row */}
              <div className="pt-2">
                <button
                  onClick={() => onSelectClientForBooking(selectedClient.id)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Agendar Novo Atendimento para este Cliente
                </button>
              </div>
            </div>

            {/* Attendance History list */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-slate-500" />
                Histórico de Atendimentos ({clientHistory.length})
              </h4>

              {clientHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic">Esse cliente ainda não possui nenhum atendimento em nosso histórico.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {clientHistory.map((appt) => (
                    <div 
                      key={appt.id}
                      className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-all hover:bg-slate-50"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{getServiceName(appt.serviceId)}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            appt.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : appt.status === 'cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {appt.status === 'completed' ? 'Concluído' : appt.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {appt.date.split('-').reverse().join('/')} às {appt.time} • {appt.duration} min
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="font-bold text-slate-900 block font-mono">R$ {formatPrice(appt.price)}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">
                          {appt.paymentStatus === 'paid' ? 'PAGO' : appt.paymentStatus === 'installments' ? 'PARCELADO' : 'PENDENTE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        ) : (
          /* TELA 4.1 — LISTA DE CLIENTES */
          <motion.div
            key="clients-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900 leading-tight">Painel de Clientes</h2>
                <span className="text-xs text-slate-500 font-mono">
                  {clients.length} cadastrados no catálogo
                </span>
              </div>
              
              <button
                onClick={handleOpenCreate}
                className="bg-slate-950 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
                id="btn-add-client"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </button>
            </div>

            {/* Sub-Tabs Selector */}
            <div className={`flex p-0.5 rounded-xl text-xs font-semibold w-full sm:max-w-sm border overflow-x-auto scrollbar-none ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800' 
                : 'bg-slate-100 border-slate-200/50'
            }`}>
              <button
                type="button"
                onClick={() => setSubTab('list')}
                className={`flex-1 min-w-fit px-4 py-1.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap ${
                  subTab === 'list' 
                    ? (isDark ? 'bg-zinc-800 text-white font-bold shadow-sm' : 'bg-white text-slate-950 font-bold shadow-sm') 
                    : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
                }`}
              >
                Lista de Clientes
              </button>
              <button
                type="button"
                onClick={() => setSubTab('crm')}
                className={`flex-1 min-w-fit px-4 py-1.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap ${
                  subTab === 'crm' 
                    ? (isDark ? 'bg-zinc-800 text-white font-bold shadow-sm' : 'bg-white text-slate-950 font-bold shadow-sm') 
                    : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
                }`}
              >
                Painel CRM & Fidelização
              </button>
            </div>

            {subTab === 'list' ? (
              <>
                {/* Search Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou WhatsApp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all shadow-sm ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700'
                        : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-slate-800'
                    }`}
                  />
                </div>

                {/* Alphabetical Table List */}
                {filteredClients.length === 0 ? (
                  <div className={`rounded-2xl p-10 text-center border shadow-sm space-y-2 ${
                    isDark ? 'bg-zinc-950 border-zinc-900 text-zinc-400' : 'bg-white border-slate-100 text-slate-700'
                  }`}>
                    <User className="w-10 h-10 text-slate-200 mx-auto" />
                    <h3 className="font-display font-semibold text-sm">Nenhum cliente correspondente</h3>
                    <p className="text-xs max-w-xs mx-auto text-slate-400">Tente ajustar o termo de pesquisa ou cadastre um novo cliente acima.</p>
                  </div>
                ) : (
                  <div className={`border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${
                    isDark ? 'bg-zinc-950/20 border-zinc-900/60' : 'bg-white border-slate-100'
                  }`}>
                    <div className="w-full">
                      {/* HEADER - DESKTOP ONLY */}
                      <div className={`hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b font-display font-bold tracking-wider uppercase text-[10px] ${
                        isDark ? 'bg-zinc-900/40 border-zinc-900 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}>
                        <div>Cliente</div>
                        <div>Contato</div>
                        <div>Endereço</div>
                        <div className="text-center">Atendimentos</div>
                        <div className="text-center">CRM</div>
                        <div className="text-right">Ações</div>
                      </div>

                      {/* CLIENT ROWS */}
                      <div className={`divide-y ${isDark ? 'divide-zinc-900/60' : 'divide-slate-100'}`}>
                        {filteredClients.map((client) => {
                          const hasFuture = hasFutureAppointment(client.id);
                          const totalVisits = appointments.filter((a) => a.clientId === client.id).length;
                          
                          // Get CRM Status
                          const getClientCRMStatus = (clientId: string) => {
                            const isRisk = crmMetrics.risk.some(r => r.id === clientId);
                            const isVip = crmMetrics.vip.some(v => v.id === clientId);
                            const isNovo = crmMetrics.novos.some(n => n.id === clientId);
                            const isRecorrente = crmMetrics.recorrentes.some(rec => rec.id === clientId);
                            
                            if (isRisk) return { label: 'Em Risco', style: isDark ? 'bg-rose-950/40 text-rose-300 border-rose-900/30' : 'bg-rose-50 text-rose-700 border-rose-100' };
                            if (isVip) return { label: 'VIP', style: isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/30' : 'bg-amber-50 text-amber-700 border-amber-100' };
                            if (isNovo) return { label: 'Novo', style: isDark ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900/30' : 'bg-indigo-50 text-indigo-700 border-indigo-100' };
                            if (isRecorrente) return { label: 'Recorrente', style: isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/30' : 'bg-emerald-50 text-emerald-700 border-emerald-100' };
                            if (totalVisits === 0) return { label: 'Sem Visitas', style: isDark ? 'bg-zinc-900/40 text-zinc-400 border-zinc-800/30' : 'bg-slate-50 text-slate-500 border-slate-150' };
                            return { label: 'Ativo', style: isDark ? 'bg-zinc-800/40 text-zinc-300 border-zinc-800/20' : 'bg-slate-100 text-slate-600 border-slate-200' };
                          };

                          const crmStatus = getClientCRMStatus(client.id);

                          return (
                            <div 
                              key={client.id}
                              className={`flex flex-col md:grid md:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-3 md:gap-4 p-4 md:px-4 md:py-3 md:items-center transition-all duration-150 ${
                                isDark ? 'hover:bg-zinc-900/30' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              {/* CLIENT INFO */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm md:text-xs border shrink-0 ${
                                  isDark 
                                    ? 'bg-zinc-900 text-zinc-300 border-zinc-800' 
                                    : 'bg-slate-50 text-slate-600 border-slate-100'
                                }`}>
                                  {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <button 
                                      onClick={() => setSelectedClientId(client.id)}
                                      className={`font-semibold text-sm md:text-xs hover:underline text-left cursor-pointer transition-all truncate ${
                                        isDark ? 'text-zinc-100 hover:text-indigo-400' : 'text-slate-900 hover:text-indigo-600'
                                      }`}
                                    >
                                      {client.name}
                                    </button>
                                    {hasFuture && (
                                      <span 
                                        className="w-1.5 h-1.5 rounded-full bg-indigo-500 notification-pulse shrink-0" 
                                        title="Tem agendamento futuro marcado"
                                      />
                                    )}
                                  </div>
                                  {client.notes && (
                                    <p className="text-[10px] md:text-[9px] w-full truncate italic text-slate-400">
                                      "{client.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* CONTACT INFO */}
                              <div className="space-y-0.5 mt-1 md:mt-0 ml-[52px] md:ml-0 min-w-0">
                                <span className={`font-mono text-[11px] md:text-[10px] block whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                                  {client.phone.startsWith('+') ? client.phone : formatPhone(client.phone)}
                                </span>
                                {client.email ? (
                                  <span className="text-[11px] md:text-[10px] text-slate-400 block w-full truncate">
                                    {client.email}
                                  </span>
                                ) : (
                                  <span className="text-[10px] md:text-[9px] text-slate-400 italic block">
                                    sem e-mail
                                  </span>
                                )}
                              </div>

                              {/* ADDRESS */}
                              <div className="ml-[52px] md:ml-0 mt-1 md:mt-0 min-w-0">
                                {client.address ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <MapPin className="w-3.5 h-3.5 md:w-3 md:h-3 text-slate-400 shrink-0" />
                                    <span className="text-[11px] md:text-[10px] truncate text-slate-400" title={client.address}>
                                      {client.address}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] md:text-[10px] text-slate-400 italic font-light block">
                                    Endereço não informado
                                  </span>
                                )}
                              </div>

                              {/* METRICS & CRM MOBILE CONTAINER */}
                              <div className="flex items-center justify-between md:contents mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-slate-200 dark:border-zinc-800">
                                {/* TOTAL VISITS */}
                                <div className="flex md:flex-col items-center md:justify-center gap-2 md:gap-0">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 md:hidden">Visitas:</span>
                                  <span className={`font-mono font-bold text-xs ${
                                    isDark ? 'text-zinc-300' : 'text-slate-800'
                                  }`}>
                                    {totalVisits}
                                  </span>
                                </div>

                                {/* CRM STATUS */}
                                <div className="flex items-center justify-center">
                                  <span className={`inline-block text-[10px] md:text-[9px] font-semibold px-2 py-0.5 rounded-full border ${crmStatus.style}`}>
                                    {crmStatus.label}
                                  </span>
                                </div>

                                {/* ACTIONS */}
                                <div className="flex items-center justify-end gap-1.5 md:gap-1">
                                  <button
                                    onClick={() => setSelectedClientId(client.id)}
                                    title="Ver Ficha"
                                    className={`p-2 md:p-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isDark 
                                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100' 
                                        : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                  >
                                    <Eye className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEdit(client)}
                                    title="Editar Dados"
                                    className={`p-2 md:p-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isDark 
                                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100' 
                                        : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                  >
                                    <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onSelectClientForBooking(client.id)}
                                    title="Novo Agendamento"
                                    className={`p-2 md:p-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isDark 
                                        ? 'bg-indigo-950/40 border-indigo-900/30 text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200' 
                                        : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/50 hover:text-indigo-700'
                                    }`}
                                  >
                                    <Calendar className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClient(client.id)}
                                    title="Excluir Cliente"
                                    className={`p-2 md:p-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isDark 
                                        ? 'bg-rose-950/40 border-rose-900/30 text-rose-300 hover:bg-rose-900/40 hover:text-rose-200' 
                                        : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100/50 hover:text-rose-700'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* CRM DASHBOARD BENTO PANELS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* PANEL 1: CLIENTES EM RISCO */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500 text-base">⚠</span>
                      <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide">Clientes em Risco</h4>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isDark 
                        ? 'bg-rose-950/40 text-rose-300 border-rose-900/30' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {crmMetrics.risk.length} alertas
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {crmMetrics.risk.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        Nenhum cliente em risco no momento.
                      </div>
                    ) : (
                      crmMetrics.risk.map((item) => (
                        <div key={item.id} className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs border ${
                          isDark 
                            ? 'bg-rose-950/20 border-rose-900/30 text-rose-200' 
                            : 'bg-rose-50/40 border border-rose-100/50'
                        }`}>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className={`text-[10px] font-medium block ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{item.details}</span>
                          </div>
                          <button
                            onClick={() => {
                              triggerAlert(`Mensagem de reengajamento enviada para ${item.name}!`, 'success');
                            }}
                            className={`font-bold text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition-all active:scale-95 border ${
                              isDark 
                                ? 'bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border-rose-900/40' 
                                : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                            }`}
                          >
                            Reatar Contato
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* PANEL 2: CLIENTES VIP */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 text-base">★</span>
                      <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide">Clientes VIP</h4>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isDark 
                        ? 'bg-amber-950/40 text-amber-300 border-amber-900/30' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      Destaques
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {crmMetrics.vip.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        Nenhum cliente VIP identificado ainda.
                      </div>
                    ) : (
                      crmMetrics.vip.slice(0, 4).map((item) => (
                        <div key={item.id} className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs border ${
                          isDark 
                            ? 'bg-amber-950/20 border-amber-900/30 text-amber-200' 
                            : 'bg-amber-50/30 border border-amber-100/40'
                        }`}>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className={`text-[10px] font-bold block ${isDark ? 'text-amber-300/90' : 'text-amber-600'}`}>{item.details}</span>
                          </div>
                          <span className={`font-mono font-black text-[11px] px-2.5 py-1 rounded-lg border ${
                            isDark 
                              ? 'bg-amber-950/40 border-amber-900/40 text-amber-300' 
                              : 'bg-amber-50 border border-amber-100 text-amber-700'
                          }`}>
                            Gastou R$ {formatPrice(item.value)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* PANEL 3: CLIENTES NOVOS */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-500 text-base">✦</span>
                      <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide">Clientes Novos</h4>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isDark 
                        ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900/30' 
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      Primeiro Atendimento
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {crmMetrics.novos.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        Nenhum cliente novo nos últimos 15 dias.
                      </div>
                    ) : (
                      crmMetrics.novos.map((item) => (
                        <div key={item.id} className={`p-3 rounded-xl text-xs border ${
                          isDark 
                            ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200' 
                            : 'bg-indigo-50/30 border border-indigo-100/40'
                        }`}>
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className={`text-[10px] font-medium block mt-0.5 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>{item.details}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* PANEL 4: CLIENTES RECORRENTES */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 text-base">🔄</span>
                      <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide">Clientes Recorrentes</h4>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isDark 
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/30' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      Fidelidade
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {crmMetrics.recorrentes.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        Nenhum cliente recorrente ainda.
                      </div>
                    ) : (
                      crmMetrics.recorrentes.slice(0, 4).map((item) => (
                        <div key={item.id} className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs border ${
                          isDark 
                            ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-200' 
                            : 'bg-emerald-50/20 border border-emerald-100/40'
                        }`}>
                          <span className="font-bold text-slate-900 truncate">{item.name}</span>
                          <span className={`font-mono font-extrabold text-[10px] px-2 py-0.5 rounded border ${
                            isDark 
                              ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-300' 
                              : 'bg-emerald-50 border border-emerald-100/60 text-emerald-700'
                          }`}>
                            {item.details}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TELA 4.2 — MODAL CADASTRO / EDIÇÃO DE CLIENTE */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
              <h3 className="font-display font-bold text-base">
                {editingClient ? 'Editar Dados do Cliente' : 'Novo Cliente'}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveClient} className="p-5 space-y-4 text-xs text-slate-700">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Nome Completo *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">WhatsApp / Telefone *</label>
                <div className="flex gap-2">
                  <div className="w-24 shrink-0 relative">
                    <input
                      type="text"
                      list="clients-country-codes"
                      value={formCountryCode}
                      onChange={(e) => setFormCountryCode(e.target.value)}
                      placeholder="+55"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none text-center font-medium"
                    />
                    <datalist id="clients-country-codes">
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
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                      placeholder="Ex: (11) 98888-8888"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">E-mail (Opcional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="carlos@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none"
                  />
                </div>
              </div>

              {/* Geolocation Address Field */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Endereço Residencial</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade - Estado"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Preferences Text Area */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Anotações / Preferências de Atendimento</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Gosta de cortar bem baixo nas laterais, alérgico a perfume de mentol, prefere horários da manhã, etc..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 cursor-pointer text-center transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white cursor-pointer text-center transition-all shadow-md active:scale-98 hover:shadow-slate-200/40"
                >
                  Salvar Cliente
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
              isDark
                ? alertMessage.type === 'success'
                  ? 'bg-zinc-900 border-zinc-800 text-emerald-400'
                  : alertMessage.type === 'error'
                  ? 'bg-zinc-900 border-zinc-800 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-indigo-400'
                : alertMessage.type === 'success' 
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

      {/* DELETE CLIENT CONFIRMATION MODAL */}
      <AnimatePresence>
        {clientToDelete && (
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
                <h4 className="font-display font-bold text-base text-slate-950">Excluir Cliente?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tem certeza que deseja excluir este cliente? Históricos de agendamento não serão perdidos, mas o cliente será desvinculado de futuras buscas rápidas.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setClientToDelete(null)}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteClient(clientToDelete);
                    setSelectedClientId(null);
                    setClientToDelete(null);
                    triggerAlert('Cliente excluído com sucesso!', 'success');
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
