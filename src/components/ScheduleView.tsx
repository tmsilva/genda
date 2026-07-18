import { now, parseDate, getTodayStr, formatDatePtBR } from '../dateUtils';
import dayjs from 'dayjs';
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Plus, Clock, User, Briefcase, DollarSign, 
  ChevronLeft, ChevronRight, Share2, Edit2, Trash2, 
  Check, Phone, CheckCircle2, AlertCircle, X, Bell, RefreshCw, Send, Search
} from 'lucide-react';
import { Appointment, Client, Service, ThemeOption, RecurrenceType, PaymentStatus, AppointmentStatus, MessageTemplate } from '../types';
import { formatPhone, getWhatsAppNumber, formatPrice } from '../utils';

interface BlockedSlot {
  id: string;
  date: string;
  time: string;
  reason: string;
}

interface ScheduleViewProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  workingDays: any[];
  theme: ThemeOption;
  isDark: boolean;
  messageTemplates: MessageTemplate[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onAddClient: (client: Client) => void;
  onViewClient: (clientId: string) => void;
  activeAppointmentId?: string | null;
  onClearActiveAppointmentId?: () => void;
}

export default function ScheduleView({
  appointments,
  clients,
  services,
  workingDays,
  theme,
  isDark,
  messageTemplates,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onAddClient,
  onViewClient,
  activeAppointmentId,
  onClearActiveAppointmentId,
}: ScheduleViewProps) {
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(false);
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState('pix');

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  
  // Drag and drop & Universal Search states
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Fast Client Creation within Appointment Form
  const [showFastClientModal, setShowFastClientModal] = useState(false);
  const [fastClientName, setFastClientName] = useState('');
  const [fastClientCountryCode, setFastClientCountryCode] = useState('+55');
  const [fastClientPhone, setFastClientPhone] = useState('');

  // Custom alerts and confirmations state
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const triggerAlert = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);
  };

  // Creation/Edit Form State
  const [formAppointmentId, setFormAppointmentId] = useState<string | null>(null);
  const [formClientId, setFormClientId] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState(30);
  const [formPrice, setFormPrice] = useState(50);
  const [formRecurrence, setFormRecurrence] = useState<RecurrenceType>('none');
  const [formReminder, setFormReminder] = useState(true);

  // Custom Blocked Slots State
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() => {
    const cached = localStorage.getItem('genda_blocked_slots');
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    localStorage.setItem('genda_blocked_slots', JSON.stringify(blockedSlots));
  }, [blockedSlots]);

  useEffect(() => {
    if (activeAppointmentId) {
      const appt = appointments.find(a => a.id === activeAppointmentId);
      if (appt) {
        setSelectedAppointment(appt);
        setShowDetailsModal(true);
        if (onClearActiveAppointmentId) {
          onClearActiveAppointmentId();
        }
      }
    }
  }, [activeAppointmentId, appointments, onClearActiveAppointmentId]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slot: string } | null>(null);
  const [blockingModalSlot, setBlockingModalSlot] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleRightClickSlot = (e: React.MouseEvent, slot: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      slot
    });
  };

  const handleUnblockSlot = (blockId: string) => {
    setBlockedSlots(prev => prev.filter(b => b.id !== blockId));
    triggerAlert('Horário desbloqueado com sucesso!', 'success');
  };

  const getCustomBlock = (slot: string) => {
    return blockedSlots.find(b => b.date === selectedDate && b.time === slot);
  };
  const [formPaymentStatus, setFormPaymentStatus] = useState<PaymentStatus>('pending');
  const [formPaymentMethod, setFormPaymentMethod] = useState('pix');

  // Parse Selected Date
  const parsedDate = useMemo(() => {
    const d = parseDate(selectedDate + 'T00:00:00');
    return {
      day: d.date(),
      dayOfWeek: d.day(),
      month: d.format('MMMM'),
      year: d.year(),
      formatted: d.format('dddd, D [de] MMMM'),
    };
  }, [selectedDate]);

  // Navigate Date helper
  const navigateDate = (days: number) => {
    const current = parseDate(selectedDate + 'T00:00:00');
    setSelectedDate(current.add(days, 'day').format('YYYY-MM-DD'));
  };

  // Helper: Get weekday name
  const getWeekdayName = (dayOfWeek: number) => {
    const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return names[dayOfWeek];
  };

  // Check if a day of week is working day
  const workingDayConfig = useMemo(() => {
    return workingDays.find(wd => wd.dayOfWeek === parsedDate.dayOfWeek);
  }, [workingDays, parsedDate.dayOfWeek]);

  const isWorkingDay = workingDayConfig ? workingDayConfig.isWorking : true;

  // Filtered Appointments for Selected Date
  const dayAppointments = useMemo(() => {
    return appointments.filter(appt => appt.date === selectedDate && appt.status !== 'cancelled');
  }, [appointments, selectedDate]);

  // Time Slots generation (dynamic based on professional's active/working hours, plus any out-of-bounds appointments)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    
    // Helper: Convert "HH:MM" to minutes from midnight
    const parseTimeToMinutes = (t: string): number => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    // Helper: Convert minutes to "HH:MM"
    const formatMinutesToTime = (min: number): string => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    if (workingDayConfig && workingDayConfig.isWorking) {
      const startMin = parseTimeToMinutes(workingDayConfig.startTime || '09:00');
      const endMin = parseTimeToMinutes(workingDayConfig.endTime || '18:00');
      
      for (let min = startMin; min <= endMin; min += 30) {
        slots.push(formatMinutesToTime(min));
      }
    }

    // Add any existing appointments on this day that aren't on standard slots or are outside working hours
    dayAppointments.forEach(appt => {
      if (appt.time && !slots.includes(appt.time)) {
        slots.push(appt.time);
      }
    });

    // Sort chronologically
    slots.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

    return slots;
  }, [workingDayConfig, dayAppointments]);

  // Handle open creation modal
  const openCreateModal = (timePreset?: string) => {
    setFormAppointmentId(null);
    setFormClientId(clients[0]?.id || '');
    setFormServiceId(services[0]?.id || '');
    setFormDate(selectedDate);
    setFormTime(timePreset || '10:00');
    
    const service = services[0];
    if (service) {
      setFormDuration(service.duration);
      setFormPrice(service.price);
    } else {
      setFormDuration(30);
      setFormPrice(50);
    }
    
    setFormRecurrence('none');
    setFormReminder(true);
    setFormPaymentStatus('pending');
    setFormPaymentMethod('pix');
    setShowCreateModal(true);
  };

  // Handle Open edit modal
  const openEditModal = (appt: Appointment) => {
    setFormAppointmentId(appt.id);
    setFormClientId(appt.clientId);
    setFormServiceId(appt.serviceId);
    setFormDate(appt.date);
    setFormTime(appt.time);
    setFormDuration(appt.duration);
    setFormPrice(appt.price);
    setFormRecurrence(appt.isRecurring);
    setFormReminder(appt.isReminderEnabled);
    setFormPaymentStatus(appt.paymentStatus);
    setFormPaymentMethod(appt.paymentMethod || 'pix');
    
    setShowDetailsModal(false);
    setShowCreateModal(true);
  };

  // Handle service select to pre-fill duration and price
  const handleServiceChange = (serviceId: string) => {
    setFormServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFormDuration(service.duration);
      setFormPrice(service.price);
    }
  };

  // Save/Create appointment handler
  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId) {
      triggerAlert('Selecione um cliente ou cadastre um novo.', 'error');
      return;
    }
    if (!formServiceId) {
      triggerAlert('Selecione um serviço.', 'error');
      return;
    }

    const apptData: Appointment = {
      id: formAppointmentId || 'appt_' + Date.now(),
      clientId: formClientId,
      serviceId: formServiceId,
      date: formDate,
      time: formTime,
      duration: formDuration,
      price: formPrice,
      isRecurring: formRecurrence,
      isReminderEnabled: formReminder,
      paymentStatus: formPaymentStatus,
      paymentMethod: formPaymentStatus === 'paid' ? formPaymentMethod : undefined,
      paymentDate: formPaymentStatus === 'paid' ? formDate : undefined,
      status: 'scheduled',
    };

    if (formAppointmentId) {
      onUpdateAppointment(apptData);
      triggerAlert('Agendamento atualizado com sucesso!', 'success');
    } else {
      onAddAppointment(apptData);
      triggerAlert('Agendamento realizado com sucesso!', 'success');
    }

    setShowCreateModal(false);
  };

  // Fast client creation within form
  const handleSaveFastClient = () => {
    if (!fastClientName.trim()) return;
    const finalPhone = fastClientPhone ? `${fastClientCountryCode} ${fastClientPhone}` : `${fastClientCountryCode} (11) 99999-9999`;
    const newClient: Client = {
      id: 'c_' + Date.now(),
      name: fastClientName,
      phone: finalPhone,
      email: '',
      address: '',
      notes: 'Adicionado rapidamente pelo agendador.',
    };
    onAddClient(newClient);
    setFormClientId(newClient.id);
    setFastClientName('');
    setFastClientCountryCode('+55');
    setFastClientPhone('');
    setShowFastClientModal(false);
  };

  // Open Appointment Details card
  const handleOpenDetails = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setShowDetailsModal(true);
    setShowPaymentMethodSelector(false);
    setCompletedPaymentMethod(appt.paymentMethod || 'pix');
  };

  // Get matching client for appointment
  const getApptClient = (clientId: string): Client => {
    return clients.find(c => c.id === clientId) || {
      id: '', name: 'Cliente Desconhecido', phone: '', email: '', address: '', notes: ''
    };
  };

  // Get matching service for appointment
  const getApptService = (serviceId: string): Service => {
    return services.find(s => s.id === serviceId) || {
      id: '', name: 'Serviço Removido', duration: 0, price: 0, color: '#94a3b8'
    };
  };

  // Actions for detail modal
  const handleMarkAsCompleted = () => {
    setShowPaymentMethodSelector(true);
  };

  const handleConfirmMarkAsCompleted = () => {
    if (!selectedAppointment) return;
    const updated: Appointment = {
      ...selectedAppointment,
      status: 'completed',
      paymentStatus: 'paid',
      paymentDate: getTodayStr(),
      paymentMethod: completedPaymentMethod,
    };
    onUpdateAppointment(updated);
    setSelectedAppointment(updated);
    setShowDetailsModal(false);
    setShowPaymentMethodSelector(false);
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    setShowCancelConfirm(true);
  };

  // Create template text for WhatsApp
  const handleShareReminder = (templateType: 'reminder' | 'confirm' | 'reschedule' | 'thanks') => {
    if (!selectedAppointment) return;
    const client = getApptClient(selectedAppointment.clientId);
    const service = getApptService(selectedAppointment.serviceId);
    
    const template = messageTemplates.find(t => t.type === templateType) || messageTemplates[0];
    if (!template) return;

    // format date nicely DD/MM
    const dateParts = selectedAppointment.date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}`;

    let body = template.body
      .replace('{nome}', client.name.split(' ')[0])
      .replace('{serviço}', service.name)
      .replace('{data}', formattedDate)
      .replace('{hora}', selectedAppointment.time);

    // Simulated copy/send action
    const whatsappUrl = `https://wa.me/${getWhatsAppNumber(client.phone)}?text=${encodeURIComponent(body)}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(body);
    
    // Open in new tab simulating WhatsApp draft
    window.open(whatsappUrl, '_blank');
  };

  // Check if a time slot has a booking
  const getBookingForSlot = (slot: string) => {
    return dayAppointments.find(appt => {
      const apptTime = appt.time;
      // parse hour and minutes
      const [sh, sm] = slot.split(':').map(Number);
      const [ah, am] = apptTime.split(':').map(Number);
      
      const slotMin = sh * 60 + sm;
      const apptMin = ah * 60 + am;
      const apptEndMin = apptMin + appt.duration;

      return slotMin >= apptMin && slotMin < apptEndMin;
    });
  };

  // Check if slot falls in lunch hour
  const isLunchSlot = (slot: string) => {
    if (!workingDayConfig || !workingDayConfig.lunchStart || !workingDayConfig.lunchEnd) return false;
    const [sh, sm] = slot.split(':').map(Number);
    const [lsh, lsm] = workingDayConfig.lunchStart.split(':').map(Number);
    const [leh, lem] = workingDayConfig.lunchEnd.split(':').map(Number);

    const slotMin = sh * 60 + sm;
    const lunchStartMin = lsh * 60 + lsm;
    const lunchEndMin = leh * 60 + lem;

    return slotMin >= lunchStartMin && slotMin < lunchEndMin;
  };

  // Simple Month Days calculation for month view
  const monthDays = useMemo(() => {
    const year = Number(selectedDate.split('-')[0]);
    const month = Number(selectedDate.split('-')[1]) - 1; // 0-indexed
    
    const firstDay = parseDate().year(year).month(month).date(1);
    const lastDay = parseDate().year(year).month(month).endOf('month');
    
    const daysInMonth = lastDay.date();
    const startingDayOfWeek = firstDay.day(); // 0 = Sunday
    
    const days = [];
    // Padding for days of previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        hasAppointments: appointments.some(appt => appt.date === dateStr && appt.status !== 'cancelled'),
      });
    }
    return days;
  }, [selectedDate, appointments]);

  // Week appointments calculation for week view
  const weekDays = useMemo(() => {
    const current = parseDate(selectedDate + 'T00:00:00');
    const startOfWeek = current.startOf('week');
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = startOfWeek.add(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      days.push({
        date: dateStr,
        dayName: d.format('ddd').replace('.', ''),
        dayNum: d.date(),
        appointments: appointments.filter(appt => appt.date === dateStr && appt.status !== 'cancelled'),
      });
    }
    return days;
  }, [selectedDate, appointments]);

  // Day Occupancy calculation
  const dayOccupancy = useMemo(() => {
    if (timeSlots.length === 0) return { total: 0, occupied: 0, percentage: 0 };
    const activeSlots = timeSlots.filter(slot => !isLunchSlot(slot));
    if (activeSlots.length === 0) return { total: 0, occupied: 0, percentage: 0 };
    
    let occupiedCount = 0;
    activeSlots.forEach(slot => {
      if (getBookingForSlot(slot)) {
        occupiedCount++;
      }
    });
    
    const pct = Math.round((occupiedCount / activeSlots.length) * 100);
    return {
      total: activeSlots.length,
      occupied: occupiedCount,
      percentage: pct
    };
  }, [timeSlots, dayAppointments]);

  const blockBar = useMemo(() => {
    const totalBlocks = 10;
    const filledBlocks = Math.round((dayOccupancy.percentage / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  }, [dayOccupancy.percentage]);

  // Global search results across all appointments
  const globalSearchResults = useMemo(() => {
    if (!globalSearchTerm.trim()) return [];
    const term = globalSearchTerm.toLowerCase();
    return appointments.map(appt => {
      const client = getApptClient(appt.clientId);
      const service = getApptService(appt.serviceId);
      return {
        ...appt,
        client,
        service
      };
    }).filter(item => {
      return (
        item.client.name.toLowerCase().includes(term) ||
        item.client.phone.includes(term) ||
        item.service.name.toLowerCase().includes(term) ||
        item.date.includes(term)
      );
    }).slice(0, 8);
  }, [appointments, globalSearchTerm, clients, services]);

  return (
    <div className="space-y-4" id="schedule-tab-root">

      {/* UNIVERSAL SEARCH BAR */}
      <div className="relative">
        <div className={`relative flex items-center ${isDark ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl border shadow-sm`}>
          <span className="absolute left-4 text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Buscar cliente, serviço ou data..."
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none rounded-2xl pl-11 pr-10 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          />
          {globalSearchTerm && (
            <button
              onClick={() => setGlobalSearchTerm('')}
              className="absolute right-3 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {globalSearchTerm && (
          <div className={`absolute left-0 right-0 mt-2 z-50 rounded-2xl border shadow-2xl p-3 ${
            isDark ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-150 dark:border-zinc-800 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Resultados da Busca</span>
              <span className="text-[10px] text-slate-500">{globalSearchResults.length} encontrados</span>
            </div>
            
            {globalSearchResults.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhum agendamento encontrado para "{globalSearchTerm}"
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {globalSearchResults.map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => {
                      setSelectedDate(appt.date);
                      handleOpenDetails(appt);
                      setGlobalSearchTerm('');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between text-xs cursor-pointer ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {appt.client.name}
                        <span className="text-[10px] font-normal text-slate-400">({appt.client.phone})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold" style={{ color: appt.service.color }}>{appt.service.name}</span>
                        <span>•</span>
                        <span>{appt.date.split('-').reverse().join('/')} às {appt.time}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                      appt.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      appt.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}>
                      {appt.status === 'completed' ? 'Concluído' : appt.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Banner Calendar Controls */}
      <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'} rounded-2xl p-3 sm:p-4 border shadow-sm flex flex-col gap-3`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <button 
              onClick={() => navigateDate(-1)}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center sm:text-left px-1 flex-1 sm:flex-none">
              <h2 className={`font-display font-bold text-sm sm:text-base md:text-lg leading-tight capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeTab === 'day' ? parsedDate.formatted : parsedDate.month.toUpperCase() + ' ' + parsedDate.year}
              </h2>
              <div className="flex flex-col gap-0.5 mt-0.5 items-center sm:items-start">
                <span className={`text-[10px] sm:text-[11px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  {dayAppointments.length} agendamentos hoje
                </span>
                {activeTab === 'day' && dayOccupancy.total > 0 && (
                  <div className="flex flex-wrap items-center gap-x-2 text-[10px] sm:text-[11px] font-mono leading-tight">
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500 font-medium'}>
                      {dayOccupancy.occupied}/{dayOccupancy.total} horários ocupados
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => navigateDate(1)}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Tab Selectors */}
          <div className={`flex self-center sm:self-auto ${isDark ? 'bg-zinc-800 border-zinc-700/60' : 'bg-slate-100 border-slate-200/40'} p-0.5 rounded-xl border text-xs font-medium`}>
            {(['day', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-2.5 py-1.5 sm:px-3 rounded-lg transition-all capitalize cursor-pointer ${
                  activeTab === t 
                    ? (isDark ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') 
                    : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
                }`}
              >
                {t === 'day' ? 'Dia' : t === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>

        {/* Selected week mini-bar (horizontal days slider) - helpful for quick click */}
        {activeTab === 'day' && (
          <div className={`grid grid-cols-7 gap-1 pt-1 border-t ${isDark ? 'border-zinc-800/60' : 'border-slate-100/60'}`}>
            {weekDays.map((wd) => {
              const isSelected = wd.date === selectedDate;
              return (
                <button
                  key={wd.date}
                  onClick={() => setSelectedDate(wd.date)}
                  className={`py-1.5 sm:py-2 rounded-xl text-center flex flex-col items-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
                    isSelected 
                      ? (isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm') 
                      : (isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-50 text-slate-600')
                  }`}
                >
                  <span className="text-[8px] sm:text-[10px] uppercase font-medium">{wd.dayName}</span>
                  <span className="text-xs sm:text-sm font-bold">{wd.dayNum}</span>
                  {wd.appointments.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : (isDark ? 'bg-indigo-400' : 'bg-slate-900')}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CORE VIEWPORT */}
      <AnimatePresence mode="wait">
        {/* TAB 1: DAY SCHEDULE SLOTS */}
        {activeTab === 'day' && (
          <motion.div
            key="day-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-100'} rounded-2xl border shadow-sm overflow-hidden`}
          >
            {!isWorkingDay && dayAppointments.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className={`w-14 h-14 ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-400'} rounded-full flex items-center justify-center mx-auto`}>
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className={`font-display font-semibold ${isDark ? 'text-white' : 'text-slate-800'} text-base`}>Dia de Folga</h3>
                <p className={`${isDark ? 'text-zinc-500' : 'text-slate-500'} text-xs max-w-xs mx-auto`}>
                  Este dia está marcado como não útil nas suas configurações padrão de atendimento.
                </p>
                <button
                  onClick={() => openCreateModal()}
                  className={`${isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-slate-800'} text-white text-xs px-4 py-2 rounded-xl transition-all cursor-pointer font-medium`}
                >
                  Forçar Agendamento mesmo assim (+)
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Draggable Services Row */}
                <div className={`p-3 border-b ${isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-slate-100 bg-slate-50/50'} flex flex-col gap-1.5`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Arraste um serviço para um horário disponível para reservar rapidamente:
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0 snap-x">
                    {services.map(srv => (
                      <div
                        key={srv.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('genda_drag_type', 'service');
                          e.dataTransfer.setData('genda_drag_id', srv.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all shadow-sm select-none flex items-center gap-1.5 shrink-0 snap-center ${
                          isDark 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: srv.color }} />
                        <span>{srv.name}</span>
                        {srv.isPackage && (
                          <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded leading-none uppercase shrink-0 border ${
                            isDark
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            ★ Pacote
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'} max-h-[500px] overflow-y-auto pr-0.5`}>
                {timeSlots.map((slot) => {
                  const booking = getBookingForSlot(slot);
                  const isLunch = isLunchSlot(slot);
                  
                  // If booking exists and is exact start time of booking, we render it
                  const isBookingStart = booking && booking.time === slot;

                  // If booking exists but isn't start time, we hide this row to let the absolute card expand,
                  // or render smaller indicator. Let's make a beautiful simplified view:
                  // For each slot, if booking start, we render booking card. If slot is spanned by booking, we don't render a new free line.
                  if (booking && !isBookingStart) return null;

                  return (
                    <div key={slot} className={`flex min-h-[56px] transition-all ${isDark ? 'hover:bg-zinc-900/10' : 'hover:bg-slate-50/40'}`}>
                      {/* Left Hour Tag */}
                      <div className={`w-14 sm:w-16 shrink-0 border-r ${isDark ? 'border-zinc-800/60' : 'border-slate-100'} py-3 text-center flex items-center justify-center`}>
                        <span className={`font-mono text-xs font-semibold ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>{slot}</span>
                      </div>

                      {/* Right Slot Container */}
                      <div className="flex-1 p-1.5 sm:p-2 flex items-center min-w-0">
                        {booking ? (
                          /* BOOKED CARD */
                          <button
                            onClick={() => handleOpenDetails(booking)}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('genda_drag_type', 'appointment');
                              e.dataTransfer.setData('genda_drag_id', booking.id);
                            }}
                            className="w-full min-w-0 text-left p-2 sm:p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0 transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
                            style={{ 
                              backgroundColor: `${getApptService(booking.serviceId).color}15`,
                              borderColor: getApptService(booking.serviceId).color,
                              color: getApptService(booking.serviceId).color
                            }}
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] uppercase font-mono tracking-wider opacity-90 truncate max-w-[120px] sm:max-w-[200px]">
                                  {getApptService(booking.serviceId).name}
                                </span>
                                {getApptService(booking.serviceId).isPackage && (
                                  <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded leading-none uppercase shrink-0 border ${
                                    isDark
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : 'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}>
                                    ★ Pacote
                                  </span>
                                )}
                              </div>
                              <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-xs truncate`}>
                                {getApptClient(booking.clientId).name}
                              </h4>
                              <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'} font-mono`}>
                                <span className="flex items-center gap-0.5 shrink-0">
                                  <Clock className="w-3 h-3" /> {booking.time} ({booking.duration}m)
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className={`font-bold shrink-0 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                                  R$ {formatPrice(booking.price)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
                              {booking.isRecurring !== 'none' && (
                                <span className={`p-1 rounded ${isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-white text-slate-600 border'} text-[9px] font-mono`}>Recorrente</span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                booking.paymentStatus === 'paid' 
                                  ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800') 
                                  : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800')
                              }`}>
                                {booking.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                              </span>
                            </div>
                          </button>
                        ) : isLunch ? (
                          /* LUNCH BREAK / BLOCKED SLOT */
                          <div className={`w-full min-w-0 py-2 px-2 sm:px-3 ${isDark ? 'bg-zinc-800/30 border-zinc-800 text-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-400'} rounded-xl border border-dashed text-xs flex items-center justify-between gap-2 italic`}>
                            <div className="flex items-center gap-2 min-w-0 truncate">
                              <Briefcase className="w-4 h-4 text-slate-300 animate-pulse shrink-0" />
                              <span className="truncate">Horário de Almoço Reservado</span>
                            </div>
                            <button
                              onClick={() => openCreateModal(slot)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shrink-0"
                            >
                              Reservar
                            </button>
                          </div>
                        ) : getCustomBlock(slot) ? (
                          /* CUSTOM BLOCKED SLOT */
                          <div className={`w-full min-w-0 py-2 px-2 sm:px-3 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-700'} rounded-xl border border-dashed text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="font-medium text-left truncate">{getCustomBlock(slot)?.reason}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                              <button
                                onClick={() => openCreateModal(slot)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shrink-0"
                              >
                                Reservar
                              </button>
                              <button
                                onClick={() => handleUnblockSlot(getCustomBlock(slot)!.id)}
                                className="p-1 rounded-lg hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all cursor-pointer"
                                title="Desbloquear"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* FREE WORK HOUR - BLANK UNTIL HOVER/DRAG */
                          <button
                            onClick={() => openCreateModal(slot)}
                            onContextMenu={(e) => handleRightClickSlot(e, slot)}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDragEnter={() => {
                              setDragOverSlot(slot);
                            }}
                            onDragLeave={() => {
                              setDragOverSlot(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverSlot(null);
                              const dragType = e.dataTransfer.getData('genda_drag_type');
                              const dragId = e.dataTransfer.getData('genda_drag_id');
                              
                              if (!dragId) return;
                              
                              if (dragType === 'appointment') {
                                const appt = appointments.find(a => a.id === dragId);
                                if (appt) {
                                  onUpdateAppointment({
                                    ...appt,
                                    time: slot,
                                    date: selectedDate,
                                  });
                                  triggerAlert(`Agendamento de ${getApptClient(appt.clientId).name} reagendado para ${slot}!`, 'success');
                                }
                              } else if (dragType === 'service') {
                                openCreateModal(slot);
                                setFormServiceId(dragId);
                                const service = services.find(s => s.id === dragId);
                                if (service) {
                                  setFormDuration(service.duration);
                                  setFormPrice(service.price);
                                }
                              }
                            }}
                            className={`w-full py-2.5 text-left border rounded-xl px-3 transition-all flex items-center justify-between group cursor-pointer ${
                              dragOverSlot === slot
                                ? (isDark ? 'border-indigo-500 bg-indigo-500/10' : 'border-indigo-500 bg-indigo-50/20')
                                : (isDark ? 'border-transparent hover:border-zinc-800/40' : 'border-transparent hover:border-slate-100')
                            }`}
                          >
                            <span></span>
                            <span className={`opacity-0 group-hover:opacity-100 ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-slate-100 text-slate-700'} px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all`}>
                              <Plus className="w-3 h-3" /> Reservar
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: WEEK PREVIEW GRID */}
        {activeTab === 'week' && (
          <motion.div
            key="week-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {weekDays.map((wd) => {
              const isToday = wd.date === getTodayStr();
              return (
                <div 
                  key={wd.date}
                  className={`bg-white rounded-xl border p-3.5 transition-all flex flex-col md:flex-row gap-3 md:items-center justify-between ${
                    isToday ? 'border-indigo-500/60 ring-1 ring-indigo-500/10' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-display ${
                      isToday ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                    }`}>
                      <span className="text-[9px] uppercase font-semibold">{wd.dayName}</span>
                      <span className="text-base font-extrabold">{wd.dayNum}</span>
                    </div>

                    <div className="text-left">
                      <h3 className="text-xs font-semibold text-slate-900">
                        {wd.appointments.length === 0 ? 'Nenhum agendamento' : `${wd.appointments.length} agendamentos`}
                      </h3>
                      <button
                        onClick={() => setSelectedDate(wd.date)}
                        className="text-[10px] text-indigo-500 hover:underline cursor-pointer"
                      >
                        Ver agenda do dia
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 items-center">
                    {wd.appointments.length > 0 ? (
                      wd.appointments.map((appt) => {
                        const s = getApptService(appt.serviceId);
                        const c = getApptClient(appt.clientId);
                        return (
                          <button
                            key={appt.id}
                            onClick={() => handleOpenDetails(appt)}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                            style={{ backgroundColor: `${s.color}08`, borderColor: s.color, color: s.color }}
                          >
                            {s.isPackage && <span className="text-amber-500 text-[9px] font-extrabold shrink-0">★</span>}
                            <span className="font-mono">{appt.time}</span>
                            <span>-</span>
                            <span className="max-w-[80px] truncate text-slate-800">{c.name.split(' ')[0]}</span>
                          </button>
                        );
                      })
                    ) : (
                      <button
                        onClick={() => { setSelectedDate(wd.date); openCreateModal(); }}
                        className="text-[10px] text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/50 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Agendar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* TAB 3: MONTHLY MINI-CALENDAR GRID */}
        {activeTab === 'month' && (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4"
          >
            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-display font-semibold text-xs text-slate-400">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(h => (
                <div key={h} className="py-1">{h}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {monthDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
                const isSelected = day.date === selectedDate;
                const isToday = day.date === getTodayStr();

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'bg-slate-900 text-white font-bold shadow-md' 
                        : isToday 
                        ? 'border border-indigo-500 bg-indigo-50/30 text-indigo-600 font-semibold' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{day.day}</span>
                    {day.hasAppointments && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Selecione uma data acima para visualizar, editar ou criar compromissos.</span>
              <button
                onClick={() => openCreateModal()}
                className="bg-slate-900 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agendar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOAT BUTTON FOR QUICK BOOKING */}
      <div className="fixed bottom-20 right-6 z-30">
        <button
          onClick={() => openCreateModal()}
          className="w-14 h-14 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Novo Agendamento"
          id="btn-quick-schedule"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* MODAL 3.2 — CRIAR NOVO AGENDAMENTO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-bold text-base">
                  {formAppointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formDate} às {formTime}
                </span>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAppointment} className="p-5 space-y-4 text-xs text-slate-700">
              
              {/* Select Client with quick add */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">Cliente *</label>
                  <button
                    type="button"
                    onClick={() => setShowFastClientModal(true)}
                    className="text-indigo-500 hover:underline font-bold text-[10px] cursor-pointer"
                  >
                    + Novo Cliente Rápido
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-slate-800 transition-all appearance-none"
                    required
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone}</option>
                    ))}
                  </select>
                </div>

                {/* TEXTO INFORMATIVO DE PREFERÊNCIAS DO CLIENTE */}
                {formClientId && (() => {
                  const client = clients.find(c => c.id === formClientId);
                  if (client) {
                    return (
                      <div className={`mt-2 p-2.5 border rounded-xl text-[11px] animate-fade-in space-y-1 ${
                        isDark
                          ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200'
                          : 'bg-indigo-50/50 border-indigo-100 text-slate-600'
                      }`}>
                        <div className={`flex items-center gap-1 font-bold ${
                          isDark ? 'text-indigo-300' : 'text-indigo-700'
                        }`}>
                          <span>💡 Preferências & Notas do Cliente:</span>
                        </div>
                        <p className={`italic ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {client.notes || 'Nenhuma preferência específica anotada ainda. Adicione notas na ficha de clientes para exibi-las aqui.'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Select Service */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Serviço *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <select
                    value={formServiceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-slate-800 transition-all appearance-none"
                    required
                  >
                    <option value="">-- Selecione o Serviço --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (R$ {formatPrice(s.price)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Data</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Horário</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Overrides: Duration & Price */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-medium text-slate-500 mb-1">Duração (minutos)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-center font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-500 mb-1">Preço Cobrado (R$)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-center font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Recurrence & Lembrete 24h & Payment Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Recorrência</label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as RecurrenceType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none appearance-none"
                  >
                    <option value="none">Não recorrente</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5 pl-2">
                  <input
                    type="checkbox"
                    id="reminder-check"
                    checked={formReminder}
                    onChange={(e) => setFormReminder(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="reminder-check" className="font-semibold text-slate-700 select-none flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-indigo-500" />
                    Lembrete 24h?
                  </label>
                </div>
              </div>

              {/* Payment details */}
              <div className="border-t border-slate-100 pt-3.5">
                <label className="block font-semibold text-slate-700 mb-1.5">Status de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pending', 'paid'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormPaymentStatus(status)}
                      className={`py-1.5 rounded-lg text-center font-medium border cursor-pointer transition-all ${
                        formPaymentStatus === status
                          ? status === 'paid'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      {status === 'paid' ? 'Pago' : 'Pendente'}
                    </button>
                  ))}
                  <button
                    key="installments"
                    type="button"
                    onClick={() => setFormPaymentStatus('installments')}
                    className={`py-1.5 rounded-lg text-center font-medium border cursor-pointer transition-all ${
                      formPaymentStatus === 'installments'
                        ? 'bg-purple-50 border-purple-500 text-purple-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    Parcelado
                  </button>
                </div>

                {formPaymentStatus === 'paid' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Método de Recebimento</label>
                      <select
                        value={formPaymentMethod}
                        onChange={(e) => setFormPaymentMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                      >
                        <option value="pix">PIX</option>
                        <option value="money">Dinheiro</option>
                        <option value="credit">Cartão de Crédito</option>
                        <option value="debit">Cartão de Débito</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-white cursor-pointer text-center"
                >
                  {formAppointmentId ? 'Salvar Edição' : 'Reservar Horário'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FAST NEW CLIENT INNER MODAL */}
      {showFastClientModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Cadastro Rápido de Cliente
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={fastClientName}
                  onChange={(e) => setFastClientName(e.target.value)}
                  placeholder="Ex: José da Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Telefone WhatsApp</label>
                <div className="flex gap-2">
                  <div className="w-20 shrink-0 relative">
                    <input
                      type="text"
                      list="schedule-country-codes"
                      value={fastClientCountryCode}
                      onChange={(e) => setFastClientCountryCode(e.target.value)}
                      placeholder="+55"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none text-center font-medium"
                    />
                    <datalist id="schedule-country-codes">
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
                    value={fastClientPhone}
                    onChange={(e) => setFastClientPhone(formatPhone(e.target.value))}
                    placeholder="Ex: (11) 98888-8888"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFastClientModal(false)}
                className="flex-1 py-1.5 rounded-lg border text-slate-500 text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleSaveFastClient}
                className="flex-1 py-1.5 rounded-lg bg-slate-900 text-white text-xs cursor-pointer"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3.3 — DETALHES DO AGENDAMENTO */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl transition-all ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-100'
          }`}>
            {/* Header with service color top line */}
            <div 
              className="h-2 w-full" 
              style={{ backgroundColor: getApptService(selectedAppointment.serviceId).color }} 
            />
            
            <div className={`p-5 space-y-4 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      {getApptService(selectedAppointment.serviceId).name}
                    </span>
                    {getApptService(selectedAppointment.serviceId).isPackage && (
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[8px] font-extrabold px-1 py-0.2 rounded leading-none uppercase shrink-0">
                        ★ Pacote
                      </span>
                    )}
                  </div>
                  <h3 className={`font-display font-extrabold text-lg ${isDark ? 'text-zinc-100' : 'text-slate-950'}`}>
                    {getApptClient(selectedAppointment.clientId).name}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className={`p-1 rounded-lg transition-all cursor-pointer ${
                    isDark ? 'hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details Body */}
              <div className={`rounded-xl p-4 border space-y-3.5 ${
                isDark ? 'bg-zinc-900/40 border-zinc-900' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">Data & Hora</span>
                    <p className={`font-bold flex items-center gap-1 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                      <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`} />
                      {selectedAppointment.date.split('-').reverse().join('/')}
                    </p>
                    <p className={`font-mono pl-4.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{selectedAppointment.time} ({selectedAppointment.duration} min)</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">Valor Cobrado</span>
                    <p className={`font-bold text-base flex items-center ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      R$ {formatPrice(selectedAppointment.price)}
                    </p>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-3 pt-2.5 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200/50'}`}>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">Fidelidade</span>
                    <p className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                      {selectedAppointment.isRecurring === 'none' 
                        ? 'Sessão Única' 
                        : selectedAppointment.isRecurring === 'weekly'
                        ? 'Semanal'
                        : selectedAppointment.isRecurring === 'biweekly'
                        ? 'Quinzenal'
                        : 'Mensal'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">Status de Pagamento</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        selectedAppointment.paymentStatus === 'paid'
                          ? (isDark ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-100 text-emerald-800')
                          : selectedAppointment.paymentStatus === 'installments'
                          ? (isDark ? 'bg-purple-950/40 text-purple-300' : 'bg-purple-100 text-purple-800')
                          : (isDark ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-100 text-amber-800')
                      }`}>
                        {selectedAppointment.paymentStatus === 'paid' 
                          ? 'Confirmado (Pago)' 
                          : selectedAppointment.paymentStatus === 'installments'
                          ? 'Parcelado'
                          : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Quick Contact */}
                <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-zinc-800' : 'border-slate-200/50'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{getApptClient(selectedAppointment.clientId).phone}</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      onViewClient(selectedAppointment.clientId);
                    }}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Ver Ficha Completa →
                  </button>
                </div>
              </div>

              {/* Send Quick Reminder Templates */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Enviar Mensagem por WhatsApp
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleShareReminder('reminder')}
                    className={`p-2 border rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isDark 
                        ? 'border-zinc-800 bg-zinc-900/20 hover:bg-indigo-950/20 hover:border-indigo-800' 
                        : 'border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <span className={`font-bold block ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Lembrete 24h</span>
                      <span className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Confirmar dia anterior</span>
                    </div>
                    <Send className={`w-3.5 h-3.5 transition-all ${isDark ? 'text-zinc-600 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  </button>

                  <button
                    onClick={() => handleShareReminder('thanks')}
                    className={`p-2 border rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isDark 
                        ? 'border-zinc-800 bg-zinc-900/20 hover:bg-emerald-950/20 hover:border-emerald-800' 
                        : 'border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    <div>
                      <span className={`font-bold block ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Pós-Atendimento</span>
                      <span className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Agradecer fidelidade</span>
                    </div>
                    <CheckCircle2 className={`w-3.5 h-3.5 transition-all ${isDark ? 'text-zinc-600 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                  </button>
                </div>
              </div>

              {/* Actions Footer row */}
              <div className={`border-t pt-4 flex flex-col gap-2 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                
                {/* Mark as Completed Button with Payment Method Selection */}
                {selectedAppointment.status === 'scheduled' && (
                  <div className="space-y-3">
                    {showPaymentMethodSelector ? (
                      <div className={`p-3 border rounded-xl space-y-2 transition-all ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}>
                          Forma de Pagamento
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'pix', label: 'PIX' },
                            { id: 'money', label: 'Dinheiro' },
                            { id: 'credit', label: 'C. Crédito' },
                            { id: 'debit', label: 'C. Débito' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setCompletedPaymentMethod(opt.id)}
                              className={`py-1.5 rounded-lg border text-xs font-bold text-center cursor-pointer transition-all ${
                                completedPaymentMethod === opt.id
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                  : isDark 
                                    ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowPaymentMethodSelector(false)}
                            className={`flex-1 py-2 rounded-lg border font-semibold cursor-pointer text-[10px] text-center transition-all ${
                              isDark 
                                ? 'border-zinc-850 hover:bg-zinc-800 text-zinc-400' 
                                : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                            }`}
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmMarkAsCompleted}
                            className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer text-[10px] text-center shadow-sm flex items-center justify-center gap-1 transition-all"
                          >
                            <Check className="w-3 h-3" />
                            Confirmar e Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleMarkAsCompleted}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Marcar como Atendido & Pago
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(selectedAppointment)}
                    className={`flex-1 py-2 border rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isDark 
                        ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Reagendar / Editar
                  </button>

                  <button
                    onClick={handleCancelAppointment}
                    className={`flex-1 py-2 border rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isDark 
                        ? 'border-red-900/40 hover:bg-red-950/20 text-red-400' 
                        : 'border-red-200 hover:bg-red-50 text-red-600'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancelar Sessão
                  </button>
                </div>
              </div>

            </div>
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

      {/* APPOINTMENT CANCEL CONFIRMATION MODAL */}
      <AnimatePresence>
        {showCancelConfirm && selectedAppointment && (
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
                <h4 className="font-display font-bold text-base text-slate-950">Cancelar Agendamento?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tem certeza que deseja cancelar a sessão de <strong>{getApptClient(selectedAppointment.clientId).name}</strong> para <strong>{getApptService(selectedAppointment.serviceId).name}</strong>?
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Manter Atendimento
                </button>
                <button
                  onClick={() => {
                    const updated: Appointment = {
                      ...selectedAppointment,
                      status: 'cancelled',
                    };
                    onUpdateAppointment(updated);
                    setShowDetailsModal(false);
                    setShowCancelConfirm(false);
                    triggerAlert('Agendamento cancelado com sucesso!', 'success');
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONTEXT MENU FOR BLOCKING TIMES */}
      {contextMenu && (
        <div 
          className={`fixed z-[90] py-1 rounded-xl border shadow-2xl overflow-hidden min-w-[180px] ${
            isDark 
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              setBlockingModalSlot(contextMenu.slot);
              setBlockReason('');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Bloquear Horário ({contextMenu.slot})
          </button>
        </div>
      )}

      {/* MODAL FOR WRITE REASON FOR BLOCK */}
      <AnimatePresence>
        {blockingModalSlot && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl text-left space-y-4 ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-850 text-white' 
                  : 'bg-white border-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-sm flex items-center gap-2 text-indigo-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Bloquear Horário • {blockingModalSlot}
                </h4>
                <button 
                  onClick={() => setBlockingModalSlot(null)}
                  className="p-1 rounded-lg hover:bg-slate-500/10 transition-all text-slate-400 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Escreva o motivo do bloqueio:
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ex: Manutenção da barbearia / Aula particular"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                    }`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newBlock: BlockedSlot = {
                          id: 'block_' + Date.now(),
                          date: selectedDate,
                          time: blockingModalSlot,
                          reason: blockReason.trim() || 'Bloqueado',
                        };
                        setBlockedSlots(prev => [...prev, newBlock]);
                        setBlockingModalSlot(null);
                        setBlockReason('');
                        triggerAlert('Horário bloqueado com sucesso!', 'success');
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => setBlockingModalSlot(null)}
                    className={`flex-1 py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isDark 
                        ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900' 
                        : 'border-slate-250 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const newBlock: BlockedSlot = {
                        id: 'block_' + Date.now(),
                        date: selectedDate,
                        time: blockingModalSlot,
                        reason: blockReason.trim() || 'Bloqueado',
                      };
                      setBlockedSlots(prev => [...prev, newBlock]);
                      setBlockingModalSlot(null);
                      setBlockReason('');
                      triggerAlert('Horário bloqueado com sucesso!', 'success');
                    }}
                    className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm"
                  >
                    Bloquear
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
