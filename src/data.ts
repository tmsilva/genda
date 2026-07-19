import { now, parseDate, getTodayStr } from './dateUtils';
import dayjs from 'dayjs';
import { Service, Client, Appointment, WorkingDay, MessageTemplate, ProfessionalProfile, ThemeOption, StockItem } from './types';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'elegant-dark',
    name: 'Elegância Noturna',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 border-transparent',
    secondary: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20',
    background: 'bg-zinc-950 text-zinc-300',
    card: 'bg-zinc-900 border-zinc-800',
    text: 'text-white',
    backgroundDark: 'bg-zinc-950 text-zinc-300',
    cardDark: 'bg-zinc-900 border-zinc-800',
    textDark: 'text-white',
    secondaryDark: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    accentDark: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20',
    backgroundLight: 'bg-indigo-50/40 text-slate-700',
    cardLight: 'bg-white border-slate-200/80',
    textLight: 'text-slate-900',
    secondaryLight: 'bg-slate-100 text-slate-800 border-slate-200',
    accentLight: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100',
  },
  {
    id: 'slate',
    name: 'Grafite Clássico',
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-slate-100 text-slate-800 border-slate-200',
    accent: 'text-slate-950 bg-slate-100 border-slate-200 hover:bg-slate-100',
    background: 'bg-slate-50',
    card: 'bg-white border-slate-100',
    text: 'text-slate-900',
    backgroundDark: 'bg-slate-950 text-slate-300',
    cardDark: 'bg-slate-900 border-slate-800',
    textDark: 'text-white',
    secondaryDark: 'bg-slate-800 text-slate-300 border-slate-700',
    accentDark: 'text-slate-400 bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/20',
    backgroundLight: 'bg-slate-50 text-slate-850',
    cardLight: 'bg-white border-slate-100',
    textLight: 'text-slate-900',
    secondaryLight: 'bg-slate-100 text-slate-800 border-slate-200',
    accentLight: 'text-slate-950 bg-slate-100 border-slate-200 hover:bg-slate-100',
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    accent: 'text-emerald-950 bg-emerald-50 border-emerald-100 hover:bg-emerald-100',
    background: 'bg-stone-50',
    card: 'bg-white border-stone-100',
    text: 'text-stone-900',
    backgroundDark: 'bg-stone-950 text-stone-300',
    cardDark: 'bg-stone-900 border-stone-800',
    textDark: 'text-white',
    secondaryDark: 'bg-stone-800 text-stone-300 border-stone-700',
    accentDark: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    backgroundLight: 'bg-stone-50 text-stone-900',
    cardLight: 'bg-white border-stone-100',
    textLight: 'text-stone-900',
    secondaryLight: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    accentLight: 'text-emerald-950 bg-emerald-50 border-emerald-100 hover:bg-emerald-100',
  },
  {
    id: 'ocean',
    name: 'Azul Oceano',
    primary: 'bg-sky-600 text-white hover:bg-sky-700',
    secondary: 'bg-sky-50 text-sky-800 border-sky-100',
    accent: 'text-sky-950 bg-sky-50 border-sky-100 hover:bg-sky-100',
    background: 'bg-slate-50',
    card: 'bg-white border-slate-100',
    text: 'text-slate-900',
    backgroundDark: 'bg-zinc-950 text-zinc-300',
    cardDark: 'bg-zinc-900 border-zinc-800',
    textDark: 'text-white',
    secondaryDark: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    accentDark: 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20',
    backgroundLight: 'bg-slate-50 text-slate-900',
    cardLight: 'bg-white border-slate-100',
    textLight: 'text-slate-900',
    secondaryLight: 'bg-sky-50 text-sky-800 border-sky-100',
    accentLight: 'text-sky-950 bg-sky-50 border-sky-100 hover:bg-sky-100',
  },
  {
    id: 'orchid',
    name: 'Orquídea Real',
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-purple-50 text-purple-800 border-purple-100',
    accent: 'text-purple-950 bg-purple-50 border-purple-100 hover:bg-purple-100',
    background: 'bg-zinc-50',
    card: 'bg-white border-zinc-100',
    text: 'text-zinc-900',
    backgroundDark: 'bg-zinc-950 text-zinc-300',
    cardDark: 'bg-zinc-900 border-zinc-800',
    textDark: 'text-white',
    secondaryDark: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    accentDark: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
    backgroundLight: 'bg-zinc-50 text-zinc-900',
    cardLight: 'bg-white border-zinc-100',
    textLight: 'text-zinc-900',
    secondaryLight: 'bg-purple-50 text-purple-800 border-purple-100',
    accentLight: 'text-purple-950 bg-purple-50 border-purple-100 hover:bg-purple-100',
  },
  {
    id: 'amber',
    name: 'Âmbar Solar',
    primary: 'bg-amber-600 text-white hover:bg-amber-500 border-transparent',
    secondary: 'bg-stone-150 text-stone-800 border-stone-200',
    accent: 'text-amber-950 bg-amber-50 border-amber-100 hover:bg-amber-100',
    background: 'bg-stone-50',
    card: 'bg-white border-stone-100',
    text: 'text-stone-900',
    backgroundDark: 'bg-stone-950 text-stone-300',
    cardDark: 'bg-stone-900 border-stone-800',
    textDark: 'text-white',
    secondaryDark: 'bg-stone-800 text-stone-300 border-stone-700',
    accentDark: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
    backgroundLight: 'bg-amber-50/40 text-slate-850',
    cardLight: 'bg-white border-amber-100',
    textLight: 'text-slate-900',
    secondaryLight: 'bg-amber-50 text-amber-800 border-amber-150',
    accentLight: 'text-amber-950 bg-amber-50 border-amber-100 hover:bg-amber-100',
  }
];

