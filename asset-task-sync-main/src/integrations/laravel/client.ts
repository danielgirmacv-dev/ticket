import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const laravelClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
laravelClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
laravelClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Optional: Redirect to login or dispatch logout event
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export default laravelClient;

// Helper types matching backend models
export interface User {
  id: number;
  name: string;
  email: string;
  roles?: Role[];
  profile?: Profile;
}

export interface Role {
  id: number;
  name: string;
}

export interface Profile {
  id: string;
  user_id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  department?: string | null;
  location_id?: string | null;
  location?: Location | null;
  user?: User;
}

export interface Asset {
  id: string;
  name: string;
  type: 'computer' | 'printer' | 'server' | 'network_device' | 'other';
  serial_number: string;
  purchase_date: string;
  warranty_expiry?: string;
  location: string;
  status: 'active' | 'maintenance' | 'retired' | 'disposed';
  assigned_to?: string | null;
  notes?: string;
  assigned_user?: Profile;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description?: string;
  type: 'maintenance' | 'repair' | 'installation' | 'inspection' | 'other';
  status: 'submitted' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed_pending_review' | 'completed' | 'reopened' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  asset_id?: string | null;
  requester_id?: string;
  assigned_technician_id?: string;
  scheduled_date: string;
  completed_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  is_recurring: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  recurring_ends_at?: string | null;
  notes?: string;
  rejection_reason?: string;
  diagnosis?: string;
  actions_taken?: string;
  spare_parts?: Array<{ name: string; quantity: number; cost?: number }>;
  images?: { 
    before?: string[]; 
    after?: string[]; 
    attachments?: Array<{ name: string; url: string; mime: string; size: number }>;
  };
  feedback_rating?: number;
  feedback_comment?: string;
  approved_by?: string;
  reviewed_by?: string;
  approved_at?: string;
  started_at?: string;
  reviewed_at?: string;
  support_category?: 'it_support' | 'sap' | 'general';
  assigned_manager_id?: string;
  assigned_manager?: Profile;
  asset?: Asset;
  requester?: Profile;
  assigned_technician?: Profile;
  approved_by_profile?: Profile;
  reviewed_by_profile?: Profile;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  link?: string;
  created_at: string;
  updated_at: string;
}
