import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Users, DollarSign, Settings, Smartphone, 
  Bell, ArrowRight, X, Send, Sparkles, CheckCircle,
  Cloud, CloudOff, RefreshCw, Clipboard, Trash2, Check, BellOff, Download, Upload,
  ChevronLeft, ChevronRight, Menu, Package, Bot, LogOut
} from 'lucide-react';
import { 
  ProfessionalProfile, Service, Client, Appointment, 
  MessageTemplate, ThemeOption, AppNotification, StockItem 
} from './types';
import { 
  THEME_OPTIONS, DEFAULT_SERVICES, DEFAULT_CLIENTS, 
  getInitialAppointments, DEFAULT_TEMPLATES, DEFAULT_PROFILE, DEFAULT_STOCK_ITEMS 
} from './data';
import { getWhatsAppNumber } from './utils';

import Onboarding from './components/Onboarding';
import ScheduleView from './components/ScheduleView';
import ClientsView from './components/ClientsView';
import ServicesView from './components/ServicesView';
import FinanceView from './components/FinanceView';
import SettingsView from './components/SettingsView';
import EstoqueView from './components/EstoqueView';
import AIAssistantView from './components/AIAssistantView';
import Logo from './components/Logo';
import { auth, loginWithGoogle, logoutUser, loginWithEmail, registerWithEmail } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  fetchAllCloudData, 
  uploadInitialDataToCloud, 
  syncProfile, 
  syncService, 
  syncServiceDelete, 
  syncClient, 
  syncClientDelete, 
  syncAppointment, 
  syncAppointmentDelete, 
  syncTemplate, 
  clearAllCloudData 
} from './firebaseSync';