export const DEFAULT_SERVICES: Service[] = [
  { 
    id: 's1', 
    name: 'Corte de Cabelo Masculino', 
    duration: 30, 
    price: 50, 
    color: '#0ea5e9',
    stockMaterials: []
  }, // sky-500
  { 
    id: 's2', 
    name: 'Barba Terapia', 
    duration: 30, 
    price: 40, 
    color: '#10b981',
    stockMaterials: []
  }, // emerald-500
  { id: 's3', name: 'Manicure Completa', duration: 45, price: 60, color: '#ec4899', stockMaterials: [] }, // pink-500
  { id: 's4', name: 'Consultoria Individual', duration: 60, price: 150, color: '#8b5cf6', stockMaterials: [] }, // violet-500
  { id: 's_pkg_1', name: 'Pacote Premium (Corte + Barba + Sobrancelha)', duration: 80, price: 95, color: '#f59e0b', isPackage: true, packageItems: ['s1', 's2'], stockMaterials: [] },
];

export const DEFAULT_STOCK_ITEMS: StockItem[] = [];

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Carlos Eduardo Santos',
    phone: '(11) 98765-4321',
    email: 'carlos.edu@gmail.com',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    notes: 'Prefere corte com tesoura nas laterais. Café sem açúcar.',
  },
  {
    id: 'c2',
    name: 'Mariana Silva Costa',
    phone: '(11) 99876-5432',
    email: 'mariana.costa@hotmail.com',
    address: 'Rua Augusta, 450 - Consolação, São Paulo - SP',
    notes: 'Alérgica a esmaltes de marcas comuns. Prefere marcas hipoalergênicas.',
  },
  {
    id: 'c3',
    name: 'Thiago Oliveira',
    phone: '(21) 97654-3210',
    email: 'thiago.oliveira@outlook.com',
    address: 'Rua Barata Ribeiro, 200 - Copacabana, Rio de Janeiro - RJ',
    notes: 'Cliente regular de barba. Costuma marcar quinzenalmente às sextas.',
  },
  {
    id: 'c4',
    name: 'Beatriz Vasconcellos',
    phone: '(11) 96543-2109',
    email: 'beatriz.v@gmail.com',
    address: 'Rua dos Pinheiros, 1200 - Pinheiros, São Paulo - SP',
    notes: 'Sempre pontual. Prefere atendimento pela manhã.',
  }
];

