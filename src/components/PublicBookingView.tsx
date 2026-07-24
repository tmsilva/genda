import React, { useState, useMemo } from 'react';
import { 
  Globe, Calendar as CalendarIcon, Clock, User, CheckCircle2, ChevronRight, 
  ArrowLeft, Phone, MapPin, Instagram, Sparkles, AlertCircle, Heart, 
  Gift, Check, ShieldCheck, QrCode, Share2, Plus, Zap, ExternalLink, RefreshCw
} from 'lucide-react';
import { OnlineBookingConfig, Service, Appointment, Client, WorkingDay } from '../types';
import { formatPrice } from '../utils';
import dayjs from 'dayjs';

interface PublicBookingViewProps {
  config: OnlineBookingConfig;
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  workingDays: WorkingDay[];
  onAddAppointment: (newAppt: Appointment) => void;
  onClose?: () => void;
  isEmbedMode?: boolean;
}

export const PublicBookingView: React.FC<PublicBookingViewProps> = ({
  config,
  services,
  appointments,
  clients,
  workingDays,
  onAddAppointment,
  onClose,
  isEmbedMode = false,
}) => {
  // Stepper State: 1 = Service, 2 = Staff, 3 = Date & Time, 4 = Client Info, 5 = Confirmation, 6 = Success
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('any'); // 'any' or staff ID
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().add(1, 'day').format('YYYY-MM-DD')
  );
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Client Info Form
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [acceptedLgpd, setAcceptedLgpd] = useState<boolean>(true);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Favorites / Returning Client Lookup
  const [lookupPhone, setLookupPhone] = useState<string>('');
  const [returningClientMessage, setReturningClientMessage] = useState<string>('');

  // Filter Enabled Services
  const enabledServices = useMemo(() => {
    if (!config.enabledServiceIds || config.enabledServiceIds.length === 0) {
      return services;
    }
    return services.filter(s => config.enabledServiceIds.includes(s.id));
  }, [services, config.enabledServiceIds]);

  // Total Duration & Total Price
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.duration, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  // Handle Phone Auto Lookup in Step 4
  const handlePhoneChange = (val: string) => {
    setClientPhone(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 10) {
      const match = clients.find(c => c.phone.replace(/\D/g, '') === clean);
      if (match) {
        setClientName(match.name);
        if (match.email) setClientEmail(match.email);
      }
    }
  };

  // Cross-sell Service Recommendation
  const crossSellService = useMemo(() => {
    if (!config.crossSellEnabled || selectedServices.length === 0) return null;
    const firstSelectedId = selectedServices[0].id;
    // Find a service not yet selected
    return enabledServices.find(s => !selectedServices.some(sel => sel.id === s.id));
  }, [config.crossSellEnabled, selectedServices, enabledServices]);

  // Available Time Slots Calculation for Selected Date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || selectedServices.length === 0) return [];

    // Check if selected date is in blocked dates
    const isBlocked = (config.blockedDates || []).some(b => b.date === selectedDate);
    if (isBlocked) return [];

    const dateObj = dayjs(selectedDate);
    const dayOfWeek = dateObj.day(); // 0 = Sunday, 1 = Monday ...

    const dayConfig = workingDays.find(w => w.dayOfWeek === dayOfWeek);
    if (!dayConfig || !dayConfig.isWorking) return [];

    // Parse working hours
    const [startH, startM] = dayConfig.startTime.split(':').map(Number);
    const [endH, endM] = dayConfig.endTime.split(':').map(Number);

    let lunchStartMins = -1;
    let lunchEndMins = -1;
    if (dayConfig.lunchStart && dayConfig.lunchEnd) {
      const [lsh, lsm] = dayConfig.lunchStart.split(':').map(Number);
      const [leh, lem] = dayConfig.lunchEnd.split(':').map(Number);
      lunchStartMins = lsh * 60 + lsm;
      lunchEndMins = leh * 60 + lem;
    }

    const startTotalMins = startH * 60 + startM;
    const endTotalMins = endH * 60 + endM;
    const interval = config.slotIntervalMinutes || 30;

    // Existing appointments on selected date
    const dateAppts = appointments.filter(a => a.date === selectedDate && a.status !== 'cancelled');

    const slots: { time: string; isSmart: boolean }[] = [];

    for (let current = startTotalMins; current + totalDuration <= endTotalMins; current += interval) {
      const slotStart = current;
      const slotEnd = current + totalDuration;

      // Check lunch overlap
      if (lunchStartMins >= 0 && lunchEndMins >= 0) {
        if (slotStart < lunchEndMins && slotEnd > lunchStartMins) {
          continue; // overlaps lunch
        }
      }

      // Format time string HH:MM
      const hour = Math.floor(slotStart / 60);
      const min = slotStart % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      // Check conflict with existing appointments
      let hasConflict = false;
      let isAdjacentToExisting = false;

      for (const appt of dateAppts) {
        const [aStartH, aStartM] = appt.time.split(':').map(Number);
        const aStartMins = aStartH * 60 + aStartM;
        const aEndMins = aStartMins + appt.duration;

        // Overlap test
        if (slotStart < aEndMins && slotEnd > aStartMins) {
          hasConflict = true;
          break;
        }

        // Smart slot detection: slot directly before or after an existing appointment
        if (slotStart === aEndMins || slotEnd === aStartMins) {
          isAdjacentToExisting = true;
        }
      }

      if (!hasConflict) {
        slots.push({
          time: timeStr,
          isSmart: config.smartSlotsEnabled && isAdjacentToExisting
        });
      }
    }

    return slots;
  }, [selectedDate, selectedServices, totalDuration, workingDays, appointments, config]);

  // Handle Submit Booking
  const handleConfirmBooking = () => {
    if (!clientName.trim() || !clientPhone.trim() || !selectedDate || !selectedTime) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Identify or create client ID
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const existingClient = clients.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
    const clientId = existingClient ? existingClient.id : 'c_online_' + Date.now();

    const newAppointment: Appointment = {
      id: 'online_' + Date.now(),
      clientId: clientId,
      serviceId: selectedServices[0]?.id || 's1',
      date: selectedDate,
      time: selectedTime,
      duration: totalDuration,
      price: totalPrice,
      isRecurring: 'none',
      isReminderEnabled: true,
      paymentStatus: config.paymentMode === 'none' ? 'pending' : 'paid',
      paymentMethod: config.paymentMode === 'none' ? 'money' : 'pix',
      status: 'scheduled',
      source: 'online'
    };

    onAddAppointment(newAppointment);
    setCreatedAppointment(newAppointment);
    setStep(6); // Success Step
  };

  // Google Calendar Link Generator
  const getGoogleCalendarUrl = () => {
    if (!selectedDate || !selectedTime || selectedServices.length === 0) return '#';
    const title = encodeURIComponent(`${config.title || 'Agendamento'} - ${selectedServices.map(s => s.name).join(', ')}`);
    const details = encodeURIComponent(`Agendamento Online no ${config.title}.\nEndereço: ${config.address || 'Local do Atendimento'}`);

    const [startH, startM] = selectedTime.split(':').map(Number);
    const startDateObj = dayjs(selectedDate).hour(startH).minute(startM);
    const endDateObj = startDateObj.add(totalDuration, 'minute');

    const startIso = startDateObj.format('YYYYMMDDTHHmmss');
    const endIso = endDateObj.format('YYYYMMDDTHHmmss');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${encodeURIComponent(config.address || '')}`;
  };

  // ICS Download Generator for Apple Calendar
  const handleDownloadIcs = () => {
    if (!selectedDate || !selectedTime) return;
    const [startH, startM] = selectedTime.split(':').map(Number);
    const startDateObj = dayjs(selectedDate).hour(startH).minute(startM);
    const endDateObj = startDateObj.add(totalDuration, 'minute');

    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Genda//Agendamento Online//PT
BEGIN:VEVENT
SUMMARY:${config.title} - ${selectedServices.map(s => s.name).join(', ')}
DESCRIPTION:Agendamento Online realizado via Genda.
DTSTART:${startDateObj.format('YYYYMMDDTHHmmss')}
DTEND:${endDateObj.format('YYYYMMDDTHHmmss')}
LOCATION:${config.address || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `agendamento_${selectedDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Message Link Generator
  const getWhatsAppUrl = () => {
    const rawNumber = (config.whatsapp || '11987654321').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá! Realizei o agendamento online de *${selectedServices.map(s => s.name).join(', ')}* para o dia *${dayjs(selectedDate).format('DD/MM/YYYY')}* às *${selectedTime}*.`
    );
    return `https://wa.me/55${rawNumber}?text=${text}`;
  };

  return (
    <div className={`min-h-screen ${isEmbedMode ? 'bg-transparent' : 'bg-slate-900 text-slate-100'} font-sans pb-16`}>
      {/* TOP CONTAINER / COVER BANNER */}
      <div className="relative max-w-2xl mx-auto bg-slate-950 rounded-b-3xl overflow-hidden shadow-2xl border-b border-slate-800">
        <div className="h-40 sm:h-48 w-full relative">
          <img
            src={config.coverImageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80'}
            alt="Capa do Estabelecimento"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-bold border border-slate-700 hover:bg-slate-800 cursor-pointer backdrop-blur-md"
            >
              ✕ Fechar Preview
            </button>
          )}
        </div>

        {/* PROFILE INFO HEADER */}
        <div className="px-5 pb-5 -mt-12 relative z-10 flex flex-col items-center text-center">
          <img
            src={config.avatarUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80'}
            alt={config.title}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-950 object-cover shadow-xl"
          />

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{config.title || 'Genda Barbershop'}</h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                ★ 4.9 (128)
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto line-clamp-2">
              {config.description || 'Agende seu horário com os melhores profissionais.'}
            </p>

            <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-slate-400">
              {config.address && (
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {config.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STEPPER PROGRESS BAR (Only if step < 6) */}
        {step < 6 && (
          <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-around text-[10px] sm:text-xs font-bold">
            <button
              onClick={() => step > 1 && setStep(1)}
              className={`flex items-center gap-1 transition-colors ${step === 1 ? 'text-indigo-400 font-extrabold' : step > 1 ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-indigo-600 text-white' : step > 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>1</span>
              <span>Serviços</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />

            <button
              onClick={() => step > 2 && setStep(2)}
              className={`flex items-center gap-1 transition-colors ${step === 2 ? 'text-indigo-400 font-extrabold' : step > 2 ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-indigo-600 text-white' : step > 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>2</span>
              <span>Profissional</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />

            <button
              onClick={() => step > 3 && setStep(3)}
              className={`flex items-center gap-1 transition-colors ${step === 3 ? 'text-indigo-400 font-extrabold' : step > 3 ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-indigo-600 text-white' : step > 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>3</span>
              <span>Data & Hora</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-600" />

            <button
              onClick={() => step > 4 && setStep(4)}
              className={`flex items-center gap-1 transition-colors ${step === 4 ? 'text-indigo-400 font-extrabold' : step > 4 ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-indigo-600 text-white' : step > 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>4</span>
              <span>Dados</span>
            </button>
          </div>
        )}
      </div>

      {/* MAIN STEP CONTENT AREA */}
      <div className="max-w-2xl mx-auto mt-4 px-4">
        {/* STEP 1: SERVIÇOS */}
        {step === 1 && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Escolha os Serviços Desejados
                </h2>
                <p className="text-xs text-slate-400">Selecione um ou mais serviços para o seu atendimento.</p>
              </div>

              {selectedServices.length > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {selectedServices.length} selecionado(s)
                </span>
              )}
            </div>

            {/* Returning Client Quick Rebook Banner */}
            {config.favoritesEnabled && (
              <div className="p-3.5 rounded-xl border bg-indigo-950/30 border-indigo-800/40 space-y-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Já é cliente? Remarque com 1 clique!
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite seu WhatsApp (ex: 11987654321)"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = lookupPhone.replace(/\D/g, '');
                      const client = clients.find(c => c.phone.replace(/\D/g, '') === clean);
                      if (client) {
                        // Find recent appointment for client
                        const last = appointments.find(a => a.clientId === client.id);
                        if (last) {
                          const s = services.find(srv => srv.id === last.serviceId);
                          if (s) {
                            setSelectedServices([s]);
                            setClientName(client.name);
                            setClientPhone(client.phone);
                            setClientEmail(client.email || '');
                            setReturningClientMessage(`Olá ${client.name}! Carregamos seu serviço habitual: ${s.name}.`);
                            return;
                          }
                        }
                      }
                      setReturningClientMessage('Nenhum agendamento anterior encontrado para este número.');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shrink-0"
                  >
                    Buscar
                  </button>
                </div>

                {returningClientMessage && (
                  <p className="text-[11px] text-amber-300 font-medium">{returningClientMessage}</p>
                )}
              </div>
            )}

            {/* Service List */}
            <div className="space-y-2.5">
              {enabledServices.map(s => {
                const isSelected = selectedServices.some(sel => sel.id === s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedServices(selectedServices.filter(sel => sel.id !== s.id));
                      } else {
                        setSelectedServices([...selectedServices, s]);
                      }
                    }}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="font-extrabold text-sm block">{s.name}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {s.duration} min
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{formatPrice(s.price)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Cross-Sell Suggestion */}
            {crossSellService && selectedServices.length > 0 && (
              <div className="p-3.5 rounded-xl border bg-amber-950/20 border-amber-800/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-300 block flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-400" /> Sugestão Especial: {crossSellService.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Geralmente agendado junto (+{crossSellService.duration} min | +{formatPrice(crossSellService.price)}).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedServices([...selectedServices, crossSellService])}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg shrink-0"
                >
                  + Adicionar
                </button>
              </div>
            )}

            {/* Next Step Button */}
            <button
              disabled={selectedServices.length === 0}
              onClick={() => setStep(2)}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedServices.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Avançar para Profissionais ({formatPrice(totalPrice)})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PROFISSIONAL */}
        {step === 2 && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-indigo-400 font-bold flex items-center gap-1 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <h2 className="text-base font-extrabold text-white">Escolha o Profissional</h2>
            </div>

            <div className="space-y-2.5">
              {/* Option: Any Available */}
              <div
                onClick={() => setSelectedStaff('any')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedStaff === 'any'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 font-extrabold flex items-center justify-center text-sm">
                    ★
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Qualquer Profissional Disponível</span>
                    <span className="text-[10px] text-slate-400 block">Encontra o melhor horário mais rápido para você.</span>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedStaff === 'any' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                }`}>
                  {selectedStaff === 'any' && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Specific Staff Members */}
              {(config.staffMembers || []).map(staff => (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedStaff === staff.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {staff.avatarUrl ? (
                      <img src={staff.avatarUrl} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm">
                        {staff.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-sm block">{staff.name}</span>
                      <span className="text-[10px] text-slate-400 block">{staff.role}</span>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedStaff === staff.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                  }`}>
                    {selectedStaff === staff.id && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Avançar para Data e Horário</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: DATA & HORÁRIO */}
        {step === 3 && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-indigo-400 font-bold flex items-center gap-1 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <h2 className="text-base font-extrabold text-white">Selecione Data e Horário</h2>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Data do Atendimento</label>
              <input
                type="date"
                min={dayjs().format('YYYY-MM-DD')}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Time Slot Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Horários Livres ({dayjs(selectedDate).format('DD/MM/YYYY')})
                </span>
                {config.smartSlotsEnabled && (
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Horários Recomendados
                  </span>
                )}
              </div>

              {availableTimeSlots.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 text-center text-xs text-slate-400 space-y-1">
                  <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
                  <p className="font-bold text-slate-300">Sem horários disponíveis para esta data.</p>
                  <p>Escolha outro dia ou entre em contato via WhatsApp.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableTimeSlots.map(slot => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-2.5 rounded-xl border text-center font-mono text-xs font-bold transition-all relative cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30 scale-105'
                            : slot.isSmart
                            ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 hover:bg-amber-900/40'
                            : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {slot.isSmart && !isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                        )}
                        <span>{slot.time}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              disabled={!selectedTime}
              onClick={() => setStep(4)}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedTime
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Avançar para Seus Dados ({selectedTime})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: SEUS DADOS */}
        {step === 4 && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(3)}
                className="text-xs text-indigo-400 font-bold flex items-center gap-1 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <h2 className="text-base font-extrabold text-white">Seus Dados de Contato</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp / Celular *</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail (Opcional)</label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Alguma preferência ou instrução..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lgpd"
                  checked={acceptedLgpd}
                  onChange={(e) => setAcceptedLgpd(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="lgpd" className="text-[11px] text-slate-400 select-none">
                  Concordo com os termos de agendamento e política de confirmação via WhatsApp (LGPD).
                </label>
              </div>
            </div>

            <button
              disabled={!clientName.trim() || !clientPhone.trim() || !acceptedLgpd}
              onClick={() => setStep(5)}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                clientName.trim() && clientPhone.trim() && acceptedLgpd
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Revisar e Confirmar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 5: RESUMO & CONFIRMAÇÃO */}
        {step === 5 && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(4)}
                className="text-xs text-indigo-400 font-bold flex items-center gap-1 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
              <h2 className="text-base font-extrabold text-white">Resumo do Agendamento</h2>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3 font-sans">
              <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Serviço(s)</span>
                  <span className="font-extrabold text-white text-sm">
                    {selectedServices.map(s => s.name).join(' + ')}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-base">{formatPrice(totalPrice)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Data</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {dayjs(selectedDate).format('DD/MM/YYYY')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Horário</span>
                  <span className="font-bold text-slate-200 font-mono">{selectedTime}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Duração Estimada</span>
                  <span className="font-bold text-slate-200">{totalDuration} minutos</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Cliente</span>
                  <span className="font-bold text-slate-200 truncate block">{clientName}</span>
                </div>
              </div>
            </div>

            {/* Deposit PIX info if required */}
            {config.paymentMode === 'deposit' && (
              <div className="p-3.5 rounded-xl border bg-emerald-950/20 border-emerald-800/40 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-300 block">Sinal Obrigatorio via PIX (50%)</span>
                <span className="text-xs font-mono font-bold text-emerald-400 text-base block">
                  {formatPrice(totalPrice * 0.5)}
                </span>
                <p className="text-[10px] text-slate-400">
                  O horário será confirmado assim que o pagamento do sinal for realizado.
                </p>
              </div>
            )}

            <button
              onClick={handleConfirmBooking}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar Agendamento</span>
            </button>
          </div>
        )}

        {/* STEP 6: SUCESSO / CONFIRMADO */}
        {step === 6 && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white">Seu horário foi reservado!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Uma confirmação e lembretes serão enviados para o WhatsApp <strong className="text-white font-mono">{clientPhone}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1.5 text-xs">
              <span className="font-extrabold text-indigo-400 block">
                {selectedServices.map(s => s.name).join(' + ')}
              </span>
              <p className="text-slate-300 font-mono">
                📅 {dayjs(selectedDate).format('DD/MM/YYYY')} às {selectedTime}
              </p>
              <p className="text-slate-400">📍 {config.address}</p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all block"
              >
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                <span>Adicionar ao Google Calendar</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>🍏 Adicionar ao Apple Calendar (.ics)</span>
              </button>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all block"
              >
                <Phone className="w-4 h-4" />
                <span>Enviar Mensagem no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedServices([]);
                  setSelectedTime('');
                }}
                className="w-full py-2.5 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Fazer Novo Agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