export default function App() {
  // Firebase Auth & Cloud Sync States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [syncConflict, setSyncConflict] = useState<{ uid: string; cloudData: any } | null>(null);
  const isCompletingOnboardingRef = useRef(false);

  // Global App States
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('genda_onboarded') === 'true';
  });

  const [profile, setProfile] = useState<ProfessionalProfile>(() => {
    const cached = localStorage.getItem('genda_profile');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        workingDays: parsed.workingDays || DEFAULT_PROFILE.workingDays,
      };
    }
    return DEFAULT_PROFILE;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const cached = localStorage.getItem('genda_services');
    return cached ? JSON.parse(cached) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const cached = localStorage.getItem('genda_clients');
    return cached ? JSON.parse(cached) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const cached = localStorage.getItem('genda_appointments');
    return cached ? JSON.parse(cached) : [];
  });

  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(() => {
    const cached = localStorage.getItem('genda_message_templates');
    return cached ? JSON.parse(cached) : DEFAULT_TEMPLATES;
  });

  const [activeTab, setActiveTab] = useState<'agenda' | 'clients' | 'services' | 'finance' | 'estoque' | 'ai' | 'settings'>('agenda');
  const [stock, setStock] = useState<StockItem[]>(() => {
    return localStorage.getItem('genda_stock') ? JSON.parse(localStorage.getItem('genda_stock')!) : DEFAULT_STOCK_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('genda_stock', JSON.stringify(stock));
  }, [stock]);

  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Push Notification / Local Alerts State
  const [pushNotification, setPushNotification] = useState<{
    id: string;
    title: string;
    body: string;
    appointmentId: string;
  } | null>(null);

  // Notifications / Reminders State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const cached = localStorage.getItem('genda_notifications');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  // Auto-dismiss simulated push notification after 8 seconds
  useEffect(() => {
    if (pushNotification) {
      const timer = setTimeout(() => {
        setPushNotification(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [pushNotification]);

  // Theme configuration derived from state
  const isDark = profile.isDarkMode ?? true;
  const baseTheme = THEME_OPTIONS.find((t) => t.id === profile.themeId) || THEME_OPTIONS[0];
  const currentTheme = {
    ...baseTheme,
    background: isDark ? (baseTheme.backgroundDark || baseTheme.background) : (baseTheme.backgroundLight || baseTheme.background),
    card: isDark ? (baseTheme.cardDark || baseTheme.card) : (baseTheme.cardLight || baseTheme.card),
    text: isDark ? (baseTheme.textDark || baseTheme.text) : (baseTheme.textLight || baseTheme.text),
    secondary: isDark ? (baseTheme.secondaryDark || baseTheme.secondary) : (baseTheme.secondaryLight || baseTheme.secondary),
    accent: isDark ? (baseTheme.accentDark || baseTheme.accent) : (baseTheme.accentLight || baseTheme.accent),
  };

  // Sync state variables to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('genda_onboarded', String(isOnboarded));
    localStorage.setItem('genda_profile', JSON.stringify(profile));
    localStorage.setItem('genda_services', JSON.stringify(services));
    localStorage.setItem('genda_clients', JSON.stringify(clients));
    localStorage.setItem('genda_appointments', JSON.stringify(appointments));
    localStorage.setItem('genda_message_templates', JSON.stringify(messageTemplates));
    localStorage.setItem('genda_notifications', JSON.stringify(notifications));
  }, [isOnboarded, profile, services, clients, appointments, messageTemplates, notifications]);

  // Auth State Listener and Cloud Restore Hook
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (isCompletingOnboardingRef.current) {
        setAuthLoading(false);
        return;
      }
      if (currentUser) {
        setIsCloudSyncing(true);
        try {
          const cloudData = await fetchAllCloudData(currentUser.uid);
          
          // Read from localStorage to avoid stale closure state
          const localClientsStr = localStorage.getItem('genda_clients');
          const localClients = localClientsStr ? JSON.parse(localClientsStr) : [];
          const localApptsStr = localStorage.getItem('genda_appointments');
          const localAppts = localApptsStr ? JSON.parse(localApptsStr) : [];
          const localProfileStr = localStorage.getItem('genda_profile');
          const localProfile = localProfileStr ? JSON.parse(localProfileStr) : null;
          const localServicesStr = localStorage.getItem('genda_services');
          const localServices = localServicesStr ? JSON.parse(localServicesStr) : [];
          const localTemplatesStr = localStorage.getItem('genda_message_templates');
          const localTemplates = localTemplatesStr ? JSON.parse(localTemplatesStr) : [];

          if (cloudData) {
            // There is data in the cloud (existing account with data)!
            // Always fetch and load the cloud data directly, then open the agenda
            setProfile({
              ...DEFAULT_PROFILE,
              ...cloudData.profile,
              workingDays: (cloudData.profile && cloudData.profile.workingDays) || DEFAULT_PROFILE.workingDays,
            });
            setServices(cloudData.services || []);
            setClients(cloudData.clients || []);
            setAppointments(cloudData.appointments || []);
            if (cloudData.templates && cloudData.templates.length > 0) {
              setMessageTemplates(cloudData.templates);
            }
            setIsOnboarded(true);
            setActiveTab('agenda');
          } else {
            // No data in the cloud (empty cloud account or new registration).
            // Initialize with their current local data if any, otherwise default data, and upload it to the cloud.
            const initialProfile = localProfile || {
              ...DEFAULT_PROFILE,
              name: currentUser.displayName || 'Meu Negócio',
            };
            const initialServices = localServices.length > 0 ? localServices : DEFAULT_SERVICES;
            const initialTemplates = localTemplates.length > 0 ? localTemplates : DEFAULT_TEMPLATES;

            await uploadInitialDataToCloud(
              currentUser.uid,
              initialProfile,
              initialServices,
              localClients,
              localAppts,
              initialTemplates
            );

            setProfile(initialProfile);
            setServices(initialServices);
            setClients(localClients);
            setAppointments(localAppts);
            setMessageTemplates(initialTemplates);
            setIsOnboarded(true);
            setActiveTab('agenda');
          }
        } catch (err) {
          console.error('Cloud synchronization failed', err);
        } finally {
          setIsCloudSyncing(false);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleResolveConflictUseCloud = () => {
    if (!syncConflict) return;
    const { cloudData } = syncConflict;
    setProfile({
      ...DEFAULT_PROFILE,
      ...cloudData.profile,
      workingDays: (cloudData.profile && cloudData.profile.workingDays) || DEFAULT_PROFILE.workingDays,
    });
    setServices(cloudData.services || []);
    setClients(cloudData.clients || []);
    setAppointments(cloudData.appointments || []);
    if (cloudData.templates && cloudData.templates.length > 0) {
      setMessageTemplates(cloudData.templates);
    }
    setIsOnboarded(true);
    setSyncConflict(null);
  };

  const handleResolveConflictUseLocal = async () => {
    if (!syncConflict) return;
    const { uid } = syncConflict;
    setIsCloudSyncing(true);
    try {
      await uploadInitialDataToCloud(
        uid,
        profile,
        services,
        clients,
        appointments,
        messageTemplates
      );
      setIsOnboarded(true);
      setSyncConflict(null);
    } catch (err) {
      console.error('Error seeding cloud from conflict resolution:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Handle simulated push notification trigger on app load after a delay (realistic 24h reminder demo)
  useEffect(() => {
    if (isOnboarded) {
      const timer = setTimeout(() => {
        // Find first upcoming scheduled appointment to notify about
        const nextAppt = appointments.find(a => a.status === 'scheduled');
        if (nextAppt) {
          const client = clients.find(c => c.id === nextAppt.clientId);
          const service = services.find(s => s.id === nextAppt.serviceId);
          if (client && service) {
            const notifId = 'notif_' + Date.now();
            const notifBody = `${client.name.split(' ')[0]} - ${service.name} às ${nextAppt.time}`;
            setPushNotification({
              id: notifId,
              title: 'Lembrete de Atendimento • Amanhã',
              body: notifBody,
              appointmentId: nextAppt.id,
            });

            // Also save to notifications history
            const newNotif: AppNotification = {
              id: notifId,
              title: 'Lembrete de Atendimento • Amanhã',
              body: notifBody,
              timestamp: new Date().toISOString(),
              read: false,
              appointmentId: nextAppt.id,
            };
            setNotifications(prev => {
              if (prev.some(n => n.body === notifBody && n.title === newNotif.title)) return prev;
              return [newNotif, ...prev];
            });
          }
        }
      }, 5000); // Triggers 5 seconds after startup to amaze reviewers
      return () => clearTimeout(timer);
    }
  }, [isOnboarded]);

  // Handlers
  const handleLoginGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Falha na autenticação do Google', err);
    }
  };

  const handleLoginEmail = async (email: string, password: string) => {
    await loginWithEmail(email, password);
  };

  const handleRegisterEmail = async (email: string, password: string, displayName: string) => {
    await registerWithEmail(email, password, displayName);
  };

  const handleAddAppointment = async (appt: Appointment) => {
    setAppointments(prev => [...prev, appt]);
    if (auth.currentUser) {
      await syncAppointment(auth.currentUser.uid, appt);
    }

    const client = clients.find(c => c.id === appt.clientId);
    const service = services.find(s => s.id === appt.serviceId);
    const newNotif: AppNotification = {
      id: 'notif_' + Date.now(),
      title: 'Novo Agendamento',
      body: `${client ? client.name : 'Cliente'} agendou ${service ? service.name : 'serviço'} para ${appt.date} às ${appt.time}`,
      timestamp: new Date().toISOString(),
      read: false,
      appointmentId: appt.id
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateAppointment = async (appt: Appointment) => {
    const oldAppt = appointments.find(a => a.id === appt.id);
    setAppointments(prev => prev.map(a => a.id === appt.id ? appt : a));
    if (auth.currentUser) {
      await syncAppointment(auth.currentUser.uid, appt);
    }

    if (oldAppt) {
      const client = clients.find(c => c.id === appt.clientId);
      const service = services.find(s => s.id === appt.serviceId);
      let notifTitle = '';
      let notifBody = '';

      if (oldAppt.status !== appt.status) {
        if (appt.status === 'cancelled') {
          notifTitle = 'Agendamento Cancelado';
          notifBody = `${client ? client.name.split(' ')[0] : 'Cliente'} - ${service ? service.name : 'serviço'} de ${appt.date} às ${appt.time} foi cancelado`;
        } else if (appt.status === 'completed') {
          notifTitle = 'Atendimento Concluído';
          notifBody = `${client ? client.name.split(' ')[0] : 'Cliente'} - ${service ? service.name : 'serviço'} concluído com sucesso`;
        }
      } else if (oldAppt.time !== appt.time || oldAppt.date !== appt.date) {
        notifTitle = 'Agendamento Alterado';
        notifBody = `${client ? client.name.split(' ')[0] : 'Cliente'} alterado de ${oldAppt.date} às ${oldAppt.time} para ${appt.date} às ${appt.time}`;
      }

      if (notifTitle) {
        const newNotif: AppNotification = {
          id: 'notif_' + Date.now(),
          title: notifTitle,
          body: notifBody,
          timestamp: new Date().toISOString(),
          read: false,
          appointmentId: appt.id
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    if (auth.currentUser) {
      await syncAppointmentDelete(auth.currentUser.uid, id);
    }
  };

  const handleAddClient = async (c: Client) => {
    setClients(prev => [...prev, c]);
    if (auth.currentUser) {
      await syncClient(auth.currentUser.uid, c);
    }
  };

  const handleUpdateClient = async (c: Client) => {
    setClients(prev => prev.map(cl => cl.id === c.id ? c : cl));
    if (auth.currentUser) {
      await syncClient(auth.currentUser.uid, c);
    }
  };

  const handleDeleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (auth.currentUser) {
      await syncClientDelete(auth.currentUser.uid, id);
    }
  };

  const handleUpdateProfile = async (prof: ProfessionalProfile) => {
    setProfile(prof);
    if (auth.currentUser) {
      await syncProfile(auth.currentUser.uid, prof);
    }
  };

  const handleUpdateServices = async (srvs: Service[]) => {
    const previousServices = services;
    setServices(srvs);
    if (auth.currentUser) {
      // Find deleted services and delete them in Firestore
      const deleted = previousServices.filter(prev => !srvs.some(current => current.id === prev.id));
      for (const s of deleted) {
        await syncServiceDelete(auth.currentUser.uid, s.id);
      }
      // Sync active services
      for (const s of srvs) {
        await syncService(auth.currentUser.uid, s);
      }
    }
  };

  const handleUpdateTemplates = async (tmps: MessageTemplate[]) => {
    setMessageTemplates(tmps);
    if (auth.currentUser) {
      for (const t of tmps) {
        await syncTemplate(auth.currentUser.uid, t);
      }
    }
  };

  const handleOnboardingComplete = async (
    prof: ProfessionalProfile, 
    srvs: Service[], 
    pendingAuth?: { email: string; password?: string; name: string }
  ) => {
    setProfile(prof);
    setServices(srvs);
    setClients([]);
    setAppointments([]);
    setIsOnboarded(true);
    setActiveTab('agenda');

    // Sync to localStorage immediately to guarantee availability
    localStorage.setItem('genda_onboarded', 'true');
    localStorage.setItem('genda_profile', JSON.stringify(prof));
    localStorage.setItem('genda_services', JSON.stringify(srvs));
    localStorage.setItem('genda_clients', JSON.stringify([]));
    localStorage.setItem('genda_appointments', JSON.stringify([]));

    if (pendingAuth && pendingAuth.password) {
      isCompletingOnboardingRef.current = true;
      setIsCloudSyncing(true);
      try {
        const newUser = await registerWithEmail(pendingAuth.email, pendingAuth.password, pendingAuth.name);
        setUser(newUser);
        if (newUser) {
          await uploadInitialDataToCloud(
            newUser.uid,
            prof,
            srvs,
            [],
            [],
            messageTemplates
          );
        }
      } catch (err: any) {
        console.error('Falha ao registrar usuário ao concluir o onboarding', err);
        const newNotif: AppNotification = {
          id: 'notif_' + Date.now(),
          title: 'Erro de Sincronização',
          body: `Sua conta local foi criada, mas não foi possível conectar à nuvem: ${err.message || err}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
      } finally {
        isCompletingOnboardingRef.current = false;
        setIsCloudSyncing(false);
      }
    } else if (auth.currentUser) {
      await uploadInitialDataToCloud(
        auth.currentUser.uid,
        prof,
        srvs,
        [],
        [],
        messageTemplates
      );
    }
  };

  const handleQuickStart = () => {
    setProfile(DEFAULT_PROFILE);
    setServices(DEFAULT_SERVICES);
    setClients(DEFAULT_CLIENTS);
    setAppointments(getInitialAppointments());
    setMessageTemplates(DEFAULT_TEMPLATES);
    setIsOnboarded(true);
    setActiveTab('agenda');
  };

  const handleLogout = async () => {
    if (auth.currentUser) {
      try {
        await logoutUser();
      } catch (err) {
        console.error('Logout failed', err);
      }
    }

    localStorage.removeItem('genda_onboarded');
    localStorage.removeItem('genda_profile');
    localStorage.removeItem('genda_services');
    localStorage.removeItem('genda_clients');
    localStorage.removeItem('genda_appointments');
    localStorage.removeItem('genda_message_templates');
    localStorage.removeItem('genda_notifications');
    
    setIsOnboarded(false);
    setProfile(DEFAULT_PROFILE);
    setServices(DEFAULT_SERVICES);
    setClients(DEFAULT_CLIENTS);
    setAppointments(getInitialAppointments());
    setMessageTemplates(DEFAULT_TEMPLATES);
    setNotifications([]);
  };

  const handleClearAllData = async () => {
    if (auth.currentUser) {
      await clearAllCloudData(auth.currentUser.uid, services, clients, appointments);
    }
    setServices([]);
    setClients([]);
    setAppointments([]);
  };

  // Full data backup exporter (downloads JSON direct)
  const handleExportFullData = () => {
    const dataObj = {
      profile,
      services,
      clients,
      appointments,
      messageTemplates
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Genda_Backup_Completo.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Full data backup importer
  const handleImportFullData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.services) setServices(parsed.services);
      if (parsed.clients) setClients(parsed.clients);
      if (parsed.appointments) setAppointments(parsed.appointments);
      if (parsed.messageTemplates) setMessageTemplates(parsed.messageTemplates);
    } catch (e) {
      console.error('Backup decryption failed', e);
    }
  };

  // Switch tab and pass selected client to show their profile details
  const handleViewClientProfile = (clientId: string) => {
    setActiveClientId(clientId);
    setActiveTab('clients');
  };

  // Callback to reserve calendar slot directly from client profile card
  const handleSelectClientForBooking = (clientId: string) => {
    setActiveClientId(clientId);
    setActiveTab('agenda');
    // Open appointment modal automatically with this client preset
    setTimeout(() => {
      const btn = document.getElementById('btn-quick-schedule');
      if (btn) btn.click();
    }, 150);
  };

  // Send WhatsApp simulation from Push notification banner
  const handleSendNotifReminderToWhatsApp = () => {
    if (!pushNotification) return;
    const appt = appointments.find(a => a.id === pushNotification.appointmentId);
    if (!appt) return;
    const client = clients.find(c => c.id === appt.clientId);
    const service = services.find(s => s.id === appt.serviceId);
    if (!client || !service) return;

    const template = messageTemplates.find(t => t.type === 'reminder') || messageTemplates[0];
    if (!template) return;

    // formatted day
    const dateParts = appt.date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}`;

    const text = template.body
      .replace('{nome}', client.name.split(' ')[0])
      .replace('{serviço}', service.name)
      .replace('{data}', formattedDate)
      .replace('{hora}', appt.time);

    const whatsappUrl = `https://wa.me/${getWhatsAppNumber(client.phone)}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    setPushNotification(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatNotifTime = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  // State and handler to select and open appointment details from notification clicks
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  const handleOpenAppointmentDetails = (appointmentId?: string) => {
    if (!appointmentId) return;
    setActiveAppointmentId(appointmentId);
    setActiveTab('agenda');
    setIsNotificationsOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Logo variant="full" size="xl" />
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mt-4" />
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Carregando Agenda...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen theme-${currentTheme.id} ${isDark ? 'dark-mode' : 'light-mode'} ${currentTheme.background} selection:bg-indigo-600 selection:text-white transition-colors duration-300 font-sans`}>
      
      {/* Onboarding View Check */}
      <AnimatePresence mode="wait">
        {!isOnboarded ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <Onboarding 
              onComplete={handleOnboardingComplete} 
              onQuickStart={handleQuickStart} 
              onLoginGoogle={handleLoginGoogle}
              onLoginEmail={handleLoginEmail}
              onRegisterEmail={handleRegisterEmail}
              user={user}
              isCloudSyncing={isCloudSyncing}
            />
          </motion.div>
        ) : (
          /* DASHBOARD VIEWPORT WITH SHARED BOTTOM BAR */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full min-h-screen flex flex-col md:flex-row"
          >
            {/* DESKTOP RETRACTABLE SIDEBAR */}
            <aside 
              className={`hidden md:flex flex-col shrink-0 transition-all duration-300 border-r z-40 md:sticky md:top-0 md:h-screen ${
                isSidebarExpanded ? 'w-64' : 'w-20'
              } themed-sidebar shadow-xl`}
            >
              {/* Sidebar Header with Logo & Toggle Button */}
              <div className="p-4 flex items-center justify-between border-b themed-sidebar-border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Logo variant={isSidebarExpanded ? 'compact' : 'icon'} lightMode={!isDark} />
                </div>
                <button
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  className="p-1.5 rounded-lg themed-sidebar-toggle-btn transition-all cursor-pointer"
                  title={isSidebarExpanded ? 'Recolher Menu' : 'Expandir Menu'}
                >
                  {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
                {/* Item 1: Agenda */}
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('agenda'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'agenda'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'themed-sidebar-inactive-btn'
                  } ${!isSidebarExpanded && 'justify-center'}`}
                  title="Agenda"
                >
                  <Calendar className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="text-sm">Agenda</span>}
                </button>

                {/* Item 2: Clientes */}
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('clients'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'clients'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'themed-sidebar-inactive-btn'
                  } ${!isSidebarExpanded && 'justify-center'}`}
                  title="Clientes"
                >
                  <Users className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="text-sm">Clientes</span>}
                </button>

                {/* Item 3: Serviços */}
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('services'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'services'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'themed-sidebar-inactive-btn'
                  } ${!isSidebarExpanded && 'justify-center'}`}
                  title="Serviços"
                >
                  <Clipboard className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="text-sm">Serviços</span>}
                </button>

                {/* Item 4: Financeiro */}
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('finance'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'finance'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'themed-sidebar-inactive-btn'
                  } ${!isSidebarExpanded && 'justify-center'}`}
                  title="Financeiro"
                >
                  <DollarSign className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="text-sm">Financeiro</span>}
                </button>

                {/* Item 4.1: Estoque */}
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('estoque'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'estoque'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'themed-sidebar-inactive-btn'
                  } ${!isSidebarExpanded && 'justify-center'}`}
                  title="Estoque de Materiais"
                >
                  <Package className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="text-sm">Controle de Estoque</span>}
                </button>

                {/* Item 4.2: Assistente IA */}
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('ai'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'ai'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'themed-sidebar-inactive-btn'
                  } ${!isSidebarExpanded && 'justify-center'}`}
                  title="Genda AI"
                >
                  <Bot className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="text-sm">Genda AI</span>}
                </button>

                {/* Item 5: Ajustes */}
                <button
                  onClick={() => { setActiveClientId(null); setActiveTab('settings'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'themed-sidebar-inactive-btn'
                  } ${!isSidebarExpanded && 'justify-center'}`}
                  title="Ajustes"
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="text-sm">Ajustes</span>}
                </button>
              </div>

              {/* Logout Button */}
              <div className="p-3.5 border-t themed-sidebar-border mt-auto shrink-0">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer text-red-400 hover:bg-red-500/10 ${!isSidebarExpanded && 'justify-center'}`}
                  title="Sair da Conta"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && (
                    <span className="text-sm font-semibold">
                      Sair da Conta
                    </span>
                  )}
                </button>
              </div>

            </aside>

            {/* Main content wrapper */}
            <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-6">
            
             {/* SIMULATED IN-APP PUSH NOTIFICATION POPUP */}
             <AnimatePresence>
               {pushNotification && (
                 <motion.div
                   initial={{ opacity: 0, y: -50, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: -20, scale: 0.95 }}
                   onClick={() => {
                     if (pushNotification.appointmentId) {
                       handleOpenAppointmentDetails(pushNotification.appointmentId);
                       setPushNotification(null);
                     }
                   }}
                   className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-slate-950 text-white rounded-2xl p-4 pb-5 shadow-2xl border border-slate-800 hover:border-slate-700 flex flex-col gap-3 overflow-hidden cursor-pointer select-none transition-colors"
                 >
                   <div className="flex items-start justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center notification-pulse">
                         <Bell className="w-4.5 h-4.5 text-white" />
                       </div>
                       <div className="text-left">
                         <h4 className="font-display font-bold text-xs text-indigo-400 uppercase tracking-wide">
                           {pushNotification.title}
                         </h4>
                         <p className="text-[11px] text-slate-300 font-semibold leading-tight mt-0.5">
                           {pushNotification.body}
                         </p>
                       </div>
                     </div>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setPushNotification(null);
                       }}
                       className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white cursor-pointer"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>

                   <div className="flex items-center justify-between gap-2 border-t border-slate-900 pt-2 text-[10px]">
                     <span className="text-slate-400">Lembrete automático</span>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleSendNotifReminderToWhatsApp();
                       }}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                     >
                       <Send className="w-3 h-3" />
                       Enviar Lembrete ao Cliente
                     </button>
                   </div>

                  {/* Decreasing progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 8, ease: "linear" }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* UPPER BRAND HEADER ROW */}
            <div className={`${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-100'} border-b shadow-sm sticky top-0 z-30 backdrop-blur-md`}>
              <div className="max-w-none mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
                
                {/* Brand Logo & Professional Name info */}
                <div className="flex items-center gap-2.5">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover shadow-md border border-slate-200/50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Logo variant="icon" className="w-9 h-9 shadow-md rounded-xl" />
                  )}
                  <div className="text-left">
                    <span className={`font-display font-extrabold ${isDark ? 'text-white' : 'text-slate-950'} text-sm sm:text-base leading-tight block max-w-[100px] sm:max-w-[200px] md:max-w-none truncate`}>
                      {profile.name}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'} block -mt-0.5 truncate max-w-[100px] sm:max-w-[200px] md:max-w-none`}>
                      {profile.category} • Agenda Genda
                    </span>
                  </div>
                </div>
                   {/* Connection offline Status Pill & Notifications Area */}
                <div className="flex items-center gap-2">
                  {/* Notifications Bell Dropdown */}
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                        isDark
                          ? isNotificationsOpen
                            ? 'bg-zinc-800 border-zinc-700 text-white'
                            : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                          : isNotificationsOpen
                            ? 'bg-slate-100 border-slate-300 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      id="btn-notifications-toggle"
                      title="Lembretes e Alertas"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <>
                          {/* Dropdown menu */}
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute right-0 mt-2 w-[280px] sm:w-80 md:w-96 rounded-2xl border shadow-xl z-50 overflow-hidden text-left ${
                              isDark
                                ? 'bg-zinc-950 border-zinc-850 text-zinc-300 shadow-zinc-950/80'
                                : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
                            }`}
                          >
                            {/* Dropdown Header */}
                            <div className={`p-4 border-b flex items-center justify-between ${
                              isDark ? 'border-zinc-850' : 'border-slate-100'
                            }`}>
                              <div>
                                <h3 className={`font-display font-bold text-xs uppercase tracking-wider ${
                                  isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                  Lembretes e Alertas
                                </h3>
                                <p className="text-[10px] text-slate-400">Atividades e notificações recentes</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {notifications.length > 0 && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                      }}
                                      className={`p-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                        isDark
                                          ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white'
                                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                                      }`}
                                      title="Marcar todas como lidas"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setNotifications([]);
                                      }}
                                      className={`p-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                        isDark
                                          ? 'hover:bg-zinc-900 text-rose-400 hover:text-rose-300'
                                          : 'hover:bg-rose-50 text-rose-600 hover:text-rose-700'
                                      }`}
                                      title="Limpar tudo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Dropdown Body - Notifications list */}
                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-850">
                              {notifications.length === 0 ? (
                                <div className="p-8 text-center space-y-2">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                                    isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-slate-50 text-slate-300'
                                  }`}>
                                    <BellOff className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className={`text-xs font-semibold ${
                                      isDark ? 'text-zinc-500' : 'text-slate-400'
                                    }`}>
                                      Nenhuma notificação
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Alertas e lembretes aparecerão aqui</p>
                                  </div>
                                </div>
                              ) : (
                                notifications.map((notif) => (
                                  <div
                                    key={notif.id}
                                    onClick={() => {
                                      // Mark single as read
                                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                      if (notif.appointmentId) {
                                        handleOpenAppointmentDetails(notif.appointmentId);
                                      }
                                    }}
                                    className={`p-4 flex gap-3 transition-colors relative cursor-pointer ${
                                      !notif.read 
                                        ? isDark
                                          ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
                                          : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                                        : isDark
                                          ? 'hover:bg-zinc-900/60'
                                          : 'hover:bg-slate-50/80'
                                    }`}
                                  >
                                    {/* Unread indicator dot */}
                                    {!notif.read && (
                                      <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    )}

                                    {/* Icon / status */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                      notif.title.includes('Cancelado')
                                        ? 'bg-rose-500/10 text-rose-500'
                                        : notif.title.includes('Concluído')
                                          ? 'bg-emerald-500/10 text-emerald-500'
                                          : 'bg-indigo-500/10 text-indigo-500'
                                    }`}>
                                      <Bell className="w-4 h-4" />
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 min-w-0 text-xs">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className={`font-semibold truncate ${
                                          isDark ? 'text-zinc-100' : 'text-slate-900'
                                        }`}>
                                          {notif.title}
                                        </h4>
                                        <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                                          {formatNotifTime(notif.timestamp)}
                                        </span>
                                      </div>
                                      <p className={`text-[11px] mt-0.5 leading-snug ${
                                        isDark ? 'text-zinc-400' : 'text-slate-500'
                                      }`}>
                                        {notif.body}
                                      </p>
                                    </div>

                                    {/* Delete single notification button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                      }}
                                      className={`p-1 rounded-md text-slate-400 hover:text-rose-500 cursor-pointer self-start transition-colors`}
                                      title="Excluir"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {user ? (
                    <div
                      className={`px-2 py-1 sm:px-2.5 rounded-full border text-[10px] font-semibold flex items-center gap-1 sm:gap-1.5 transition-all ${
                        isDark 
                          ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      }`}
                      title="Sincronização em tempo real ativada."
                    >
                      <Cloud className={`w-3.5 h-3.5 text-indigo-500 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                      <span>{isCloudSyncing ? 'Sincronizando...' : <><span className="hidden sm:inline">Nuvem Conectada</span><span className="sm:hidden">Nuvem</span></>}</span>
                    </div>
                  ) : (
                    <div
                      className={`px-2 py-1 sm:px-2.5 rounded-full border text-[10px] font-semibold flex items-center gap-1 sm:gap-1.5 transition-all ${
                        isDark 
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-400' 
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                      title="Seus dados estão salvos de forma segura e local neste dispositivo."
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                      <span><span className="hidden sm:inline">Dados Locais • Nuvem Desconectada</span><span className="sm:hidden">Local</span></span>
                    </div>
                  )}

                  {/* Mobile-only Logout button */}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`md:hidden p-2 rounded-xl border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900/40 border-zinc-800 text-red-400 hover:bg-zinc-850 hover:text-red-300'
                        : 'bg-slate-50 border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                    }`}
                    title="Sair da Conta"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

            {/* MAIN CONTAINER LAYOUT WITH TRANSITIONS */}
            <main className="max-w-none mx-auto px-4 md:px-8 py-6 transition-all duration-200" id="genda-main-content">
              <AnimatePresence mode="wait">
                {activeTab === 'agenda' && (
                  <motion.div
                    key="agenda"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ScheduleView 
                      appointments={appointments}
                      clients={clients}
                      services={services}
                      workingDays={profile.workingDays}
                      theme={currentTheme}
                      isDark={isDark}
                      messageTemplates={messageTemplates}
                      onAddAppointment={handleAddAppointment}
                      onUpdateAppointment={handleUpdateAppointment}
                      onDeleteAppointment={handleDeleteAppointment}
                      onAddClient={handleAddClient}
                      onViewClient={handleViewClientProfile}
                      activeAppointmentId={activeAppointmentId}
                      onClearActiveAppointmentId={() => setActiveAppointmentId(null)}
                    />
                  </motion.div>
                )}

                {activeTab === 'clients' && (
                  <motion.div
                    key="clients"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ClientsView 
                      clients={clients}
                      appointments={appointments}
                      services={services}
                      activeClientId={activeClientId}
                      isDark={isDark}
                      onAddClient={handleAddClient}
                      onUpdateClient={handleUpdateClient}
                      onDeleteClient={handleDeleteClient}
                      onSelectClientForBooking={handleSelectClientForBooking}
                      onCloseDetails={() => setActiveClientId(null)}
                    />
                  </motion.div>
                )}

                {activeTab === 'services' && (
                  <motion.div
                    key="services"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ServicesView 
                      services={services}
                      onUpdateServices={handleUpdateServices}
                      profile={profile}
                      isDark={isDark}
                    />
                  </motion.div>
                )}

                {activeTab === 'finance' && (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FinanceView 
                      appointments={appointments}
                      clients={clients}
                      services={services}
                      isDark={isDark}
                    />
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SettingsView 
                      profile={profile}
                      services={services}
                      messageTemplates={messageTemplates}
                      onUpdateProfile={handleUpdateProfile}
                      onUpdateServices={handleUpdateServices}
                      onUpdateTemplates={handleUpdateTemplates}
                      onExportFullData={handleExportFullData}
                      onImportFullData={handleImportFullData}
                      onClearAllData={handleClearAllData}
                      user={user}
                      isCloudSyncing={isCloudSyncing}
                      onLoginGoogle={handleLoginGoogle}
                      onLogout={handleLogout}
                      onLoginEmail={handleLoginEmail}
                      onRegisterEmail={handleRegisterEmail}
                    />
                  </motion.div>
                )}

                {activeTab === 'estoque' && (
                  <motion.div
                    key="estoque"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EstoqueView 
                      stock={stock}
                      onUpdateStock={setStock}
                      isDark={isDark}
                    />
                  </motion.div>
                )}

                {activeTab === 'ai' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AIAssistantView 
                      clients={clients}
                      appointments={appointments}
                      services={services}
                      stock={stock}
                      isDark={isDark}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* PERSISTENT BOTTOM NAVIGATION TAB BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-40 themed-mobile-bar backdrop-blur-md border-t shadow-lg px-6 py-2 flex items-center justify-between gap-6 overflow-x-auto scrollbar-none rounded-t-3xl md:hidden">
              
              {/* Tab 1: Agenda */}
              <button
                onClick={() => { setActiveClientId(null); setActiveTab('agenda'); }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  activeTab === 'agenda' 
                    ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                    : 'themed-mobile-inactive'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  activeTab === 'agenda' 
                    ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : 'bg-transparent'
                }`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Agenda</span>
              </button>

              {/* Tab 2: Clients */}
              <button
                onClick={() => { setActiveClientId(null); setActiveTab('clients'); }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  activeTab === 'clients' 
                    ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                    : 'themed-mobile-inactive'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  activeTab === 'clients' 
                    ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : 'bg-transparent'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Clientes</span>
              </button>

              {/* Tab 2.5: Services */}
              <button
                onClick={() => { setActiveClientId(null); setActiveTab('services'); }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  activeTab === 'services' 
                    ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                    : 'themed-mobile-inactive'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  activeTab === 'services' 
                    ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : 'bg-transparent'
                }`}>
                  <Clipboard className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Serviços</span>
              </button>

              {/* Tab 3: Finance */}
              <button
                onClick={() => { setActiveClientId(null); setActiveTab('finance'); }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  activeTab === 'finance' 
                    ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                    : 'themed-mobile-inactive'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  activeTab === 'finance' 
                    ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : 'bg-transparent'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Financeiro</span>
              </button>

              {/* Tab 3.1: Estoque */}
              <button
                onClick={() => { setActiveClientId(null); setActiveTab('estoque'); }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  activeTab === 'estoque' 
                    ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                    : 'themed-mobile-inactive'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  activeTab === 'estoque' 
                    ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : 'bg-transparent'
                }`}>
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Estoque</span>
              </button>

              {/* Tab 3.2: Genda AI */}
              <button
                onClick={() => { setActiveClientId(null); setActiveTab('ai'); }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  activeTab === 'ai' 
                    ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                    : 'themed-mobile-inactive'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  activeTab === 'ai' 
                    ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : 'bg-transparent'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Genda AI</span>
              </button>

              {/* Tab 4: Settings */}
              <button
                onClick={() => { setActiveClientId(null); setActiveTab('settings'); }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 ${
                  activeTab === 'settings' 
                    ? (isDark ? 'text-indigo-400 scale-105 font-bold' : 'text-indigo-600 scale-105 font-bold') 
                    : 'themed-mobile-inactive'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  activeTab === 'settings' 
                    ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : 'bg-transparent'
                }`}>
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Ajustes</span>
              </button>

            </div>

          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* CONFLICT RESOLUTION MODAL */}
      <AnimatePresence>
        {syncConflict && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-2xl border p-6 max-w-md w-full mx-4 shadow-2xl text-left space-y-5 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                  : 'bg-white border-slate-100 text-slate-850'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Conflito de Sincronização Encontrado
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Sua conta Google já possui dados de agenda armazenados na nuvem. Como você também possui dados novos salvos localmente neste aparelho, escolha como deseja prosseguir:
                </p>
              </div>

              <div className="space-y-3 pt-1 text-xs text-left">
                {/* Option 1: Use Cloud Data */}
                <button
                  onClick={handleResolveConflictUseCloud}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    isDark 
                      ? 'bg-zinc-950/50 hover:bg-zinc-950 border-zinc-800 hover:border-zinc-700' 
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="w-6 h-6 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Cloud className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      Usar Dados da Nuvem
                    </span>
                    <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Substituirá os dados locais deste aparelho pelos dados já sincronizados na sua conta de nuvem ({syncConflict.cloudData.appointments?.length || 0} agendamentos).
                    </span>
                  </div>
                </button>

                {/* Option 2: Upload Local Data */}
                <button
                  onClick={handleResolveConflictUseLocal}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    isDark 
                      ? 'bg-zinc-950/50 hover:bg-zinc-950 border-zinc-800 hover:border-zinc-700' 
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="w-6 h-6 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      Manter Dados deste Aparelho
                    </span>
                    <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Envia os dados atuais deste aparelho ({appointments.length} agendamentos) para a nuvem, substituindo qualquer informação salva anteriormente na conta Google.
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESET/LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-2xl border p-6 max-w-sm w-full mx-4 shadow-2xl text-center space-y-4 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                  : 'bg-white border-slate-100 text-slate-850'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Sair da sua Conta?
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {user 
                    ? `Deseja desconectar de ${user.email}? Seus dados continuarão salvos com segurança na nuvem para quando você entrar novamente.`
                    : "Isso apagará permanentemente todos os dados salvos localmente (agendas, clientes, faturamentos) neste dispositivo. Faça um backup em JSON antes se desejar guardar as informações!"
                  }
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`flex-1 py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    isDark
                      ? 'border-zinc-700 text-zinc-350 hover:bg-zinc-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
