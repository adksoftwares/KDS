import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  doc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const INITIAL_MENU = [
  { id: 'm1', name: 'Classic Burger', price: 12.99, category: 'Mains', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60', is_available: true },
  { id: 'm2', name: 'Margherita Pizza', price: 14.50, category: 'Mains', image_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?auto=format&fit=crop&w=500&q=60', is_available: true },
  { id: 'd1', name: 'Craft Cola', price: 3.50, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60', is_available: true },
  { id: 'd2', name: 'Lemonade', price: 4.00, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60', is_available: false },
  { id: 'ds1', name: 'Cheesecake', price: 7.00, category: 'Desserts', image_url: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=500&q=60', is_available: true }
];

// Helper to seed the menu collection if empty
const seedMenuIfEmpty = async () => {
  try {
    const menuCol = collection(db, 'menu_items');
    const snapshot = await getDocs(menuCol);
    if (snapshot.empty) {
      console.log('Seeding initial menu items to Firestore...');
      for (const item of INITIAL_MENU) {
        const { id, ...itemData } = item;
        // Seed using id as document name so it's consistent
        await setDoc(doc(db, 'menu_items', id), itemData);
      }
    }
  } catch (error) {
    console.error('Error seeding menu items:', error);
  }
};

export const getMenuItems = async () => {
  const menuCol = collection(db, 'menu_items');
  const snapshot = await getDocs(menuCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const listenToMenuItems = (callback) => {
  // First seed if empty in the background
  seedMenuIfEmpty();

  const menuCol = collection(db, 'menu_items');
  return onSnapshot(menuCol, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    console.error("Error listening to menu items:", error);
  });
};

export const updateMenuItem = async (id, updates) => {
  try {
    const itemDoc = doc(db, 'menu_items', id);
    await updateDoc(itemDoc, updates);
  } catch (error) {
    console.error("Error updating menu item:", error);
  }
};

export const createOrder = async (orderData) => {
  try {
    const ordersCol = collection(db, 'orders');
    const newOrder = {
      ...orderData,
      created_at: serverTimestamp(),
      status: 'pending' // pending | preparing | ready | completed
    };
    const docRef = await addDoc(ordersCol, newOrder);
    return { id: docRef.id, ...newOrder };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const listenToActiveOrders = (callback) => {
  const ordersCol = collection(db, 'orders');
  // Query active orders (pending or preparing)
  const q = query(
    ordersCol,
    where('status', 'in', ['pending', 'preparing']),
    orderBy('created_at', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to ISO string for compatibility with frontend components
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        completed_at: data.completed_at ? data.completed_at.toDate().toISOString() : null
      };
    });
    callback(orders);
  }, (error) => {
    console.error("Error listening to active orders:", error);
  });
};

export const listenToAllOrders = (callback) => {
  const ordersCol = collection(db, 'orders');
  const q = query(ordersCol, orderBy('created_at', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        completed_at: data.completed_at ? data.completed_at.toDate().toISOString() : null
      };
    });
    callback(orders);
  }, (error) => {
    console.error("Error listening to all orders:", error);
  });
};

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderDoc = doc(db, 'orders', orderId);
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completed_at = serverTimestamp();
    }
    await updateDoc(orderDoc, updates);
  } catch (error) {
    console.error("Error updating order status:", error);
  }
};

// ─── Staff Accounts Collection Methods ──────────────────────────────────────────

export const listenToStaff = (callback) => {
  const staffCol = collection(db, 'staff');
  return onSnapshot(staffCol, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(members);
  }, (error) => {
    console.error("Error listening to staff accounts:", error);
  });
};

export const addStaffMember = async (staffData) => {
  try {
    const staffCol = collection(db, 'staff');
    const newStaff = {
      ...staffData,
      created_at: new Date().toISOString()
    };
    const docRef = await addDoc(staffCol, newStaff);
    return { id: docRef.id, ...newStaff };
  } catch (error) {
    console.error("Error adding staff member:", error);
    throw error;
  }
};

export const removeStaffMember = async (id) => {
  try {
    const staffDoc = doc(db, 'staff', id);
    await deleteDoc(staffDoc);
  } catch (error) {
    console.error("Error removing staff member:", error);
    throw error;
  }
};

export const getStaffByEmail = async (email) => {
  try {
    const staffCol = collection(db, 'staff');
    const q = query(staffCol, where('email', '==', email.trim().toLowerCase()));
    
    // Protect against hanging queries by racing getDocs with a 3-second timeout
    const snapshot = await Promise.race([
      getDocs(q),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore connection timeout")), 3000))
    ]);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error searching staff member:", error);
    return null;
  }
};

export const saveManagerProfile = async (email, profileData) => {
  try {
    const managersCol = collection(db, 'managers');
    await setDoc(doc(db, 'managers', email.trim().toLowerCase()), {
      ...profileData,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving manager profile:", error);
    throw error;
  }
};
