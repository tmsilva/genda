import { now, parseDate, getTodayStr, formatDatePtBR } from '../dateUtils';
import dayjs from 'dayjs';
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, Users, DollarSign, Clipboard, Plus, TrendingUp, 
  AlertTriangle, ArrowRight, CheckCircle, Clock, Package, 
  MessageSquare, Briefcase, Zap, Bell, ChevronRight, Sparkles, UserCheck
} from 'lucide-react';
import { Appointment, Client, Service, StockItem, ProfessionalProfile } from '../types';
import { formatPrice } from '../utils';

interface DashboardViewProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  stock: StockItem[];
  profile: ProfessionalProfile;
  isDark: boolean;
  onNavigateToTab: (tab: 'agenda' | 'clients' | 'services' | 'finance' | 'estoque' | 'ai' | 'settings') => void;
  onTriggerNewAppointment: () => void;
  onTriggerNewClient: () => void;
  onTriggerNewService: () => void;
}

export default function DashboardView({
  appointments,
  clients,
  services,
  stock,
  profile,
  isDark,
  onNavigateToTab,
  onTriggerNewAppointment,
  onTriggerNewClient,
  onTriggerNewService,
}: DashboardViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Today Date String Context (safely local)
  const todayStr = useMemo(() => {
    const currentDate = now();
    return currentDate.year() + '-' + 
      String(currentDate.month() + 1).padStart(2, '0') + '-' + 
      String(currentDate.date()).padStart(2, '0');
  }, []);

  const currentMonthStr = useMemo(() => {
    const currentDate = now();
    return currentDate.year() + '-' + String(currentDate.month() + 1).padStart(2, '0');
  }, []);

  // --- Today's Calculations ---
  const todayAppointments = useMemo(() => {
    return appointments.filter(appt => appt.date === todayStr);
  }, [appointments, todayStr]);

  const todayMetrics = useMemo(() => {
    const activeToday = todayAppointments.filter(appt => appt.status !== 'cancelled');
    const completedToday = todayAppointments.filter(appt => appt.status === 'completed');
    
    // Sum of confirmed and total revenues
    const confirmedRevenue = completedToday.reduce((sum, appt) => sum + (appt.price || 0), 0);
    const totalExpectedRevenue = activeToday.reduce((sum, appt) => sum + (appt.price || 0), 0);
    const clientsAttended = completedToday.length;

    return {
      total: todayAppointments.length,
      activeCount: activeToday.length,
      completedCount: completedToday.length,
      cancelledCount: todayAppointments.length - activeToday.length,
      confirmedRevenue,
      totalExpectedRevenue,
      clientsAttended,
    };
  }, [todayAppointments]);

  // --- Quick Indicators ---
  const indicators = useMemo(() => {
    // Clientes cadastrados
    const totalClients = clients.length;

    // Serviços ativos
    const totalServices = services.length;

    // Faturamento do mês (current month appointments non-cancelled)
    const monthAppointments = appointments.filter(appt => 
      appt.date.startsWith(currentMonthStr) && appt.status !== 'cancelled'
    );
    const monthRevenue = monthAppointments.reduce((sum, appt) => sum + (appt.price || 0), 0);

    return {
      totalClients,
      totalServices,
      monthRevenue,
    };
  }, [clients, services, appointments, currentMonthStr]);

  // --- Alerts Calculations ---
  const alerts = useMemo(() => {
    const items: Array<{ id: string; type: 'warning' | 'danger' | 'info'; title: string; desc: string; tab: any }> = [];

    // Low stock items
    const lowStockCount = stock.filter(item => item.quantity <= item.minQuantity).length;
    if (lowStockCount > 0) {
      items.push({
        id: 'low_stock',
        type: 'danger',
        title: 'Estoque Baixo detectado',
        desc: `${lowStockCount} item(ns) estão abaixo do estoque mínimo estabelecido.`,
        tab: 'estoque',
      });
    }

    // Unpaid appointments in the past
    const overduePayments = appointments.filter(appt => {
      return appt.date < todayStr && appt.paymentStatus === 'pending' && appt.status === 'completed';
    }).length;

    if (overduePayments > 0) {
      items.push({
        id: 'overdue_payments',
        type: 'warning',
        title: 'Pagamentos pendentes',
        desc: `Existem ${overduePayments} atendimentos concluídos no passado sem confirmação de pagamento.`,
        tab: 'finance',
      });
    }

    // High workload alert
    if (todayMetrics.activeCount >= 6) {
      items.push({
        id: 'workload',
        type: 'info',
        title: 'Dia bastante produtivo!',
        desc: `Você possui uma agenda cheia hoje com ${todayMetrics.activeCount} agendamentos. Planeje bem seus intervalos!`,
        tab: 'agenda',
      });
    }

    // Default Greeting Alert if empty
    if (items.length === 0) {
      items.push({
        id: 'welcome',
        type: 'info',
        title: 'Tudo pronto para hoje!',
        desc: `Não há alertas pendentes no momento. Tenha um ótimo dia de atendimentos no Genda!`,
        tab: 'agenda',
      });
    }

    return items;
  }, [stock, appointments, todayStr, todayMetrics]);

  // --- Upcoming Appointments ---
  const upcomingAppointmentsList = useMemo(() => {
    return appointments
      .filter(appt => {
        if (appt.status === 'cancelled') return false;
        if (appt.date > todayStr) return true;
        if (appt.date === todayStr) {
          // Check time
          const currentDate = now();
          const currentHourMin = String(currentDate.hour()).padStart(2, '0') + ':' + String(currentDate.minute()).padStart(2, '0');
          return appt.time >= currentHourMin;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      })
      .slice(0, 4);
  }, [appointments, todayStr]);

  // --- Compact Today's Agenda ---
  const todayTimelineAppointments = useMemo(() => {
    return [...todayAppointments]
      .filter(appt => appt.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [todayAppointments]);

  // --- Chart Data Calculations ---
  // 1. Billing chart
  const billingChartData = useMemo(() => {
    if (chartPeriod === 'daily') {
      // Last 7 days including today
      const datesList = Array.from({ length: 7 }).map((_, i) => {
        return now().subtract(i, 'day').format('YYYY-MM-DD');
      }).reverse();

      return datesList.map(date => {
        const dailyAppts = appointments.filter(appt => appt.date === date && appt.status !== 'cancelled');
        const revenue = dailyAppts.reduce((sum, appt) => sum + (appt.price || 0), 0);
        
        // Format label (e.g., "17/07")
        const [, m, d] = date.split('-');
        const label = `${d}/${m}`;

        return { label, value: revenue };
      });
    } else if (chartPeriod === 'weekly') {
      // Last 4 weeks
      const weeksData = Array.from({ length: 4 }).map((_, i) => {
        const end = now().subtract(i * 7, 'day');
        const start = end.subtract(6, 'day');
        return { start, end };
      }).reverse();

      return weeksData.map((week, idx) => {
        const weekAppts = appointments.filter(appt => {
          if (appt.status === 'cancelled') return false;
          const apptDate = parseDate(appt.date + 'T00:00:00');
          return apptDate.isSameOrAfter(week.start, 'day') && apptDate.isSameOrBefore(week.end, 'day');
        });
        const revenue = weekAppts.reduce((sum, appt) => sum + (appt.price || 0), 0);
        const label = `Semana ${idx + 1}`;
        return { label, value: revenue };
      });
    } else {
      // Last 6 months
      const monthsData = Array.from({ length: 6 }).map((_, i) => {
        const d = now().subtract(i, 'month');
        return {
          matchStr: d.format('YYYY-MM'),
          label: d.format('MMM').replace('.', '')
        };
      }).reverse();

      return monthsData.map(monthObj => {
        const monthlyAppts = appointments.filter(appt => 
          appt.date.startsWith(monthObj.matchStr) && appt.status !== 'cancelled'
        );
        const revenue = monthlyAppts.reduce((sum, appt) => sum + (appt.price || 0), 0);
        
        return { 
          label: monthObj.label.charAt(0).toUpperCase() + monthObj.label.slice(1), 
          value: revenue 
        };
      });
    }
  }, [appointments, chartPeriod]);

  // Max value in chart for scaling
  const chartMaxValue = useMemo(() => {
    const maxVal = Math.max(...billingChartData.map(d => d.value), 0);
    return maxVal === 0 ? 100 : maxVal;
  }, [billingChartData]);

  // 2. Services distribution count
  const serviceDistribution = useMemo(() => {
    const counts: Record<string, { name: string; color: string; count: number; totalValue: number }> = {};
    
    // Count from all appointments
    appointments.forEach(appt => {
      const service = services.find(s => s.id === appt.serviceId);
      const sName = service ? service.name : 'Serviço Removido';
      const sColor = service ? service.color : '#cbd5e1';

      if (!counts[appt.serviceId]) {
        counts[appt.serviceId] = {
          name: sName,
          color: sColor,
          count: 0,
          totalValue: 0,
        };
      }
      
      if (appt.status !== 'cancelled') {
        counts[appt.serviceId].count += 1;
        counts[appt.serviceId].totalValue += (appt.price || 0);
      }
    });

    // Convert to list and sort by count descending
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [appointments, services]);

  const maxServiceCount = useMemo(() => {
    const max = Math.max(...serviceDistribution.map(s => s.count), 0);
    return max === 0 ? 1 : max;
  }, [serviceDistribution]);

  return (
    <div className="space-y-6">
      {/* Welcome banner with status description */}
      <div className={`p-6 rounded-2xl border ${
        isDark 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-white border-slate-150'
      } shadow-sm relative overflow-hidden`}>
        {/* Abstract design elements to make it look extremely modern and non-slop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Painel Geral
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <h1 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Olá, {profile.name || 'Profissional'}!
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'} max-w-xl`}>
              Aqui está uma visão integrada do seu negócio para hoje. Você possui <strong className="font-bold">{todayMetrics.activeCount} agendamentos</strong> ativos, com <strong className="font-bold">R$ {Math.round(todayMetrics.confirmedRevenue).toLocaleString('pt-BR')}</strong> já confirmados.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={onTriggerNewAppointment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
            <button
              onClick={onTriggerNewClient}
              className={`font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Novo Cliente
            </button>
            <button
              onClick={onTriggerNewService}
              className={`font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              Novo Serviço
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Indicator 1: Clients */}
        <div 
          onClick={() => onNavigateToTab('clients')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:translate-y-[-2px] hover:shadow-md text-left ${
            isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-150 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Clientes Cadastrados
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className={`font-display font-extrabold text-lg sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {indicators.totalClients}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Ativos na base
            </span>
          </div>
        </div>

        {/* Indicator 2: Services */}
        <div 
          onClick={() => onNavigateToTab('services')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:translate-y-[-2px] hover:shadow-md text-left ${
            isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-150 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Serviços Ativos
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Clipboard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className={`font-display font-extrabold text-lg sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {indicators.totalServices}
            </span>
            <span className={`text-[10px] font-mono block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Catálogo de serviços
            </span>
          </div>
        </div>

        {/* Indicator 4: Revenue this month */}
        <div 
          onClick={() => onNavigateToTab('finance')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:translate-y-[-2px] hover:shadow-md text-left ${
            isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-150 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Faturamento do Mês
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className={`font-display font-extrabold text-lg sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatPrice(indicators.monthRevenue)}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Faturamento previsto
            </span>
          </div>
        </div>
      </div>

      {/* Daily Summary & Business Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Metrics Summary */}
        <div className={`p-5 rounded-2xl border text-left ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-150'
        }`}>
          <h3 className={`font-display font-extrabold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Zap className="w-4.5 h-4.5 text-indigo-500" />
            Resumo de Hoje ({todayStr.split('-').reverse().slice(0, 2).join('/')})
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-slate-50 border-slate-100'}`}>
                <span className={`text-[10px] block font-semibold text-slate-400`}>Agendados</span>
                <span className={`text-base font-extrabold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {todayMetrics.total}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-emerald-950/20 border-emerald-900/10'}`}>
                <span className="text-[10px] block font-semibold text-emerald-500">Concluídos</span>
                <span className="text-base font-extrabold block text-emerald-500">
                  {todayMetrics.completedCount}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-rose-950/10 border-rose-900/10'}`}>
                <span className="text-[10px] block font-semibold text-rose-400">Cancelados</span>
                <span className="text-base font-extrabold block text-rose-400">
                  {todayMetrics.cancelledCount}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400">Clientes Atendidos</span>
                <span className={`font-mono font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                  {todayMetrics.clientsAttended} / {todayMetrics.activeCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-dashed border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400">Faturamento Confirmado</span>
                <span className="font-mono font-bold text-emerald-500">
                  {formatPrice(todayMetrics.confirmedRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Faturamento Total Estimado</span>
                <span className={`font-mono font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                  {formatPrice(todayMetrics.totalExpectedRevenue)}
                </span>
              </div>
            </div>

            {/* Micro progress bar for daily completion rate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Taxa de Conclusão</span>
                <span className="font-bold text-indigo-500">
                  {todayMetrics.activeCount > 0 
                    ? Math.round((todayMetrics.completedCount / todayMetrics.activeCount) * 100) 
                    : 0}%
                </span>
              </div>
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${todayMetrics.activeCount > 0 
                      ? (todayMetrics.completedCount / todayMetrics.activeCount) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts and Important Notifications Card */}
        <div className={`p-5 rounded-2xl border text-left lg:col-span-2 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-150'
        }`}>
          <h3 className={`font-display font-extrabold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <Bell className="w-4.5 h-4.5 text-indigo-500 animate-swing" />
            Alertas e Ações Recomendadas
          </h3>

          <div className="space-y-3 max-h-[195px] overflow-y-auto pr-1">
            {alerts.map((alert, idx) => (
              <div 
                key={alert.id + '_' + idx}
                onClick={() => onNavigateToTab(alert.tab)}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer hover:scale-[1.01] ${
                  alert.type === 'danger'
                    ? isDark ? 'bg-rose-950/15 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-100 text-rose-700'
                    : alert.type === 'warning'
                      ? isDark ? 'bg-amber-950/15 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-100 text-amber-700'
                      : isDark ? 'bg-indigo-950/15 border-indigo-900/40 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.type === 'danger'
                    ? 'bg-rose-500/15 text-rose-500'
                    : alert.type === 'warning'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-indigo-500/15 text-indigo-500'
                }`}>
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs block leading-snug">
                    {alert.title}
                  </span>
                  <span className="text-[11px] opacity-90 block leading-normal mt-0.5">
                    {alert.desc}
                  </span>
                </div>
                <div className="self-center shrink-0">
                  <ChevronRight className="w-4.5 h-4.5 opacity-60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts & Distribution Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Chart Card */}
        <div className={`p-5 rounded-2xl border text-left lg:col-span-2 flex flex-col justify-between ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-150'
        }`}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className={`font-display font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
              Gráfico de Faturamento
            </h3>

            {/* Toggle filters */}
            <div className={`p-1 rounded-xl flex gap-1 ${isDark ? 'bg-zinc-950' : 'bg-slate-50'}`}>
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    chartPeriod === period
                      ? isDark ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-500 dark:hover:text-zinc-200'
                  }`}
                >
                  {period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>

          {/* High Fidelity Custom Responsive SVG Chart */}
          <div className="h-48 w-full flex items-end gap-2 px-1 relative">
            {billingChartData.map((data, idx) => {
              const percentage = (data.value / chartMaxValue) * 100;
              // Prevent exact 0 heights so there's always a subtle active anchor line
              const barHeight = Math.max(percentage, 4);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Modern Hover Tooltip with value */}
                  <div className={`absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none scale-95 group-hover:scale-100 ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-transparent text-white'
                  } border shadow-lg rounded-lg py-1 px-2.5 text-[10px] font-mono font-bold whitespace-nowrap`}>
                    {formatPrice(data.value)}
                  </div>

                  {/* SVG representation or animated block representing high quality */}
                  <div className="w-full max-w-[40px] relative rounded-t-lg overflow-hidden transition-all duration-300 bg-indigo-500/10 group-hover:bg-indigo-500/20" style={{ height: `${barHeight}%` }}>
                    <div 
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-500 transition-all duration-500`}
                      style={{ height: '100%' }}
                    />
                  </div>

                  <span className={`text-[10px] font-semibold mt-2.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'} truncate max-w-full block`}>
                    {data.label}
                  </span>
                </div>
              );
            })}

            {/* Fallback state when billing values are completely empty */}
            {chartMaxValue === 100 && billingChartData.every(d => d.value === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent backdrop-blur-xs text-center">
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'} font-semibold`}>
                  Nenhum faturamento registrado neste período.
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Seus novos atendimentos preencherão este gráfico automaticamente!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Services distribution count */}
        <div className={`p-5 rounded-2xl border text-left flex flex-col justify-between ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-150'
        }`}>
          <div>
            <h3 className={`font-display font-extrabold text-sm uppercase tracking-wider mb-5 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
              Serviços mais Realizados
            </h3>

            {serviceDistribution.length === 0 ? (
              <div className="py-12 text-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-950 flex items-center justify-center mx-auto text-slate-400">
                  <Clipboard className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-semibold text-slate-400">Nenhum serviço realizado ainda</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                  Os serviços aparecerão organizados conforme você conclui agendamentos.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceDistribution.map((service, index) => {
                  const percentOfMax = (service.count / maxServiceCount) * 100;
                  
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className={`font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-slate-800'}`} title={service.name}>
                          {service.name}
                        </span>
                        <span className={`font-mono font-bold flex-shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                          {service.count}x <span className="text-[10px] font-normal text-slate-400">({formatPrice(service.totalValue)})</span>
                        </span>
                      </div>

                      {/* Custom Horizontal Colored Bar representing percentage */}
                      <div className={`h-2 w-full rounded-full ${isDark ? 'bg-zinc-950' : 'bg-slate-50'}`}>
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentOfMax}%`,
                            backgroundColor: service.color || '#0ea5e9'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {serviceDistribution.length > 0 && (
            <button
              onClick={() => onNavigateToTab('services')}
              className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 py-1.5 mt-4 text-center rounded-xl transition-all cursor-pointer border ${
                isDark 
                  ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-950' 
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Ver Catálogo Completo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Upcoming appointments & Compact Today's Agenda Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compact Today's Agenda list */}
        <div className={`p-5 rounded-2xl border text-left flex flex-col justify-between ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-150'
        }`}>
          <div>
            <h3 className={`font-display font-extrabold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              Agenda Compacta de Hoje
            </h3>

            {todayTimelineAppointments.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-950 flex items-center justify-center mx-auto text-slate-300 dark:text-zinc-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Nenhum atendimento para hoje</p>
                  <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto mt-0.5">
                    Aproveite o tempo para organizar seus materiais ou planeje novos contatos com clientes!
                  </p>
                </div>
                <button
                  onClick={onTriggerNewAppointment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wide cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Agendar Agora
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                {todayTimelineAppointments.map((appt) => {
                  const client = clients.find(c => c.id === appt.clientId);
                  const service = services.find(s => s.id === appt.serviceId);
                  
                  return (
                    <div 
                      key={appt.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-zinc-950/30 border-zinc-850/60' : 'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Time circle status badge */}
                        <div className={`p-2 rounded-xl shrink-0 font-mono font-bold text-xs ${
                          appt.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {appt.time}
                        </div>

                        <div className="min-w-0 text-left">
                          <span className={`font-bold text-xs block truncate ${
                            isDark ? 'text-zinc-100' : 'text-slate-800'
                          }`}>
                            {client ? client.name : 'Cliente Desconhecido'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: service?.color || '#cbd5e1' }} 
                            />
                            <span className="text-[10px] text-slate-400 truncate block">
                              {service ? service.name : 'Serviço'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold text-xs block ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                          {formatPrice(appt.price)}
                        </span>
                        <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 ${
                          appt.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {appt.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {todayTimelineAppointments.length > 0 && (
            <button
              onClick={() => onNavigateToTab('agenda')}
              className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 py-1.5 mt-4 text-center rounded-xl transition-all cursor-pointer border ${
                isDark 
                  ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-950' 
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Ir para Agenda Completa
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Upcoming appointments list */}
        <div className={`p-5 rounded-2xl border text-left flex flex-col justify-between ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-150'
        }`}>
          <div>
            <h3 className={`font-display font-extrabold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Calendar className="w-4.5 h-4.5 text-indigo-500" />
              Próximos Agendamentos
            </h3>

            {upcomingAppointmentsList.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-950 flex items-center justify-center mx-auto text-slate-300 dark:text-zinc-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Nenhum próximo agendamento</p>
                  <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto mt-0.5">
                    Você está em dia com seus agendamentos! Cadastre novos ou reagende atendimentos.
                  </p>
                </div>
                <button
                  onClick={onTriggerNewAppointment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wide cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Agendar Agora
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                {upcomingAppointmentsList.map((appt) => {
                  const client = clients.find(c => c.id === appt.clientId);
                  const service = services.find(s => s.id === appt.serviceId);
                  
                  // Format Date to short view: e.g. "20/07"
                  const [, m, d] = appt.date.split('-');
                  const dateShort = `${d}/${m}`;

                  return (
                    <div 
                      key={appt.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-zinc-950/30 border-zinc-850/60' : 'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Short Date Circle Badge */}
                        <div className={`p-2 rounded-xl shrink-0 font-mono font-bold text-center text-xs w-11 ${
                          isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-850' : 'bg-slate-100 text-slate-600 border border-slate-150'
                        }`}>
                          <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold -mb-0.5">Dia</span>
                          {dateShort}
                        </div>

                        <div className="min-w-0 text-left">
                          <span className={`font-bold text-xs block truncate ${
                            isDark ? 'text-zinc-100' : 'text-slate-800'
                          }`}>
                            {client ? client.name : 'Cliente Desconhecido'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: service?.color || '#cbd5e1' }} 
                            />
                            <span className="text-[10px] text-slate-400 truncate block">
                              {service ? service.name : 'Serviço'} • {appt.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold text-xs block ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                          {formatPrice(appt.price)}
                        </span>
                        <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 bg-indigo-500/10 text-indigo-500`}>
                          Agendado
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {upcomingAppointmentsList.length > 0 && (
            <button
              onClick={() => onNavigateToTab('agenda')}
              className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 py-1.5 mt-4 text-center rounded-xl transition-all cursor-pointer border ${
                isDark 
                  ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-950' 
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Ver na Agenda Semanal
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
