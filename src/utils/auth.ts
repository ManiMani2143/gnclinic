import { User } from '../types';

const STORAGE_KEY = 'clinic_users';
const AUTH_KEY = 'clinic_auth';

// Default admin user
const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'admin123', // In production, this should be hashed
  role: 'admin',
  name: 'System Administrator',
  email: 'admin@clinic.com',
  phone: '+91 9876543210',
  isActive: true,
  createdAt: new Date().toISOString(),
};

// Default salesman user
const DEFAULT_SALESMAN: User = {
  id: 'sales-001',
  username: 'salesman',
  password: 'sales123', // In production, this should be hashed
  role: 'salesman',
  name: 'Sales Person',
  email: 'sales@clinic.com',
  phone: '+91 9876543211',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const authService = {
  // Initialize default users if not exists
  initializeUsers: () => {
    const existingUsers = localStorage.getItem(STORAGE_KEY);
    if (!existingUsers) {
      const defaultUsers = [DEFAULT_ADMIN, DEFAULT_SALESMAN];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    }
  },

  // Get all users
  getUsers: (): User[] => {
    const users = localStorage.getItem(STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  },

  // Save users
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  // Login user
  login: (username: string, password: string): User | null => {
    const users = authService.getUsers();
    const user = users.find(u => 
      u.username === username && 
      u.password === password && 
      u.isActive
    );
    
    if (user) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      const updatedUsers = users.map(u => u.id === user.id ? user : u);
      authService.saveUsers(updatedUsers);
      
      // Save auth state
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        isAuthenticated: true,
        user: user
      }));
      
      return user;
    }
    
    return null;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  // Get current auth state
  getAuthState: () => {
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      return JSON.parse(authData);
    }
    return {
      isAuthenticated: false,
      user: null
    };
  },

  // Add new user (admin only)
  addUser: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const users = authService.getUsers();
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    authService.saveUsers(users);
    return newUser;
  },

  // Update user
  updateUser: (id: string, userData: Partial<User>): boolean => {
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData };
      authService.saveUsers(users);
      return true;
    }
    
    return false;
  },

  // Delete user
  deleteUser: (id: string): boolean => {
    const users = authService.getUsers();
    const filteredUsers = users.filter(u => u.id !== id);
    
    if (filteredUsers.length < users.length) {
      authService.saveUsers(filteredUsers);
      return true;
    }
    
    return false;
  },

  // Check if user has permission
  hasPermission: (user: User | null, requiredRole: 'admin' | 'salesman'): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has all permissions
    return user.role === requiredRole;
  }
};