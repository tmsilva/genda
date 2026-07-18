import { now, parseDate, getTodayStr, formatDatePtBR } from '../dateUtils';
import dayjs from 'dayjs';
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, TrendingUp, Calendar, Filter, Download, ArrowUpRight, 
  CreditCard, CheckCircle, AlertTriangle, Briefcase, User, Layers 
} from 'lucide-react';
import { Appointment, Client, Service } from '../types';
import { formatPrice } from '../utils';

interface FinanceViewProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  isDark?: boolean;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'custom';

export default function FinanceView({ appointments, clients, services, isDark = false }: FinanceViewProps) {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Core calculations
  const stats = useMemo(() => {
    const todayStr = getTodayStr();
    
    // Get current week range
    const firstDayOfWeek = now().startOf('week');
    const firstDayStr = firstDayOfWeek.format('YYYY-MM-DD');

    // Get current month range (YYYY-MM)
    const currentMonthPrefix = now().format('YYYY-MM');

    let billingToday = 0;
    let billingWeek = 0;
    let billingMonth = 0;
    let totalPending = 0;

    appointments.forEach((appt) => {
      if (appt.status === 'cancelled') return;

      const apptPrice = appt.price;
      const isPaid = appt.paymentStatus === 'paid';
      
      // Calculate pending
      if (appt.paymentStatus === 'pending') {
        totalPending += apptPrice;
      } else if (appt.paymentStatus === 'installments') {
        // Assume half is pending or similar, or just sum total value
        totalPending += apptPrice; // Keep simple for autônomos
      }

      // Sum values for completed or scheduled sessions depending on paid status
      if (isPaid) {
        if (appt.date === todayStr) {
          billingToday += apptPrice;
        }
        if (appt.date >= firstDayStr) {
          billingWeek += apptPrice;
        }
        if (appt.date.startsWith(currentMonthPrefix)) {
          billingMonth += apptPrice;
        }
      }
    });

    return {
      today: billingToday,
      week: billingWeek,
      month: billingMonth,
      pending: totalPending
    };
  }, [appointments]);

  // Filtered appointments list for Period reports
  const reportAppointments = useMemo(() => {
    const todayStr = getTodayStr();
    const firstDayStr = now().startOf('week').format('YYYY-MM-DD');

    // start of month
    const currentMonthPrefix = now().format('YYYY-MM');

    return appointments.filter((appt) => {
      if (appt.status === 'cancelled') return false;

      if (period === 'today') {
        return appt.date === todayStr;
      }
      if (period === 'week') {
        return appt.date >= firstDayStr;
      }
      if (period === 'month') {
        return appt.date.startsWith(currentMonthPrefix);
      }
      if (period === 'custom') {
        if (!customStartDate || !customEndDate) return true;
        return appt.date >= customStartDate && appt.date <= customEndDate;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, period, customStartDate, customEndDate]);

  // Report aggregates
  const reportSummary = useMemo(() => {
    let totalReceived = 0;
    let totalPending = 0;

    reportAppointments.forEach((appt) => {
      if (appt.paymentStatus === 'paid') {
        totalReceived += appt.price;
      } else {
        totalPending += appt.price;
      }
    });

    return {
      received: totalReceived,
      pending: totalPending,
      total: totalReceived + totalPending,
    };
  }, [reportAppointments]);

  // Chart data structure (Last 6 days faturamento)
  const chartPoints = useMemo(() => {
    const days = [];
    for (let i = 5; i >= 0; i--) {
      const d = now().subtract(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const dayLabel = d.format('ddd');
      
      const dayTotal = appointments
        .filter(appt => appt.date === dateStr && appt.status === 'completed' && appt.paymentStatus === 'paid')
        .reduce((sum, appt) => sum + appt.price, 0);

      days.push({
        label: dayLabel,
        total: dayTotal
      });
    }
    return days;
  }, [appointments]);

  // Export report to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Data,Cliente,Serviço,Valor (R$),Status de Pagamento,Metodo\n';

    reportAppointments.forEach((appt) => {
      const client = clients.find(c => c.id === appt.clientId)?.name || 'Desconhecido';
      const service = services.find(s => s.id === appt.serviceId)?.name || 'Removido';
      const paymentLabel = appt.paymentStatus === 'paid' ? 'Pago' : appt.paymentStatus === 'installments' ? 'Parcelado' : 'Pendente';
      
      csvContent += `${appt.date.split('-').reverse().join('/')},"${client}","${service}",${appt.price},${paymentLabel},${appt.paymentMethod || '-'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Genda_Relatorio_Financeiro_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper resolvers
  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Cliente Geral';
  };

  const getServiceName = (serviceId: string) => {
    return services.find((s) => s.id === serviceId)?.name || 'Serviço Geral';
  };

  // Max value in chart to scale SVG
  const maxChartValue = Math.max(...chartPoints.map(p => p.total), 100);

  return (
    <div className="space-y-4" id="finance-tab-root">
      
      {/* SECTION 5.1 — TILE CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Today */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Hoje (Recebido)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-left">
            <h3 className="font-display font-extrabold text-slate-900 text-lg md:text-xl">
              R$ {formatPrice(stats.today)}
            </h3>
            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Faturamento diário
            </span>
          </div>
        </div>

        {/* Week */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Na Semana</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-left">
            <h3 className="font-display font-extrabold text-slate-900 text-lg md:text-xl">
              R$ {formatPrice(stats.week)}
            </h3>
            <span className="text-[9px] text-slate-400 block mt-0.5">Acumulado de 7 dias</span>
          </div>
        </div>

        {/* Month */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Faturado no Mês</span>
            <span className="p-1.5 rounded-lg bg-slate-900 text-white">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-left">
            <h3 className="font-display font-extrabold text-slate-900 text-lg md:text-xl">
              R$ {formatPrice(stats.month)}
            </h3>
            <span className="text-[9px] text-slate-400 block mt-0.5">Total líquido recebido</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">A Receber</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-left">
            <h3 className="font-display font-extrabold text-slate-900 text-lg md:text-xl text-amber-700">
              R$ {formatPrice(stats.pending)}
            </h3>
            <span className="text-[9px] text-amber-600 font-semibold block mt-0.5">Pendentes ou parcelas</span>
          </div>
        </div>

      </div>

      {/* EVOLUÇÃO GRÁFICA (MINIMAL SVG CHART) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900">Histórico de Receita Diária</h4>
            <span className="text-[10px] text-slate-400">Evolução do faturamento líquido nos últimos 6 dias</span>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg border border-emerald-100">
            Faturamento Confirmado
          </span>
        </div>

        {/* Custom SVG Column Chart */}
        <div className="relative pt-4 pb-2">
          <div className="flex items-end justify-between h-32 px-2.5">
            {chartPoints.map((pt, index) => {
              // calculate percentage height
              const pctHeight = (pt.total / maxChartValue) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-4 bg-slate-950 text-white font-mono text-[9px] py-1 px-1.5 rounded shadow-lg transition-all pointer-events-none">
                    R$ {formatPrice(pt.total)}
                  </div>
                  
                  {/* Dynamic Column */}
                  <div 
                    className="w-8 bg-slate-900 hover:bg-indigo-600 transition-all rounded-t-lg shadow-sm"
                    style={{ height: `${Math.max(pctHeight, 6)}%` }}
                  />

                  {/* Day label */}
                  <span className="text-[9px] text-slate-400 uppercase font-mono mt-2">{pt.label}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom ground line */}
          <div className="w-full h-px bg-slate-200 mt-0.5" />
        </div>
      </div>

      {/* SECTION 5.2 — RELATÓRIOS E LISTAGENS */}
      <div className={`rounded-2xl p-5 border shadow-sm space-y-4 transition-all duration-200 ${
        isDark ? 'bg-zinc-950/20 border-zinc-900/60' : 'bg-white border-slate-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className={`font-display font-bold text-base ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Relatório Consolidado</h4>
            <span className="text-xs text-slate-400">Filtre atendimentos e confira o somatório</span>
          </div>

          {/* Download CSV button */}
          <button
            onClick={handleExportCSV}
            className={`self-start sm:self-center text-xs font-bold px-3.5 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
              isDark 
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>

        {/* Period selection filters */}
        <div className={`flex flex-wrap gap-1 p-0.5 rounded-xl text-xs font-medium border max-w-md ${
          isDark 
            ? 'bg-zinc-900 border-zinc-800' 
            : 'bg-slate-100/80 border-slate-200/50'
        }`}>
          {(['today', 'week', 'month', 'custom'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-center transition-all cursor-pointer flex-1 ${
                period === p 
                  ? (isDark ? 'bg-zinc-800 text-white font-bold shadow-sm' : 'bg-white text-slate-950 font-bold shadow-sm') 
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Personalizado'}
            </button>
          ))}
        </div>

        {/* Custom date range inputs */}
        {period === 'custom' && (
          <div className={`grid grid-cols-2 gap-3 p-3 border rounded-xl ${
            isDark ? 'bg-zinc-900/30 border-zinc-900' : 'bg-slate-50 border-slate-100'
          }`}>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Data Início</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-700' 
                    : 'bg-white border-slate-200 text-slate-700 focus:border-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Data Fim</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-700' 
                    : 'bg-white border-slate-200 text-slate-700 focus:border-slate-800'
                }`}
              />
            </div>
          </div>
        )}

        {/* Responsive List & Table of services executed */}
        <div className={`border rounded-xl overflow-hidden max-h-[350px] overflow-y-auto ${
          isDark ? 'border-zinc-900 bg-zinc-950/10' : 'border-slate-100 bg-slate-50/10'
        }`}>
          {reportAppointments.length === 0 ? (
            <div className={`p-10 text-center italic text-xs border-dashed rounded-xl m-2 ${
              isDark ? 'text-zinc-500 border-zinc-800' : 'text-slate-450 border-slate-200'
            }`}>
              Nenhum faturamento registrado para o período selecionado.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                <thead>
                  <tr className={`border-b font-display font-bold tracking-wider uppercase text-[10px] sticky top-0 z-10 ${
                    isDark ? 'bg-zinc-900 border-zinc-900 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <th className="py-3 px-4">Serviço</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Pagamento</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-900/60' : 'divide-slate-100'}`}>
                  {reportAppointments.map((appt) => {
                    const sName = getServiceName(appt.serviceId);
                    const cName = getClientName(appt.clientId);
                    const isPaid = appt.paymentStatus === 'paid';
                    const isInstallments = appt.paymentStatus === 'installments';

                    // Theme aware badge style
                    const badgeClass = isPaid
                      ? (isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/30' : 'bg-emerald-50 text-emerald-700 border-emerald-100')
                      : isInstallments
                      ? (isDark ? 'bg-purple-950/40 text-purple-300 border-purple-900/30' : 'bg-purple-50 text-purple-700 border-purple-100')
                      : (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/30' : 'bg-amber-50 text-amber-700 border-amber-100');

                    return (
                      <tr 
                        key={appt.id}
                        className={`transition-colors duration-150 ${
                          isDark ? 'hover:bg-zinc-900/20' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold">
                          <span className={isDark ? 'text-zinc-200' : 'text-slate-900'}>{sName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{cName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                          {appt.date.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-semibold border ${badgeClass}`}>
                              {isPaid ? 'Pago' : isInstallments ? 'Parcelado' : 'Pendente'}
                            </span>
                            {appt.paymentMethod && (
                              <span className="text-[9px] text-slate-400 uppercase font-mono">
                                ({appt.paymentMethod})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold font-mono">
                          <span className={isDark ? 'text-zinc-100' : 'text-slate-900'}>R$ {formatPrice(appt.price)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Aggregates Grid */}
        <div className={`grid grid-cols-3 gap-2.5 rounded-xl p-0.5 border ${
          isDark 
            ? 'bg-zinc-900/20 border-zinc-900/60' 
            : 'bg-slate-100/50 border-slate-200/50'
        }`}>
          {/* Card 1: Confirmado */}
          <div className={`p-3 rounded-lg text-center space-y-0.5 border ${
            isDark 
              ? 'bg-zinc-950/60 border-zinc-900/45' 
              : 'bg-white border-slate-150/50'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider font-bold block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Confirmado
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-500 font-mono block">
              R$ {formatPrice(reportSummary.received)}
            </span>
          </div>

          {/* Card 2: A Receber */}
          <div className={`p-3 rounded-lg text-center space-y-0.5 border ${
            isDark 
              ? 'bg-zinc-950/60 border-zinc-900/45' 
              : 'bg-white border-slate-150/50'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider font-bold block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              A Receber
            </span>
            <span className="text-sm sm:text-base font-extrabold text-amber-500 font-mono block">
              R$ {formatPrice(reportSummary.pending)}
            </span>
          </div>

          {/* Card 3: Total Geral */}
          <div className={`p-3 rounded-lg text-center space-y-0.5 border ${
            isDark 
              ? 'bg-zinc-950/60 border-zinc-900/45' 
              : 'bg-white border-slate-150/50'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider font-bold block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Total Geral
            </span>
            <span className={`text-sm sm:text-base font-extrabold font-mono block ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              R$ {formatPrice(reportSummary.total)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
