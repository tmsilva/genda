export type PaymentStatus = 'paid' | 'pending' | 'installments';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface WorkingDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isWorking: boolean;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  lunchStart?: string; // "HH:MM"
  lunchEnd?: string; // "HH:MM"
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  color: string; // CSS color class name or hex code
  materials?: string; // Optional materials used
  isPackage?: boolean;
  packageItems?: string[]; // Array of service IDs included
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string; // 'un' | 'ml' | 'g' | 'pacote'
  lastUpdated: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes (overridable)
  price: number; // in BRL (overridable)
  isRecurring: RecurrenceType;
  isReminderEnabled: boolean;
  paymentStatus: PaymentStatus;
  installmentCount?: number;
  installmentValue?: number;
  paymentDate?: string;
  paymentMethod?: string; // 'money' | 'pix' | 'credit' | 'debit'
  status: AppointmentStatus;
}

export interface MessageTemplate {
  id: string;
  type: 'reminder' | 'confirm' | 'reschedule' | 'thanks';
  title: string;
  body: string;
}

export interface ProfessionalProfile {
  name: string;
  category: string;
  avatarUrl?: string;
  whatsapp?: string;
  workingDays: WorkingDay[];
  themeId: string;
  isOfflineModeEnabled: boolean;
  packageDiscount?: number;
  isDarkMode?: boolean;
}

export type ThemeOption = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  
  // Custom mode values
  backgroundDark?: string;
  cardDark?: string;
  textDark?: string;
  secondaryDark?: string;
  accentDark?: string;

  backgroundLight?: string;
  cardLight?: string;
  textLight?: string;
  secondaryLight?: string;
  accentLight?: string;
};

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string; // ISO string
  read: boolean;
  appointmentId?: string;
}