export const DEFAULT_WORKING_DAYS: WorkingDay[] = [
  { dayOfWeek: 1, isWorking: true, startTime: '09:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { dayOfWeek: 2, isWorking: true, startTime: '09:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { dayOfWeek: 3, isWorking: true, startTime: '09:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { dayOfWeek: 4, isWorking: true, startTime: '09:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { dayOfWeek: 5, isWorking: true, startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { dayOfWeek: 6, isWorking: true, startTime: '09:00', endTime: '16:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '12:00' }, // Domingo folga
];

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 't1',
    type: 'reminder',
    title: 'Lembrete de Agendamento 24h antes',
    body: 'Olá, {nome}! Passando para lembrar do seu atendimento de {serviço} amanhã, dia {data}, às {hora}. Confirmado? Até lá!',
  },
  {
    id: 't2',
    type: 'confirm',
    title: 'Confirmação de Agendamento',
    body: 'Olá, {nome}! Seu agendamento de {serviço} foi confirmado para o dia {data} às {hora}. Obrigado pela preferência!',
  },
  {
    id: 't3',
    type: 'reschedule',
    title: 'Aviso de Reagendamento',
    body: 'Olá, {nome}! Confirmamos o reagendamento do seu serviço de {serviço} para a nova data: {data} às {hora}. Caso precise alterar, nos avise!',
  },
  {
    id: 't4',
    type: 'thanks',
    title: 'Agradecimento Pós-Atendimento',
    body: 'Olá, {nome}! Muito obrigado pela visita hoje para realizar o serviço de {serviço}. Espero que tenha gostado! Excelente semana.',
  }
];

export const getInitialAppointments = (): Appointment[] => {
  const todayStr = getTodayStr();
  
  // Get tomorrow
  const tomorrow = now().add(1, 'day');
  
  const tomorrowStr = tomorrow.format('YYYY-MM-DD');

  // Get yesterday
  const yesterday = now().subtract(1, 'day');
  
  const yesterdayStr = yesterday.format('YYYY-MM-DD');

  return [
    {
      id: 'a1',
      clientId: 'c1',
      serviceId: 's1',
      date: todayStr,
      time: '09:30',
      duration: 30,
      price: 50,
      isRecurring: 'none',
      isReminderEnabled: true,
      paymentStatus: 'paid',
      paymentMethod: 'pix',
      paymentDate: todayStr,
      status: 'completed',
    },
    {
      id: 'a2',
      clientId: 'c2',
      serviceId: 's3',
      date: todayStr,
      time: '14:00',
      duration: 45,
      price: 60,
      isRecurring: 'none',
      isReminderEnabled: true,
      paymentStatus: 'pending',
      status: 'scheduled',
    },
    {
      id: 'a3',
      clientId: 'c3',
      serviceId: 's2',
      date: tomorrowStr,
      time: '10:00',
      duration: 30,
      price: 40,
      isRecurring: 'weekly',
      isReminderEnabled: true,
      paymentStatus: 'pending',
      status: 'scheduled',
    },
    {
      id: 'a4',
      clientId: 'c4',
      serviceId: 's4',
      date: yesterdayStr,
      time: '16:00',
      duration: 60,
      price: 150,
      isRecurring: 'none',
      isReminderEnabled: true,
      paymentStatus: 'paid',
      paymentMethod: 'credit',
      paymentDate: yesterdayStr,
      status: 'completed',
    },
    {
      id: 'a5',
      clientId: 'c1',
      serviceId: 's1',
      date: tomorrowStr,
      time: '15:00',
      duration: 30,
      price: 50,
      isRecurring: 'none',
      isReminderEnabled: true,
      paymentStatus: 'pending',
      status: 'scheduled',
    }
  ];
};

export const DEFAULT_PROFILE: ProfessionalProfile = {
  name: 'Genda Barbershop',
  category: 'Barbearia & Estética',
  whatsapp: '',
  workingDays: DEFAULT_WORKING_DAYS,
  themeId: 'elegant-dark',
  isOfflineModeEnabled: true,
  packageDiscount: 10,
  isDarkMode: true,
};
