import { User, UserRole, Job, Application, ApplicationStatus, Document } from '../types';
import { authAPI } from './apiClient';

interface DataStore {
  getCurrentUser(): User | null;
  setCurrentUser(user: User | null): void;
  subscribe(callback: () => void): () => void;
}

// Create a simple store implementation
class Store implements DataStore {
  private currentUser: User | null = null;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    // Initialize with a stored user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch {
        this.currentUser = null;
      }
    }
  }

  // ===== Authentication Methods =====

  async login(email: string, password: string): Promise<User | null> {
    const user = await authAPI.login(email, password);
    this.setCurrentUser(user);
    return user;
  }

  async signup(
    name: string,
    email: string,
    phone: string,
    password: string,
    role: UserRole
  ): Promise<User> {
    const user = await authAPI.signup(name, email, phone, password, role);
    this.setCurrentUser(user);
    return user;
  }

  async logout(): Promise<void> {
    await authAPI.logout();
    this.setCurrentUser(null);
  }

  async forgotPassword(email: string): Promise<{ msg: string }> {
    return await authAPI.forgotPassword(email);
  }

  async resetPassword(email: string, newPassword: string): Promise<{ msg: string }> {
    return await authAPI.resetPassword(email, newPassword);
  }

  // ===== Store Methods =====

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    this.notifySubscribers();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
}

export const store = new Store();
