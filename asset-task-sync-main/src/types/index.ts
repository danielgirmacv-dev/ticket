// User roles enum
export type UserRole = 'admin' | 'technician' | 'requester';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  createdAt: Date;
}

// Asset types
export type AssetType = 'computer' | 'printer' | 'server' | 'network_device' | 'other';
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'disposed';

// Asset interface
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  serialNumber: string;
  purchaseDate: Date;
  warrantyExpiry?: Date;
  location: string;
  status: AssetStatus;
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task status and priority
export type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketType = 'maintenance' | 'repair' | 'installation' | 'inspection' | 'other';

// Maintenance ticket interface
export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  assetId: string;
  asset?: Asset;
  requesterId: string;
  requester?: User;
  assignedTechnicianId?: string;
  assignedTechnician?: User;
  scheduledDate: Date;
  completedDate?: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// Dashboard statistics
export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  totalTickets: number;
  pendingTickets: number;
  inProgressTickets: number;
  completedTickets: number;
  overdueTickets: number;
  ticketsThisWeek: number;
}

// Activity log
export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: 'asset' | 'ticket' | 'user';
  entityId: string;
  details?: string;
  createdAt: Date;
}
