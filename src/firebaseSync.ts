import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ProfessionalProfile, Service, Client, Appointment, MessageTemplate, StockItem } from './types';

// Fetch all cloud data for a user UID
export async function fetchAllCloudData(uid: string) {
  try {
    // 1. Fetch Profile
    const profileDocRef = doc(db, 'users', uid, 'profile', 'main');
    const profileDoc = await getDoc(profileDocRef);
    const profile = profileDoc.exists() ? (profileDoc.data() as ProfessionalProfile) : null;

    // 2. Fetch Services
    const servicesColRef = collection(db, 'users', uid, 'services');
    const servicesSnapshot = await getDocs(servicesColRef);
    const services = servicesSnapshot.docs.map(d => d.data() as Service);

    // 3. Fetch Clients
    const clientsColRef = collection(db, 'users', uid, 'clients');
    const clientsSnapshot = await getDocs(clientsColRef);
    const clients = clientsSnapshot.docs.map(d => d.data() as Client);

    // 4. Fetch Appointments
    const apptsColRef = collection(db, 'users', uid, 'appointments');
    const apptsSnapshot = await getDocs(apptsColRef);
    const appointments = apptsSnapshot.docs.map(d => d.data() as Appointment);

    // 5. Fetch Templates
    const templatesColRef = collection(db, 'users', uid, 'templates');
    const templatesSnapshot = await getDocs(templatesColRef);
    const templates = templatesSnapshot.docs.map(d => d.data() as MessageTemplate);

    // 6. Fetch Stock
    const stockColRef = collection(db, 'users', uid, 'stock');
    const stockSnapshot = await getDocs(stockColRef);
    const stock = stockSnapshot.docs.map(d => d.data() as StockItem);

    if (!profile && services.length === 0 && clients.length === 0 && appointments.length === 0 && stock.length === 0) {
      return null;
    }

    return {
      profile,
      services,
      clients,
      appointments,
      templates,
      stock
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

// Upload initial guest/offline data to Cloud
export async function uploadInitialDataToCloud(
  uid: string,
  profile: ProfessionalProfile,
  services: Service[],
  clients: Client[],
  appointments: Appointment[],
  templates: MessageTemplate[],
  stock: StockItem[]
) {
  const batch = writeBatch(db);

  try {
    // Save Profile
    const profileDocRef = doc(db, 'users', uid, 'profile', 'main');
    batch.set(profileDocRef, profile);

    // Save Services
    services.forEach(s => {
      const sRef = doc(db, 'users', uid, 'services', s.id);
      batch.set(sRef, s);
    });

    // Save Clients
    clients.forEach(c => {
      const cRef = doc(db, 'users', uid, 'clients', c.id);
      batch.set(cRef, c);
    });

    // Save Appointments
    appointments.forEach(a => {
      const aRef = doc(db, 'users', uid, 'appointments', a.id);
      batch.set(aRef, a);
    });

    // Save Templates
    templates.forEach(t => {
      const tRef = doc(db, 'users', uid, 'templates', t.id);
      batch.set(tRef, t);
    });

    // Save Stock
    stock.forEach(st => {
      const stRef = doc(db, 'users', uid, 'stock', st.id);
      batch.set(stRef, st);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/batch-upload`);
  }
}

// Sync single Profile
export async function syncProfile(uid: string, profile: ProfessionalProfile) {
  const path = `users/${uid}/profile/main`;
  try {
    const ref = doc(db, 'users', uid, 'profile', 'main');
    await setDoc(ref, profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync single Service
export async function syncService(uid: string, service: Service) {
  const path = `users/${uid}/services/${service.id}`;
  try {
    const ref = doc(db, 'users', uid, 'services', service.id);
    await setDoc(ref, service);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete single Service
export async function syncServiceDelete(uid: string, serviceId: string) {
  const path = `users/${uid}/services/${serviceId}`;
  try {
    const ref = doc(db, 'users', uid, 'services', serviceId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync single Client
export async function syncClient(uid: string, client: Client) {
  const path = `users/${uid}/clients/${client.id}`;
  try {
    const ref = doc(db, 'users', uid, 'clients', client.id);
    await setDoc(ref, client);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete single Client
export async function syncClientDelete(uid: string, clientId: string) {
  const path = `users/${uid}/clients/${clientId}`;
  try {
    const ref = doc(db, 'users', uid, 'clients', clientId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync single Appointment
export async function syncAppointment(uid: string, appointment: Appointment) {
  const path = `users/${uid}/appointments/${appointment.id}`;
  try {
    const ref = doc(db, 'users', uid, 'appointments', appointment.id);
    await setDoc(ref, appointment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete single Appointment
export async function syncAppointmentDelete(uid: string, appointmentId: string) {
  const path = `users/${uid}/appointments/${appointmentId}`;
  try {
    const ref = doc(db, 'users', uid, 'appointments', appointmentId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync single Message Template
export async function syncTemplate(uid: string, template: MessageTemplate) {
  const path = `users/${uid}/templates/${template.id}`;
  try {
    const ref = doc(db, 'users', uid, 'templates', template.id);
    await setDoc(ref, template);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync single StockItem
export async function syncStockItem(uid: string, item: StockItem) {
  const path = `users/${uid}/stock/${item.id}`;
  try {
    const ref = doc(db, 'users', uid, 'stock', item.id);
    await setDoc(ref, item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete single StockItem
export async function syncStockItemDelete(uid: string, itemId: string) {
  const path = `users/${uid}/stock/${itemId}`;
  try {
    const ref = doc(db, 'users', uid, 'stock', itemId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Clear all cloud data
export async function clearAllCloudData(
  uid: string,
  services: Service[],
  clients: Client[],
  appointments: Appointment[],
  stock: StockItem[]
) {
  const batch = writeBatch(db);

  try {
    // Delete profile
    const profileDocRef = doc(db, 'users', uid, 'profile', 'main');
    batch.delete(profileDocRef);

    // Delete services
    services.forEach(s => {
      const sRef = doc(db, 'users', uid, 'services', s.id);
      batch.delete(sRef);
    });

    // Delete clients
    clients.forEach(c => {
      const cRef = doc(db, 'users', uid, 'clients', c.id);
      batch.delete(cRef);
    });

    // Delete appointments
    appointments.forEach(a => {
      const aRef = doc(db, 'users', uid, 'appointments', a.id);
      batch.delete(aRef);
    });

    // Delete stock
    stock.forEach(st => {
      const stRef = doc(db, 'users', uid, 'stock', st.id);
      batch.delete(stRef);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/clear-all`);
  }
}
